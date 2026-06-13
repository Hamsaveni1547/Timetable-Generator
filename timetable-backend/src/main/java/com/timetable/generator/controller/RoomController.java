package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.RoomDto;
import com.timetable.generator.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "Room/infrastructure management")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @Operation(summary = "List all rooms (optional filter: ?type=LAB)")
    public ResponseEntity<ApiResponse<List<RoomDto>>> getAll(
            @RequestParam(required = false) String type) {
        List<RoomDto> rooms = type != null
                ? roomService.getByType(type.toUpperCase())
                : roomService.getAll();
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/types")
    @Operation(summary = "Get distinct room types — drives dynamic dropdown in UI")
    public ResponseEntity<ApiResponse<List<String>>> getTypes() {
        return ResponseEntity.ok(ApiResponse.success(roomService.getDistinctRoomTypes()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomDto>> create(@Valid @RequestBody RoomDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(roomService.create(dto), "Room created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomDto>> update(@PathVariable Long id, @Valid @RequestBody RoomDto dto) {
        return ResponseEntity.ok(ApiResponse.success(roomService.update(id, dto), "Room updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a room (soft delete)")
    public ResponseEntity<ApiResponse<String>> deactivate(@PathVariable Long id) {
        roomService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Room deactivated."));
    }
}
