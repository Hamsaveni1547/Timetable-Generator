/* page.tsx — Admin Schedule configuration page (working days and calendar dates) */

'use client';

import React from 'react';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import WorkingDaysSelector from '@/components/config/WorkingDaysSelector';
import { AlertCircle } from 'lucide-react';

export default function AdminSchedulePage() {
  const { scheduleConfigs, loading, error, saveScheduleConfig } = useDynamicConfig();

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Working Calendar</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Manage school calendar limits, semester labels, and active days of the week.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <WorkingDaysSelector 
        configs={scheduleConfigs} 
        onUpdate={saveScheduleConfig} 
      />
    </div>
  );
}
