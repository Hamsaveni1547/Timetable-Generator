package com.timetable.generator.solver;

import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.model.CandidateAssignment;
import com.timetable.generator.solver.model.SessionVariable;
import com.timetable.generator.solver.model.SolverState;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
public class HardConstraintChecker {

    /**
     * Checks if a candidate assignment for a session satisfies all active hard constraints.
     *
     * Batch Lab Support:
     * - Multiple LAB subjects for the same section can be placed at the same day+slot
     *   (they represent different batches of students using different lab rooms).
     * - However all lab batches for a section are locked to the same day+slot chain once
     *   the first lab is placed (HC_LAB_SAME_SLOT enforced here).
     * - A LAB cannot overlap a THEORY slot for the same section.
     */
    public boolean isValid(SessionVariable session, CandidateAssignment candidate, ConstraintContext ctx, SolverState state) {
        String day = candidate.getDay();
        Long roomId = candidate.getRoomId();
        Long sectionId = session.getSectionId();
        Long facultyId = session.getFacultyId();
        boolean isLab = "LAB".equalsIgnoreCase(session.getRequiredRoomType());

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

        // 3. Lab Day/Slot Lock — enforces that all lab batches for a section run at
        //    exactly the same day and slot chain (one lab window per section per week).
        if (isLab) {
            String lockedDay = state.getSectionLabDay().get(sectionId);
            List<Long> lockedChain = state.getSectionLabSlotChain().get(sectionId);
            if (lockedDay != null && lockedChain != null) {
                if (!day.equals(lockedDay) || !candidate.getSlotChain().equals(lockedChain)) {
                    return false;
                }
            }
        }

        // 4. Slot-by-slot checks (clash & unavailability)
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
                    if (!isLab) {
                        // Theory / other sessions: can never share a slot with any other class for this section
                        return false;
                    }
                    // LAB session: allowed to overlap only if no THEORY class occupies this section-slot.
                    // Different lab subjects = different student batches of the same section (parallel rooms).
                    String sectionSlotKey = day + "_" + slotId + "_" + sectionId;
                    if (state.getSectionTheorySlots().contains(sectionSlotKey)) {
                        return false; // Theory already there — lab cannot overlap it
                    }
                    // All existing occupancy is lab-only → parallel batch scheduling allowed
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
