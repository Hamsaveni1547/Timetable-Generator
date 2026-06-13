package com.timetable.generator.repository.config;

import com.timetable.generator.entity.config.ConstraintConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConstraintConfigRepository extends JpaRepository<ConstraintConfig, Long> {
    Optional<ConstraintConfig> findByConstraintKey(String constraintKey);
    List<ConstraintConfig> findByIsActiveTrue();
    List<ConstraintConfig> findByIsHardAndIsActiveTrue(boolean isHard);
}
