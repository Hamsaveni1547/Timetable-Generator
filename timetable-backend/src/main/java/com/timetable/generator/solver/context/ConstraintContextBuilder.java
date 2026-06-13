package com.timetable.generator.solver.context;

import com.timetable.generator.entity.academic.Faculty;
import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.entity.config.FacultyUnavailability;
import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.repository.academic.FacultyRepository;
import com.timetable.generator.repository.academic.RoomRepository;
import com.timetable.generator.repository.config.FacultyUnavailabilityRepository;
import com.timetable.generator.repository.config.SlotTemplateRepository;
import com.timetable.generator.service.ConstraintConfigService;
import com.timetable.generator.service.ScheduleConfigService;
import com.timetable.generator.service.SlotTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ConstraintContextBuilder {

    private final SlotTemplateService slotTemplateService;
    private final SlotTemplateRepository slotTemplateRepository;
    private final ScheduleConfigService scheduleConfigService;
    private final ConstraintConfigService constraintConfigService;
    private final FacultyRepository facultyRepository;
    private final FacultyUnavailabilityRepository facultyUnavailabilityRepository;
    private final RoomRepository roomRepository;

    /**
     * Builds the ConstraintContext for a department's solver run.
     */
    public ConstraintContext build(Long deptId) {
        // 1. Get active days (e.g. MONDAY, TUESDAY, etc.)
        List<String> activeDays = scheduleConfigService.getActiveDays().stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        // 2. Load all active non-break slots
        List<SlotTemplate> activeSlots = slotTemplateRepository.findByIsActiveAndIsBreakOrderBySlotNumberAsc(true, false);

        // 3. Group slots by day
        Map<String, List<SlotTemplate>> slotsByDay = new HashMap<>();
        for (String day : activeDays) {
            List<SlotTemplate> daySlots = activeSlots.stream()
                    .filter(slot -> slot.appliesToDay(day))
                    .collect(Collectors.toList());
            slotsByDay.put(day, daySlots);
        }

        // 4. Hard constraint flags & soft weights
        Map<String, Boolean> hardConstraintFlags = constraintConfigService.getActiveHardConstraintFlags();
        Map<String, Double> softPenaltyWeights = constraintConfigService.getActiveSoftPenaltyWeights();

        // 5. Faculty weekly max hours (only for active faculty in the department)
        List<Faculty> activeFaculty = facultyRepository.findByDepartmentIdAndIsActiveTrue(deptId);
        Map<Long, Integer> facultyWeeklyMaxHours = new HashMap<>();
        for (Faculty f : activeFaculty) {
            facultyWeeklyMaxHours.put(f.getId(), f.getMaxHoursPerWeek());
        }

        // 6. Faculty blocked slots (based on unavailability templates)
        LocalDate refDate = scheduleConfigService.getAcademicYearStart();
        List<FacultyUnavailability> unavailabilities = facultyUnavailabilityRepository.findActiveByDepartmentId(deptId);
        Map<Long, Set<String>> facultyBlockedSlots = new HashMap<>();
        for (FacultyUnavailability u : unavailabilities) {
            if (u.isActiveOn(refDate)) {
                Long facultyId = u.getFaculty().getId();
                String day = u.getDayOfWeek().toUpperCase();
                Long slotId = u.getSlotTemplate().getId();
                String key = day + "_" + slotId;
                facultyBlockedSlots.computeIfAbsent(facultyId, k -> new HashSet<>()).add(key);
            }
        }

        // 7. Rooms
        List<Room> allRooms = roomRepository.findByIsActiveTrue();
        Map<Long, Room> roomsById = allRooms.stream()
                .collect(Collectors.toMap(Room::getId, r -> r));

        // 8. Precompute consecutive slot chains (blockSizes 1 to 5)
        Map<String, Map<Integer, List<List<Long>>>> consecutiveSlotChains = new HashMap<>();
        for (String day : activeDays) {
            Map<Integer, List<List<Long>>> dayChains = new HashMap<>();
            for (int blockSize = 1; blockSize <= 5; blockSize++) {
                List<List<Long>> chains = slotTemplateService.getConsecutiveSlotChains(day, blockSize);
                dayChains.put(blockSize, chains);
            }
            consecutiveSlotChains.put(day, dayChains);
        }

        return ConstraintContext.builder()
                .activeSlots(activeSlots)
                .slotsByDay(slotsByDay)
                .activeDays(activeDays)
                .hardConstraintFlags(hardConstraintFlags)
                .softPenaltyWeights(softPenaltyWeights)
                .facultyBlockedSlots(facultyBlockedSlots)
                .facultyWeeklyMaxHours(facultyWeeklyMaxHours)
                .roomsById(roomsById)
                .allRooms(allRooms)
                .consecutiveSlotChains(consecutiveSlotChains)
                .build();
    }
}
