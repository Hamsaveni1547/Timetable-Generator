package com.timetable.generator.entity.timetable;

import com.timetable.generator.entity.academic.*;
import com.timetable.generator.entity.config.SlotTemplate;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "timetable_entries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_room_day_slot",
            columnNames = {"room_id", "day_of_week", "slot_template_id", "generation_id"}),
        // subject_id is included to allow parallel lab batches:
        // two different lab subjects can share the same section+day+slot (different student batches, different rooms)
        @UniqueConstraint(name = "uq_section_day_slot_subject",
            columnNames = {"section_id", "day_of_week", "slot_template_id", "generation_id", "subject_id"}),
        @UniqueConstraint(name = "uq_faculty_day_slot",
            columnNames = {"faculty_id", "day_of_week", "slot_template_id", "generation_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generation_id", nullable = false)
    private TimetableGeneration generation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    /**
     * References the dynamic slot template — NOT a hardcoded day/time.
     * When admin updates a slot's start/end time in slot_templates,
     * the timetable display automatically shows the new times on next load.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_template_id", nullable = false)
    private SlotTemplate slotTemplate;

    /** Day of week string: 'MONDAY', 'TUESDAY', etc. */
    @Column(name = "day_of_week", nullable = false, length = 15)
    private String dayOfWeek;

    @Column(name = "is_manually_overridden", nullable = false)
    @Builder.Default
    private boolean isManuallyOverridden = false;

    @Column(name = "override_reason", length = 255)
    private String overrideReason;

    /** User ID of Admin/HOD who performed the manual override. */
    @Column(name = "override_by")
    private Long overrideBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
