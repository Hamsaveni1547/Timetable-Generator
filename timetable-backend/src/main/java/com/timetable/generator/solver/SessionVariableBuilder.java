package com.timetable.generator.solver;

import com.timetable.generator.entity.academic.SubjectAllocation;
import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.model.SessionVariable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SessionVariableBuilder {

    /**
     * Translates SubjectAllocations into a list of SessionVariables that need to be
     * scheduled.
     * Splitting a total weekly allocation (e.g. 5 hours) with a consecutive block
     * requirement (e.g. 2 hours)
     * will result in:
     * - 2 sessions of blockSize = 2
     * - 1 session of blockSize = 1 (remainder)
     */
    public List<SessionVariable> build(List<SubjectAllocation> allocations, ConstraintContext ctx) {
        List<SessionVariable> variables = new ArrayList<>();

        for (SubjectAllocation alloc : allocations) {
            int allocatedHours = alloc.getAllocatedHoursPerWeek();
            int requiredBlock = alloc.getSubject().getConsecutiveSlotsRequired();
            if (requiredBlock <= 0) {
                requiredBlock = 1;
            }

            int numSessions = allocatedHours / requiredBlock;
            int remainder = allocatedHours % requiredBlock;

            int sessionIdx = 0;
            // Create full block sessions
            for (int i = 0; i < numSessions; i++) {
                variables.add(buildVariable(alloc, requiredBlock, sessionIdx++, ctx));
            }

            // Create remainder session if any
            if (remainder > 0) {
                variables.add(buildVariable(alloc, remainder, sessionIdx++, ctx));
            }
        }

        return variables;
    }

    private SessionVariable buildVariable(SubjectAllocation alloc, int blockSize, int sessionIdx,
            ConstraintContext ctx) {
        Long facultyId = alloc.getFaculty().getId();
        int maxHours = ctx.getFacultyWeeklyMaxHours().getOrDefault(facultyId, alloc.getFaculty().getMaxHoursPerWeek());

        return SessionVariable.builder()
                .allocationId(alloc.getId())
                .subjectId(alloc.getSubject().getId())
                .subjectName(alloc.getSubject().getName())
                .subjectCode(alloc.getSubject().getCode())
                .requiredRoomType(alloc.getSubject().getRequiredRoomType())
                .consecutiveSlotsRequired(blockSize)
                .minDaysBetweenSessions(alloc.getSubject().getMinDaysBetweenSessions())
                .maxSessionsPerDay(alloc.getSubject().getMaxSessionsPerDay())
                .facultyId(facultyId)
                .facultyName(alloc.getFaculty().getName())
                .facultyMaxHoursPerWeek(maxHours)
                .sectionId(alloc.getSection().getId())
                .sectionName(alloc.getSection().getName())
                .sectionStudentCount(alloc.getSection().getStudentCount())
                .preferredRoomId(alloc.getSection().getRoom() != null ? alloc.getSection().getRoom().getId() : null)
                .departmentId(alloc.getSection().getDepartment().getId())
                .sessionIndex(sessionIdx)
                .build();
    }
}
