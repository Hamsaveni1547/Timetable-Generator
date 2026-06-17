package com.timetable.generator.solver.model;

import lombok.Getter;
import java.util.*;

/**
 * Tracks the assignments and occupancy states during backtracking.
 */
@Getter
public class SolverState {

    // Room occupancy: "day_slotId" -> roomId
    private final Map<String, Long> roomOccupancy = new HashMap<>();

    // Section occupancy: "day_slotId" -> set of sectionIds
    private final Map<String, Set<Long>> sectionOccupancy = new HashMap<>();

    // Faculty occupancy: "day_slotId" -> set of facultyIds
    private final Map<String, Set<Long>> facultyOccupancy = new HashMap<>();

    // Faculty weekly workload: facultyId -> hours assigned
    private final Map<Long, Integer> facultyAssignedHours = new HashMap<>();

    // Faculty daily slots: facultyId -> dayOfWeek -> list of slotTemplateId (sorted asc)
    private final Map<Long, Map<String, List<Long>>> facultyDailySlots = new HashMap<>();

    // Section daily slots: sectionId -> dayOfWeek -> list of slotTemplateId (sorted asc)
    private final Map<Long, Map<String, List<Long>>> sectionDailySlots = new HashMap<>();

    // Subject/section assignments on a given day: "day_subjectId_sectionId" -> count
    private final Map<String, Integer> subjectSectionDailySessions = new HashMap<>();

    // Subject/section assigned days: "subjectId_sectionId" -> list of days assigned
    private final Map<String, List<String>> subjectSectionAssignedDays = new HashMap<>();

    // ---- Batch Lab Parallel Scheduling Support ----

    // Tracks "day_slotId_sectionId" keys where a THEORY class occupies the slot.
    // Used to prevent labs from being scheduled on top of theory classes.
    private final Set<String> sectionTheorySlots = new HashSet<>();

    // The day on which a section's lab batches are locked (all labs must share this day).
    // sectionId -> locked day string
    private final Map<Long, String> sectionLabDay = new HashMap<>();

    // The exact slot-chain all lab batches for a section must share.
    // sectionId -> locked List<slotId>
    private final Map<Long, List<Long>> sectionLabSlotChain = new HashMap<>();

    // Count of lab sessions assigned per section (used to release locks on unassign).
    private final Map<Long, Integer> sectionLabSessionCount = new HashMap<>();

    // Current session assignments
    private final Map<SessionVariable, CandidateAssignment> assignments = new LinkedHashMap<>();

    /**
     * Updates all state maps to reflect assigning the candidate placement to the session.
     */
    public void assign(SessionVariable session, CandidateAssignment candidate) {
        String day = candidate.getDay();
        Long roomId = candidate.getRoomId();
        Long sectionId = session.getSectionId();
        Long facultyId = session.getFacultyId();
        boolean isLab = "LAB".equalsIgnoreCase(session.getRequiredRoomType());

        // 1. Occupancy maps
        for (Long slotId : candidate.getSlotChain()) {
            String key = day + "_" + slotId;
            roomOccupancy.put(key, roomId);
            sectionOccupancy.computeIfAbsent(key, k -> new HashSet<>()).add(sectionId);
            facultyOccupancy.computeIfAbsent(key, k -> new HashSet<>()).add(facultyId);

            // Track theory slots for section (to block labs from overlapping theory)
            if (!isLab) {
                sectionTheorySlots.add(day + "_" + slotId + "_" + sectionId);
            }
        }

        // 2. Faculty weekly workload
        int hours = candidate.getSlotChain().size();
        facultyAssignedHours.put(facultyId, facultyAssignedHours.getOrDefault(facultyId, 0) + hours);

        // 3. Faculty daily slots
        facultyDailySlots.computeIfAbsent(facultyId, k -> new HashMap<>())
                .computeIfAbsent(day, k -> new ArrayList<>())
                .addAll(candidate.getSlotChain());
        Collections.sort(facultyDailySlots.get(facultyId).get(day));

        // 4. Section daily slots
        sectionDailySlots.computeIfAbsent(sectionId, k -> new HashMap<>())
                .computeIfAbsent(day, k -> new ArrayList<>())
                .addAll(candidate.getSlotChain());
        Collections.sort(sectionDailySlots.get(sectionId).get(day));

        // 5. Subject section daily count
        String subSecDayKey = day + "_" + session.subjectSectionKey();
        subjectSectionDailySessions.put(subSecDayKey, subjectSectionDailySessions.getOrDefault(subSecDayKey, 0) + 1);

        // 6. Subject section assigned days
        String subSecKey = session.subjectSectionKey();
        subjectSectionAssignedDays.computeIfAbsent(subSecKey, k -> new ArrayList<>()).add(day);

        // 7. Lab day/slot lock: once the first lab for a section is placed, all
        //    subsequent labs for the same section must use the same day + slot chain.
        if (isLab) {
            sectionLabDay.putIfAbsent(sectionId, day);
            sectionLabSlotChain.putIfAbsent(sectionId, new ArrayList<>(candidate.getSlotChain()));
            sectionLabSessionCount.put(sectionId, sectionLabSessionCount.getOrDefault(sectionId, 0) + 1);
        }

        // 8. Track assignment
        assignments.put(session, candidate);
    }

