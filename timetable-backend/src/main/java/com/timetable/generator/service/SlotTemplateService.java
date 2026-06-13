package com.timetable.generator.service;

import com.timetable.generator.dto.config.SlotTemplateDto;
import com.timetable.generator.entity.config.SlotTemplate;
import com.timetable.generator.exception.ConflictException;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.config.SlotTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotTemplateService {

    private final SlotTemplateRepository slotRepository;

    /** All slots ordered by slot_number — includes breaks (for UI display). */
    public List<SlotTemplateDto> getAllSlots() {
        return slotRepository.findAllByOrderBySlotNumberAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Only schedulable slots (is_break=false, is_active=true) — used by solver. */
    public List<SlotTemplateDto> getActiveSchedulingSlots() {
        return slotRepository.findByIsActiveAndIsBreakOrderBySlotNumberAsc(true, false).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Active, non-break slots for a specific day. */
    public List<SlotTemplate> getActiveSlotEntitiesForDay(String day) {
        return slotRepository.findByIsActiveAndIsBreakOrderBySlotNumberAsc(true, false)
                .stream()
                .filter(slot -> slot.appliesToDay(day))
                .collect(Collectors.toList());
    }

    /**
     * Pre-computes chains of consecutive slot IDs for a given day and block size.
     * Example: for blockSize=2, day=MONDAY, returns [[slot1_id, slot2_id], [slot2_id, slot3_id], ...]
     * These chains are used by the solver to find valid consecutive placement options.
     */
    public List<List<Long>> getConsecutiveSlotChains(String day, int blockSize) {
        List<SlotTemplate> daySlots = getActiveSlotEntitiesForDay(day);
        List<List<Long>> chains = new ArrayList<>();

        for (int i = 0; i <= daySlots.size() - blockSize; i++) {
            // Verify consecutive: each slot_number must be exactly 1 more than previous
            // (skipping break slots which don't appear in this filtered list)
            boolean isConsecutive = true;
            List<Long> chain = new ArrayList<>();

            for (int j = 0; j < blockSize; j++) {
                chain.add(daySlots.get(i + j).getId());
                if (j > 0) {
                    int prevSlotNum = daySlots.get(i + j - 1).getSlotNumber();
                    int currSlotNum = daySlots.get(i + j).getSlotNumber();
                    // Slots are consecutive only if they are adjacent in slot_number
                    // (gaps caused by break slots in the original sequence break the chain)
                    if (currSlotNum != prevSlotNum + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
            }

            if (isConsecutive) {
                chains.add(chain);
            }
        }

        return chains;
    }

    public SlotTemplateDto getById(Long id) {
        return toDto(findById(id));
    }

    @Transactional
    public SlotTemplateDto createSlot(SlotTemplateDto dto) {
        SlotTemplate slot = SlotTemplate.builder()
                .slotNumber(dto.getSlotNumber())
                .label(dto.getLabel())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .isBreak(dto.isBreak())
                .appliesToDays(dto.getAppliesToDays().toUpperCase())
                .isActive(true)
                .build();
        return toDto(slotRepository.save(slot));
    }

    @Transactional
    public SlotTemplateDto updateSlot(Long id, SlotTemplateDto dto) {
        SlotTemplate slot = findById(id);
        slot.setSlotNumber(dto.getSlotNumber());
        slot.setLabel(dto.getLabel());
        slot.setStartTime(dto.getStartTime());
        slot.setEndTime(dto.getEndTime());
        slot.setBreak(dto.isBreak());
        slot.setAppliesToDays(dto.getAppliesToDays().toUpperCase());
        slot.setActive(dto.isActive());
        return toDto(slotRepository.save(slot));
    }

    @Transactional
    public void deactivateSlot(Long id) {
        SlotTemplate slot = findById(id);
        if (slotRepository.isReferencedByPublishedEntry(id)) {
            throw new ConflictException(
                "Cannot deactivate slot '" + slot.getLabel() + "' — it is referenced by one or more PUBLISHED timetable entries. " +
                "Archive or delete the published timetables first.");
        }
        slot.setActive(false);
        slotRepository.save(slot);
    }

    private SlotTemplate findById(Long id) {
        return slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SlotTemplate", id));
    }

    public SlotTemplateDto toDto(SlotTemplate slot) {
        return SlotTemplateDto.builder()
                .id(slot.getId())
                .slotNumber(slot.getSlotNumber())
                .label(slot.getLabel())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isBreak(slot.isBreak())
                .appliesToDays(slot.getAppliesToDays())
                .isActive(slot.isActive())
                .build();
    }
}
