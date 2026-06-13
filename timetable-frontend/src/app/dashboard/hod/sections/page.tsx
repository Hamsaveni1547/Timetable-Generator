/* page.tsx — HOD Sections management page */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import academicService from '@/services/academicService';
import { Section } from '@/types/entities';
import { Plus, Edit2, Trash2, Save, X, Users, AlertCircle, Check } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function HodSectionsPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Add state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState<number>(2);
  const [semester, setSemester] = useState<number>(3);
  const [studentCount, setStudentCount] = useState<number>(60);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    if (deptId) {
      loadSections();
    }
  }, [deptId]);

  const loadSections = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const data = await academicService.getSections(deptId);
      setSections(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve student sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setAcademicYear(2);
    setSemester(3);
    setStudentCount(60);
    setRoomName('');
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (section: Section) => {
    setEditingId(section.id);
    setName(section.name);
    setAcademicYear(section.academicYear);
    setSemester(section.semester);
    setStudentCount(section.studentCount);
    setRoomName(section.roomName ?? '');
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deptId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const added = await academicService.createSection({
        name,
        academicYear,
        semester,
        studentCount,
        departmentId: deptId,
        roomName: roomName.trim() || null,
        isActive: true
      });
      
      setSuccess('Class section registered.');
      setShowAddForm(false);
      await loadSections();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!name.trim() || !deptId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const original = sections.find(s => s.id === id)!;
      const updated = await academicService.updateSection(id, {
        ...original,
        name,
        academicYear,
        semester,
        studentCount,
        roomName: roomName.trim() || null
      });
      
      setSuccess('Section details updated.');
      setEditingId(null);
      await loadSections();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    setError(null);
    try {
      await academicService.deleteSection(id);
      setSuccess('Section record deleted.');
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete section.');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Student Sections</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Configure active class groups, student enrollments, academic years, and semester levels.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Class Section
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
          <Users size={22} style={{ color: 'var(--accent)' }} /> Department Class Sections
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Section Name</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Academic Year</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Semester</th>
                <th style={{ padding: '12px 8px', width: '180px' }}>Classroom</th>
                <th style={{ padding: '12px 8px', width: '150px', textAlign: 'right' }}>Students Count</th>
                <th style={{ padding: '12px 8px', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(sec => {
                const isEditing = editingId === sec.id;
                return (
                  <tr key={sec.id} style={{ borderBottom: '1px solid var(--border)', opacity: sec.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '180px' }}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      ) : (
                        sec.name
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '120px' }}
                          value={academicYear}
                          onChange={(e) => setAcademicYear(Number(e.target.value))}
                        >
                          <option value={1}>1st Year</option>
                          <option value={2}>2nd Year</option>
                          <option value={3}>3rd Year</option>
                          <option value={4}>4th Year</option>
                        </select>
                      ) : (
                        `Year ${sec.academicYear}`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '120px' }}
                          value={semester}
                          onChange={(e) => setSemester(Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      ) : (
                        `Semester ${sec.semester}`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '180px' }}
                          placeholder="e.g. MCA Block-1"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                        />
                      ) : (
                        sec.roomName ? sec.roomName : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '90px', textAlign: 'right' }}
                          value={studentCount}
                          onChange={(e) => setStudentCount(Number(e.target.value))}
                        />
                      ) : (
                        `${sec.studentCount} students`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleUpdate(sec.id)}
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
                              onClick={() => handleStartEdit(sec)}
                              disabled={!sec.isActive}
                            >
                              <Edit2 size={14} />
                            </button>
                            {sec.isActive ? (
                              <button
                                className="theme-toggle-btn"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDelete(sec.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button
                                className="theme-toggle-btn"
                                style={{ color: 'var(--success)' }}
                                onClick={async () => {
                                  await academicService.updateSection(sec.id, { ...sec, isActive: true });
                                  await loadSections();
                                }}
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No student sections registered. Click "Add Class Section" to register.
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
          <div className="login-card" style={{ width: '450px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">Section Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add New Class Section</h2>
            </div>

            <form onSubmit={handleAdd} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="sec-name">Section Name</label>
                <input
                  id="sec-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. CSE-3A, ECE-2B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sec-year">Academic Year</label>
                  <select
                    id="sec-year"
                    className="form-input"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sec-sem">Semester</label>
                  <select
                    id="sec-sem"
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sec-room">Assigned Classroom</label>
                <input
                  id="sec-room"
                  className="form-input"
                  type="text"
                  placeholder="e.g. MCA Block-1, A-201"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Type a classroom name. If it does not exist yet, it will be created as a CLASSROOM.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sec-count">Total Students enrolled</label>
                <input
                  id="sec-count"
                  type="number"
                  className="form-input"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  required
                  disabled={isSubmitting}
                />
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
                  disabled={isSubmitting || !name.trim() || !roomName.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Register Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
