package com.timetable.generator.solver.context;

import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.entity.config.SlotTemplate;
import lombok.Builder;
import lombok.Getter;

import java.util.*;

@Getter
@Builder
public class ConstraintContext {

    // All active non-break slots
    private final List<SlotTemplate> activeSlots;

    // Active slots by day (day -> list of active slots)
    private final Map<String, List<SlotTemplate>> slotsByDay;

    // List of active days of the week (e.g., MONDAY, TUESDAY)
    private final List<String> activeDays;

    // Hard constraints flag map (HC_* -> isActive)
    private final Map<String, Boolean> hardConstraintFlags;

    // Soft constraints penalty weight map (SC_* -> weight)
    private final Map<String, Double> softPenaltyWeights;

    // Faculty blocked slots: facultyId -> Set of "DAY_slotTemplateId"
    private final Map<Long, Set<String>> facultyBlockedSlots;

    // Faculty max hours per week: facultyId -> maxHoursPerWeek
    private final Map<Long, Integer> facultyWeeklyMaxHours;

    // Rooms by ID
    private final Map<Long, Room> roomsById;

    // All active rooms
    private final List<Room> allRooms;

    // Precomputed consecutive slot template ID chains: day -> blockSize -> list of slot ID chains
    // Example: "MONDAY" -> 2 -> [[1, 2], [2, 3], [5, 6]]
    private final Map<String, Map<Integer, List<List<Long>>>> consecutiveSlotChains;

    /**
     * Checks if a specific hard constraint is enabled.
     */
    public boolean isHardConstraintEnabled(String key) {
        return hardConstraintFlags.getOrDefault(key, true);
    }

    /**
     * Gets the weight of a specific soft constraint.
     */
    public double getSoftWeight(String key) {
        return softPenaltyWeights.getOrDefault(key, 0.0);
    }
}
