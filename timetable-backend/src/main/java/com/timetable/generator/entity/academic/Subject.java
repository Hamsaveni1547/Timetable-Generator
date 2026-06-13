package com.timetable.generator.entity.academic;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 15)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "semester", nullable = false)
    private Integer semester;

    @Column(name = "credits", nullable = false)
    private Integer credits;

    /** Total weekly teaching hours this subject requires. Solver creates this many session slots. */
    @Column(name = "hours_per_week", nullable = false)
    private Integer hoursPerWeek;

    /** e.g. 'THEORY', 'PRACTICAL' — stored as VARCHAR, not ENUM, for extensibility. */
    @Column(name = "subject_type", nullable = false, length = 30)
    private String subjectType;

    /**
     * Must match rooms.room_type exactly (case-sensitive).
     * e.g. 'CLASSROOM', 'LAB', 'DRAWING_HALL'.
     * Solver uses this for HC_ROOM_TYPE_MATCH constraint.
     */
    @Column(name = "required_room_type", nullable = false, length = 30)
    private String requiredRoomType;

    /**
     * For lab/practical subjects: how many consecutive slots this subject occupies.
     * Default 1 = single-period theory class.
     * e.g. 2 = double-period lab, 3 = triple-period lab session.
     * Solver reads this per subject at runtime — no code change needed.
     */
    @Column(name = "consecutive_slots_required", nullable = false)
    @Builder.Default
    private Integer consecutiveSlotsRequired = 1;

    /**
     * Minimum number of days that must separate sessions of this subject.
     * Soft constraint SC_SUBJECT_SPREAD uses this to penalize close scheduling.
     */
    @Column(name = "min_days_between_sessions", nullable = false)
    @Builder.Default
    private Integer minDaysBetweenSessions = 1;

    /** Max times this subject can appear in a single day's schedule for a section. */
    @Column(name = "max_sessions_per_day", nullable = false)
    @Builder.Default
    private Integer maxSessionsPerDay = 1;

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
