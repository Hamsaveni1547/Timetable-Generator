package com.timetable.generator.solver;

import com.timetable.generator.solver.model.SessionVariable;
import org.springframework.stereotype.Component;

import java.util.Comparator;

/**
 * Sorts SessionVariables in order of scheduling difficulty (MRV heuristic).
 * Hardest-to-schedule variables are placed at the beginning of the list.
 */
@Component
public class VariableMRVComparator implements Comparator<SessionVariable> {

    @Override
    public int compare(SessionVariable v1, SessionVariable v2) {
        // 1. Larger consecutive block size scheduled first (labs first)
        int blockComp = Integer.compare(v2.getConsecutiveSlotsRequired(), v1.getConsecutiveSlotsRequired());
        if (blockComp != 0) return blockComp;

        // 2. Larger spread requirement (minDaysBetweenSessions) scheduled first
        int spreadComp = Integer.compare(v2.getMinDaysBetweenSessions(), v1.getMinDaysBetweenSessions());
        if (spreadComp != 0) return spreadComp;

        // 3. Faculty with smaller weekly workload limit scheduled first (more constrained)
        int facultyComp = Integer.compare(v1.getFacultyMaxHoursPerWeek(), v2.getFacultyMaxHoursPerWeek());
        if (facultyComp != 0) return facultyComp;

        // 4. Section with larger student count scheduled first (harder to find matching room capacity)
        int studentComp = Integer.compare(v2.getSectionStudentCount(), v1.getSectionStudentCount());
        if (studentComp != 0) return studentComp;

        // 5. Tie-breaker: keep sorting stable using allocation ID and session index
        int allocComp = Long.compare(v1.getAllocationId(), v2.getAllocationId());
        if (allocComp != 0) return allocComp;

        return Integer.compare(v1.getSessionIndex(), v2.getSessionIndex());
    }
}
