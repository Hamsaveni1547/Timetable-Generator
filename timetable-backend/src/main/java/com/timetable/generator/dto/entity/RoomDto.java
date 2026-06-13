package com.timetable.generator.dto.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomDto {
    private Long id;

    @NotBlank(message = "Room name is required")
    @Size(max = 50, message = "Room name cannot exceed 50 characters")
    private String name;

    @NotBlank(message = "Room type is required (e.g. CLASSROOM, LAB, SEMINAR_HALL)")
    @Size(max = 30)
    private String roomType;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String building;
    private Integer floorNumber;

    @JsonProperty("isActive")
    private boolean isActive;
}

