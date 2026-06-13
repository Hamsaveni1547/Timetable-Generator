package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.FacultyDto;
import com.timetable.generator.service.FacultyService;
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
@RequestMapping("/api/v1/faculty")
@RequiredArgsConstructor
@Tag(name = "Faculty", description = "Faculty management and workload summary")
public class FacultyController {

    private final FacultyService facultyService;

    @GetMapping
    @Operation(summary = "List faculty (optional filter: ?deptId)")
    public ResponseEntity<ApiResponse<List<FacultyDto>>> getAll(
            @RequestParam(required = false) Long deptId) {
        return ResponseEntity.ok(ApiResponse.success(facultyService.getAll(deptId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacultyDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(facultyService.getById(id)));
    }

    @GetMapping("/{id}/workload-summary")
    @Operation(summary = "Get faculty workload summary with allocation breakdown")
    public ResponseEntity<ApiResponse<FacultyDto>> getWorkloadSummary(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(facultyService.getWorkloadSummary(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<FacultyDto>> create(@Valid @RequestBody FacultyDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(facultyService.create(dto), "Faculty created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<FacultyDto>> update(@PathVariable Long id, @Valid @RequestBody FacultyDto dto) {
        return ResponseEntity.ok(ApiResponse.success(facultyService.update(id, dto), "Faculty updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Deactivate faculty (soft delete)")
    public ResponseEntity<ApiResponse<String>> deactivate(@PathVariable Long id) {
        facultyService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Faculty deactivated."));
    }
}
