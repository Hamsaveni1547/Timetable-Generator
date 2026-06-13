package com.timetable.generator.entity.config;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "constraint_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConstraintConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Constraint identifier key. Examples:
     *   HC_NO_SECTION_CLASH, HC_NO_FACULTY_CLASH, HC_ROOM_TYPE_MATCH (hard)
     *   SC_FACULTY_WEEKLY_WORKLOAD, SC_FACULTY_DAILY_GAP (soft)
     */
    @Column(name = "constraint_key", nullable = false, unique = true, length = 100)
    private String constraintKey;

    /**
     * If true: violation causes the solver to REJECT the candidate assignment outright.
     * If false: violation adds penalty_weight to the assignment's cost score.
     */
    @Column(name = "is_hard", nullable = false)
    private boolean isHard;

    /**
     * Only relevant when is_hard = false.
     * The solver multiplies this weight by the violation count to compute cost.
     * Stored in DB — admins can tune without code changes.
     */
    @Column(name = "penalty_weight", nullable = false, precision = 8, scale = 2)
    private BigDecimal penaltyWeight;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
