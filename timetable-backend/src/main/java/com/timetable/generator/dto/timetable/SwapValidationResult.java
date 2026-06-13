package com.timetable.generator.dto.timetable;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapValidationResult {
    private boolean valid;
    private List<String> clashes;
}
