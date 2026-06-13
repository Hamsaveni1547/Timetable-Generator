package com.timetable.generator.service;

import com.timetable.generator.dto.entity.AllocationValidationDto;
import com.timetable.generator.dto.entity.SubjectAllocationDto;
import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.academic.Section;
import com.timetable.generator.entity.academic.Subject;
import com.timetable.generator.entity.academic.SubjectAllocation;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.exception.ValidationException;
import com.timetable.generator.repository.academic.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectAllocationService {

    private final SubjectAllocationRepository allocationRepository;
    private final SubjectRepository subjectRepository;
    private final SectionRepository sectionRepository;
    private final FacultyRepository facultyRepository;

    public List<SubjectAllocationDto> getByDepartmentAndSemester(Long deptId, Integer semester) {
        return allocationRepository.findByDepartmentAndSemester(deptId, semester)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SubjectAllocationDto> getByFaculty(Long facultyId) {
        return allocationRepository.findByFacultyId(facultyId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public SubjectAllocationDto create(SubjectAllocationDto dto) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject", dto.getSubjectId()));
        Section section = sectionRepository.findById(dto.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section", dto.getSectionId()));
        Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", dto.getFacultyId()));

        // Same faculty allocated twice to same subject+section is a conflict
        if (allocationRepository.existsBySubjectIdAndSectionIdAndFacultyId(
                dto.getSubjectId(), dto.getSectionId(), dto.getFacultyId())) {
            throw new ConflictException(
                "Faculty " + faculty.getName() + " is already allocated to " +
                subject.getCode() + " for section " + section.getName() + ".");
        }

        // Validate workload ceiling
        validateWorkloadCeiling(faculty, dto.getAllocatedHoursPerWeek());

        SubjectAllocation allocation = SubjectAllocation.builder()
                .subject(subject).section(section).faculty(faculty)
                .allocatedHoursPerWeek(dto.getAllocatedHoursPerWeek())
                .build();
        return toDto(allocationRepository.save(allocation));
    }

    @Transactional
    public SubjectAllocationDto update(Long id, SubjectAllocationDto dto) {
        SubjectAllocation allocation = findEntityById(id);
        Faculty faculty = allocation.getFaculty();

        // For workload check: subtract current allocation before checking new ceiling
        int currentHours = allocationRepository.sumAllocatedHoursByFaculty(faculty.getId());
        int newTotal = currentHours - allocation.getAllocatedHoursPerWeek() + dto.getAllocatedHoursPerWeek();

        if (newTotal > faculty.getMaxHoursPerWeek()) {
            throw new ValidationException(
                "Updating this allocation would push " + faculty.getName() + "'s weekly workload to " +
                newTotal + " hours, exceeding their maximum of " + faculty.getMaxHoursPerWeek() + " hours.");
        }

        allocation.setAllocatedHoursPerWeek(dto.getAllocatedHoursPerWeek());
        return toDto(allocationRepository.save(allocation));
    }

    @Transactional
    public void delete(Long id) {
        SubjectAllocation allocation = findEntityById(id);
        allocationRepository.delete(allocation);
    }

    /**
     * Validates that all allocation rows for a subject-section correctly sum to subject.hours_per_week.
     * Used pre-generation to ensure solver has complete allocation data.
     */
    public AllocationValidationDto validateCompletion(Long subjectId, Long sectionId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", subjectId));
        sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

        List<SubjectAllocation> allocations = allocationRepository.findBySubjectIdAndSectionId(subjectId, sectionId);
        int totalAllocated = allocations.stream().mapToInt(SubjectAllocation::getAllocatedHoursPerWeek).sum();
        int required = subject.getHoursPerWeek();

        List<AllocationValidationDto.AllocationBreakdown> breakdown = allocations.stream()
                .map(a -> new AllocationValidationDto.AllocationBreakdown(
                        a.getFaculty().getId(), a.getFaculty().getName(), a.getAllocatedHoursPerWeek()))
                .collect(Collectors.toList());

        return AllocationValidationDto.builder()
                .subjectId(subjectId).subjectName(subject.getName()).subjectCode(subject.getCode())
                .requiredHoursPerWeek(required).allocatedTotal(totalAllocated)
                .isComplete(totalAllocated == required)
                .deficit(required - totalAllocated)
                .allocations(breakdown)
                .build();
    }

    private void validateWorkloadCeiling(Faculty faculty, int additionalHours) {
        Integer currentTotal = allocationRepository.sumAllocatedHoursByFaculty(faculty.getId());
        int newTotal = (currentTotal != null ? currentTotal : 0) + additionalHours;
        if (newTotal > faculty.getMaxHoursPerWeek()) {
            throw new ValidationException(
                "This allocation would push " + faculty.getName() + "'s weekly workload to " +
                newTotal + " hours, exceeding their maximum of " + faculty.getMaxHoursPerWeek() + " hours. " +
                "Increase their max_hours_per_week or reduce the allocation.");
        }
    }

    private SubjectAllocation findEntityById(Long id) {
        return allocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubjectAllocation", id));
    }

    private SubjectAllocationDto toDto(SubjectAllocation a) {
        return SubjectAllocationDto.builder()
                .id(a.getId())
                .subjectId(a.getSubject().getId()).subjectName(a.getSubject().getName())
                .subjectCode(a.getSubject().getCode())
                .sectionId(a.getSection().getId()).sectionName(a.getSection().getName())
                .facultyId(a.getFaculty().getId()).facultyName(a.getFaculty().getName())
                .allocatedHoursPerWeek(a.getAllocatedHoursPerWeek())
                .build();
    }
}
