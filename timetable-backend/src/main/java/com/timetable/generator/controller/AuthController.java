package com.timetable.generator.controller;

import com.timetable.generator.common.ApiResponse;
import com.timetable.generator.dto.auth.*;
import com.timetable.generator.entity.auth.User;
import com.timetable.generator.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, register, and user profile endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful."));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new user account (Admin only)")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        User created = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "User '" + created.getUsername() + "' created with role " + created.getRole(),
                        "User registered successfully."));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<Object>> getCurrentUser(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                new java.util.HashMap<String, Object>() {
                    {
                        put("userId", currentUser.getId());
                        put("fullName", currentUser.getFullName());
                        put("username", currentUser.getUsername());
                        put("email", currentUser.getEmail());
                        put("role", currentUser.getRole().name());
                        put("departmentId", currentUser.getDepartmentId());
                        put("lastLogin", currentUser.getLastLogin());
                    }
                },
                "Profile fetched successfully."));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change own password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully."));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    @Operation(summary = "Get registered users (Admin sees all, HOD sees department users)")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getAllUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long deptId) {
        return ResponseEntity
                .ok(ApiResponse.success(authService.getAllUsers(currentUser, deptId), "Users fetched successfully."));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing user account (Admin only)")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success(authService.updateUser(id, request), "User updated successfully."));
    }
}
