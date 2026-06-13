/* layout.tsx — Dashboard Layout Shell with sidebar, navbar, and route protection */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import './dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Loading Screen
  if (loading) {
    return (
      <div 
        style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '16px' }}></div>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Loading Workspace...</p>
      </div>
    );
  }

  // Double check auth to avoid rendering dashboard content briefly before redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="dashboard-shell">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="main-content">
        <Navbar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />
        <main className="dashboard-page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
