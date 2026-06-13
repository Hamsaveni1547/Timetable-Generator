package com.timetable.generator.solver;

import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.exception.SchedulingConstraintException;
import com.timetable.generator.solver.context.ConstraintContext;
import com.timetable.generator.solver.model.BottleneckReport;
import com.timetable.generator.solver.model.CandidateAssignment;
import com.timetable.generator.solver.model.SessionVariable;
import com.timetable.generator.solver.model.SolverState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class TimetableSolver {

    private final HardConstraintChecker hardConstraintChecker;
    private final PenaltyCalculator penaltyCalculator;
    private final VariableMRVComparator variableMRVComparator;

    /**
     * Solves the timetable problem for the given session variables.
     * Returns a map of variables to candidate assignments, or throws
     * SchedulingConstraintException.
     */
    public Map<SessionVariable, CandidateAssignment> solve(List<SessionVariable> variables, ConstraintContext ctx) {
        // 1. Sort variables using the MRV Heuristic
        List<SessionVariable> sortedVariables = new ArrayList<>(variables);
        sortedVariables.sort(variableMRVComparator);

        SolverState state = new SolverState();
        long startTime = System.currentTimeMillis();
        long timeLimitMs = 60000; // 60 seconds timeout

        log.info("Starting backtracking solver. Total variables to schedule: {}", sortedVariables.size());

        boolean success = backtrack(0, sortedVariables, ctx, state, startTime, timeLimitMs);

        if (!success) {
            log.warn("Solver failed to find a valid timetable assignment.");
            BottleneckReport report = generateBottleneckReport(sortedVariables, ctx, state);
            throw new SchedulingConstraintException("Unsolvable scheduling constraints", report);
        }

        log.info("Solver successfully found a solution in {} ms", System.currentTimeMillis() - startTime);
        return state.getAssignments();
    }

    private boolean backtrack(int index, List<SessionVariable> variables, ConstraintContext ctx, SolverState state,
            long startTime, long timeLimitMs) {
        // Check timeout
        if (System.currentTimeMillis() - startTime > timeLimitMs) {
            log.warn("Solver reached time limit of {} ms", timeLimitMs);
            return false;
        }

        // Base case: all variables assigned
        if (index >= variables.size()) {
            return true;
        }

        SessionVariable currentVar = variables.get(index);

        // Generate and order the domain values (candidates) for this variable (LCV
        // heuristic)
        List<CandidateAssignment> candidates = getOrderedDomain(currentVar, ctx, state);

        for (CandidateAssignment candidate : candidates) {
            // Apply assignment
            state.assign(currentVar, candidate);

            // Recurse
            if (backtrack(index + 1, variables, ctx, state, startTime, timeLimitMs)) {
                return true;
            }

            // Rollback
            state.unassign(currentVar, candidate);
        }

        return false;
    }

    /**
     * Generates all valid candidate assignments (day, room, slotChain) for a
     * variable,
     * and sorts them by their soft constraint penalty (LCV: Least Constraining
     * Value).
     */
    private List<CandidateAssignment> getOrderedDomain(SessionVariable var, ConstraintContext ctx, SolverState state) {
        List<CandidateAssignment> domain = new ArrayList<>();
        int blockSize = var.getConsecutiveSlotsRequired();
        List<Room> candidateRooms = ctx.getAllRooms();

        if (var.getPreferredRoomId() != null) {
            Room preferredRoom = ctx.getRoomsById().get(var.getPreferredRoomId());
            if (preferredRoom == null) {
                return domain;
            }
            candidateRooms = List.of(preferredRoom);
        }

        // 1. Try all active days
        for (String day : ctx.getActiveDays()) {
            // Get precomputed consecutive slot chains of the required block size
            Map<Integer, List<List<Long>>> chainsForDay = ctx.getConsecutiveSlotChains().get(day);
            if (chainsForDay == null)
                continue;

            List<List<Long>> slotChains = chainsForDay.get(blockSize);
            if (slotChains == null || slotChains.isEmpty())
                continue;

            // 2. Try all eligible rooms
            for (Room room : candidateRooms) {
                // Early check: if room doesn't match required type, skip
                String reqRoomType = var.getRequiredRoomType();
                if (reqRoomType != null && !reqRoomType.trim().isEmpty()) {
                    if (!reqRoomType.equalsIgnoreCase(room.getRoomType())) {
                        continue;
                    }
                }

                // Capacity check
                if (room.getCapacity() < var.getSectionStudentCount()) {
                    continue;
                }

                // 3. For each slot chain
                for (List<Long> slotChain : slotChains) {
                    CandidateAssignment candidate = CandidateAssignment.builder()
                            .day(day)
                            .slotChain(slotChain)
                            .roomId(room.getId())
                            .roomType(room.getRoomType())
                            .roomCapacity(room.getCapacity())
                            .build();

                    // Check hard constraints
                    if (hardConstraintChecker.isValid(var, candidate, ctx, state)) {
                        // Calculate soft penalty cost
                        double penalty = penaltyCalculator.calculate(var, candidate, ctx, state);
                        candidate.setPenaltyCost(penalty);
                        domain.add(candidate);
                    }
                }
            }
        }

        // Sort LCV: lower penalty cost first
        domain.sort(Comparator.comparingDouble(CandidateAssignment::getPenaltyCost));
        return domain;
    }

    /**
     * Analyzes why scheduling failed and generates a bottleneck report.
     */
    private BottleneckReport generateBottleneckReport(List<SessionVariable> variables, ConstraintContext ctx,
            SolverState state) {
        List<BottleneckReport.BottleneckItem> bottlenecks = new ArrayList<>();
        List<String> suggestedActions = new ArrayList<>();

        // 1. Analyze Faculty workload
        Map<Long, Integer> facultyTotalAllocatedHours = new HashMap<>();
        for (SessionVariable var : variables) {
            facultyTotalAllocatedHours.put(var.getFacultyId(),
                    facultyTotalAllocatedHours.getOrDefault(var.getFacultyId(), 0) + var.getConsecutiveSlotsRequired());
        }

        for (Map.Entry<Long, Integer> entry : facultyTotalAllocatedHours.entrySet()) {
            Long facultyId = entry.getKey();
            int allocated = entry.getValue();
            int max = ctx.getFacultyWeeklyMaxHours().getOrDefault(facultyId, 40);
            if (allocated > max) {
                String name = variables.stream()
                        .filter(v -> v.getFacultyId().equals(facultyId))
                        .findFirst()
                        .map(SessionVariable::getFacultyName)
                        .orElse("Faculty ID " + facultyId);

                bottlenecks.add(BottleneckReport.BottleneckItem.builder()
                        .category("FACULTY_OVERLOAD")
                        .entityType("FACULTY")
                        .entityIds(Collections.singletonList(facultyId))
                        .description(String.format(
                                "Faculty '%s' has total allocated hours (%d) exceeding their weekly limit (%d).", name,
                                allocated, max))
                        .build());
            }
        }

        // 2. Analyze Room availability
        Map<String, Integer> requiredHoursByRoomType = new HashMap<>();
        for (SessionVariable var : variables) {
            String rt = var.getRequiredRoomType();
            if (rt == null || rt.trim().isEmpty()) {
                rt = "Classroom"; // default fallback label
            }
            requiredHoursByRoomType.put(rt.toUpperCase(),
                    requiredHoursByRoomType.getOrDefault(rt.toUpperCase(), 0) + var.getConsecutiveSlotsRequired());
        }

        int activeDaysCount = ctx.getActiveDays().size();
        int activeSlotsCount = ctx.getActiveSlots().size();
        int maxSlotsPerRoom = activeDaysCount * activeSlotsCount;

        for (Map.Entry<String, Integer> entry : requiredHoursByRoomType.entrySet()) {
            String roomType = entry.getKey();
            int reqHours = entry.getValue();

            long roomCount = ctx.getAllRooms().stream()
                    .filter(r -> r.getRoomType().equalsIgnoreCase(roomType))
                    .count();

            long totalCapacityHours = roomCount * maxSlotsPerRoom;

            if (reqHours > totalCapacityHours) {
                bottlenecks.add(BottleneckReport.BottleneckItem.builder()
                        .category("RESOURCE_SHORTAGE")
                        .entityType("ROOM")
                        .entityIds(ctx.getAllRooms().stream()
                                .filter(r -> r.getRoomType().equalsIgnoreCase(roomType))
                                .map(Room::getId)
                                .collect(Collectors.toList()))
                        .description(String.format(
                                "Insufficient rooms of type '%s'. Required hours: %d, Max available capacity: %d.",
                                roomType, reqHours, totalCapacityHours))
                        .build());
            }
        }

        // 3. Fallback item if no obvious physical overload was detected
        if (bottlenecks.isEmpty()) {
            bottlenecks.add(BottleneckReport.BottleneckItem.builder()
                    .category("UNAVAILABILITY_CONFLICT")
                    .entityType("GENERAL")
                    .entityIds(new ArrayList<>())
                    .description(
                            "The schedule is too tightly constrained. Conflicts in faculty availability, unavailabilities, or room capacities prevent finding a clash-free solution.")
                    .build());
        }

        // Suggested actions
        suggestedActions.add("Reduce total subject hours allocated to sections.");
        suggestedActions.add("Increase faculty weekly max hours limit.");
        suggestedActions.add("Add more rooms of the required types or increase capacities.");
        suggestedActions.add("Remove or ease some faculty unavailability slots.");

        return BottleneckReport.builder()
                .type("UNSOLVABLE")
                .bottlenecks(bottlenecks)
                .suggestedActions(suggestedActions)
                .build();
    }
}
