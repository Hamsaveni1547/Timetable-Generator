package com.timetable.generator.service;

import com.timetable.generator.dto.entity.SectionDto;
import com.timetable.generator.entity.academic.Department;
import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.entity.academic.Section;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.exception.ValidationException;
import com.timetable.generator.repository.academic.DepartmentRepository;
import com.timetable.generator.repository.academic.RoomRepository;
import com.timetable.generator.repository.academic.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepository sectionRepository;
    private final DepartmentRepository departmentRepository;
    private final RoomRepository roomRepository;

    public List<SectionDto> getAll(Long deptId, Integer academicYear, Integer semester) {
        List<Section> sections;
        if (deptId != null && academicYear != null && semester != null) {
            sections = sectionRepository.findByDepartmentIdAndAcademicYearAndSemester(deptId, academicYear, semester);
        } else if (deptId != null && semester != null) {
            sections = sectionRepository.findByDepartmentIdAndSemester(deptId, semester);
        } else if (deptId != null) {
            sections = sectionRepository.findByDepartmentId(deptId);
        } else {
            sections = sectionRepository.findAll();
        }
        return sections.stream().map(this::toDto).collect(Collectors.toList());
    }

    public SectionDto getById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional
    public SectionDto create(SectionDto dto) {
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", dto.getDepartmentId()));

        Room room = resolveRoom(dto.getRoomId(), dto.getRoomName(), dto.getStudentCount(), null);

        if (sectionRepository.existsByNameAndAcademicYearAndSemesterAndDepartmentId(
                dto.getName(), dto.getAcademicYear(), dto.getSemester(), dto.getDepartmentId())) {
            throw new ConflictException("Section '" + dto.getName() + "' already exists for Year "
                    + dto.getAcademicYear() + " Sem " + dto.getSemester() + " in " + dept.getName() + ".");
        }

        ensureRoomAvailability(room, null);

        Section section = Section.builder()
                .name(dto.getName().toUpperCase())
                .academicYear(dto.getAcademicYear())
                .semester(dto.getSemester())
                .studentCount(dto.getStudentCount())
                .department(dept)
                .room(room)
                .isActive(true)
                .build();
        return toDto(sectionRepository.save(section));
    }

    @Transactional
    public SectionDto update(Long id, SectionDto dto) {
        Section section = findEntityById(id);
        Room room = resolveRoom(dto.getRoomId(), dto.getRoomName(), dto.getStudentCount(), id);

        section.setName(dto.getName().toUpperCase());
        section.setAcademicYear(dto.getAcademicYear());
        section.setSemester(dto.getSemester());
        section.setStudentCount(dto.getStudentCount());
        section.setRoom(room);
        section.setActive(dto.isActive());
        return toDto(sectionRepository.save(section));
    }

    @Transactional
    public void delete(Long id) {
        Section section = findEntityById(id);
        sectionRepository.delete(section);
    }

    /** HOD scope check: verifies section belongs to the HOD's department. */
    public void verifyDepartmentAccess(Long sectionId, Long hodDepartmentId) {
        Section section = findEntityById(sectionId);
        if (!section.getDepartment().getId().equals(hodDepartmentId)) {
            throw new ValidationException("You can only manage sections in your own department.");
        }
    }

    private Section findEntityById(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Section", id));
    }

    private Room resolveRoom(Long roomId, String roomName, Integer studentCount, Long currentSectionId) {
        Room room;
        if (roomId != null) {
            room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new ResourceNotFoundException("Room", roomId));
        } else if (roomName != null && !roomName.trim().isEmpty()) {
            room = roomRepository.findFirstByNameIgnoreCase(roomName.trim())
                    .map(existing -> {
                        if (!existing.isActive()) {
                            existing.setActive(true);
                        }
                        if (studentCount != null && existing.getCapacity() < studentCount) {
                            existing.setCapacity(studentCount);
                        }
                        if (existing.getRoomType() == null || existing.getRoomType().trim().isEmpty()) {
                            existing.setRoomType("CLASSROOM");
                        }
                        return roomRepository.save(existing);
                    })
                    .orElseGet(() -> roomRepository.save(Room.builder()
                            .name(roomName.trim())
                            .roomType("CLASSROOM")
                            .capacity(studentCount != null ? studentCount : 1)
                            .isActive(true)
                            .build()));
        } else {
            throw new ValidationException("Assigned classroom is required.");
        }

        if (!room.isActive()) {
            throw new ValidationException("Room '" + room.getName() + "' is inactive.");
        }

        ensureRoomAvailability(room, currentSectionId);
        return room;
    }

    private void ensureRoomAvailability(Room room, Long currentSectionId) {
        if (room == null) {
            return;
        }

        boolean roomInUse = currentSectionId == null
                ? sectionRepository.existsByRoom_IdAndIsActiveTrue(room.getId())
                : sectionRepository.existsByRoom_IdAndIsActiveTrueAndIdNot(room.getId(), currentSectionId);

        if (roomInUse) {
            throw new ConflictException("Room '" + room.getName() + "' is already assigned to another active section.");
        }
    }

    private SectionDto toDto(Section s) {
        return SectionDto.builder()
                .id(s.getId()).name(s.getName())
                .academicYear(s.getAcademicYear()).semester(s.getSemester())
                .studentCount(s.getStudentCount())
                .departmentId(s.getDepartment().getId())
                .departmentName(s.getDepartment().getName())
                .roomId(s.getRoom() != null ? s.getRoom().getId() : null)
                .roomName(s.getRoom() != null ? s.getRoom().getName() : null)
                .isActive(s.isActive())
                .build();
    }
}
