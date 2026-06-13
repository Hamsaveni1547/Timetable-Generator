package com.timetable.generator.repository.config;

import com.timetable.generator.entity.config.SlotTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SlotTemplateRepository extends JpaRepository<SlotTemplate, Long> {

    /** All active slots ordered by slot number — used for UI display (includes breaks). */
    List<SlotTemplate> findAllByOrderBySlotNumberAsc();

    /** Active, non-break slots only — used by solver as scheduling candidates. */
    List<SlotTemplate> findByIsActiveAndIsBreakOrderBySlotNumberAsc(boolean isActive, boolean isBreak);

    /** Check if any PUBLISHED timetable entry references this slot. */
    @Query("""
        SELECT COUNT(e) > 0 FROM TimetableEntry e
        WHERE e.slotTemplate.id = :slotId
        AND e.generation.status = com.timetable.generator.entity.timetable.TimetableGeneration.Status.PUBLISHED
        """)
    boolean isReferencedByPublishedEntry(Long slotId);
}
