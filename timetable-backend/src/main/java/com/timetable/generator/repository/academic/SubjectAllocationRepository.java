package com.timetable.generator.repository.academic;

import com.timetable.generator.entity.academic.SubjectAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubjectAllocationRepository extends JpaRepository<SubjectAllocation, Long> {

    List<SubjectAllocation> findBySubjectIdAndSectionId(Long subjectId, Long sectionId);

    List<SubjectAllocation> findByFacultyId(Long facultyId);

    List<SubjectAllocation> findBySectionId(Long sectionId);

    /** All allocations for a department-semester — used by HOD dashboard and generation trigger. */
    @Query("""
        SELECT a FROM SubjectAllocation a
        WHERE a.section.department.id = :deptId
        AND a.subject.semester = :semester
        """)
    List<SubjectAllocation> findByDepartmentAndSemester(Long deptId, Integer semester);

    /** For solver pre-load: all active allocations with full entity graph. */
    @Query("""
        SELECT a FROM SubjectAllocation a
        JOIN FETCH a.subject s
        JOIN FETCH a.section sec
        JOIN FETCH a.faculty f
        WHERE sec.department.id = :deptId
        AND s.semester = :semester
        AND sec.isActive = true
        AND f.isActive = true
        """)
    List<SubjectAllocation> findForSolverByDepartmentAndSemester(Long deptId, Integer semester);

    /** Sum of allocated hours for a faculty across all subjects. */
    @Query("SELECT COALESCE(SUM(a.allocatedHoursPerWeek), 0) FROM SubjectAllocation a WHERE a.faculty.id = :facultyId")
    Integer sumAllocatedHoursByFaculty(Long facultyId);

    /** Sum for a specific subject-section (validation: should equal subject.hours_per_week). */
    @Query("SELECT COALESCE(SUM(a.allocatedHoursPerWeek), 0) FROM SubjectAllocation a WHERE a.subject.id = :subjectId AND a.section.id = :sectionId")
    Integer sumAllocatedHoursForSubjectSection(Long subjectId, Long sectionId);

    boolean existsBySubjectIdAndSectionIdAndFacultyId(Long subjectId, Long sectionId, Long facultyId);
}
