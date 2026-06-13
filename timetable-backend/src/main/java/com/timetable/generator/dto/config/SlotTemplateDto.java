package com.timetable.generator.dto.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotTemplateDto {
    private Long id;

    @NotNull(message = "Slot number is required")
    @Min(value = 1, message = "Slot number must be >= 1")
    private Integer slotNumber;

    @NotBlank(message = "Label is required")
    @Size(max = 50, message = "Label cannot exceed 50 characters")
    private String label;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @JsonProperty("isBreak")
    private boolean isBreak;

    @NotBlank(message = "Applies-to-days is required (use 'ALL' or comma-separated day names)")
    private String appliesToDays;

    @JsonProperty("isActive")
    private boolean isActive;
}
