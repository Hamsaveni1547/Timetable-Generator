package com.timetable.generator.dto.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionDto {
    private Long id;

    @NotBlank(message = "Section name is required (e.g. A, B, C)")
    @Size(max = 20)
    private String name;

    @NotNull(message = "Academic year is required")
    @Min(value = 1, message = "Academic year must be >= 1")
    private Integer academicYear;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be >= 1")
    private Integer semester;

    @NotNull(message = "Student count is required")
    @Min(value = 1, message = "Student count must be at least 1")
    private Integer studentCount;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private String departmentName; // Populated on read

    private Long roomId;
    private String roomName;

    @JsonProperty("isActive")
    private boolean isActive;
}
