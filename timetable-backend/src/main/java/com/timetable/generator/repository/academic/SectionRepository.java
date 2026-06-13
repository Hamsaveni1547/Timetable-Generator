package com.timetable.generator.repository.academic;

import com.timetable.generator.entity.academic.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByDepartmentId(Long departmentId);

    List<Section> findByDepartmentIdAndIsActiveTrue(Long departmentId);

    List<Section> findByDepartmentIdAndAcademicYear(Long departmentId, Integer academicYear);

    List<Section> findByDepartmentIdAndAcademicYearAndSemester(Long departmentId, Integer academicYear,
            Integer semester);

    List<Section> findByDepartmentIdAndSemester(Long departmentId, Integer semester);

    boolean existsByNameAndAcademicYearAndSemesterAndDepartmentId(String name, Integer academicYear, Integer semester,
            Long departmentId);

    boolean existsByRoom_IdAndIsActiveTrue(Long roomId);

    boolean existsByRoom_IdAndIsActiveTrueAndIdNot(Long roomId, Long id);
}
