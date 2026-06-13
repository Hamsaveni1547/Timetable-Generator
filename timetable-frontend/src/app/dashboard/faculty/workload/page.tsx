/* page.tsx — Faculty Workload Analysis page */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import timetableService from '@/services/timetableService';
import academicService from '@/services/academicService';
import { Faculty } from '@/types/entities';
import { AlertCircle, ShieldAlert, Award, Clock, BookOpen, User, CheckCircle } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

export default function FacultyWorkloadPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [actualHours, setActualHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkload() {
      if (!deptId || !user) return;
      setLoading(true);
      setError(null);
      try {
        const [facList, generations] = await Promise.all([
          academicService.getFaculty(deptId),
          timetableService.getGenerations(deptId)
        ]);

        const currentFaculty = facList.find(f => f.userId === user.userId);
        if (!currentFaculty) {
          setError('Could not locate a faculty account matching your login credentials.');
          setLoading(false);
          return;
        }

        // Fetch detailed workload summary
        const detailedFac = await academicService.getFacultyWorkloadSummary(currentFaculty.id);
        setFaculty(detailedFac);

        // Find actual hours from latest published generation
        const published = generations.find(g => g.status === 'PUBLISHED');
        if (published) {
          const hours = await timetableService.getFacultyActualWorkload(currentFaculty.id, published.id);
          setActualHours(hours);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to retrieve workload summary.');
      } finally {
        setLoading(false);
      }
    }
    loadWorkload();
  }, [deptId, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const allocatedHours = faculty?.allocatedHoursPerWeek || 0;
  const maxHours = faculty?.maxHoursPerWeek || 1;
  const remaining = Math.max(0, maxHours - allocatedHours);

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Workload Analysis</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Check your workload capacity, allocated syllabus hours, and actual scheduled teaching time.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {faculty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Workload Stats Row */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Award size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{maxHours} hrs</span>
                <span className="stat-label">Max Allowance</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{allocatedHours} hrs</span>
                <span className="stat-label font-medium">Syllabus Allocated</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{actualHours} hrs</span>
                <span className="stat-label">Scheduled Classes</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{ 
                backgroundColor: remaining > 0 ? 'var(--success-light)' : 'var(--warning-light)', 
                color: remaining > 0 ? 'var(--success)' : 'var(--warning)' 
              }}>
                <User size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{remaining} hrs</span>
                <span className="stat-label">Spare Capacity</span>
              </div>
            </div>
          </div>

          {/* Allocation Details Breakdown Table */}
          <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} /> Teaching Assignments
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '12px 8px' }}>Subject Code</th>
                    <th style={{ padding: '12px 8px' }}>Subject Name</th>
                    <th style={{ padding: '12px 8px' }}>Class Section</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Weekly Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.allocationBreakdown && faculty.allocationBreakdown.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{item.subjectCode}</td>
                      <td style={{ padding: '12px 8px' }}>{item.subjectName}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.sectionName}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>{item.hours} hrs</td>
                    </tr>
                  ))}
                  {(!faculty.allocationBreakdown || faculty.allocationBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No course allocations assigned to you for this semester yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
