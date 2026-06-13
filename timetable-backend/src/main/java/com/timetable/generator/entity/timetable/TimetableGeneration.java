package com.timetable.generator.entity.timetable;

import com.timetable.generator.entity.academic.Department;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "timetable_generations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableGeneration {

    public enum Status {
        IN_PROGRESS, DRAFT, PUBLISHED, FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "academic_year", nullable = false)
    private Integer academicYear;

    @Column(name = "semester", nullable = false)
    private Integer semester;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private Status status = Status.IN_PROGRESS;

    /** User ID of the Admin/HOD who triggered this generation. */
    @Column(name = "triggered_by", nullable = false)
    private Long triggeredBy;

    /** How long the backtracking solver took in milliseconds. */
    @Column(name = "solver_duration_ms")
    private Long solverDurationMs;

    /**
     * JSON string stored in MySQL JSON column.
     * Contains structured bottleneck details when status = FAILED.
     * Deserialized to BottleneckReport object in the service layer.
     */
    @Column(name = "bottleneck_report", columnDefinition = "JSON")
    private String bottleneckReport;

    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        this.generatedAt = LocalDateTime.now();
    }
}
