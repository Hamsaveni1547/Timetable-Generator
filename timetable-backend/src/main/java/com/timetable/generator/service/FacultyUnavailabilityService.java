package com.timetable.generator.service;

import com.timetable.generator.dto.entity.FacultyUnavailabilityDto;
import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.config.FacultyUnavailability;
import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.FacultyRepository;
import com.timetable.generator.repository.config.FacultyUnavailabilityRepository;
import com.timetable.generator.repository.config.SlotTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacultyUnavailabilityService {

    private final FacultyUnavailabilityRepository unavailabilityRepository;
    private final FacultyRepository facultyRepository;
    private final SlotTemplateRepository slotRepository;

    public List<FacultyUnavailabilityDto> getByFaculty(Long facultyId) {
        return unavailabilityRepository.findByFacultyId(facultyId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<FacultyUnavailabilityDto> getByDepartment(Long deptId) {
        return unavailabilityRepository.findByDepartmentId(deptId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public FacultyUnavailabilityDto create(Long facultyId, FacultyUnavailabilityDto dto) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", facultyId));

        SlotTemplate slot = slotRepository.findById(dto.getSlotTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("SlotTemplate", dto.getSlotTemplateId()));

        // Validate slot actually applies to this day
        if (!slot.appliesToDay(dto.getDayOfWeek().toUpperCase())) {
            throw new com.timetable.generator.exception.ValidationException(
                "Slot '" + slot.getLabel() + "' does not apply to " + dto.getDayOfWeek() + ".");
        }

        FacultyUnavailability unavailability = FacultyUnavailability.builder()
                .faculty(faculty)
                .dayOfWeek(dto.getDayOfWeek().toUpperCase())
                .slotTemplate(slot)
                .reason(dto.getReason())
                .effectiveFrom(dto.getEffectiveFrom())
                .effectiveTo(dto.getEffectiveTo())
                .build();

        return toDto(unavailabilityRepository.save(unavailability));
    }

    @Transactional
    public void delete(Long id) {
        FacultyUnavailability entry = unavailabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FacultyUnavailability", id));
        unavailabilityRepository.delete(entry);
    }

    private FacultyUnavailabilityDto toDto(FacultyUnavailability u) {
        return FacultyUnavailabilityDto.builder()
                .id(u.getId())
                .facultyId(u.getFaculty().getId())
                .facultyName(u.getFaculty().getName())
                .dayOfWeek(u.getDayOfWeek())
                .slotTemplateId(u.getSlotTemplate().getId())
                .slotLabel(u.getSlotTemplate().getLabel())
                .startTime(u.getSlotTemplate().getStartTime())
                .reason(u.getReason())
                .effectiveFrom(u.getEffectiveFrom())
                .effectiveTo(u.getEffectiveTo())
                .build();
    }
}
