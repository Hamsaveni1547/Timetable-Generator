package com.timetable.generator.solver;

import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.model.CandidateAssignment;
import com.timetable.generator.solver.model.SessionVariable;
import com.timetable.generator.solver.model.SolverState;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class PenaltyCalculator {

    /**
     * Calculates the incremental soft penalty cost if the candidate assignment is applied.
     */
    public double calculate(SessionVariable session, CandidateAssignment candidate, ConstraintContext ctx, SolverState state) {
        double penalty = 0.0;

        String day = candidate.getDay();
        Long facultyId = session.getFacultyId();
        Long sectionId = session.getSectionId();

        // 1. SC_FACULTY_WEEKLY_WORKLOAD
        double workloadWeight = ctx.getSoftWeight("SC_FACULTY_WEEKLY_WORKLOAD");
        if (workloadWeight > 0) {
            int maxHours = session.getFacultyMaxHoursPerWeek();
            int currentHours = state.getFacultyAssignedHours().getOrDefault(facultyId, 0);
            int blockSize = candidate.getSlotChain().size();

            int excessBefore = Math.max(0, currentHours - maxHours);
            int excessAfter = Math.max(0, (currentHours + blockSize) - maxHours);
            int incrementalExcess = excessAfter - excessBefore;

            penalty += incrementalExcess * workloadWeight;
        }

        // 2. SC_SUBJECT_DAILY_REPEAT
        double dailyRepeatWeight = ctx.getSoftWeight("SC_SUBJECT_DAILY_REPEAT");
        if (dailyRepeatWeight > 0) {
            String subSecDayKey = day + "_" + session.subjectSectionKey();
            int currentDailySessions = state.getSubjectSectionDailySessions().getOrDefault(subSecDayKey, 0);
            int maxDailySessions = session.getMaxSessionsPerDay();

            if (currentDailySessions + 1 > maxDailySessions) {
                penalty += dailyRepeatWeight;
            }
        }

        // 3. SC_SUBJECT_SPREAD
        double spreadWeight = ctx.getSoftWeight("SC_SUBJECT_SPREAD");
        if (spreadWeight > 0 && session.getMinDaysBetweenSessions() > 1) {
            int minDays = session.getMinDaysBetweenSessions();
            String subSecKey = session.subjectSectionKey();
            List<String> assignedDays = state.getSubjectSectionAssignedDays().get(subSecKey);
            if (assignedDays != null) {
                int currentDayIdx = getDayIndex(day);
                for (String prevDay : assignedDays) {
                    int prevDayIdx = getDayIndex(prevDay);
                    int dist = Math.abs(currentDayIdx - prevDayIdx);
                    if (dist > 0 && dist < minDays) {
                        penalty += (minDays - dist) * spreadWeight;
                    }
                }
            }
        }

        // 4. SC_FACULTY_DAILY_GAP
        double facultyGapWeight = ctx.getSoftWeight("SC_FACULTY_DAILY_GAP");
        if (facultyGapWeight > 0) {
            List<SlotTemplate> activeSlots = ctx.getSlotsByDay().get(day);
            if (activeSlots != null) {
                List<Long> existingSlots = new ArrayList<>();
                Map<String, List<Long>> facDays = state.getFacultyDailySlots().get(facultyId);
                if (facDays != null && facDays.get(day) != null) {
                    existingSlots.addAll(facDays.get(day));
                }

                int gapsBefore = calculateGaps(existingSlots, activeSlots);
                
                List<Long> slotsAfter = new ArrayList<>(existingSlots);
                slotsAfter.addAll(candidate.getSlotChain());
                int gapsAfter = calculateGaps(slotsAfter, activeSlots);

                penalty += (gapsAfter - gapsBefore) * facultyGapWeight;
            }
        }

        // 5. SC_STUDENT_DAILY_GAP
        double studentGapWeight = ctx.getSoftWeight("SC_STUDENT_DAILY_GAP");
        if (studentGapWeight > 0) {
            List<SlotTemplate> activeSlots = ctx.getSlotsByDay().get(day);
            if (activeSlots != null) {
                List<Long> existingSlots = new ArrayList<>();
                Map<String, List<Long>> secDays = state.getSectionDailySlots().get(sectionId);
                if (secDays != null && secDays.get(day) != null) {
                    existingSlots.addAll(secDays.get(day));
                }

                int gapsBefore = calculateGaps(existingSlots, activeSlots);
                
                List<Long> slotsAfter = new ArrayList<>(existingSlots);
                slotsAfter.addAll(candidate.getSlotChain());
                int gapsAfter = calculateGaps(slotsAfter, activeSlots);

                penalty += (gapsAfter - gapsBefore) * studentGapWeight;
            }
        }

        return penalty;
    }

    private int calculateGaps(List<Long> assignedSlotIds, List<SlotTemplate> activeSlotsOfDay) {
        if (assignedSlotIds == null || assignedSlotIds.size() <= 1) {
            return 0;
        }

        List<Integer> indices = new ArrayList<>();
        for (Long slotId : assignedSlotIds) {
            for (int i = 0; i < activeSlotsOfDay.size(); i++) {
                if (activeSlotsOfDay.get(i).getId().equals(slotId)) {
                    indices.add(i);
                    break;
                }
            }
        }

        if (indices.size() <= 1) {
            return 0;
        }

        int minIdx = Collections.min(indices);
        int maxIdx = Collections.max(indices);

        Set<Integer> uniqueIndices = new HashSet<>(indices);
        int totalSlotsInRange = maxIdx - minIdx + 1;
        return totalSlotsInRange - uniqueIndices.size();
    }

    private int getDayIndex(String day) {
        switch (day.toUpperCase()) {
            case "MONDAY": return 0;
            case "TUESDAY": return 1;
            case "WEDNESDAY": return 2;
            case "THURSDAY": return 3;
            case "FRIDAY": return 4;
            case "SATURDAY": return 5;
            case "SUNDAY": return 6;
            default: return -1;
        }
    }
}
