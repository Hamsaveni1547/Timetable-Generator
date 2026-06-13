package com.timetable.generator.service;

import com.timetable.generator.dto.config.ScheduleConfigDto;
import com.timetable.generator.entity.config.ScheduleConfig;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.config.ScheduleConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleConfigService {

    private final ScheduleConfigRepository configRepository;

    public List<ScheduleConfigDto> getAllConfigs() {
        return configRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public String getConfigValue(String key) {
        return configRepository.findByConfigKey(key)
                .map(ScheduleConfig::getConfigValue)
                .orElseThrow(() -> new ResourceNotFoundException("Config key not found: " + key));
    }

    @Transactional
    public ScheduleConfigDto updateConfig(String key, String newValue, Long updatedByUserId) {
        ScheduleConfig config = configRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Config key not found: " + key));
        config.setConfigValue(newValue);
        config.setUpdatedBy(updatedByUserId);
        config.setUpdatedAt(LocalDateTime.now());
        return toDto(configRepository.save(config));
    }

    // ===== Typed Accessors — All read from DB at runtime =====

    /** Returns active working days as a list. Example: ["MONDAY","TUESDAY",...] */
    public List<String> getActiveDays() {
        String value = getConfigValue("ACTIVE_DAYS");
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Whether Saturday scheduling is enabled. */
    public boolean isSaturdayAllowed() {
        return Boolean.parseBoolean(getConfigValue("ALLOW_SATURDAY"));
    }

    /** Current academic term label. */
    public String getSemesterLabel() {
        return getConfigValue("SEMESTER_LABEL");
    }

    /** Academic year start date. */
    public LocalDate getAcademicYearStart() {
        return LocalDate.parse(getConfigValue("ACADEMIC_YEAR_START"));
    }

    /** Academic year end date. */
    public LocalDate getAcademicYearEnd() {
        return LocalDate.parse(getConfigValue("ACADEMIC_YEAR_END"));
    }

    private ScheduleConfigDto toDto(ScheduleConfig sc) {
        return ScheduleConfigDto.builder()
                .id(sc.getId())
                .configKey(sc.getConfigKey())
                .configValue(sc.getConfigValue())
                .description(sc.getDescription())
                .updatedAt(sc.getUpdatedAt())
                .build();
    }
}
