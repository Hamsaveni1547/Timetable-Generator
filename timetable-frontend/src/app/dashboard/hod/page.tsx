/* page.tsx — HOD Dashboard Overview Panel */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import authService from '@/services/authService';
import academicService from '@/services/academicService';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Network, 
  Cpu, 
  CalendarOff,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

export default function HodOverview() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [stats, setStats] = useState({
    sections: 0,
    subjects: 0,
    faculty: 0,
    allocationCompletion: 0,
    deficitHours: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!deptId) return;
      try {
        const [sections, subjects, faculty, allocations] = await Promise.all([
          academicService.getSections(deptId),
          academicService.getSubjects(deptId),
          academicService.getFaculty(deptId),
          academicService.getAllocations(deptId)
        ]);

        const deptUsers = await authService.getUsers();

        // Calculate allocation completeness percentage
        // Loop through sections and check subjects in matching semesters
        let totalRequiredHours = 0;
        let totalAllocatedHours = 0;

        sections.forEach(sec => {
          // Find subjects in this semester
          const semSubjects = subjects.filter(s => s.semester === sec.semester);
          semSubjects.forEach(sub => {
            totalRequiredHours += sub.hoursPerWeek;
            
            // Find allocations for this combination
            const cellAllocations = allocations.filter(a => a.subjectId === sub.id && a.sectionId === sec.id);
            const sumAllocated = cellAllocations.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
            totalAllocatedHours += Math.min(sumAllocated, sub.hoursPerWeek); // Clamp to max needed
          });
        });

        const ratio = totalRequiredHours > 0 ? (totalAllocatedHours / totalRequiredHours) * 100 : 0;
        const deficit = Math.max(0, totalRequiredHours - totalAllocatedHours);

        setStats({
          sections: sections.length,
          subjects: subjects.length,
          faculty: faculty.length,
          allocationCompletion: Math.round(ratio),
          deficitHours: deficit
        });
        setUsers(deptUsers);
      } catch (err) {
        console.error('Failed to load HOD stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [deptId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const allAllocated = stats.allocationCompletion === 100;

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Department Panel &mdash; HOD Portal</h2>
          <p>Configure course allocations, define unavailability blocks, and execute solver runs for your class sections.</p>
        </div>
        <div className="welcome-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
          <Sparkles size={20} />
          <span>Active Semester Term</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.sections}</span>
            <span className="stat-label">Student Sections</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.subjects}</span>
            <span className="stat-label">Subjects</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.faculty}</span>
            <span className="stat-label">Faculty Accounts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ 
            backgroundColor: allAllocated ? 'var(--success-light)' : 'var(--warning-light)', 
            color: allAllocated ? 'var(--success)' : 'var(--warning)' 
          }}>
            {allAllocated ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.allocationCompletion}%</span>
            <span className="stat-label">Allocations Complete</span>
          </div>
        </div>
      </div>

      {/* Allocation completeness checklist block */}
      {!allAllocated && (
        <div className="error-banner" style={{ backgroundColor: 'var(--warning-light)', borderColor: 'var(--warning)', color: 'var(--warning)', marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Workload allocations deficit detected. {stats.deficitHours} weekly syllabus hours remain unallocated. Complete allocations before solver runs.
            </span>
          </div>
          <Link href="/dashboard/hod/allocations" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(38, 92%, 35%)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
            Allocate Hours <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Quick Links Menu */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
          Planning & Schedules
        </h3>

        <div className="config-path-grid">
          {/* Allocations Matrix */}
          <Link href="/dashboard/hod/allocations" className="config-path-card">
            <div className="path-header">
              <Network size={24} className="path-icon text-accent" />
              <h4>Faculty Allocations</h4>
            </div>
            <p>Define workload splits, assign teachers to class subjects, and inspect live weekly load meters.</p>
            <div className="path-action">
              <span>Edit Matrix</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Unavailability */}
          <Link href="/dashboard/hod/unavailability" className="config-path-card">
            <div className="path-header">
              <CalendarOff size={24} className="path-icon text-danger" />
              <h4>Faculty Unavailability</h4>
            </div>
            <p>Register busy schedules, research days, or lab sessions for faculty members to constrain solver slots.</p>
            <div className="path-action">
              <span>Block Slots</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Control Room */}
          <Link href="/dashboard/hod/generate" className="config-path-card">
            <div className="path-header">
              <Cpu size={24} className="path-icon text-warning" />
              <h4>Control Room</h4>
            </div>
            <p>Trigger timetable generation draft runs, check constraint failures, and publish locked schedules.</p>
            <div className="path-action">
              <span>Open Control Room</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </div>

      {/* Department Users */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
          Department Users
        </h3>

        <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px', width: '140px' }}>Username</th>
                  <th style={{ padding: '12px 8px', width: '140px' }}>Role</th>
                  <th style={{ padding: '12px 8px', width: '120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', opacity: user.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{user.fullName}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{user.username}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="profile-role-badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: user.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No users are linked to this department yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
