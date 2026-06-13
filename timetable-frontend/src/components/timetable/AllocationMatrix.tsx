/* AllocationMatrix.tsx — Grid interface mapping subjects against sections for workload allocation management */

'use client';

import React, { useState } from 'react';
import { Subject, Section, Faculty, SubjectAllocation } from '@/types/entities';
import { Plus, Trash2, X, AlertCircle, Check, Info, AlertTriangle } from 'lucide-react';
import '../../app/dashboard/dashboard.css';
import './timetable.css';

interface AllocationMatrixProps {
  subjects: Subject[];
  sections: Section[];
  facultyList: Faculty[];
  allocations: SubjectAllocation[];
  onAdd: (alloc: { subjectId: number; sectionId: number; facultyId: number; allocatedHoursPerWeek: number }) => Promise<any>;
  onRemove: (id: number) => Promise<any>;
}

export default function AllocationMatrix({ 
  subjects, 
  sections, 
  facultyList, 
  allocations, 
  onAdd, 
  onRemove 
}: AllocationMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ subject: Subject; section: Section } | null>(null);
  const [facultyId, setFacultyId] = useState<number | ''>('');
  const [allocatedHours, setAllocatedHours] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Get allocations for a specific subject-section cell
  const getCellAllocations = (subjectId: number, sectionId: number) => {
    return allocations.filter(a => a.subjectId === subjectId && a.sectionId === sectionId);
  };

  // Get status of a cell allocation
  const getCellStatus = (subject: Subject, section: Section) => {
    const cellAllocations = getCellAllocations(subject.id, section.id);
    const totalAllocated = cellAllocations.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
    const required = subject.hoursPerWeek;

    if (totalAllocated === 0) return 'unallocated';
    if (totalAllocated < required) return 'partial';
    if (totalAllocated === required) return 'complete';
    return 'overallocated';
  };

  const getCellBgClass = (status: string) => {
    if (status === 'complete') return 'matrix-cell-complete';
    if (status === 'partial') return 'matrix-cell-partial';
    if (status === 'overallocated') return 'matrix-cell-overallocated';
    return 'matrix-cell-unallocated';
  };

  // Handle cell click to open drawer
  const handleCellClick = (subject: Subject, section: Section) => {
    setSelectedCell({ subject, section });
    setFacultyId('');
    setDrawerError(null);
    
    // Suggest remaining hours
    const cellAllocations = getCellAllocations(subject.id, section.id);
    const totalAllocated = cellAllocations.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
    const remaining = Math.max(0, subject.hoursPerWeek - totalAllocated);
    setAllocatedHours(remaining > 0 ? remaining : 2);
  };

  // Handle allocation save
  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !facultyId) return;

    setDrawerError(null);
    setIsSubmitting(true);

    const cellAllocations = getCellAllocations(selectedCell.subject.id, selectedCell.section.id);
    const totalAllocated = cellAllocations.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
    const required = selectedCell.subject.hoursPerWeek;

    if (totalAllocated + allocatedHours > required) {
      setDrawerError(`Cannot allocate ${allocatedHours} hours. This exceeds the subject's required ${required} hours/week (Already allocated: ${totalAllocated}h).`);
      setIsSubmitting(false);
      return;
    }

    try {
      await onAdd({
        subjectId: selectedCell.subject.id,
        sectionId: selectedCell.section.id,
        facultyId: Number(facultyId),
        allocatedHoursPerWeek: allocatedHours
      });
      
      // Reset input
      setFacultyId('');
      const newTotal = totalAllocated + allocatedHours;
      const remaining = Math.max(0, required - newTotal);
      setAllocatedHours(remaining > 0 ? remaining : 2);
    } catch (err: any) {
      setDrawerError(err.message || 'Failed to save allocation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAllocation = async (id: number) => {
    setDrawerError(null);
    try {
      await onRemove(id);
    } catch (err: any) {
      setDrawerError(err.message || 'Failed to delete allocation.');
    }
  };

  // Filter faculty dropdown to eligible teachers in HOD's department
  const getEligibleFacultyList = () => {
    return facultyList.filter(f => f.isActive);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Allocation Matrix</h2>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}></span> Unallocated
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}></span> Partial Hours
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}></span> Fully Allocated
            </span>
          </div>
        </div>

        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner-header">Subjects ({subjects.length})</th>
              {sections.map(section => (
                <th key={section.id} className="matrix-section-header">
                  <div>{section.name}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Yr {section.academicYear} • Sem {section.semester}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => (
              <tr key={subject.id}>
                <td className="matrix-subject-cell">
                  <div style={{ fontWeight: 700 }}>{subject.code}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '160px' }}>
                    {subject.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span>{subject.hoursPerWeek}h/wk</span>
                    <span>•</span>
                    <span>{subject.subjectType}</span>
                  </div>
                </td>
                
                {sections.map(section => {
                  const cellAllocations = getCellAllocations(subject.id, section.id);
                  const status = getCellStatus(subject, section);
                  const bgClass = getCellBgClass(status);
                  const hoursSum = cellAllocations.reduce((s, a) => s + a.allocatedHoursPerWeek, 0);

                  return (
                    <td 
                      key={section.id} 
                      className={`matrix-cell ${bgClass}`}
                      onClick={() => handleCellClick(subject, section)}
                    >
                      <div className="matrix-cell-content">
                        {cellAllocations.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {cellAllocations.map(a => (
                              <div key={a.id} className="matrix-cell-faculty-pill">
                                {a.facultyName} <span style={{ opacity: 0.8, fontWeight: 700 }}>({a.allocatedHoursPerWeek}h)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="matrix-cell-empty-text">Assign Faculty</div>
                        )}
                        
                        <div className="matrix-cell-progress-tag">
                          {hoursSum} / {subject.hoursPerWeek} hrs
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={sections.length + 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No subjects registered for this semester.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side Drawer Overlay for Allocating Faculty */}
      {selectedCell && (
        <div className="drawer-overlay" onClick={() => setSelectedCell(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="login-title-badge">Allocations Editor</span>
                <h3>{selectedCell.subject.code} &mdash; {selectedCell.section.name}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {selectedCell.subject.name} • Needs {selectedCell.subject.hoursPerWeek} hrs/week
                </p>
              </div>
              <button className="theme-toggle-btn" onClick={() => setSelectedCell(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {drawerError && (
                <div className="error-banner" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <AlertCircle size={18} />
                  <span>{drawerError}</span>
                </div>
              )}

              {/* Current Allocations List */}
              <div className="drawer-section">
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Current Allocations</h4>
                
                {getCellAllocations(selectedCell.subject.id, selectedCell.section.id).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getCellAllocations(selectedCell.subject.id, selectedCell.section.id).map(alloc => (
                      <div key={alloc.id} className="allocation-list-item">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{alloc.facultyName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allocated: {alloc.allocatedHoursPerWeek} hrs/week</span>
                        </div>
                        <button 
                          className="theme-toggle-btn" 
                          style={{ color: 'var(--danger)', border: 'none', padding: '6px' }}
                          onClick={() => handleRemoveAllocation(alloc.id)}
                          title="Remove allocation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No faculty allocated to this slot yet.
                  </div>
                )}
              </div>

              {/* Allocation Progress Bar */}
              <div className="drawer-section" style={{ marginTop: 'var(--spacing-lg)' }}>
                {(() => {
                  const cellAllocs = getCellAllocations(selectedCell.subject.id, selectedCell.section.id);
                  const totalAllocated = cellAllocs.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
                  const required = selectedCell.subject.hoursPerWeek;
                  const ratio = Math.min((totalAllocated / required) * 100, 100);
                  
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Total Assigned Hours</span>
                        <span>{totalAllocated} / {required} hrs</span>
                      </div>
                      <div className="workload-progress-bg" style={{ height: '8px' }}>
                        <div 
                          className="workload-progress-fill" 
                          style={{ 
                            width: `${ratio}%`, 
                            backgroundColor: totalAllocated === required ? 'var(--success)' : 'var(--warning)'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Form to Add New Allocation */}
              {(() => {
                const cellAllocs = getCellAllocations(selectedCell.subject.id, selectedCell.section.id);
                const totalAllocated = cellAllocs.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
                const required = selectedCell.subject.hoursPerWeek;
                const isFulfilled = totalAllocated >= required;

                if (isFulfilled) {
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--spacing-lg)', fontSize: '0.8rem', fontWeight: 600 }}>
                      <Check size={16} />
                      <span>This subject allocation is fully completed.</span>
                    </div>
                  );
                }

                return (
                  <form onSubmit={handleSaveAllocation} className="login-form" style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-lg)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Add New Faculty Allocation</h4>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="faculty-select">Select Faculty Member</label>
                      <select
                        id="faculty-select"
                        className="form-input"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value ? Number(e.target.value) : '')}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">-- Choose Faculty --</option>
                        {getEligibleFacultyList().map(fac => {
                          const isAlreadyIn = cellAllocs.some(a => a.facultyId === fac.id);
                          if (isAlreadyIn) return null;
                          
                          const workloadLabel = fac.allocatedHoursPerWeek !== undefined 
                            ? `(${fac.allocatedHoursPerWeek}/${fac.maxHoursPerWeek} hrs filled)` 
                            : '';
                          return (
                            <option key={fac.id} value={fac.id}>
                              {fac.name} {workloadLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="allocated-hours">Allocated Hours (Weekly)</label>
                      <input
                        id="allocated-hours"
                        type="number"
                        min="1"
                        max={required - totalAllocated}
                        className="form-input"
                        value={allocatedHours}
                        onChange={(e) => setAllocatedHours(Number(e.target.value))}
                        required
                        disabled={isSubmitting}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        Required: {required} hrs/week. Remaining to allocate: {required - totalAllocated} hrs.
                      </span>
                    </div>

                    <button 
                      type="submit" 
                      className="login-btn" 
                      style={{ height: 'auto', padding: '10px 16px', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled={isSubmitting || !facultyId}
                    >
                      <Plus size={16} /> Allocate Faculty
                    </button>
                  </form>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
