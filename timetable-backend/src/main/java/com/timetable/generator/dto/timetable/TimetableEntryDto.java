package com.timetable.generator.dto.timetable;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableEntryDto {
    private Long id;
    private Long generationId;
    
    private Long sectionId;
    private String sectionName;
    
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    
    private Long facultyId;
    private String facultyName;
    
    private Long roomId;
    private String roomName;
    
    private Long slotTemplateId;
    private String slotLabel;
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String dayOfWeek;
    @JsonProperty("isManuallyOverridden")
    private boolean isManuallyOverridden;
    private String overrideReason;
    private Long overrideBy;
}
