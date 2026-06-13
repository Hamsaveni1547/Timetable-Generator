package com.timetable.generator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timetable.generator.dto.timetable.*;
import com.timetable.generator.entity.academic.*;
import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.entity.timetable.TimetableEntry;
import com.timetable.generator.entity.timetable.TimetableGeneration;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.exception.SchedulingConstraintException;
import com.timetable.generator.exception.ValidationException;
import com.timetable.generator.repository.academic.*;
import com.timetable.generator.repository.config.SlotTemplateRepository;
import com.timetable.generator.repository.timetable.TimetableEntryRepository;
import com.timetable.generator.repository.timetable.TimetableGenerationRepository;
import com.timetable.generator.solver.OverrideValidator;
import com.timetable.generator.solver.SessionVariableBuilder;
import com.timetable.generator.solver.TimetableSolver;
import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.context.ConstraintContextBuilder;
import com.timetable.generator.solver.model.BottleneckReport;
import com.timetable.generator.solver.model.CandidateAssignment;
import com.timetable.generator.solver.model.SessionVariable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

    private final TimetableGenerationRepository generationRepository;
    private final TimetableEntryRepository entryRepository;
    private final DepartmentRepository departmentRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final SlotTemplateRepository slotTemplateRepository;
    private final SubjectAllocationRepository subjectAllocationRepository;
    private final FacultyRepository facultyRepository;

    private final ConstraintContextBuilder constraintContextBuilder;
    private final SessionVariableBuilder sessionVariableBuilder;
    private final TimetableSolver timetableSolver;
    private final OverrideValidator overrideValidator;
    private final ObjectMapper objectMapper;

    /**
     * Triggers the timetable generation process.
     */
    @Transactional
    public GenerationStatusDto generate(GenerateRequest request, Long triggeredByUserId) {
        Long deptId = request.getDepartmentId();
        Integer semester = request.getSemester();
        Integer academicYear = request.getAcademicYear();

        Department department = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", deptId));

        // 1. Initialize the generation record as IN_PROGRESS
        TimetableGeneration generation = TimetableGeneration.builder()
                .department(department)
                .academicYear(academicYear)
                .semester(semester)
                .status(TimetableGeneration.Status.IN_PROGRESS)
                .triggeredBy(triggeredByUserId)
                .build();
        generation = generationRepository.save(generation);

        try {
            // 2. Validate allocations are complete for this department-semester
            validateAllocationsComplete(deptId, semester, academicYear);

            // 3. Build Solver Context and variables
            ConstraintContext ctx = constraintContextBuilder.build(deptId);
            
            List<SubjectAllocation> allocations = subjectAllocationRepository
                    .findForSolverByDepartmentAndSemester(deptId, semester);

            if (allocations.isEmpty()) {
                throw new ValidationException("No subject allocations found for the selected department and semester.");
            }

            List<SessionVariable> variables = sessionVariableBuilder.build(allocations, ctx);

            // 4. Run the Backtracking Solver
            long solverStartTime = System.currentTimeMillis();
            Map<SessionVariable, CandidateAssignment> solution;
            try {
                solution = timetableSolver.solve(variables, ctx);
            } catch (SchedulingConstraintException e) {
                // Solver failed due to unsolvable constraints
                long duration = System.currentTimeMillis() - solverStartTime;
                generation.setStatus(TimetableGeneration.Status.FAILED);
                generation.setSolverDurationMs(duration);
                generation.setBottleneckReport(serializeReport(e.getBottleneckReport()));
                generationRepository.save(generation);
                throw e;
            }

            long solverDuration = System.currentTimeMillis() - solverStartTime;

            // 5. Clean up any existing DRAFT generations for the same dept+sem+year
            List<TimetableGeneration> existingDrafts = generationRepository
                    .findByDepartmentIdAndStatus(deptId, TimetableGeneration.Status.DRAFT).stream()
                    .filter(g -> g.getAcademicYear().equals(academicYear) && g.getSemester().equals(semester))
                    .collect(Collectors.toList());

            for (TimetableGeneration draft : existingDrafts) {
                entryRepository.deleteByGenerationId(draft.getId());
                generationRepository.delete(draft);
            }

            // 6. Persist generated TimetableEntry records
            List<TimetableEntry> entries = new ArrayList<>();
            for (Map.Entry<SessionVariable, CandidateAssignment> solved : solution.entrySet()) {
                SessionVariable var = solved.getKey();
                CandidateAssignment assignment = solved.getValue();

                Section section = sectionRepository.getReferenceById(var.getSectionId());
                Subject subject = subjectRepository.getReferenceById(var.getSubjectId());
                Faculty faculty = facultyRepository.getReferenceById(var.getFacultyId());
                Room room = roomRepository.getReferenceById(assignment.getRoomId());

                // Expand consecutive slots chain into individual slot entries
                for (Long slotId : assignment.getSlotChain()) {
                    SlotTemplate slot = slotTemplateRepository.getReferenceById(slotId);

                    TimetableEntry entry = TimetableEntry.builder()
                            .generation(generation)
                            .section(section)
                            .subject(subject)
                            .faculty(faculty)
                            .room(room)
                            .slotTemplate(slot)
                            .dayOfWeek(assignment.getDay())
                            .isManuallyOverridden(false)
                            .build();
                    entries.add(entry);
                }
            }

            entryRepository.saveAll(entries);

            // 7. Update generation status to DRAFT
            generation.setStatus(TimetableGeneration.Status.DRAFT);
            generation.setSolverDurationMs(solverDuration);
            generation = generationRepository.save(generation);

            return toDto(generation);

        } catch (SchedulingConstraintException e) {
            // Already handled internally
            throw e;
        } catch (Exception e) {
            // General exception fallback
            generation.setStatus(TimetableGeneration.Status.FAILED);
            BottleneckReport report = BottleneckReport.builder()
                    .type("UNSOLVABLE")
                    .suggestedActions(List.of("Verify that all classroom/lab room capacities and faculty workloads are correct.", "Check if you have seeded slot templates and constraint weights."))
                    .build();
            generation.setBottleneckReport(serializeReport(report));
            generationRepository.save(generation);
            throw new SchedulingConstraintException("Failed to generate timetable: " + e.getMessage(), report);
        }
    }

    /**
     * Validates that all active subjects in active sections for the semester have complete allocations.
     */
    private void validateAllocationsComplete(Long deptId, Integer semester, Integer academicYear) {
        List<Section> activeSections = sectionRepository.findByDepartmentIdAndSemester(deptId, semester).stream()
                .filter(s -> s.isActive() && s.getAcademicYear().equals(academicYear))
                .collect(Collectors.toList());

        List<Subject> activeSubjects = subjectRepository.findByDepartmentIdAndSemester(deptId, semester);

        List<String> missingAllocations = new ArrayList<>();

        for (Section section : activeSections) {
            for (Subject subject : activeSubjects) {
                Integer allocatedHours = subjectAllocationRepository
                        .sumAllocatedHoursForSubjectSection(subject.getId(), section.getId());

                if (allocatedHours == null || !allocatedHours.equals(subject.getHoursPerWeek())) {
                    missingAllocations.add(String.format("Subject '%s' (%s) in Section '%s' (Allocated: %d/%d hrs)",
                            subject.getName(), subject.getCode(), section.getName(),
                            allocatedHours == null ? 0 : allocatedHours, subject.getHoursPerWeek()));
                }
            }
        }

        if (!missingAllocations.isEmpty()) {
            throw new SchedulingConstraintException(
                    "Incomplete subject allocations",
                    BottleneckReport.incompleteAllocations(missingAllocations)
            );
        }
    }

    public List<GenerationStatusDto> getGenerations(Long deptId) {
        return generationRepository.findByDepartmentIdOrderByGeneratedAtDesc(deptId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public GenerationStatusDto getGeneration(Long id) {
        TimetableGeneration gen = generationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableGeneration", id));
        return toDto(gen);
    }

    public List<TimetableEntryDto> getEntries(Long generationId) {
        return entryRepository.findByGenerationId(generationId).stream()
                .map(this::toEntryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GenerationStatusDto publish(Long generationId, Long userId) {
        TimetableGeneration gen = generationRepository.findById(generationId)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableGeneration", generationId));

        if (gen.getStatus() == TimetableGeneration.Status.PUBLISHED) {
            return toDto(gen);
        }

        if (gen.getStatus() != TimetableGeneration.Status.DRAFT) {
            throw new ValidationException("Only DRAFT timetables can be published.");
        }

        // Demote existing published timetable for the same department and semester
        Optional<TimetableGeneration> oldPublished = generationRepository
                .findByDepartmentIdAndAcademicYearAndSemesterAndStatus(
                        gen.getDepartment().getId(), gen.getAcademicYear(), gen.getSemester(),
                        TimetableGeneration.Status.PUBLISHED
                );

        if (oldPublished.isPresent()) {
            TimetableGeneration old = oldPublished.get();
            old.setStatus(TimetableGeneration.Status.DRAFT);
            generationRepository.save(old);
        }

        gen.setStatus(TimetableGeneration.Status.PUBLISHED);
        gen.setPublishedAt(LocalDateTime.now());
        return toDto(generationRepository.save(gen));
    }

    @Transactional
    public void deleteGeneration(Long id) {
        TimetableGeneration gen = generationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableGeneration", id));

        if (gen.getStatus() == TimetableGeneration.Status.PUBLISHED) {
            throw new ConflictException("Cannot delete a PUBLISHED timetable. Demote or archive it first.");
        }

        entryRepository.deleteByGenerationId(id);
        generationRepository.delete(gen);
    }

    public SwapValidationResult validateSwap(Long entryId, OverrideRequest request, Long generationId) {
        return overrideValidator.validateSwap(
                entryId,
                request.getNewDay().toUpperCase(),
                request.getNewSlotTemplateId(),
                request.getNewRoomId(),
                generationId
        );
    }

    @Transactional
    public TimetableEntryDto commitOverride(Long entryId, OverrideRequest request, Long userId) {
        TimetableEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", entryId));

        TimetableGeneration gen = entry.getGeneration();
        if (gen.getStatus() != TimetableGeneration.Status.DRAFT) {
            throw new ValidationException("Manual overrides can only be applied to DRAFT timetables.");
        }

        SwapValidationResult validationResult = overrideValidator.validateSwap(
                entryId,
                request.getNewDay().toUpperCase(),
                request.getNewSlotTemplateId(),
                request.getNewRoomId(),
                gen.getId()
        );

        if (!validationResult.isValid()) {
            throw new ValidationException("Manual override violates hard constraints: " +
                    String.join("; ", validationResult.getClashes()));
        }

        Room newRoom = roomRepository.findById(request.getNewRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", request.getNewRoomId()));

        SlotTemplate newSlot = slotTemplateRepository.findById(request.getNewSlotTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("SlotTemplate", request.getNewSlotTemplateId()));

        entry.setDayOfWeek(request.getNewDay().toUpperCase());
        entry.setSlotTemplate(newSlot);
        entry.setRoom(newRoom);
        entry.setManuallyOverridden(true);
        entry.setOverrideReason(request.getReason());
        entry.setOverrideBy(userId);

        return toEntryDto(entryRepository.save(entry));
    }

    // ===== Timetable Views =====

    public List<TimetableEntryDto> getFacultyTimetable(Long facultyId, Long generationId) {
        return entryRepository.findByGenerationIdAndFacultyId(generationId, facultyId).stream()
                .map(this::toEntryDto)
                .collect(Collectors.toList());
    }

    public List<TimetableEntryDto> getSectionTimetable(Long sectionId, Long generationId) {
        return entryRepository.findByGenerationIdAndSectionId(generationId, sectionId).stream()
                .map(this::toEntryDto)
                .collect(Collectors.toList());
    }

    public List<TimetableEntryDto> getRoomTimetable(Long roomId, Long generationId) {
        return entryRepository.findByGenerationIdAndRoomId(generationId, roomId).stream()
                .map(this::toEntryDto)
                .collect(Collectors.toList());
    }

    public long getActualFacultyWorkload(Long facultyId, Long generationId) {
        return entryRepository.countByGenerationIdAndFacultyId(generationId, facultyId);
    }

    // ===== Mappers =====

    private GenerationStatusDto toDto(TimetableGeneration gen) {
        return GenerationStatusDto.builder()
                .id(gen.getId())
                .departmentId(gen.getDepartment().getId())
                .departmentName(gen.getDepartment().getName())
                .academicYear(gen.getAcademicYear())
                .semester(gen.getSemester())
                .status(gen.getStatus().name())
                .solverDurationMs(gen.getSolverDurationMs())
                .bottleneckReport(deserializeReport(gen.getBottleneckReport()))
                .generatedAt(gen.getGeneratedAt())
                .publishedAt(gen.getPublishedAt())
                .build();
    }

    private TimetableEntryDto toEntryDto(TimetableEntry e) {
        return TimetableEntryDto.builder()
                .id(e.getId())
                .generationId(e.getGeneration().getId())
                .sectionId(e.getSection().getId())
                .sectionName(e.getSection().getName())
                .subjectId(e.getSubject().getId())
                .subjectName(e.getSubject().getName())
                .subjectCode(e.getSubject().getCode())
                .facultyId(e.getFaculty().getId())
                .facultyName(e.getFaculty().getName())
                .roomId(e.getRoom().getId())
                .roomName(e.getRoom().getName())
                .slotTemplateId(e.getSlotTemplate().getId())
                .slotLabel(e.getSlotTemplate().getLabel())
                .startTime(e.getSlotTemplate().getStartTime())
                .endTime(e.getSlotTemplate().getEndTime())
                .dayOfWeek(e.getDayOfWeek())
                .isManuallyOverridden(e.isManuallyOverridden())
                .overrideReason(e.getOverrideReason())
                .overrideBy(e.getOverrideBy())
                .build();
    }

    private String serializeReport(BottleneckReport report) {
        try {
            return objectMapper.writeValueAsString(report);
        } catch (Exception e) {
            log.error("Failed to serialize bottleneck report", e);
            return null;
        }
    }

    private BottleneckReport deserializeReport(String json) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, BottleneckReport.class);
        } catch (Exception e) {
            log.error("Failed to deserialize bottleneck report", e);
            return null;
        }
    }
}
