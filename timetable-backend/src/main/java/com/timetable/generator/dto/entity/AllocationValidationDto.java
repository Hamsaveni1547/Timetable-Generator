package com.timetable.generator.dto.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

/**
 * Returned by GET /allocations/validate?subjectId=X&sectionId=Y
 * Shows whether the total allocated hours matches the subject's hours_per_week.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllocationValidationDto {
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Integer requiredHoursPerWeek;
    private Integer allocatedTotal;
    @JsonProperty("isComplete")
    private boolean isComplete;
    private Integer deficit;       // Negative = over-allocated
    private List<AllocationBreakdown> allocations;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationBreakdown {
        private Long facultyId;
        private String facultyName;
        private Integer allocatedHours;
    }
}
