package com.timetable.generator.repository.timetable;

import com.timetable.generator.entity.timetable.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TimetableEntryRepository extends JpaRepository<TimetableEntry, Long> {

    List<TimetableEntry> findByGenerationId(Long generationId);

    List<TimetableEntry> findByGenerationIdAndFacultyId(Long generationId, Long facultyId);

    List<TimetableEntry> findByGenerationIdAndSectionId(Long generationId, Long sectionId);

    List<TimetableEntry> findByGenerationIdAndRoomId(Long generationId, Long roomId);

    List<TimetableEntry> findByGenerationIdAndIsManuallyOverriddenTrue(Long generationId);

    // ===== Clash-check queries (used by OverrideValidator + solver state verification) =====

    boolean existsByGenerationIdAndRoomIdAndDayOfWeekAndSlotTemplateId(
        Long generationId, Long roomId, String dayOfWeek, Long slotTemplateId);

    boolean existsByGenerationIdAndSectionIdAndDayOfWeekAndSlotTemplateId(
        Long generationId, Long sectionId, String dayOfWeek, Long slotTemplateId);

    boolean existsByGenerationIdAndFacultyIdAndDayOfWeekAndSlotTemplateId(
        Long generationId, Long facultyId, String dayOfWeek, Long slotTemplateId);

    /** For override validation — excludes the entry being moved (excludeId). */
    @Query("""
        SELECT COUNT(e) > 0 FROM TimetableEntry e
        WHERE e.generation.id = :generationId
        AND e.room.id = :roomId
        AND e.dayOfWeek = :day
        AND e.slotTemplate.id = :slotId
        AND e.id <> :excludeId
        """)
    boolean existsRoomClashExcluding(Long generationId, Long roomId, String day, Long slotId, Long excludeId);

    @Query("""
        SELECT COUNT(e) > 0 FROM TimetableEntry e
        WHERE e.generation.id = :generationId
        AND e.section.id = :sectionId
        AND e.dayOfWeek = :day
        AND e.slotTemplate.id = :slotId
        AND e.id <> :excludeId
        """)
    boolean existsSectionClashExcluding(Long generationId, Long sectionId, String day, Long slotId, Long excludeId);

    @Query("""
        SELECT COUNT(e) > 0 FROM TimetableEntry e
        WHERE e.generation.id = :generationId
        AND e.faculty.id = :facultyId
        AND e.dayOfWeek = :day
        AND e.slotTemplate.id = :slotId
        AND e.id <> :excludeId
        """)
    boolean existsFacultyClashExcluding(Long generationId, Long facultyId, String day, Long slotId, Long excludeId);

    /** Count actual assigned slots for a faculty in a generation (workload verification). */
    @Query("SELECT COUNT(e) FROM TimetableEntry e WHERE e.generation.id = :generationId AND e.faculty.id = :facultyId")
    long countByGenerationIdAndFacultyId(Long generationId, Long facultyId);

    void deleteByGenerationId(Long generationId);
}
