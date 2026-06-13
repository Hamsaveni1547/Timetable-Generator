package com.timetable.generator.entity.config;

import com.timetable.generator.entity.academic.Faculty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_unavailability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyUnavailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    /** Day of the week (e.g. 'MONDAY', 'TUESDAY'). Stored as String — no hardcoded enum. */
    @Column(name = "day_of_week", nullable = false, length = 15)
    private String dayOfWeek;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_template_id", nullable = false)
    private SlotTemplate slotTemplate;

    @Column(name = "reason", length = 255)
    private String reason;

    /** NULL = no start restriction (applies immediately). */
    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    /** NULL = permanent unavailability. */
    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Checks if this unavailability is active on the given date.
     * If effectiveFrom/effectiveTo are null, always considered active.
     */
    public boolean isActiveOn(LocalDate date) {
        if (effectiveFrom != null && date.isBefore(effectiveFrom)) return false;
        if (effectiveTo != null && date.isAfter(effectiveTo)) return false;
        return true;
    }
}
