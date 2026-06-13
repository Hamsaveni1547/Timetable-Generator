package com.timetable.generator.repository.academic;

import com.timetable.generator.entity.academic.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByDepartmentId(Long departmentId);
    List<Subject> findByDepartmentIdAndSemester(Long departmentId, Integer semester);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
}
