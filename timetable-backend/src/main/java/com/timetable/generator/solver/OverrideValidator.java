package com.timetable.generator.solver;

import com.timetable.generator.dto.timetable.SwapValidationResult;
import com.timetable.generator.entity.academic.Room;
import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.entity.timetable.TimetableEntry;
import com.timetable.generator.repository.academic.RoomRepository;
import com.timetable.generator.repository.config.FacultyUnavailabilityRepository;
import com.timetable.generator.repository.config.SlotTemplateRepository;
import com.timetable.generator.repository.timetable.TimetableEntryRepository;
import com.timetable.generator.service.ConstraintConfigService;
import com.timetable.generator.service.ScheduleConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OverrideValidator {

    private final TimetableEntryRepository entryRepository;
    private final RoomRepository roomRepository;
    private final SlotTemplateRepository slotTemplateRepository;
    private final FacultyUnavailabilityRepository facultyUnavailabilityRepository;
    private final ConstraintConfigService constraintConfigService;
    private final ScheduleConfigService scheduleConfigService;

    /**
     * Validates whether moving a TimetableEntry to a new day, slot, and room is
     * valid.
     */
    public SwapValidationResult validateSwap(Long entryId, String newDay, Long newSlotTemplateId, Long newRoomId,
            Long generationId) {
        List<String> clashes = new ArrayList<>();

        // 1. Load entities
        TimetableEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Timetable entry not found: " + entryId));

        Room newRoom = roomRepository.findById(newRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + newRoomId));

        SlotTemplate newSlot = slotTemplateRepository.findById(newSlotTemplateId)
                .orElseThrow(() -> new IllegalArgumentException("Slot template not found: " + newSlotTemplateId));

        // Get constraint flags
        Map<String, Boolean> hardConstraintFlags = constraintConfigService.getActiveHardConstraintFlags();
        boolean roomTypeMatchEnabled = hardConstraintFlags.getOrDefault("HC_ROOM_TYPE_MATCH", true);
        boolean roomCapacityEnabled = hardConstraintFlags.getOrDefault("HC_ROOM_CAPACITY", true);
        boolean roomClashEnabled = hardConstraintFlags.getOrDefault("HC_NO_ROOM_CLASH", true);
        boolean sectionClashEnabled = hardConstraintFlags.getOrDefault("HC_NO_SECTION_CLASH", true);
        boolean facultyClashEnabled = hardConstraintFlags.getOrDefault("HC_NO_FACULTY_CLASH", true);
        boolean unavailabilityEnabled = hardConstraintFlags.getOrDefault("HC_RESPECT_UNAVAILABILITY", true);

        // 2. Room Type Match (HC_ROOM_TYPE_MATCH)
        if (roomTypeMatchEnabled) {
            String requiredRoomType = entry.getSubject().getRequiredRoomType();
            if (requiredRoomType != null && !requiredRoomType.trim().isEmpty()) {
                if (!requiredRoomType.equalsIgnoreCase(newRoom.getRoomType())) {
                    clashes.add(
                            String.format("Room type mismatch: Subject requires '%s', but Room '%s' is of type '%s'.",
                                    requiredRoomType, newRoom.getName(), newRoom.getRoomType()));
                }
            }
        }

        if (entry.getSection().getRoom() != null && !entry.getSection().getRoom().getId().equals(newRoomId)) {
            clashes.add(String.format("Section '%s' is assigned to room '%s' and cannot be moved to '%s'.",
                    entry.getSection().getName(), entry.getSection().getRoom().getName(), newRoom.getName()));
        }

        // 3. Room Capacity (HC_ROOM_CAPACITY)
        if (roomCapacityEnabled) {
            if (newRoom.getCapacity() < entry.getSection().getStudentCount()) {
                clashes.add(String.format(
                        "Insufficient capacity: Room '%s' capacity is %d, but Section '%s' has %d students.",
                        newRoom.getName(), newRoom.getCapacity(), entry.getSection().getName(),
                        entry.getSection().getStudentCount()));
            }
        }

        // 4. Room Clash (HC_NO_ROOM_CLASH - excluding this entry)
        if (roomClashEnabled) {
            boolean hasRoomClash = entryRepository.existsRoomClashExcluding(generationId, newRoomId, newDay,
                    newSlotTemplateId, entryId);
            if (hasRoomClash) {
                clashes.add(String.format("Room clash: Room '%s' is already occupied on %s at %s.",
                        newRoom.getName(), newDay, newSlot.getLabel()));
            }
        }

        // 5. Section Clash (HC_NO_SECTION_CLASH - excluding this entry)
        if (sectionClashEnabled) {
            boolean hasSectionClash = entryRepository.existsSectionClashExcluding(generationId,
                    entry.getSection().getId(), newDay, newSlotTemplateId, entryId);
            if (hasSectionClash) {
                clashes.add(String.format("Section clash: Section '%s' already has a class scheduled on %s at %s.",
                        entry.getSection().getName(), newDay, newSlot.getLabel()));
            }
        }

        // 6. Faculty Clash (HC_NO_FACULTY_CLASH - excluding this entry)
        if (facultyClashEnabled) {
            boolean hasFacultyClash = entryRepository.existsFacultyClashExcluding(generationId,
                    entry.getFaculty().getId(), newDay, newSlotTemplateId, entryId);
            if (hasFacultyClash) {
                clashes.add(String.format("Faculty clash: Faculty '%s' is already scheduled to teach on %s at %s.",
                        entry.getFaculty().getName(), newDay, newSlot.getLabel()));
            }
        }

        // 7. Faculty Unavailability (HC_RESPECT_UNAVAILABILITY)
        if (unavailabilityEnabled) {
            LocalDate refDate = scheduleConfigService.getAcademicYearStart();
            boolean isBlocked = facultyUnavailabilityRepository.findByFacultyId(entry.getFaculty().getId()).stream()
                    .filter(u -> u.isActiveOn(refDate))
                    .filter(u -> u.getDayOfWeek().equalsIgnoreCase(newDay))
                    .anyMatch(u -> u.getSlotTemplate().getId().equals(newSlotTemplateId));

            if (isBlocked) {
                clashes.add(
                        String.format("Faculty unavailability: Faculty '%s' is registered as unavailable on %s at %s.",
                                entry.getFaculty().getName(), newDay, newSlot.getLabel()));
            }
        }

        return SwapValidationResult.builder()
                .valid(clashes.isEmpty())
                .clashes(clashes)
                .build();
    }
}
