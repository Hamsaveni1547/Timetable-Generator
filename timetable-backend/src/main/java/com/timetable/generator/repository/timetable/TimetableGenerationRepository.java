package com.timetable.generator.repository.timetable;

import com.timetable.generator.entity.timetable.TimetableGeneration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimetableGenerationRepository extends JpaRepository<TimetableGeneration, Long> {
    List<TimetableGeneration> findByDepartmentIdOrderByGeneratedAtDesc(Long departmentId);
    List<TimetableGeneration> findByDepartmentIdAndStatus(Long departmentId, TimetableGeneration.Status status);
    Optional<TimetableGeneration> findByDepartmentIdAndAcademicYearAndSemesterAndStatus(
        Long departmentId, Integer academicYear, Integer semester, TimetableGeneration.Status status);
}
