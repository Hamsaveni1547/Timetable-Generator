package com.timetable.generator.dto.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConstraintConfigDto {
    private Long id;
    private String constraintKey;
    @JsonProperty("isHard")
    private boolean isHard;

    @DecimalMin(value = "0.0", message = "Penalty weight cannot be negative")
    @DecimalMax(value = "1000.0", message = "Penalty weight cannot exceed 1000")
    private BigDecimal penaltyWeight;

    @JsonProperty("isActive")
    private boolean isActive;
    private String description;
    private LocalDateTime updatedAt;
}
