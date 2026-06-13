package com.timetable.generator.service;

import com.timetable.generator.dto.entity.DepartmentDto;
import com.timetable.generator.entity.academic.Department;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final SectionRepository sectionRepository;
    private final FacultyRepository facultyRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public List<DepartmentDto> getAll() {
        return departmentRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public DepartmentDto getById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional
    public DepartmentDto create(DepartmentDto dto) {
        if (departmentRepository.existsByName(dto.getName())) {
            throw new ConflictException("Department name '" + dto.getName() + "' already exists.");
        }
        if (departmentRepository.existsByCode(dto.getCode())) {
            throw new ConflictException("Department code '" + dto.getCode() + "' already exists.");
        }
        Department dept = Department.builder()
                .name(dto.getName())
                .code(dto.getCode().toUpperCase())
                .hodUserId(dto.getHodUserId())
                .isActive(true)
                .build();
        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto update(Long id, DepartmentDto dto) {
        Department dept = findEntityById(id);
        if (departmentRepository.existsByNameAndIdNot(dto.getName(), id)) {
            throw new ConflictException("Department name '" + dto.getName() + "' already exists.");
        }
        if (departmentRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new ConflictException("Department code '" + dto.getCode() + "' already exists.");
        }
        dept.setName(dto.getName());
        dept.setCode(dto.getCode().toUpperCase());
        dept.setHodUserId(dto.getHodUserId());
        dept.setActive(dto.isActive());
        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public void delete(Long id) {
        Department dept = findEntityById(id);
        boolean hasSections = !sectionRepository.findByDepartmentId(id).isEmpty();
        boolean hasFaculty  = !facultyRepository.findByDepartmentId(id).isEmpty();
        boolean hasSubjects = !subjectRepository.findByDepartmentId(id).isEmpty();
        if (hasSections || hasFaculty || hasSubjects) {
            throw new ConflictException(
                "Cannot delete department '" + dept.getName() + "' — it has active sections, faculty, or subjects. Deactivate them first.");
        }
        departmentRepository.delete(dept);
    }

    private Department findEntityById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    private DepartmentDto toDto(Department d) {
        String hodName = null;
        if (d.getHodUserId() != null) {
            hodName = userRepository.findById(d.getHodUserId())
                    .map(u -> u.getFullName()).orElse(null);
        }
        return DepartmentDto.builder()
                .id(d.getId()).name(d.getName()).code(d.getCode())
                .hodUserId(d.getHodUserId()).hodName(hodName)
                .isActive(d.isActive()).build();
    }
}