    /**
     * Reverts all state maps to remove the candidate placement.
     */
    public void unassign(SessionVariable session, CandidateAssignment candidate) {
        String day = candidate.getDay();
        Long sectionId = session.getSectionId();
        Long facultyId = session.getFacultyId();
        boolean isLab = "LAB".equalsIgnoreCase(session.getRequiredRoomType());

        // 1. Occupancy maps
        for (Long slotId : candidate.getSlotChain()) {
            String key = day + "_" + slotId;
            roomOccupancy.remove(key);

            Set<Long> secSet = sectionOccupancy.get(key);
            if (secSet != null) {
                secSet.remove(sectionId);
                if (secSet.isEmpty()) {
                    sectionOccupancy.remove(key);
                }
            }

            Set<Long> facSet = facultyOccupancy.get(key);
            if (facSet != null) {
                facSet.remove(facultyId);
                if (facSet.isEmpty()) {
                    facultyOccupancy.remove(key);
                }
            }

            // Remove theory-slot tracking
            if (!isLab) {
                sectionTheorySlots.remove(day + "_" + slotId + "_" + sectionId);
            }
        }

        // 2. Faculty weekly workload
        int hours = candidate.getSlotChain().size();
        int currentHours = facultyAssignedHours.getOrDefault(facultyId, 0);
        if (currentHours <= hours) {
            facultyAssignedHours.remove(facultyId);
        } else {
            facultyAssignedHours.put(facultyId, currentHours - hours);
        }

        // 3. Faculty daily slots
        Map<String, List<Long>> facDays = facultyDailySlots.get(facultyId);
        if (facDays != null) {
            List<Long> slots = facDays.get(day);
            if (slots != null) {
                slots.removeAll(candidate.getSlotChain());
                if (slots.isEmpty()) {
                    facDays.remove(day);
                }
            }
            if (facDays.isEmpty()) {
                facultyDailySlots.remove(facultyId);
            }
        }

        // 4. Section daily slots
        Map<String, List<Long>> secDays = sectionDailySlots.get(sectionId);
        if (secDays != null) {
            List<Long> slots = secDays.get(day);
            if (slots != null) {
                slots.removeAll(candidate.getSlotChain());
                if (slots.isEmpty()) {
                    secDays.remove(day);
                }
            }
            if (secDays.isEmpty()) {
                sectionDailySlots.remove(sectionId);
            }
        }

        // 5. Subject section daily count
        String subSecDayKey = day + "_" + session.subjectSectionKey();
        int dailyCount = subjectSectionDailySessions.getOrDefault(subSecDayKey, 0);
        if (dailyCount <= 1) {
            subjectSectionDailySessions.remove(subSecDayKey);
        } else {
            subjectSectionDailySessions.put(subSecDayKey, dailyCount - 1);
        }

        // 6. Subject section assigned days
        String subSecKey = session.subjectSectionKey();
        List<String> assignedDays = subjectSectionAssignedDays.get(subSecKey);
        if (assignedDays != null) {
            assignedDays.remove(day);
            if (assignedDays.isEmpty()) {
                subjectSectionAssignedDays.remove(subSecKey);
            }
        }

        // 7. Release lab day/slot lock when the last lab session for this section is removed
        if (isLab) {
            int labCount = sectionLabSessionCount.getOrDefault(sectionId, 1) - 1;
            if (labCount <= 0) {
                sectionLabDay.remove(sectionId);
                sectionLabSlotChain.remove(sectionId);
                sectionLabSessionCount.remove(sectionId);
            } else {
                sectionLabSessionCount.put(sectionId, labCount);
            }
        }

        // 8. Untrack assignment
        assignments.remove(session);
    }
}
