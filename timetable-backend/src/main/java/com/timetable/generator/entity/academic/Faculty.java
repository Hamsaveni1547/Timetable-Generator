package com.timetable.generator.entity.academic;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "employee_id", unique = true, length = 20)
    private String employeeId;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "phone", length = 15)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /**
     * Weekly workload ceiling — defined PER FACULTY in the database.
     * The solver reads this at runtime. No global constant anywhere in code.
     * Soft constraint SC_FACULTY_WEEKLY_WORKLOAD penalizes exceeding this.
     */
    @Column(name = "max_hours_per_week", nullable = false)
    @Builder.Default
    private Integer maxHoursPerWeek = 18;

    @Column(name = "designation", length = 50)
    private String designation;

    /** Link to the system user account for this faculty member. */
    @Column(name = "user_id", unique = true)
    private Long userId;

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
