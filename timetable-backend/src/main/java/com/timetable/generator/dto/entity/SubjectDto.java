package com.timetable.generator.dto.entity;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectDto {
    private Long id;

    @NotBlank(message = "Subject name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Subject code is required")
    @Size(max = 15)
    private String code;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private String departmentName;

    @NotNull(message = "Semester is required")
    @Min(value = 1)
    private Integer semester;

    @NotNull(message = "Credits are required")
    @Min(value = 1)
    private Integer credits;

    @NotNull(message = "Hours per week is required")
    @Min(value = 1, message = "Must be at least 1 hour per week")
    private Integer hoursPerWeek;

    @NotBlank(message = "Subject type is required (e.g. THEORY, PRACTICAL)")
    private String subjectType;

    @NotBlank(message = "Required room type is required (e.g. CLASSROOM, LAB)")
    private String requiredRoomType;

    @Min(value = 1, message = "Consecutive slots required must be >= 1")
    private Integer consecutiveSlotsRequired = 1;

    @Min(value = 1)
    private Integer minDaysBetweenSessions = 1;

    @Min(value = 1)
    private Integer maxSessionsPerDay = 1;
}
