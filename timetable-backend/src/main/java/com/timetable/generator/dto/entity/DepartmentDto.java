package com.timetable.generator.dto.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDto {
    private Long id;

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Department code is required")
    @Size(max = 10, message = "Code cannot exceed 10 characters")
    private String code;

    private Long hodUserId;
    private String hodName;   // Populated on read, ignored on write

    @JsonProperty("isActive")
    private boolean isActive;
}

