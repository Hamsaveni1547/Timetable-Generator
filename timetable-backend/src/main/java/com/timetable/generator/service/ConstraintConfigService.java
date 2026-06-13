package com.timetable.generator.service;

import com.timetable.generator.dto.config.ConstraintConfigDto;
import com.timetable.generator.entity.config.ConstraintConfig;
import com.timetable.generator.exception.ResourceNotFoundException;
import com.timetable.generator.repository.config.ConstraintConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConstraintConfigService {

    private final ConstraintConfigRepository constraintRepository;

    public List<ConstraintConfigDto> getAllConstraints() {
        return constraintRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Returns active hard constraint keys mapped to their is_active flag.
     * Used by ConstraintContextBuilder to know which HC_* checks to run.
     */
    public Map<String, Boolean> getActiveHardConstraintFlags() {
        Map<String, Boolean> flags = new HashMap<>();
        constraintRepository.findByIsHardAndIsActiveTrue(true)
                .forEach(cc -> flags.put(cc.getConstraintKey(), cc.isActive()));
        return flags;
    }

    /**
     * Returns active soft constraint keys mapped to their penalty weights (as double).
     * Used by PenaltyCalculator — all weights read from DB, zero hardcoded values.
     */
    public Map<String, Double> getActiveSoftPenaltyWeights() {
        Map<String, Double> weights = new HashMap<>();
        constraintRepository.findByIsHardAndIsActiveTrue(false)
                .forEach(cc -> weights.put(cc.getConstraintKey(), cc.getPenaltyWeight().doubleValue()));
        return weights;
    }

    @Transactional
    public ConstraintConfigDto updateConstraint(String key, BigDecimal newWeight, Boolean isActive, Long updatedBy) {
        ConstraintConfig config = constraintRepository.findByConstraintKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Constraint key not found: " + key));

        if (newWeight != null) {
            if (config.isHard()) {
                throw new com.timetable.generator.exception.ValidationException(
                    "Penalty weight is not applicable to hard constraint: " + key);
            }
            config.setPenaltyWeight(newWeight);
        }
        if (isActive != null) {
            config.setActive(isActive);
        }
        config.setUpdatedBy(updatedBy);
        config.setUpdatedAt(LocalDateTime.now());
        return toDto(constraintRepository.save(config));
    }

    private ConstraintConfigDto toDto(ConstraintConfig cc) {
        return ConstraintConfigDto.builder()
                .id(cc.getId())
                .constraintKey(cc.getConstraintKey())
                .isHard(cc.isHard())
                .penaltyWeight(cc.getPenaltyWeight())
                .isActive(cc.isActive())
                .description(cc.getDescription())
                .updatedAt(cc.getUpdatedAt())
                .build();
    }
}
