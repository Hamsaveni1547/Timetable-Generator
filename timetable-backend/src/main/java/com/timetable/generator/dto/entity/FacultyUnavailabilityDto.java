package com.timetable.generator.dto.entity;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyUnavailabilityDto {
    private Long id;
    private Long facultyId;
    private String facultyName;

    @NotBlank(message = "Day of week is required (e.g. MONDAY)")
    private String dayOfWeek;

    @NotNull(message = "Slot template ID is required")
    private Long slotTemplateId;

    private String slotLabel;     // Populated on read
    private LocalTime startTime;  // Populated on read

    private String reason;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;  // null = permanent
}
