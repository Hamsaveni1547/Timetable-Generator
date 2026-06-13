/* page.tsx — HOD Subjects management page */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import academicService from '@/services/academicService';
import { Subject } from '@/types/entities';
import { Plus, Edit2, Trash2, Save, X, BookOpen, AlertCircle, Check } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function HodSubjectsPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Add state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState<number>(3);
  const [credits, setCredits] = useState<number>(3);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(3);
  const [subjectType, setSubjectType] = useState('THEORY');
  const [requiredRoomType, setRequiredRoomType] = useState('');
  const [consecutiveSlotsRequired, setConsecutiveSlotsRequired] = useState<number>(1);
  const [minDaysBetweenSessions, setMinDaysBetweenSessions] = useState<number>(2);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState<number>(1);

  useEffect(() => {
    if (deptId) {
      loadAllData();
    }
  }, [deptId]);

  const loadAllData = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const [subjectsData, roomTypesData] = await Promise.all([
        academicService.getSubjects(deptId),
        academicService.getRoomTypes()
      ]);
      setSubjects(subjectsData);
      setRoomTypes(roomTypesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve subjects details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setCode('');
    setSemester(3);
    setCredits(3);
    setHoursPerWeek(3);
    setSubjectType('THEORY');
    setRequiredRoomType(roomTypes.length > 0 ? roomTypes[0] : 'THEORY');
    setConsecutiveSlotsRequired(1);
    setMinDaysBetweenSessions(2);
    setMaxSessionsPerDay(1);
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (subj: Subject) => {
    setEditingId(subj.id);
    setName(subj.name);
    setCode(subj.code);
    setSemester(subj.semester);
    setCredits(subj.credits);
    setHoursPerWeek(subj.hoursPerWeek);
    setSubjectType(subj.subjectType);
    setRequiredRoomType(subj.requiredRoomType || '');
    setConsecutiveSlotsRequired(subj.consecutiveSlotsRequired);
    setMinDaysBetweenSessions(subj.minDaysBetweenSessions);
    setMaxSessionsPerDay(subj.maxSessionsPerDay);
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !deptId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const added = await academicService.createSubject({
        name,
        code: code.toUpperCase(),
        departmentId: deptId,
        semester,
        credits,
        hoursPerWeek,
        subjectType,
        requiredRoomType: requiredRoomType || undefined,
        consecutiveSlotsRequired,
        minDaysBetweenSessions,
        maxSessionsPerDay
      });
      
      setSuccess('Subject syllabus registered.');
      setShowAddForm(false);
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!name.trim() || !code.trim() || !deptId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const original = subjects.find(s => s.id === id)!;
      const updated = await academicService.updateSubject(id, {
        ...original,
        name,
        code: code.toUpperCase(),
        semester,
        credits,
        hoursPerWeek,
        subjectType,
        requiredRoomType: requiredRoomType || undefined,
        consecutiveSlotsRequired,
        minDaysBetweenSessions,
        maxSessionsPerDay
      });
      
      setSuccess('Subject configuration updated.');
      setEditingId(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    setError(null);
    try {
      await academicService.deleteSubject(id);
      setSuccess('Subject record deleted.');
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete subject.');
    }
  };

  // Adjust default slots when selecting LAB vs THEORY
  const handleTypeChange = (val: string) => {
    setSubjectType(val);
    if (val === 'LAB') {
      setConsecutiveSlotsRequired(3);
      setHoursPerWeek(6);
      if (roomTypes.includes('LAB')) {
        setRequiredRoomType('LAB');
      }
    } else {
      setConsecutiveSlotsRequired(1);
      setHoursPerWeek(3);
      if (roomTypes.includes('THEORY')) {
        setRequiredRoomType('THEORY');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Subjects Syllabus</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Configure department courses, contact hours, credits, and rooms scheduling rules.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="error-banner" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: 'var(--spacing-lg)' }}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
          <BookOpen size={22} style={{ color: 'var(--accent)' }} /> Course Catalog
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '120px' }}>Code</th>
                <th style={{ padding: '12px 8px' }}>Course Title</th>
                <th style={{ padding: '12px 8px', width: '90px' }}>Sem</th>
                <th style={{ padding: '12px 8px', width: '90px' }}>Credits</th>
                <th style={{ padding: '12px 8px', width: '100px', textAlign: 'right' }}>Hrs/wk</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Type</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Room Block</th>
                <th style={{ padding: '12px 8px', width: '110px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subj => {
                const isEditing = editingId === subj.id;
                return (
                  <tr key={subj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '90px' }}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                      ) : (
                        subj.code
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '220px' }}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{subj.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Min days: {subj.minDaysBetweenSessions}d &bull; Max sessions: {subj.maxSessionsPerDay}/day
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '70px' }}
                          value={semester}
                          onChange={(e) => setSemester(Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        `Sem ${subj.semester}`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '70px' }}
                          value={credits}
                          onChange={(e) => setCredits(Number(e.target.value))}
                        />
                      ) : (
                        `${subj.credits} C`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '70px', textAlign: 'right' }}
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                        />
                      ) : (
                        `${subj.hoursPerWeek}h`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '100px' }}
                          value={subjectType}
                          onChange={(e) => handleTypeChange(e.target.value)}
                        >
                          <option value="THEORY">THEORY</option>
                          <option value="LAB">LAB</option>
                        </select>
                      ) : (
                        <span className="profile-role-badge" style={{ 
                          backgroundColor: subj.subjectType === 'LAB' ? 'var(--warning-light)' : 'var(--accent-light)',
                          color: subj.subjectType === 'LAB' ? 'var(--warning)' : 'var(--accent)'
                        }}>
                          {subj.subjectType}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '110px' }}
                          value={requiredRoomType}
                          onChange={(e) => setRequiredRoomType(e.target.value)}
                        >
                          <option value="">Any Room</option>
                          {roomTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        subj.requiredRoomType || 'Any'
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleUpdate(subj.id)}
                              disabled={isSubmitting}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="theme-toggle-btn"
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="theme-toggle-btn"
                              onClick={() => handleStartEdit(subj)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(subj.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No subjects configured. Click "Add Subject" to syllabus catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '500px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">Subject Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add New Syllabus Course</h2>
            </div>

            <form onSubmit={handleAdd} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-code">Subject Code</label>
                  <input
                    id="subj-code"
                    type="text"
                    className="form-input"
                    placeholder="e.g. CS302"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-name">Course Title</label>
                  <input
                    id="subj-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Database Management Systems"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-sem">Semester</label>
                  <select
                    id="subj-sem"
                    className="form-input"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-credits">Credits</label>
                  <input
                    id="subj-credits"
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-type">Subject Type</label>
                  <select
                    id="subj-type"
                    className="form-input"
                    value={subjectType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="THEORY">THEORY</option>
                    <option value="LAB">LAB (Block)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-roomtype">Required Room Type</label>
                  <select
                    id="subj-roomtype"
                    className="form-input"
                    value={requiredRoomType}
                    onChange={(e) => setRequiredRoomType(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Any Room</option>
                    {roomTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-hours">Hours/wk</label>
                  <input
                    id="subj-hours"
                    type="number"
                    min="1"
                    max="20"
                    className="form-input"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-consec">Block slots</label>
                  <input
                    id="subj-consec"
                    type="number"
                    min="1"
                    max="6"
                    className="form-input"
                    value={consecutiveSlotsRequired}
                    onChange={(e) => setConsecutiveSlotsRequired(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-mindays">Min Days Between Sessions</label>
                  <input
                    id="subj-mindays"
                    type="number"
                    min="0"
                    max="6"
                    className="form-input"
                    value={minDaysBetweenSessions}
                    onChange={(e) => setMinDaysBetweenSessions(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subj-maxsess">Max Sessions Per Day</label>
                  <input
                    id="subj-maxsess"
                    type="number"
                    min="1"
                    max="4"
                    className="form-input"
                    value={maxSessionsPerDay}
                    onChange={(e) => setMaxSessionsPerDay(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button" 
                  className="logout-btn" 
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}
                  disabled={isSubmitting || !name.trim() || !code.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Register Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
