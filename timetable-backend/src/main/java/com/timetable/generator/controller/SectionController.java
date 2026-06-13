package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.SectionDto;
import com.timetable.generator.service.SectionService;
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
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
@Tag(name = "Sections", description = "Section management (Admin + HOD)")
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    @Operation(summary = "List sections (filter: ?deptId&academicYear&semester)")
    public ResponseEntity<ApiResponse<List<SectionDto>>> getAll(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer academicYear,
            @RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok(ApiResponse.success(sectionService.getAll(deptId, academicYear, semester)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SectionDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sectionService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SectionDto>> create(@Valid @RequestBody SectionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(sectionService.create(dto), "Section created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SectionDto>> update(@PathVariable Long id, @Valid @RequestBody SectionDto dto) {
        return ResponseEntity.ok(ApiResponse.success(sectionService.update(id, dto), "Section updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        sectionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Section deleted."));
    }
}
