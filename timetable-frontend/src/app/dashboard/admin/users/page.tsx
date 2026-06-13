/* page.tsx — Admin User Accounts management page */

'use client';

import React, { useState, useEffect } from 'react';
import authService, { RegisterRequest, UpdateUserRequest, UserProfile } from '@/services/authService';
import academicService from '@/services/academicService';
import { Department } from '@/types/entities';
import { Plus, X, Users, AlertCircle, Check, Shield, GraduationCap, UserCheck, Edit2 } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT'>('HOD');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, deptsData] = await Promise.all([
        authService.getUsers(),
        academicService.getDepartments()
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('HOD');
    setDepartmentId(departments.length > 0 ? departments[0].id : '');
    setIsActive(true);
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setDepartmentId(user.departmentId ?? '');
    setIsActive(user.isActive);
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!editingUser && (!username.trim() || !password.trim())) {
      setError('Please fill in all required fields.');
      return;
    }

    if (role !== 'ADMIN' && !departmentId) {
      setError('Please select a department for this role.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingUser) {
        const payload: UpdateUserRequest = {
          username: username.trim().toLowerCase(),
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          departmentId: role !== 'ADMIN' && departmentId ? Number(departmentId) : null,
          isActive,
        };
        await authService.updateUser(editingUser.id, payload);
        setSuccess(`User "${username}" updated successfully.`);
      } else {
        const payload: RegisterRequest = {
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          password: password,
          role,
          departmentId: role !== 'ADMIN' && departmentId ? Number(departmentId) : null
        };
        await authService.register(payload);
        setSuccess(`User "${username}" registered successfully.`);
      }
      handleCloseForm();
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Shield size={16} className="text-accent" />;
      case 'HOD':
        return <GraduationCap size={16} className="text-warning" />;
      case 'FACULTY':
        return <UserCheck size={16} className="text-success" />;
      default:
        return <Users size={16} className="text-info" />;
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' };
      case 'HOD':
        return { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' };
      case 'FACULTY':
        return { backgroundColor: 'var(--success-light)', color: 'var(--success)' };
      default:
        return { backgroundColor: 'var(--info-light)', color: 'var(--info)' };
    }
  };

  if (loading && users.length === 0) {
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>User Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage logins, access credentials, system roles, and department bindings for testing.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add User Account
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
          <Users size={22} style={{ color: 'var(--accent)' }} /> Registered Users
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '80px' }}>User ID</th>
                <th style={{ padding: '12px 8px' }}>Full Name</th>
                <th style={{ padding: '12px 8px', width: '140px' }}>Username</th>
                <th style={{ padding: '12px 8px', width: '220px' }}>Email</th>
                <th style={{ padding: '12px 8px', width: '140px' }}>Role</th>
                <th style={{ padding: '12px 8px', width: '160px' }}>Department</th>
                <th style={{ padding: '12px 8px', width: '160px', textAlign: 'right' }}>Last Login</th>
                <th style={{ padding: '12px 8px', width: '80px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const dept = departments.find(d => d.id === u.departmentId);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>#{u.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{u.fullName}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{u.username}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span 
                        className="profile-role-badge" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          ...getRoleBadgeStyle(u.role)
                        }}
                      >
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {u.role === 'ADMIN' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Global (All)</span>
                      ) : (
                        <span className="profile-role-badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
                          {dept?.name || `Dept #${u.departmentId}`}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        className="theme-toggle-btn"
                        onClick={() => handleOpenEdit(u)}
                        title="Edit user account"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No user accounts registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '480px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">User Account</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>
                {editingUser ? 'Edit User Account' : 'Register New User Account'}
              </h2>
            </div>

            <form onSubmit={handleSubmitUser} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="user-fullname">Full Name</label>
                <input
                  id="user-fullname"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="user-username">Username</label>
                  <input
                    id="user-username"
                    type="text"
                    className="form-input"
                    placeholder="e.g. janesmith"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="user-email">Email Address</label>
                  <input
                    id="user-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. jane@uni.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="user-role">System Role</label>
                  <select
                    id="user-role"
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="FACULTY">Faculty Member</option>
                    <option value="STUDENT">Student Account</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                {editingUser ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-status">Account Status</label>
                    <select
                      id="user-status"
                      className="form-input"
                      value={isActive ? 'active' : 'inactive'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                      disabled={isSubmitting}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-password">Password</label>
                    <input
                      id="user-password"
                      type="password"
                      className="form-input"
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {role !== 'ADMIN' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="user-dept">Assigned Department</label>
                  <select
                    id="user-dept"
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
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button" 
                  className="logout-btn" 
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}
                  disabled={isSubmitting || !fullName.trim() || !email.trim() || (!editingUser && (!username.trim() || !password.trim())) || (role !== 'ADMIN' && !departmentId)}
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
