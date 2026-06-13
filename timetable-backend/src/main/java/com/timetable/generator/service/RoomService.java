package com.timetable.generator.service;

import com.timetable.generator.dto.entity.RoomDto;
import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public List<RoomDto> getAll() {
        // IMPORTANT: UI uses GET /api/v1/rooms (no type filter). It must not return
        // deactivated rooms.
        return roomRepository.findByIsActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RoomDto> getByType(String roomType) {
        return roomRepository.findByRoomTypeAndIsActiveTrue(roomType).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<String> getDistinctRoomTypes() {
        return roomRepository.findDistinctActiveRoomTypes();
    }

    public RoomDto getById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional
    public RoomDto create(RoomDto dto) {
        if (roomRepository.findAll().stream().anyMatch(r -> r.getName().equalsIgnoreCase(dto.getName()))) {
            throw new ConflictException("Room '" + dto.getName() + "' already exists.");
        }
        Room room = Room.builder()
                .name(dto.getName())
                .roomType(dto.getRoomType().toUpperCase())
                .capacity(dto.getCapacity())
                .building(dto.getBuilding())
                .floorNumber(dto.getFloorNumber())
                .isActive(true)
                .build();
        return toDto(roomRepository.save(room));
    }

    @Transactional
    public RoomDto update(Long id, RoomDto dto) {
        Room room = findEntityById(id);
        room.setName(dto.getName());
        room.setRoomType(dto.getRoomType().toUpperCase());
        room.setCapacity(dto.getCapacity());
        room.setBuilding(dto.getBuilding());
        room.setFloorNumber(dto.getFloorNumber());
        room.setActive(dto.isActive());
        return toDto(roomRepository.save(room));
    }

    @Transactional
    public void deactivate(Long id) {
        Room room = findEntityById(id);
        room.setActive(false);
        roomRepository.save(room);
    }

    private Room findEntityById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));
    }

    private RoomDto toDto(Room r) {
        return RoomDto.builder()
                .id(r.getId()).name(r.getName()).roomType(r.getRoomType())
                .capacity(r.getCapacity()).building(r.getBuilding())
                .floorNumber(r.getFloorNumber()).isActive(r.isActive())
                .build();
    }
}
