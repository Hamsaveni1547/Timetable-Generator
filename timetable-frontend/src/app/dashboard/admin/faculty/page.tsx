/* page.tsx — Admin Faculty management page */

'use client';

import React, { useState, useEffect } from 'react';
import academicService from '@/services/academicService';
import { Faculty, Department } from '@/types/entities';
import { Plus, Edit2, Trash2, Save, X, GraduationCap, AlertCircle, Check } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
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
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState<number>(16);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [userId, setUserId] = useState<number | ''>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [facData, deptsData] = await Promise.all([
        academicService.getFaculty(),
        academicService.getDepartments()
      ]);
      setFacultyList(facData);
      setDepartments(deptsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve faculty accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setDepartmentId(departments.length > 0 ? departments[0].id : '');
    setMaxHoursPerWeek(16);
    setDesignation('Assistant Professor');
    setUserId('');
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (fac: Faculty) => {
    setEditingId(fac.id);
    setName(fac.name);
    setEmployeeId(fac.employeeId);
    setEmail(fac.email);
    setPhone(fac.phone || '');
    setDepartmentId(fac.departmentId);
    setMaxHoursPerWeek(fac.maxHoursPerWeek);
    setDesignation(fac.designation || '');
    setUserId(fac.userId || '');
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim() || !email.trim() || !departmentId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const added = await academicService.createFaculty({
        name,
        employeeId: employeeId.toUpperCase(),
        email,
        phone: phone.trim() || undefined,
        departmentId: Number(departmentId),
        maxHoursPerWeek,
        designation,
        userId: userId ? Number(userId) : undefined,
        isActive: true
      });
      
      setSuccess('Faculty profile created successfully.');
      setShowAddForm(false);
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save faculty member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!name.trim() || !employeeId.trim() || !email.trim() || !departmentId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const original = facultyList.find(f => f.id === id)!;
      const updated = await academicService.updateFaculty(id, {
        ...original,
        name,
        employeeId: employeeId.toUpperCase(),
        email,
        phone: phone.trim() || undefined,
        departmentId: Number(departmentId),
        maxHoursPerWeek,
        designation,
        userId: userId ? Number(userId) : undefined
      });
      
      setSuccess('Faculty profile updated.');
      setEditingId(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update faculty member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this faculty profile?')) return;
    setError(null);
    try {
      await academicService.deleteFaculty(id);
      setSuccess('Faculty profile deactivated.');
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete faculty member.');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Faculty Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage lecturer registries, designations, department assignments, and weekly hour capacities.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Faculty
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
          <GraduationCap size={22} style={{ color: 'var(--accent)' }} /> Faculty Roster
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '110px' }}>Emp ID</th>
                <th style={{ padding: '12px 8px' }}>Faculty Name</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Department</th>
                <th style={{ padding: '12px 8px', width: '200px' }}>Email</th>
                <th style={{ padding: '12px 8px', width: '110px', textAlign: 'right' }}>Max load</th>
                <th style={{ padding: '12px 8px', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map(fac => {
                const isEditing = editingId === fac.id;
                const dept = departments.find(d => d.id === fac.departmentId);
                return (
                  <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)', opacity: fac.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '90px' }}
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                        />
                      ) : (
                        fac.employeeId
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', width: '180px' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', width: '180px', fontSize: '0.75rem' }}
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{fac.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{fac.designation || 'Lecturer'}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: '130px' }}
                          value={departmentId}
                          onChange={(e) => setDepartmentId(Number(e.target.value))}
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.code}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="profile-role-badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {fac.departmentName || dept?.code || `Dept #${fac.departmentId}`}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                      {isEditing ? (
                        <input
                          type="email"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '180px' }}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      ) : (
                        fac.email
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '70px', textAlign: 'right' }}
                          value={maxHoursPerWeek}
                          onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
                        />
                      ) : (
                        `${fac.maxHoursPerWeek}h`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleUpdate(fac.id)}
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
                              onClick={() => handleStartEdit(fac)}
                              disabled={!fac.isActive}
                            >
                              <Edit2 size={14} />
                            </button>
                            {fac.isActive ? (
                              <button
                                className="theme-toggle-btn"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDelete(fac.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button
                                className="theme-toggle-btn"
                                style={{ color: 'var(--success)' }}
                                onClick={async () => {
                                  await academicService.updateFaculty(fac.id, { ...fac, isActive: true });
                                  await loadAllData();
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
              {facultyList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No faculty members registered. Click "Add Faculty" to register.
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
          <div className="login-card" style={{ width: '480px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">Faculty Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add New Faculty Member</h2>
            </div>

            <form onSubmit={handleAdd} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-name">Full Name</label>
                  <input
                    id="fac-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-empid">Employee ID</label>
                  <input
                    id="fac-empid"
                    type="text"
                    className="form-input"
                    placeholder="e.g. EMP102"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-email">Email Address</label>
                  <input
                    id="fac-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh@uni.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-phone">Phone (Optional)</label>
                  <input
                    id="fac-phone"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-dept">Assigned Department</label>
                  <select
                    id="fac-dept"
                    className="form-input"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Dept --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-maxhours">Max Hours / Week</label>
                  <input
                    id="fac-maxhours"
                    type="number"
                    min="1"
                    max="40"
                    className="form-input"
                    value={maxHoursPerWeek}
                    onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-desig">Designation</label>
                  <input
                    id="fac-desig"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Associate Professor"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="fac-user">User Account ID (Optional)</label>
                  <input
                    id="fac-user"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
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
                  disabled={isSubmitting || !name.trim() || !employeeId.trim() || !email.trim() || !departmentId}
                >
                  {isSubmitting ? 'Creating...' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
