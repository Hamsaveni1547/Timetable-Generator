package com.timetable.generator.service;

import com.timetable.generator.dto.entity.FacultyDto;
import com.timetable.generator.entity.academic.Department;
import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.academic.SubjectAllocation;
import com.timetable.generator.entity.auth.User;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.DepartmentRepository;
import com.timetable.generator.repository.academic.FacultyRepository;
import com.timetable.generator.repository.academic.SubjectAllocationRepository;
import com.timetable.generator.repository.academic.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectAllocationRepository allocationRepository;
    private final UserRepository userRepository;

    public List<FacultyDto> getAll(Long deptId) {
        List<Faculty> list = deptId != null
                ? facultyRepository.findByDepartmentId(deptId)
                : facultyRepository.findAll();
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public FacultyDto getById(Long id) {
        return toDto(findEntityById(id));
    }

    /**
     * Returns faculty profile with live workload computed from subject_allocations.
     * Used by HOD dashboard workload bar — fully dynamic, no hardcoded hours.
     */
    public FacultyDto getWorkloadSummary(Long facultyId) {
        Faculty faculty = findEntityById(facultyId);
        List<SubjectAllocation> allocations = allocationRepository.findByFacultyId(facultyId);

        int totalAllocated = allocations.stream()
                .mapToInt(SubjectAllocation::getAllocatedHoursPerWeek).sum();

        List<FacultyDto.AllocationBreakdown> breakdown = allocations.stream()
                .map(a -> new FacultyDto.AllocationBreakdown(
                        a.getSubject().getName(),
                        a.getSubject().getCode(),
                        a.getSection().getName() + "-Y" + a.getSection().getAcademicYear(),
                        a.getAllocatedHoursPerWeek()
                ))
                .collect(Collectors.toList());

        FacultyDto dto = toDto(faculty);
        dto.setAllocatedHoursPerWeek(totalAllocated);
        dto.setRemainingCapacity(faculty.getMaxHoursPerWeek() - totalAllocated);
        dto.setAllocationBreakdown(breakdown);
        return dto;
    }

    @Transactional
    public FacultyDto create(FacultyDto dto) {
        validateUniqueConstraints(dto, null);
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));

        Faculty faculty = Faculty.builder()
                .name(dto.getName()).employeeId(dto.getEmployeeId())
                .email(dto.getEmail()).phone(dto.getPhone())
                .department(dept)
                .maxHoursPerWeek(dto.getMaxHoursPerWeek())
                .designation(dto.getDesignation())
                .userId(dto.getUserId()).isActive(true)
                .build();
        return toDto(facultyRepository.save(faculty));
    }

    @Transactional
    public FacultyDto update(Long id, FacultyDto dto) {
        Faculty faculty = findEntityById(id);
        validateUniqueConstraints(dto, id);
        faculty.setName(dto.getName());
        faculty.setEmployeeId(dto.getEmployeeId());
        faculty.setEmail(dto.getEmail());
        faculty.setPhone(dto.getPhone());
        faculty.setMaxHoursPerWeek(dto.getMaxHoursPerWeek());
        faculty.setDesignation(dto.getDesignation());
        faculty.setUserId(dto.getUserId());
        faculty.setActive(dto.isActive());
        return toDto(facultyRepository.save(faculty));
    }

    @Transactional
    public void deactivate(Long id) {
        Faculty faculty = findEntityById(id);
        faculty.setActive(false);
        facultyRepository.save(faculty);
    }

    private void validateUniqueConstraints(FacultyDto dto, Long excludeId) {
        boolean emailConflict = excludeId == null
                ? facultyRepository.existsByEmail(dto.getEmail())
                : facultyRepository.existsByEmailAndIdNot(dto.getEmail(), excludeId);
        if (emailConflict) {
            throw new ConflictException("Email '" + dto.getEmail() + "' is already assigned to another faculty member.");
        }
        if (dto.getEmployeeId() != null && !dto.getEmployeeId().isBlank()) {
            boolean empConflict = excludeId == null
                    ? facultyRepository.existsByEmployeeId(dto.getEmployeeId())
                    : facultyRepository.existsByEmployeeIdAndIdNot(dto.getEmployeeId(), excludeId);
            if (empConflict) {
                throw new ConflictException("Employee ID '" + dto.getEmployeeId() + "' is already in use.");
            }
        }
    }

    private Faculty findEntityById(Long id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", id));
    }

    private FacultyDto toDto(Faculty f) {
        String linkedUsername = null;
        if (f.getUserId() != null) {
            linkedUsername = userRepository.findById(f.getUserId())
                    .map(User::getUsername)
                    .orElse(null);
        }

        return FacultyDto.builder()
                .id(f.getId()).name(f.getName()).employeeId(f.getEmployeeId())
                .email(f.getEmail()).phone(f.getPhone())
                .departmentId(f.getDepartment().getId())
                .departmentName(f.getDepartment().getName())
                .maxHoursPerWeek(f.getMaxHoursPerWeek())
                .designation(f.getDesignation()).userId(f.getUserId())
                .linkedUsername(linkedUsername)
                .isActive(f.isActive())
                .build();
    }
}

