package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.FacultyUnavailabilityDto;
import com.timetable.generator.service.FacultyUnavailabilityService;
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
@RequiredArgsConstructor
@Tag(name = "Faculty Unavailability", description = "Manage faculty unavailability blocks — enforced as hard constraints by solver")
public class FacultyUnavailabilityController {

    private final FacultyUnavailabilityService unavailabilityService;

    @GetMapping("/api/v1/faculty/{facultyId}/unavailability")
    @Operation(summary = "Get all unavailability blocks for a faculty member")
    public ResponseEntity<ApiResponse<List<FacultyUnavailabilityDto>>> getByFaculty(
            @PathVariable Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success(unavailabilityService.getByFaculty(facultyId)));
    }

    @PostMapping("/api/v1/faculty/{facultyId}/unavailability")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Add an unavailability block for a faculty member")
    public ResponseEntity<ApiResponse<FacultyUnavailabilityDto>> create(
            @PathVariable Long facultyId,
            @Valid @RequestBody FacultyUnavailabilityDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                    unavailabilityService.create(facultyId, dto),
                    "Unavailability block added."));
    }

    @DeleteMapping("/api/v1/faculty/unavailability/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Remove an unavailability block")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        unavailabilityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Unavailability block removed."));
    }

    @GetMapping("/api/v1/departments/{deptId}/unavailability")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Get all unavailability entries for all faculty in a department (HOD view)")
    public ResponseEntity<ApiResponse<List<FacultyUnavailabilityDto>>> getByDepartment(
            @PathVariable Long deptId) {
        return ResponseEntity.ok(ApiResponse.success(unavailabilityService.getByDepartment(deptId)));
    }
}
