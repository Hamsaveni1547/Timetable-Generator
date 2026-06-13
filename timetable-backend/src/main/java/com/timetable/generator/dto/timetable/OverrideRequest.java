package com.timetable.generator.dto.timetable;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverrideRequest {

    @NotBlank(message = "Day is required")
    private String newDay;

    @NotNull(message = "Slot template is required")
    private Long newSlotTemplateId;

    @NotNull(message = "Room is required")
    private Long newRoomId;

    @NotBlank(message = "Override reason is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
}
