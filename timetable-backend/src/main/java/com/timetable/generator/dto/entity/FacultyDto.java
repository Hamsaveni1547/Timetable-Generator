package com.timetable.generator.dto.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyDto {
    private Long id;

    @NotBlank(message = "Faculty name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 20)
    private String employeeId;

    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @Size(max = 15)
    private String phone;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private String departmentName;

    @NotNull(message = "Max hours per week is required")
    @Min(value = 1, message = "Max hours per week must be at least 1")
    @Max(value = 40, message = "Max hours per week cannot exceed 40")
    private Integer maxHoursPerWeek;

    @Size(max = 50)
    private String designation;

    private Long userId;

    /** Linked user account username — populated from users table when userId is set. */
    private String linkedUsername;

    @JsonProperty("isActive")
    private boolean isActive;

    // Populated on workload-summary endpoint
    private Integer allocatedHoursPerWeek;
    private Integer remainingCapacity;
    private List<AllocationBreakdown> allocationBreakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationBreakdown {
        private String subjectName;
        private String subjectCode;
        private String sectionName;
        private int allocatedHours;
    }
}

