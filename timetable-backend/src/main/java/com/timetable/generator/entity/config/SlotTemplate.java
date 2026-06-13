package com.timetable.generator.entity.config;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "slot_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_number", nullable = false)
    private Integer slotNumber;

    @Column(name = "label", nullable = false, length = 50)
    private String label;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_break", nullable = false)
    private boolean isBreak;

    /**
     * Comma-separated day names or 'ALL'.
     * Example: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY' or 'ALL'
     * Solver parses this at runtime — no hardcoded day logic in code.
     */
    @Column(name = "applies_to_days", nullable = false, length = 100)
    private String appliesToDays;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

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

    /**
     * Checks if this slot applies to the given day.
     * Parses appliesToDays: 'ALL' matches every day; otherwise checks comma-separated list.
     */
    public boolean appliesToDay(String day) {
        if ("ALL".equalsIgnoreCase(appliesToDays)) return true;
        for (String d : appliesToDays.split(",")) {
            if (d.trim().equalsIgnoreCase(day)) return true;
        }
        return false;
    }
}
