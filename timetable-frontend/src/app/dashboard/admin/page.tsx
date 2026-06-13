/* page.tsx — Admin dashboard overview with system stats and quick configuration pathways */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import academicService from '@/services/academicService';
import configService from '@/services/configService';
import { 
  Building2, 
  DoorOpen, 
  GraduationCap, 
  Clock, 
  Sliders, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import './admin.css';

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    departments: 0,
    rooms: 0,
    faculty: 0,
    slots: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [depts, rooms, faculty, slots] = await Promise.all([
          academicService.getDepartments(),
          academicService.getRooms(),
          academicService.getFaculty(),
          configService.getSlots(),
        ]);
        
        setStats({
          departments: depts.length,
          rooms: rooms.length,
          faculty: faculty.length,
          slots: slots.length,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome Back, {user?.fullName}!</h2>
          <p>System Administrator Portal — Manage core university configurations, infrastructure, and constraints.</p>
        </div>
        <div className="welcome-badge">
          <ShieldCheck size={20} />
          <span>Secured Admin Session</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.departments}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
            <DoorOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.rooms}</span>
            <span className="stat-label">Classrooms & Labs</span>
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
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.slots}</span>
            <span className="stat-label">Period Slots</span>
          </div>
        </div>
      </div>

      {/* Configurations Overview Section */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} style={{ color: 'var(--accent)' }} /> Solver Configurations
        </h3>
        
        <div className="config-path-grid">
          {/* Card 1: Slot Templates */}
          <Link href="/dashboard/admin/config/slots" className="config-path-card">
            <div className="path-header">
              <Clock size={24} className="path-icon text-accent" />
              <h4>Slot Templates</h4>
            </div>
            <p>Define dynamic academic hours, slot orderings, class durations, and custom break periods.</p>
            <div className="path-action">
              <span>Configure Slots</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Card 2: Constraints */}
          <Link href="/dashboard/admin/config/constraints" className="config-path-card">
            <div className="path-header">
              <Sliders size={24} className="path-icon text-danger" />
              <h4>Constraint Weights</h4>
            </div>
            <p>Edit hard constraints check rules and adjust soft constraint penalty weights for LCV heuristic optimization.</p>
            <div className="path-action">
              <span>Adjust Weights</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Card 3: Working Calendar */}
          <Link href="/dashboard/admin/config/schedule" className="config-path-card">
            <div className="path-header">
              <Calendar size={24} className="path-icon text-warning" />
              <h4>Working Calendar</h4>
            </div>
            <p>Set active teaching days (Monday through Saturday), semester labels, and date boundary limits.</p>
            <div className="path-action">
              <span>Update Calendar</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </div>

      {/* Infrastructure Section */}
      <div style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent)' }} /> Institutional Data
        </h3>

        <div className="infra-links-grid">
          <Link href="/dashboard/admin/departments" className="infra-link-card">
            <Building2 size={20} />
            <div className="infra-text">
              <h5>Departments CRUD</h5>
              <p>Manage HOD assignments & departments.</p>
            </div>
            <ArrowRight size={18} />
          </Link>

          <Link href="/dashboard/admin/rooms" className="infra-link-card">
            <DoorOpen size={20} />
            <div className="infra-text">
              <h5>Rooms & Capacity</h5>
              <p>Set room sizes, types, and capacities.</p>
            </div>
            <ArrowRight size={18} />
          </Link>

          <Link href="/dashboard/admin/faculty" className="infra-link-card">
            <GraduationCap size={20} />
            <div className="infra-text">
              <h5>Faculty Accounts</h5>
              <p>Configure faculty roles, details & limits.</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
