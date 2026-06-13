package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.config.*;
import com.timetable.generator.entity.auth.User;
import com.timetable.generator.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
@Tag(name = "Dynamic Configuration", description = "Manage schedule parameters, slot templates, and constraint weights. Admin only.")
public class ConfigController {

    private final ScheduleConfigService scheduleConfigService;
    private final SlotTemplateService slotTemplateService;
    private final ConstraintConfigService constraintConfigService;

    // ===== Schedule Config =====

    @GetMapping("/schedule")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all schedule configuration key-value pairs")
    public ResponseEntity<ApiResponse<List<ScheduleConfigDto>>> getAllScheduleConfigs() {
        return ResponseEntity.ok(ApiResponse.success(scheduleConfigService.getAllConfigs()));
    }

    @PutMapping("/schedule/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a schedule configuration value by key")
    public ResponseEntity<ApiResponse<ScheduleConfigDto>> updateScheduleConfig(
            @PathVariable String key,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String newValue = body.get("value");
        if (newValue == null || newValue.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Request body must contain 'value' field."));
        }
        ScheduleConfigDto updated = scheduleConfigService.updateConfig(key, newValue, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Config '" + key + "' updated successfully."));
    }

    // ===== Slot Templates =====

    @GetMapping("/slots")
    @PreAuthorize("isAuthenticated()")   // Any authenticated user can view slots (needed for UI)
    @Operation(summary = "List all slot templates (includes breaks)")
    public ResponseEntity<ApiResponse<List<SlotTemplateDto>>> getAllSlots() {
        return ResponseEntity.ok(ApiResponse.success(slotTemplateService.getAllSlots()));
    }

    @GetMapping("/slots/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List only schedulable slots (no breaks)")
    public ResponseEntity<ApiResponse<List<SlotTemplateDto>>> getActiveSlots() {
        return ResponseEntity.ok(ApiResponse.success(slotTemplateService.getActiveSchedulingSlots()));
    }

    @PostMapping("/slots")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new slot template (Admin)")
    public ResponseEntity<ApiResponse<SlotTemplateDto>> createSlot(@Valid @RequestBody SlotTemplateDto dto) {
        SlotTemplateDto created = slotTemplateService.createSlot(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Slot template created successfully."));
    }

    @PutMapping("/slots/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing slot template (Admin)")
    public ResponseEntity<ApiResponse<SlotTemplateDto>> updateSlot(
            @PathVariable Long id,
            @Valid @RequestBody SlotTemplateDto dto) {
        SlotTemplateDto updated = slotTemplateService.updateSlot(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Slot template updated."));
    }

    @DeleteMapping("/slots/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a slot template (Admin). Fails if referenced by a PUBLISHED timetable.")
    public ResponseEntity<ApiResponse<String>> deactivateSlot(@PathVariable Long id) {
        slotTemplateService.deactivateSlot(id);
        return ResponseEntity.ok(ApiResponse.success("Slot deactivated successfully."));
    }

    // ===== Constraint Config =====

    @GetMapping("/constraints")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all constraint configurations with current penalty weights")
    public ResponseEntity<ApiResponse<List<ConstraintConfigDto>>> getAllConstraints() {
        return ResponseEntity.ok(ApiResponse.success(constraintConfigService.getAllConstraints()));
    }

    @PutMapping("/constraints/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update penalty weight or active status of a constraint (Admin)")
    public ResponseEntity<ApiResponse<ConstraintConfigDto>> updateConstraint(
            @PathVariable String key,
            @RequestBody ConstraintUpdateRequest body,
            @AuthenticationPrincipal User currentUser) {
        ConstraintConfigDto updated = constraintConfigService.updateConstraint(
                key, body.getPenaltyWeight(), body.getIsActive(), currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Constraint '" + key + "' updated."));
    }

    /** Inner request DTO for constraint update (kept local to avoid DTO sprawl). */
    @lombok.Getter
    @lombok.Setter
    public static class ConstraintUpdateRequest {
        private BigDecimal penaltyWeight;
        private Boolean isActive;
    }
}
