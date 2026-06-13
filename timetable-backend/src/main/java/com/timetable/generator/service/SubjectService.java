package com.timetable.generator.service;

import com.timetable.generator.dto.entity.SubjectDto;
import com.timetable.generator.entity.academic.Department;
import com.timetable.generator.entity.academic.Subject;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.DepartmentRepository;
import com.timetable.generator.repository.academic.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;

    public List<SubjectDto> getAll(Long deptId, Integer semester) {
        List<Subject> subjects;
        if (deptId != null && semester != null) {
            subjects = subjectRepository.findByDepartmentIdAndSemester(deptId, semester);
        } else if (deptId != null) {
            subjects = subjectRepository.findByDepartmentId(deptId);
        } else {
            subjects = subjectRepository.findAll();
        }
        return subjects.stream().map(this::toDto).collect(Collectors.toList());
    }

    public SubjectDto getById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional
    public SubjectDto create(SubjectDto dto) {
        if (subjectRepository.existsByCode(dto.getCode())) {
            throw new ConflictException("Subject code '" + dto.getCode() + "' already exists.");
        }
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));

        Subject subject = buildEntity(new Subject(), dto, dept);
        return toDto(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectDto update(Long id, SubjectDto dto) {
        Subject subject = findEntityById(id);
        if (subjectRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new ConflictException("Subject code '" + dto.getCode() + "' already exists.");
        }
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));
        return toDto(subjectRepository.save(buildEntity(subject, dto, dept)));
    }

    @Transactional
    public void delete(Long id) {
        Subject subject = findEntityById(id);
        subjectRepository.delete(subject);
    }

    private Subject buildEntity(Subject s, SubjectDto dto, Department dept) {
        s.setName(dto.getName());
        s.setCode(dto.getCode().toUpperCase());
        s.setDepartment(dept);
        s.setSemester(dto.getSemester());
        s.setCredits(dto.getCredits());
        s.setHoursPerWeek(dto.getHoursPerWeek());
        s.setSubjectType(dto.getSubjectType().toUpperCase());
        s.setRequiredRoomType(dto.getRequiredRoomType().toUpperCase());
        s.setConsecutiveSlotsRequired(dto.getConsecutiveSlotsRequired() != null ? dto.getConsecutiveSlotsRequired() : 1);
        s.setMinDaysBetweenSessions(dto.getMinDaysBetweenSessions() != null ? dto.getMinDaysBetweenSessions() : 1);
        s.setMaxSessionsPerDay(dto.getMaxSessionsPerDay() != null ? dto.getMaxSessionsPerDay() : 1);
        return s;
    }

    private Subject findEntityById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", id));
    }

    private SubjectDto toDto(Subject s) {
        return SubjectDto.builder()
                .id(s.getId()).name(s.getName()).code(s.getCode())
                .departmentId(s.getDepartment().getId())
                .departmentName(s.getDepartment().getName())
                .semester(s.getSemester()).credits(s.getCredits())
                .hoursPerWeek(s.getHoursPerWeek()).subjectType(s.getSubjectType())
                .requiredRoomType(s.getRequiredRoomType())
                .consecutiveSlotsRequired(s.getConsecutiveSlotsRequired())
                .minDaysBetweenSessions(s.getMinDaysBetweenSessions())
                .maxSessionsPerDay(s.getMaxSessionsPerDay())
                .build();
    }
}
