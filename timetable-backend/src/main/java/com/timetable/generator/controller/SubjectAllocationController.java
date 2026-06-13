package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.*;
import com.timetable.generator.service.SubjectAllocationService;
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
@RequestMapping("/api/v1/allocations")
@RequiredArgsConstructor
@Tag(name = "Subject Allocations", description = "Manage faculty-to-subject allocations (multi-faculty support)")
public class SubjectAllocationController {

    private final SubjectAllocationService allocationService;

    @GetMapping
    @Operation(summary = "List allocations (filter: ?deptId&semester)")
    public ResponseEntity<ApiResponse<List<SubjectAllocationDto>>> getAll(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer semester) {
        List<SubjectAllocationDto> list = (deptId != null && semester != null)
                ? allocationService.getByDepartmentAndSemester(deptId, semester)
                : allocationService.getByDepartmentAndSemester(null, null);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SubjectAllocationDto>> create(@Valid @RequestBody SubjectAllocationDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(allocationService.create(dto), "Allocation created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SubjectAllocationDto>> update(
            @PathVariable Long id, @Valid @RequestBody SubjectAllocationDto dto) {
        return ResponseEntity.ok(ApiResponse.success(allocationService.update(id, dto), "Allocation updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        allocationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Allocation removed."));
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate allocation completeness for a subject-section pair")
    public ResponseEntity<ApiResponse<AllocationValidationDto>> validate(
            @RequestParam Long subjectId,
            @RequestParam Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success(allocationService.validateCompletion(subjectId, sectionId)));
    }
}
