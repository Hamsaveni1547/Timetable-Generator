package com.timetable.generator.dto.entity;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectAllocationDto {
    private Long id;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;
    private String subjectName;
    private String subjectCode;

    @NotNull(message = "Section ID is required")
    private Long sectionId;
    private String sectionName;

    @NotNull(message = "Faculty ID is required")
    private Long facultyId;
    private String facultyName;

    @NotNull(message = "Allocated hours per week is required")
    @Min(value = 1, message = "Allocated hours must be at least 1")
    private Integer allocatedHoursPerWeek;
}
