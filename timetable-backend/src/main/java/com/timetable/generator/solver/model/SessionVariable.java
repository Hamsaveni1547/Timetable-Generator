package com.timetable.generator.solver.model;

import lombok.*;

/**
 * Represents one class session that needs to be scheduled.
 * Built from SubjectAllocation records by SessionVariableBuilder.
 * 
 * For a subject with consecutive_slots_required = 3 and
 * allocated_hours_per_week = 6:
 * → 6/3 = 2 SessionVariables are created, each with blockSize=3.
 * Each session must occupy 3 consecutive slots in a day.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionVariable {

    private Long allocationId; // Source: subject_allocations.id
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private String requiredRoomType; // Must match rooms.room_type
    private int consecutiveSlotsRequired; // How many back-to-back slots needed (from DB)
    private int minDaysBetweenSessions; // Soft constraint spread (from DB)
    private int maxSessionsPerDay; // Soft constraint daily repeat (from DB)

    private Long facultyId;
    private String facultyName;
    private int facultyMaxHoursPerWeek; // Loaded from faculty.max_hours_per_week

    private Long sectionId;
    private String sectionName;
    private int sectionStudentCount;
    private Long preferredRoomId;

    private Long departmentId;

    /** Index within this allocation's expanded sessions (e.g. session 1 of 2). */
    private int sessionIndex;

    /**
     * Returns a unique key for grouping sessions of the same subject+section on a
     * given day.
     * Used by PenaltyCalculator for SC_SUBJECT_DAILY_REPEAT check.
     */
    public String subjectSectionKey() {
        return subjectId + "_" + sectionId;
    }
}
