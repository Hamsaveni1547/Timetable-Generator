package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.entity.SubjectDto;
import com.timetable.generator.service.SubjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
@Tag(name = "Subjects", description = "Subject management (Admin + HOD)")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectDto>>> getAll(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.getAll(deptId, semester)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SubjectDto>> create(@Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(subjectService.create(dto), "Subject created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<SubjectDto>> update(@PathVariable Long id, @Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.update(id, dto), "Subject updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted."));
    }
}
