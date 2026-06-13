/* page.tsx — HOD Subject Allocation Dashboard */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkload } from '@/hooks/useWorkload';
import WorkloadBar from '@/components/timetable/WorkloadBar';
import AllocationMatrix from '@/components/timetable/AllocationMatrix';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function HodAllocationsPage() {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<number>(3); // Default to Semester 3
  
  const deptId = user?.departmentId || undefined;
  const { 
    facultyList, 
    allocations, 
    subjects, 
    sections, 
    loading, 
    error, 
    refresh,
    addAllocation, 
    removeAllocation 
  } = useWorkload(deptId, selectedSemester);

  if (loading && facultyList.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Header and Semester Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Faculty Allocations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Distribute course syllabus hours across teachers for your department.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {SEMESTERS.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <button 
            className="theme-toggle-btn"
            style={{ padding: '7px' }}
            onClick={refresh}
            title="Refresh allocation status"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Layout (Sidebar Faculty Load + Spreadsheet Matrix) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        {/* Left Side: Faculty Workload Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div className="dashboard-card" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0' }}>Faculty Weekly Loads</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 var(--spacing-sm) 0' }}>
              Hover over bars to check sections and hours breakdown.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {facultyList.map(faculty => (
                <WorkloadBar key={faculty.id} faculty={faculty} />
              ))}
              {facultyList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No faculty members found in department.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Subjects vs Sections Spreadsheet Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AllocationMatrix 
            subjects={subjects}
            sections={sections}
            facultyList={facultyList}
            allocations={allocations}
            onAdd={addAllocation}
            onRemove={removeAllocation}
          />
        </div>
      </div>
    </div>
  );
}
