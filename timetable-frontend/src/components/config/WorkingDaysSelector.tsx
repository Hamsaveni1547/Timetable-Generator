/* WorkingDaysSelector.tsx — UI Component for managing semester metadata and active teaching days */

'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleConfig } from '@/types/config';
import { Calendar, Save, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import '../../app/dashboard/dashboard.css';

interface WorkingDaysSelectorProps {
  configs: ScheduleConfig[];
  onUpdate: (key: string, value: string) => Promise<any>;
}

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' }
];

export default function WorkingDaysSelector({ configs, onUpdate }: WorkingDaysSelectorProps) {
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [semesterLabel, setSemesterLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  // Initialize form fields from configs
  useEffect(() => {
    const daysConfig = configs.find(c => c.configKey === 'ACTIVE_DAYS');
    if (daysConfig && daysConfig.configValue) {
      setActiveDays(daysConfig.configValue.split(',').filter(Boolean));
    }

    const semConfig = configs.find(c => c.configKey === 'SEMESTER_LABEL');
    if (semConfig) setSemesterLabel(semConfig.configValue || '');

    const startConfig = configs.find(c => c.configKey === 'ACADEMIC_YEAR_START');
    if (startConfig) setStartDate(startConfig.configValue || '');

    const endConfig = configs.find(c => c.configKey === 'ACADEMIC_YEAR_END');
    if (endConfig) setEndDate(endConfig.configValue || '');
  }, [configs]);

  const handleDayToggle = (dayKey: string) => {
    setActiveDays(prev => 
      prev.includes(dayKey)
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  const handleSaveDays = async () => {
    const key = 'ACTIVE_DAYS';
    setActionError(null);
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    try {
      const val = activeDays.join(',');
      await onUpdate(key, val);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update active working days.');
    } finally {
      setSavingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveField = async (key: string, value: string) => {
    setActionError(null);
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    try {
      await onUpdate(key, value);
    } catch (err: any) {
      setActionError(err.message || `Failed to update ${key}.`);
    } finally {
      setSavingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const isDaysDirty = () => {
    const original = configs.find(c => c.configKey === 'ACTIVE_DAYS')?.configValue || '';
    const originalList = original.split(',').filter(Boolean);
    if (originalList.length !== activeDays.length) return true;
    return !activeDays.every(d => originalList.includes(d));
  };

  const isFieldDirty = (key: string, currentValue: string) => {
    const original = configs.find(c => c.configKey === key)?.configValue || '';
    return original !== currentValue;
  };

  return (
    <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
        <Calendar size={22} style={{ color: 'var(--accent)' }} /> Working Calendar & Semester Settings
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
        Configure the academic term duration, labels, and days of the week when classes should be scheduled.
      </p>

      {actionError && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-md)' }}>
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Active Days multi-selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', borderRight: '1px solid var(--border)', paddingRight: 'var(--spacing-xl)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Active Working Days</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
            Check the days that are active for scheduling.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {WEEKDAYS.map(day => {
              const isActive = activeDays.includes(day.key);
              return (
                <div 
                  key={day.key}
                  onClick={() => handleDayToggle(day.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all var(--transition-fast)'
                  }}>
                    {isActive && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '0.9rem', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            {isDaysDirty() && (
              <button 
                className="login-btn" 
                style={{ height: 'auto', padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleSaveDays}
                disabled={savingKeys['ACTIVE_DAYS']}
              >
                {savingKeys['ACTIVE_DAYS'] ? <RefreshCw className="spin" size={14} /> : <Save size={14} />} Save Active Days
              </button>
            )}
          </div>
        </div>

        {/* Text Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Semester Label */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="semester-label">Semester Label</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="semester-label"
                type="text"
                className="form-input"
                placeholder="e.g. Autumn Semester 2026"
                value={semesterLabel}
                onChange={(e) => setSemesterLabel(e.target.value)}
                disabled={savingKeys['SEMESTER_LABEL']}
                style={{ flex: 1 }}
              />
              {isFieldDirty('SEMESTER_LABEL', semesterLabel) && (
                <button 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '0 16px', fontSize: '0.85rem' }}
                  onClick={() => handleSaveField('SEMESTER_LABEL', semesterLabel)}
                  disabled={savingKeys['SEMESTER_LABEL']}
                >
                  {savingKeys['SEMESTER_LABEL'] ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Academic Start Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="start-date">Academic Year Start</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="start-date"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={savingKeys['ACADEMIC_YEAR_START']}
                style={{ flex: 1 }}
              />
              {isFieldDirty('ACADEMIC_YEAR_START', startDate) && (
                <button 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '0 16px', fontSize: '0.85rem' }}
                  onClick={() => handleSaveField('ACADEMIC_YEAR_START', startDate)}
                  disabled={savingKeys['ACADEMIC_YEAR_START']}
                >
                  {savingKeys['ACADEMIC_YEAR_START'] ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Academic End Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="end-date">Academic Year End</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="end-date"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={savingKeys['ACADEMIC_YEAR_END']}
                style={{ flex: 1 }}
              />
              {isFieldDirty('ACADEMIC_YEAR_END', endDate) && (
                <button 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '0 16px', fontSize: '0.85rem' }}
                  onClick={() => handleSaveField('ACADEMIC_YEAR_END', endDate)}
                  disabled={savingKeys['ACADEMIC_YEAR_END']}
                >
                  {savingKeys['ACADEMIC_YEAR_END'] ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
