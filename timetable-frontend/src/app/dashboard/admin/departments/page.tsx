/* page.tsx — Admin Departments management page */

'use client';

import React, { useState, useEffect } from 'react';
import academicService from '@/services/academicService';
import { Department } from '@/types/entities';
import { Plus, Edit2, Trash2, Save, X, Building2, AlertCircle, Check } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [hodUserId, setHodUserId] = useState<number | ''>('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await academicService.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve departments list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setCode('');
    setHodUserId('');
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (dept: Department) => {
    setEditingId(dept.id);
    setName(dept.name);
    setCode(dept.code);
    setHodUserId(dept.hodUserId || '');
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const added = await academicService.createDepartment({
        name,
        code: code.toUpperCase(),
        hodUserId: hodUserId ? Number(hodUserId) : undefined,
        isActive: true
      });
      setDepartments(prev => [...prev, added]);
      setSuccess('Department created successfully.');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const original = departments.find(d => d.id === id)!;
      const updated = await academicService.updateDepartment(id, {
        ...original,
        name,
        code: code.toUpperCase(),
        hodUserId: hodUserId ? Number(hodUserId) : undefined
      });
      setDepartments(prev => prev.map(d => d.id === id ? updated : d));
      setSuccess('Department updated.');
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setError(null);
    try {
      await academicService.deleteDepartment(id);
      setSuccess('Department deleted.');
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete department.');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Departments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Configure institutional departments, code abbreviations, and manage HOD users.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Department
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
          <Building2 size={22} style={{ color: 'var(--accent)' }} /> Department Registry
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '80px' }}>ID</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Code</th>
                <th style={{ padding: '12px 8px' }}>Department Name</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>HOD User ID</th>
                <th style={{ padding: '12px 8px', width: '150px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => {
                const isEditing = editingId === dept.id;
                return (
                  <tr key={dept.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>#{dept.id}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '100px' }}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                      ) : (
                        <span className="profile-role-badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {dept.code}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '300px' }}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      ) : (
                        dept.name
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '100px' }}
                          value={hodUserId}
                          onChange={(e) => setHodUserId(e.target.value ? Number(e.target.value) : '')}
                        />
                      ) : (
                        dept.hodUserId || <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleUpdate(dept.id)}
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
                              onClick={() => handleStartEdit(dept)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(dept.id)}
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
              {departments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No departments created. Click "Add Department" to register.
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
              <span className="login-title-badge">Department Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add New Department</h2>
            </div>

            <form onSubmit={handleAdd} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="dept-code">Department Code (Abbreviation)</label>
                <input
                  id="dept-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. CSE, ECE, MECH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dept-name">Department Full Name</label>
                <input
                  id="dept-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science & Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dept-hod">HOD User ID (Optional)</label>
                <input
                  id="dept-hod"
                  type="number"
                  className="form-input"
                  placeholder="HOD User database ID"
                  value={hodUserId}
                  onChange={(e) => setHodUserId(e.target.value ? Number(e.target.value) : '')}
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
                  disabled={isSubmitting || !name.trim() || !code.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
