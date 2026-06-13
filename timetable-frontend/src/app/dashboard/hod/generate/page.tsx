/* page.tsx — HOD Timetable Generation Control Room */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import timetableService from '@/services/timetableService';
import configService from '@/services/configService';
import academicService from '@/services/academicService';
import { GenerationStatus } from '@/types/timetable';
import { SlotTemplate } from '@/types/config';
import BottleneckReport from '@/components/timetable/BottleneckReport';
import { Cpu, Play, CheckCircle, AlertCircle, Trash2, Eye, Sparkles, Calendar, Layers, Clock, Check } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

export default function HodGeneratePage() {
  const { user } = useAuth();
  const router = useRouter();
  const deptId = user?.departmentId || undefined;

  const [academicYear, setAcademicYear] = useState<number>(2); // Default Year 2
  const [semester, setSemester] = useState<number>(3); // Default Sem 3
  
  const [generations, setGenerations] = useState<GenerationStatus[]>([]);
  const [activeGen, setActiveGen] = useState<GenerationStatus | null>(null);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load generation history
  useEffect(() => {
    if (deptId) {
      loadGenerations();
    }
  }, [deptId]);

  const loadGenerations = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const [history, slotData] = await Promise.all([
        timetableService.getGenerations(deptId),
        configService.getSlots(),
      ]);
      setGenerations(history.sort((a, b) => b.id - a.id));
      setSlots(slotData.filter(slot => slot.isActive));
      
      // If there's an active/failed run, let's keep it in focus
      if (history.length > 0) {
        // Find most recent draft or failed
        setActiveGen(history[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve generation history.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!deptId) return;
    setSolving(true);
    setError(null);
    setActionSuccess(null);
    setActiveGen(null);

    try {
      const result = await timetableService.generate({
        departmentId: deptId,
        academicYear,
        semester
      });

      setActiveGen(result);
      setActionSuccess('Solver completed execution successfully!');
      
      // Refresh list
      const history = await timetableService.getGenerations(deptId);
      setGenerations(history.sort((a, b) => b.id - a.id));
    } catch (err: any) {
      console.error('Generation failed:', err);
      
      // If it returns a 422 with a BottleneckReport, it is parsed by our global handler or passed in error
      // Let's re-fetch history because the backend saves a FAILED record in the DB!
      const history = await timetableService.getGenerations(deptId);
      const sorted = history.sort((a, b) => b.id - a.id);
      setGenerations(sorted);
      if (sorted.length > 0) {
        setActiveGen(sorted[0]);
      }
      
      setError(err.response?.data?.message || 'Generation failed. Inspect the solver bottlenecks below.');
    } finally {
      setSolving(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!window.confirm('Are you sure you want to publish this timetable? Once published, it will be locked and visible to all students and faculty.')) return;
    
    setError(null);
    setActionSuccess(null);
    try {
      const updated = await timetableService.publish(id);
      setActionSuccess('Timetable successfully published and live!');
      
      // Update local states
      setGenerations(prev => prev.map(g => g.id === id ? updated : g));
      if (activeGen?.id === id) {
        setActiveGen(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish timetable.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this draft generation? This action is permanent.')) return;
    
    setError(null);
    setActionSuccess(null);
    try {
      await timetableService.deleteGeneration(id);
      setActionSuccess('Draft deleted.');
      
      // Filter out
      setGenerations(prev => prev.filter(g => g.id !== id));
      if (activeGen?.id === id) {
        setActiveGen(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete draft.');
    }
  };

  const handleViewTimetable = (gen: GenerationStatus) => {
    router.push(`/dashboard/hod/timetable/${gen.id}`);
  };

  if (loading && generations.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Timetable Generation Control Room</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Trigger the backtracking solver engine to construct conflict-free draft timetables.
        </p>
      </div>

      {error && !activeGen?.bottleneckReport && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="error-banner" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: 'var(--spacing-lg)' }}>
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Split layout: Controls / History & Bottleneck Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        {/* Left panel: Solver triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <Cpu size={20} style={{ color: 'var(--accent)' }} /> Trigger Solver
            </h3>

            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select 
                className="form-input"
                value={academicYear}
                onChange={(e) => setAcademicYear(Number(e.target.value))}
                disabled={solving}
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Semester</label>
              <select 
                className="form-input"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                disabled={solving}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className={`login-btn ${solving ? 'pulsing-loader' : ''}`}
              style={{
                marginTop: 'var(--spacing-sm)',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
              disabled={solving}
            >
              {solving ? (
                <>
                  <div className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }}></div>
                  <span>Running Backtracking Solver...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="white" />
                  <span>Generate Draft Timetable</span>
                </>
              )}
            </button>
          </div>

          <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>Break Windows</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {slots.filter(slot => slot.isBreak).map(slot => (
                <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <strong>{slot.label}</strong>
                  <span>{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                </div>
              ))}
              {slots.filter(slot => slot.isBreak).length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No break slots are configured.</div>
              )}
            </div>
          </div>

          {/* Active Generation details */}
          {activeGen && (
            <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>Active Draft Specs</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: activeGen.status === 'PUBLISHED' 
                      ? 'var(--success)' 
                      : activeGen.status === 'DRAFT' 
                        ? 'var(--accent)' 
                        : 'var(--danger)'
                  }}>
                    {activeGen.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Semester</span>
                  <span style={{ fontWeight: 600 }}>Semester {activeGen.semester}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Solver Run-time</span>
                  <span style={{ fontWeight: 600 }}>{activeGen.solverDurationMs || 0} ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Created At</span>
                  <span style={{ fontWeight: 600 }}>{new Date(activeGen.generatedAt).toLocaleString()}</span>
                </div>
              </div>

              {activeGen.status === 'DRAFT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'var(--spacing-md)' }}>
                  <button 
                    onClick={() => handleViewTimetable(activeGen)}
                    className="login-btn"
                    style={{ height: '36px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={12} /> View/Edit
                  </button>
                  <button 
                    onClick={() => handlePublish(activeGen.id)}
                    className="login-btn"
                    style={{ height: '36px', fontSize: '0.75rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Check size={12} /> Publish Live
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: Failure reports & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* If the active run failed, show the bottleneck report */}
          {activeGen && activeGen.status === 'FAILED' && activeGen.bottleneckReport && (
            <BottleneckReport report={activeGen.bottleneckReport} />
          )}

          {/* History Panel */}
          <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <Clock size={20} style={{ color: 'var(--accent)' }} /> Generation History
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '10px 8px' }}>Gen ID</th>
                    <th style={{ padding: '10px 8px' }}>Semester</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px' }}>Duration</th>
                    <th style={{ padding: '10px 8px' }}>Timestamp</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generations.map(gen => (
                    <tr 
                      key={gen.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: activeGen?.id === gen.id ? 'rgba(99, 102, 241, 0.02)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>#{gen.id}</td>
                      <td style={{ padding: '10px 8px' }}>Sem {gen.semester} (Yr {gen.academicYear})</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor: gen.status === 'PUBLISHED' 
                            ? 'var(--success-light)' 
                            : gen.status === 'DRAFT' 
                              ? 'var(--accent-light)' 
                              : 'var(--danger-light)',
                          color: gen.status === 'PUBLISHED' 
                            ? 'var(--success)' 
                            : gen.status === 'DRAFT' 
                              ? 'var(--accent)' 
                              : 'var(--danger)',
                        }}>
                          {gen.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>{gen.solverDurationMs || 0} ms</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        {new Date(gen.generatedAt).toLocaleDateString()} {new Date(gen.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="theme-toggle-btn"
                            style={{ padding: '4px 8px' }}
                            onClick={() => {
                              setActiveGen(gen);
                              setError(null);
                              setActionSuccess(null);
                            }}
                            title="Inspect run specs"
                          >
                            Inspect
                          </button>
                          
                          {gen.status === 'DRAFT' && (
                            <>
                              <button
                                className="theme-toggle-btn"
                                onClick={() => handleViewTimetable(gen)}
                                title="View timetable draft"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                className="theme-toggle-btn"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDelete(gen.id)}
                                title="Delete draft"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}

                          {gen.status === 'PUBLISHED' && (
                            <button
                              className="theme-toggle-btn"
                              onClick={() => handleViewTimetable(gen)}
                              title="View published timetable"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {generations.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No timetable generation runs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
