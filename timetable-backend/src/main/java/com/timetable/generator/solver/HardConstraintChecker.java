package com.timetable.generator.solver;

import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.model.CandidateAssignment;
import com.timetable.generator.solver.model.SessionVariable;
import com.timetable.generator.solver.model.SolverState;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class HardConstraintChecker {

    /**
     * Checks if a candidate assignment for a session satisfies all active hard constraints.
     */
    public boolean isValid(SessionVariable session, CandidateAssignment candidate, ConstraintContext ctx, SolverState state) {
        String day = candidate.getDay();
        Long roomId = candidate.getRoomId();
        Long sectionId = session.getSectionId();
        Long facultyId = session.getFacultyId();

        // 1. Room Type Match (HC_ROOM_TYPE_MATCH)
        if (ctx.isHardConstraintEnabled("HC_ROOM_TYPE_MATCH")) {
            String requiredRoomType = session.getRequiredRoomType();
            if (requiredRoomType != null && !requiredRoomType.trim().isEmpty()) {
                if (!requiredRoomType.equalsIgnoreCase(candidate.getRoomType())) {
                    return false;
                }
            }
        }

        // 2. Room Capacity (HC_ROOM_CAPACITY)
        if (ctx.isHardConstraintEnabled("HC_ROOM_CAPACITY")) {
            if (candidate.getRoomCapacity() < session.getSectionStudentCount()) {
                return false;
            }
        }

        // 3. Slot-by-slot checks (clash & unavailability)
        for (Long slotId : candidate.getSlotChain()) {
            String key = day + "_" + slotId;

            // Room Clash (HC_NO_ROOM_CLASH)
            if (ctx.isHardConstraintEnabled("HC_NO_ROOM_CLASH")) {
                Long occupyingRoomId = state.getRoomOccupancy().get(key);
                if (occupyingRoomId != null && occupyingRoomId.equals(roomId)) {
                    return false;
                }
            }

            // Section Clash (HC_NO_SECTION_CLASH)
            if (ctx.isHardConstraintEnabled("HC_NO_SECTION_CLASH")) {
                Set<Long> occupyingSections = state.getSectionOccupancy().get(key);
                if (occupyingSections != null && occupyingSections.contains(sectionId)) {
                    return false;
                }
            }

            // Faculty Clash (HC_NO_FACULTY_CLASH)
            if (ctx.isHardConstraintEnabled("HC_NO_FACULTY_CLASH")) {
                Set<Long> occupyingFaculty = state.getFacultyOccupancy().get(key);
                if (occupyingFaculty != null && occupyingFaculty.contains(facultyId)) {
                    return false;
                }
            }

            // Faculty Unavailability (HC_RESPECT_UNAVAILABILITY)
            if (ctx.isHardConstraintEnabled("HC_RESPECT_UNAVAILABILITY")) {
                Set<String> blocked = ctx.getFacultyBlockedSlots().get(facultyId);
                if (blocked != null && blocked.contains(key)) {
                    return false;
                }
            }
        }

        return true;
    }
}
