package com.timetable.generator.repository.academic;

import com.timetable.generator.entity.academic.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    List<Faculty> findByDepartmentId(Long departmentId);
    List<Faculty> findByDepartmentIdAndIsActiveTrue(Long departmentId);
    java.util.Optional<Faculty> findByUserIdAndIsActiveTrue(Long userId);

    /** Used by ConstraintContextBuilder to pre-load all faculty for solver. */
    @Query("SELECT f FROM Faculty f WHERE f.department.id = :deptId AND f.isActive = true")
    List<Faculty> findActiveFacultyByDepartment(Long deptId);

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByEmployeeId(String employeeId);
    boolean existsByEmployeeIdAndIdNot(String employeeId, Long id);
}
