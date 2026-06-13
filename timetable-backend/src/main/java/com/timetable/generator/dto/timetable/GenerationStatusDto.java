package com.timetable.generator.dto.timetable;

import com.timetable.generator.solver.model.BottleneckReport;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerationStatusDto {
    private Long id;
    private Long departmentId;
    private String departmentName;
    private Integer academicYear;
    private Integer semester;
    private String status;
    private Long solverDurationMs;
    private BottleneckReport bottleneckReport;
    private LocalDateTime generatedAt;
    private LocalDateTime publishedAt;
}
