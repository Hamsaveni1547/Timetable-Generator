/* Sidebar.tsx — Responsive navigation sidebar mapped to user roles */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Clock,
  Sliders,
  Calendar,
  Building2,
  DoorOpen,
  GraduationCap,
  Users,
  BookOpen,
  Network,
  CalendarOff,
  Cpu,
  LogOut,
  Sparkles
} from 'lucide-react';
import '../app/dashboard/dashboard.css';

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Active Link Helper
  const isActive = (path: string) => pathname === path;

  // Define Links based on Role
  const renderLinks = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <>
            <div className="sidebar-group-title">Overview</div>
            <Link 
              href="/dashboard/admin" 
              className={`sidebar-link ${isActive('/dashboard/admin') ? 'sidebar-link-active' : ''}`}
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>Overview</span>}
            </Link>

            <div className="sidebar-group-title">Configuration</div>
            <Link 
              href="/dashboard/admin/config/slots" 
              className={`sidebar-link ${isActive('/dashboard/admin/config/slots') ? 'sidebar-link-active' : ''}`}
            >
              <Clock size={20} />
              {!collapsed && <span>Slot Templates</span>}
            </Link>
            <Link 
              href="/dashboard/admin/config/constraints" 
              className={`sidebar-link ${isActive('/dashboard/admin/config/constraints') ? 'sidebar-link-active' : ''}`}
            >
              <Sliders size={20} />
              {!collapsed && <span>Constraint Weights</span>}
            </Link>
            <Link 
              href="/dashboard/admin/config/schedule" 
              className={`sidebar-link ${isActive('/dashboard/admin/config/schedule') ? 'sidebar-link-active' : ''}`}
            >
              <Calendar size={20} />
              {!collapsed && <span>Working Calendar</span>}
            </Link>

            <div className="sidebar-group-title">Academic Data</div>
            <Link 
              href="/dashboard/admin/departments" 
              className={`sidebar-link ${isActive('/dashboard/admin/departments') ? 'sidebar-link-active' : ''}`}
            >
              <Building2 size={20} />
              {!collapsed && <span>Departments</span>}
            </Link>
            <Link 
              href="/dashboard/admin/rooms" 
              className={`sidebar-link ${isActive('/dashboard/admin/rooms') ? 'sidebar-link-active' : ''}`}
            >
              <DoorOpen size={20} />
              {!collapsed && <span>Rooms CRUD</span>}
            </Link>
            <Link 
              href="/dashboard/admin/faculty" 
              className={`sidebar-link ${isActive('/dashboard/admin/faculty') ? 'sidebar-link-active' : ''}`}
            >
              <GraduationCap size={20} />
              {!collapsed && <span>Faculty Accounts</span>}
            </Link>
            <Link 
              href="/dashboard/admin/users" 
              className={`sidebar-link ${isActive('/dashboard/admin/users') ? 'sidebar-link-active' : ''}`}
            >
              <Users size={20} />
              {!collapsed && <span>User Accounts</span>}
            </Link>
          </>
        );

      case 'HOD':
        return (
          <>
            <div className="sidebar-group-title">Overview</div>
            <Link 
              href="/dashboard/hod" 
              className={`sidebar-link ${isActive('/dashboard/hod') ? 'sidebar-link-active' : ''}`}
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>Department Panel</span>}
            </Link>

            <div className="sidebar-group-title">Department Settings</div>
            <Link 
              href="/dashboard/hod/sections" 
              className={`sidebar-link ${isActive('/dashboard/hod/sections') ? 'sidebar-link-active' : ''}`}
            >
              <Users size={20} />
              {!collapsed && <span>Student Sections</span>}
            </Link>
            <Link 
              href="/dashboard/hod/subjects" 
              className={`sidebar-link ${isActive('/dashboard/hod/subjects') ? 'sidebar-link-active' : ''}`}
            >
              <BookOpen size={20} />
              {!collapsed && <span>Subjects CRUD</span>}
            </Link>
            <Link 
              href="/dashboard/hod/unavailability" 
              className={`sidebar-link ${isActive('/dashboard/hod/unavailability') ? 'sidebar-link-active' : ''}`}
            >
              <CalendarOff size={20} />
              {!collapsed && <span>Unavailability</span>}
            </Link>

            <div className="sidebar-group-title">Planning & Solver</div>
            <Link 
              href="/dashboard/hod/allocations" 
              className={`sidebar-link ${isActive('/dashboard/hod/allocations') ? 'sidebar-link-active' : ''}`}
            >
              <Network size={20} />
              {!collapsed && <span>Faculty Allocations</span>}
            </Link>
            <Link 
              href="/dashboard/hod/generate" 
              className={`sidebar-link ${isActive('/dashboard/hod/generate') ? 'sidebar-link-active' : ''}`}
            >
              <Cpu size={20} />
              {!collapsed && <span>Control Room</span>}
            </Link>
          </>
        );

      case 'FACULTY':
        return (
          <>
            <div className="sidebar-group-title">Portal</div>
            <Link 
              href="/dashboard/faculty" 
              className={`sidebar-link ${isActive('/dashboard/faculty') ? 'sidebar-link-active' : ''}`}
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>My Schedule</span>}
            </Link>
            <Link 
              href="/dashboard/faculty/workload" 
              className={`sidebar-link ${isActive('/dashboard/faculty/workload') ? 'sidebar-link-active' : ''}`}
            >
              <Network size={20} />
              {!collapsed && <span>Workload Analysis</span>}
            </Link>
          </>
        );

      case 'STUDENT':
        return (
          <>
            <div className="sidebar-group-title">Portal</div>
            <Link 
              href="/dashboard/student" 
              className={`sidebar-link ${isActive('/dashboard/student') ? 'sidebar-link-active' : ''}`}
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>Class Timetable</span>}
            </Link>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <Sparkles size={24} style={{ color: 'var(--accent)' }} />
        {!collapsed && <span className="sidebar-logo">BIT Timetable</span>}
      </div>

      <nav className="sidebar-menu">
        {renderLinks()}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout} style={{ width: collapsed ? '40px' : 'auto', padding: collapsed ? '8px' : '8px 12px' }}>
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
