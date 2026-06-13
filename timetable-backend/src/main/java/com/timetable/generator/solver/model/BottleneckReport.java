package com.timetable.generator.solver.model;

import lombok.*;
import java.util.List;

/**
 * Structured report returned when the solver cannot find a valid timetable.
 * Serialized to JSON and stored in timetable_generations.bottleneck_report column.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BottleneckReport {

    private String type; // "UNSOLVABLE", "TIMEOUT", "INCOMPLETE_ALLOCATIONS"

    @Builder.Default
    private List<BottleneckItem> bottlenecks = List.of();

    @Builder.Default
    private List<String> suggestedActions = List.of();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BottleneckItem {
        private String category;    // "RESOURCE_SHORTAGE", "OVERLOAD", "UNAVAILABILITY_CONFLICT"
        private String entityType;  // "ROOM", "FACULTY", "SUBJECT", "SECTION"
        private List<Long> entityIds;
        private String description;
    }

    /** Factory: incomplete allocation failure. */
    public static BottleneckReport incompleteAllocations(List<String> missingSubjects) {
        return BottleneckReport.builder()
                .type("INCOMPLETE_ALLOCATIONS")
                .bottlenecks(List.of(
                    BottleneckItem.builder()
                        .category("MISSING_ALLOCATION")
                        .entityType("SUBJECT")
                        .description("The following subjects have incomplete allocations (hours don't match): "
                            + String.join(", ", missingSubjects))
                        .build()
                ))
                .suggestedActions(List.of(
                    "Go to the Allocations page and ensure all subject allocations sum to the subject's hours_per_week."
                ))
                .build();
    }

    /** Factory: solver timed out or too complex. */
    public static BottleneckReport timeout(int sessionCount, int attempts) {
        return BottleneckReport.builder()
                .type("TIMEOUT")
                .bottlenecks(List.of(
                    BottleneckItem.builder()
                        .category("COMPLEXITY")
                        .entityType("SOLVER")
                        .description("Solver exhausted search space after " + attempts
                            + " attempts for " + sessionCount + " sessions.")
                        .build()
                ))
                .suggestedActions(List.of(
                    "Add more rooms of the required types.",
                    "Reduce the number of consecutive-slot (lab) subjects.",
                    "Add more faculty or increase their max_hours_per_week.",
                    "Reduce the number of sections or subjects per semester."
                ))
                .build();
    }
}
