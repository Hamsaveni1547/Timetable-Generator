package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.timetable.*;
import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.auth.User;
import com.timetable.generator.entity.timetable.TimetableEntry;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.academic.FacultyRepository;
import com.timetable.generator.repository.timetable.TimetableEntryRepository;
import com.timetable.generator.service.TimetableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/timetable")
@RequiredArgsConstructor
@Tag(name = "Timetable Generation & Management", description = "Endpoints for scheduling, publishing, overrides, and views")
public class TimetableController {

    private final TimetableService timetableService;
    private final FacultyRepository facultyRepository;
    private final TimetableEntryRepository entryRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Generate a draft timetable for a department and semester")
    public ResponseEntity<ApiResponse<GenerationStatusDto>> generate(
            @Valid @RequestBody GenerateRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        // Enforce HOD scope
        if (currentUser.getRole() == User.Role.HOD) {
            request.setDepartmentId(currentUser.getDepartmentId());
        } else if (request.getDepartmentId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("VALIDATION_ERROR", "Department ID is required for ADMIN role."));
        }

        GenerationStatusDto status = timetableService.generate(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(status, "Timetable generation completed."));
    }

    @GetMapping("/generations")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all timetable generations for a department")
    public ResponseEntity<ApiResponse<List<GenerationStatusDto>>> getGenerations(
            @RequestParam Long deptId,
            @AuthenticationPrincipal User currentUser) {
        
        validateDepartmentScope(currentUser, deptId);
        List<GenerationStatusDto> list = timetableService.getGenerations(deptId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/generations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Get status of a specific timetable generation")
    public ResponseEntity<ApiResponse<GenerationStatusDto>> getGeneration(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        validateGenerationScope(currentUser, id);
        GenerationStatusDto gen = timetableService.getGeneration(id);
        return ResponseEntity.ok(ApiResponse.success(gen));
    }

    @GetMapping("/generations/{id}/entries")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Get all entries for a specific timetable generation")
    public ResponseEntity<ApiResponse<List<TimetableEntryDto>>> getEntries(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        validateGenerationScope(currentUser, id);
        List<TimetableEntryDto> entries = timetableService.getEntries(id);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @PostMapping("/generations/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Publish a draft timetable generation")
    public ResponseEntity<ApiResponse<GenerationStatusDto>> publish(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        validateGenerationScope(currentUser, id);
        GenerationStatusDto published = timetableService.publish(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(published, "Timetable published successfully."));
    }

    @DeleteMapping("/generations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Delete a timetable generation (Draft/Failed only)")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        validateGenerationScope(currentUser, id);
        timetableService.deleteGeneration(id);
        return ResponseEntity.ok(ApiResponse.success("Timetable generation deleted successfully."));
    }

    @PostMapping("/entries/{id}/validate-swap")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Validate a potential swap or manual move for a timetable entry")
    public ResponseEntity<ApiResponse<SwapValidationResult>> validateSwap(
            @PathVariable Long id,
            @RequestParam Long generationId,
            @Valid @RequestBody OverrideRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        validateGenerationScope(currentUser, generationId);
        SwapValidationResult result = timetableService.validateSwap(id, request, generationId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Commit a manual override for a timetable entry")
    public ResponseEntity<ApiResponse<TimetableEntryDto>> commitOverride(
            @PathVariable Long id,
            @Valid @RequestBody OverrideRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        TimetableEntry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", id));
        validateGenerationScope(currentUser, entry.getGeneration().getId());

        TimetableEntryDto updated = timetableService.commitOverride(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Manual override applied successfully."));
    }

    // ===== Timetable Views (Public to respective roles) =====

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD','FACULTY')")
    @Operation(summary = "View timetable for a specific faculty member")
    public ResponseEntity<ApiResponse<List<TimetableEntryDto>>> getFacultyTimetable(
            @PathVariable Long facultyId,
            @RequestParam Long generationId,
            @AuthenticationPrincipal User currentUser) {
        
        if (currentUser.getRole() == User.Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserIdAndIsActiveTrue(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("No active faculty record linked to your user account."));
            if (!faculty.getId().equals(facultyId)) {
                throw new AccessDeniedException("You are only authorized to view your own allocations.");
            }
        }
        
        List<TimetableEntryDto> entries = timetableService.getFacultyTimetable(facultyId, generationId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/faculty/{facultyId}/workload-actual")
    @PreAuthorize("hasAnyRole('ADMIN','HOD','FACULTY')")
    @Operation(summary = "Get the actual scheduled teaching hours for a faculty member")
    public ResponseEntity<ApiResponse<Long>> getActualFacultyWorkload(
            @PathVariable Long facultyId,
            @RequestParam Long generationId,
            @AuthenticationPrincipal User currentUser) {
        
        if (currentUser.getRole() == User.Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserIdAndIsActiveTrue(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("No active faculty record linked to your user."));
            if (!faculty.getId().equals(facultyId)) {
                throw new AccessDeniedException("You can only query your own workload.");
            }
        }
        
        long workload = timetableService.getActualFacultyWorkload(facultyId, generationId);
        return ResponseEntity.ok(ApiResponse.success(workload));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD','STUDENT')")
    @Operation(summary = "View timetable for a specific student section")
    public ResponseEntity<ApiResponse<List<TimetableEntryDto>>> getSectionTimetable(
            @PathVariable Long sectionId,
            @RequestParam Long generationId) {
        
        List<TimetableEntryDto> entries = timetableService.getSectionTimetable(sectionId, generationId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "View room occupancy timetable")
    public ResponseEntity<ApiResponse<List<TimetableEntryDto>>> getRoomTimetable(
            @PathVariable Long roomId,
            @RequestParam Long generationId) {
        
        List<TimetableEntryDto> entries = timetableService.getRoomTimetable(roomId, generationId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/department/{deptId}")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "View entire department timetable")
    public ResponseEntity<ApiResponse<List<TimetableEntryDto>>> getDepartmentTimetable(
            @PathVariable Long deptId,
            @RequestParam Long generationId,
            @AuthenticationPrincipal User currentUser) {
        
        validateDepartmentScope(currentUser, deptId);
        validateGenerationScope(currentUser, generationId);
        List<TimetableEntryDto> entries = timetableService.getEntries(generationId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    // ===== Scope Helpers =====

    private void validateDepartmentScope(User currentUser, Long requestedDeptId) {
        if (currentUser.getRole() == User.Role.HOD) {
            if (currentUser.getDepartmentId() == null || !currentUser.getDepartmentId().equals(requestedDeptId)) {
                throw new AccessDeniedException("HODs can only access resources within their own department.");
            }
        }
    }

    private void validateGenerationScope(User currentUser, Long generationId) {
        if (currentUser.getRole() == User.Role.HOD) {
            GenerationStatusDto gen = timetableService.getGeneration(generationId);
            if (!gen.getDepartmentId().equals(currentUser.getDepartmentId())) {
                throw new AccessDeniedException("HODs can only access timetables within their own department.");
            }
        }
    }
}
