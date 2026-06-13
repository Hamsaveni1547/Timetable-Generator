package com.timetable.generator.entity.academic;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    /**
     * Stored as VARCHAR (not ENUM) so organizations can define custom types
     * (e.g. 'DRAWING_HALL', 'SEMINAR_HALL', 'WORKSHOP') without schema changes.
     * Must match subjects.required_room_type exactly for room-type hard constraint.
     */
    @Column(name = "room_type", nullable = false, length = 30)
    private String roomType;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "building", length = 50)
    private String building;

    @Column(name = "floor_number")
    private Integer floorNumber;

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
        if (!this.isActive) this.isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
