/* Navbar.tsx — Dashboard Top Navbar with role badges, theme toggles, and user info */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, Menu, LogOut, ChevronRight } from 'lucide-react';
import '../app/dashboard/dashboard.css';

interface NavbarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function Navbar({ sidebarCollapsed, setSidebarCollapsed }: NavbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Helper to map pathname to friendly page titles
  const getPageTitle = () => {
    if (pathname.includes('/dashboard/admin/config/slots')) return 'Slot Templates';
    if (pathname.includes('/dashboard/admin/config/constraints')) return 'Constraint Weights';
    if (pathname.includes('/dashboard/admin/config/schedule')) return 'Working Calendar';
    if (pathname.includes('/dashboard/admin/departments')) return 'Departments';
    if (pathname.includes('/dashboard/admin/rooms')) return 'Rooms Management';
    if (pathname.includes('/dashboard/admin/faculty')) return 'Faculty Accounts';
    if (pathname.includes('/dashboard/admin/timetable')) return 'Rescheduling Grid';
    if (pathname.includes('/dashboard/admin')) return 'Admin Overview';
    
    if (pathname.includes('/dashboard/hod/sections')) return 'Student Sections';
    if (pathname.includes('/dashboard/hod/subjects')) return 'Subjects Management';
    if (pathname.includes('/dashboard/hod/unavailability')) return 'Faculty Unavailability';
    if (pathname.includes('/dashboard/hod/allocations')) return 'Faculty Allocations';
    if (pathname.includes('/dashboard/hod/generate')) return 'Control Room';
    if (pathname.includes('/dashboard/hod/timetable')) return 'Interactive Timetable';
    if (pathname.includes('/dashboard/hod')) return 'Department Panel';
    
    if (pathname.includes('/dashboard/faculty/workload')) return 'Workload Analysis';
    if (pathname.includes('/dashboard/faculty')) return 'My Schedule';
    
    if (pathname.includes('/dashboard/student')) return 'Class Timetable';
    
    return 'Dashboard';
  };

  if (!user) return null;

  // Get initials for Avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <button 
          className="theme-toggle-btn" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <span className="navbar-title">{getPageTitle()}</span>

        </div>
      </div>

      <div className="navbar-actions">
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="profile-container">
          <div className="avatar" title={user.fullName}>
            {getInitials(user.fullName)}
          </div>
          <div className="profile-info">
            <span className="profile-name">{user.fullName}</span>
            <span className="profile-role-badge">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
