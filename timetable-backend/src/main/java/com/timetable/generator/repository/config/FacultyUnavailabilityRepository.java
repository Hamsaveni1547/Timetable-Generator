package com.timetable.generator.repository.config;

import com.timetable.generator.entity.config.FacultyUnavailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacultyUnavailabilityRepository extends JpaRepository<FacultyUnavailability, Long> {

    List<FacultyUnavailability> findByFacultyId(Long facultyId);

    /** Fetch all unavailability entries for all faculty in a department (HOD view). */
    @Query("SELECT u FROM FacultyUnavailability u WHERE u.faculty.department.id = :deptId")
    List<FacultyUnavailability> findByDepartmentId(Long deptId);

    /** Used by ConstraintContextBuilder to pre-load all entries for a department before solving. */
    @Query("""
        SELECT u FROM FacultyUnavailability u
        WHERE u.faculty.department.id = :deptId
        AND u.faculty.isActive = true
        """)
    List<FacultyUnavailability> findActiveByDepartmentId(Long deptId);
}
