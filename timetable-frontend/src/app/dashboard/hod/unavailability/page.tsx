/* page.tsx — HOD Unavailability Management Dashboard */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import timetableService, { UnavailabilityRequest } from '@/services/timetableService';
import academicService from '@/services/academicService';
import configService from '@/services/configService';
import { FacultyUnavailability, SlotTemplate } from '@/types/config';
import { Faculty as FacultyType } from '@/types/entities';
import { AlertCircle, CalendarOff, Check, Plus, Trash2, X, RefreshCw, AlertTriangle } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function HodUnavailabilityPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId || undefined;

  const [facultyList, setFacultyList] = useState<FacultyType[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  
  const [unavailabilities, setUnavailabilities] = useState<FacultyUnavailability[]>([]);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5));
  
  const [loading, setLoading] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // States for adding unavailability modal
  const [selectedCell, setSelectedCell] = useState<{ day: string; slot: SlotTemplate } | null>(null);
  const [reason, setReason] = useState('Personal Block');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load basic page configurations
  useEffect(() => {
    async function loadInitial() {
      if (!deptId) return;
      setLoading(true);
      setError(null);
      try {
        const [facData, slotsData, scheduleConfigs] = await Promise.all([
          academicService.getFaculty(deptId),
          configService.getSlots(),
          configService.getScheduleConfigs()
        ]);
        
        setFacultyList(facData.filter(f => f.isActive));
        setSlots(slotsData.filter(s => s.isActive && !s.isBreak));

        const daysConfig = scheduleConfigs.find(c => c.configKey === 'ACTIVE_DAYS');
        if (daysConfig && daysConfig.configValue) {
          setActiveDays(daysConfig.configValue.split(',').filter(Boolean));
        }

        if (facData.length > 0) {
          setSelectedFacultyId(facData[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load initial page details.');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [deptId]);

  // Load unavailabilities for selected teacher
  const loadFacultyUnavailability = useCallback(async () => {
    if (!selectedFacultyId) {
      setUnavailabilities([]);
      return;
    }
    setLoadingGrid(true);
    setError(null);
    try {
      const data = await timetableService.getFacultyUnavailability(Number(selectedFacultyId));
      setUnavailabilities(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve unavailability entries.');
    } finally {
      setLoadingGrid(false);
    }
  }, [selectedFacultyId]);

  useEffect(() => {
    loadFacultyUnavailability();
  }, [loadFacultyUnavailability]);

  // Get block at cell
  const getCellBlock = (day: string, slotId: number) => {
    return unavailabilities.find(u => u.dayOfWeek === day && u.slotTemplateId === slotId);
  };

  const handleCellClick = (day: string, slot: SlotTemplate) => {
    if (!selectedFacultyId) return;
    setActionSuccess(null);
    setError(null);

    const block = getCellBlock(day, slot.id);
    if (block) {
      // Prompt to delete block
      if (window.confirm(`Remove unavailability block for this slot?`)) {
        handleRemoveBlock(block.id);
      }
    } else {
      // Open add block modal
      setReason('Research / Lab schedule');
      setSelectedCell({ day, slot });
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedCell) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().substring(0, 10);
      await timetableService.addFacultyUnavailability(Number(selectedFacultyId), {
        dayOfWeek: selectedCell.day,
        slotTemplateId: selectedCell.slot.id,
        reason,
        effectiveFrom: todayStr
      });

      setActionSuccess('Blocked slot successfully added.');
      setSelectedCell(null);
      await loadFacultyUnavailability();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to block slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBlock = async (id: number) => {
    setError(null);
    try {
      await timetableService.deleteFacultyUnavailability(id);
      setActionSuccess('Unavailability block removed.');
      await loadFacultyUnavailability();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove block.');
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
      {/* Header and selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Faculty Unavailability</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Block out specific times when faculty members are busy with research, labs, or personal leave.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Faculty Member:</span>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Faculty --</option>
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Lecturer'})</option>
              ))}
            </select>
          </div>

          <button 
            className="theme-toggle-btn"
            style={{ padding: '8px' }}
            onClick={loadFacultyUnavailability}
            disabled={!selectedFacultyId || loadingGrid}
            title="Refresh availability"
          >
            <RefreshCw size={16} className={loadingGrid ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="error-banner" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: 'var(--spacing-lg)' }}>
          <Check size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {selectedFacultyId ? (
        <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)', position: 'relative' }}>
          {loadingGrid && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <div className="spinner"></div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOff size={20} style={{ color: 'var(--danger)' }} /> Weekly Availability Grid
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-primary)' }}></span> Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)' }}></span> Blocked / Busy
              </span>
            </div>
          </div>

          <table className="timetable-grid-table">
            <thead>
              <tr>
                <th className="timetable-corner">Day</th>
                {slots.map(slot => (
                  <th key={slot.id} className="timetable-slot-header">
                    <div>{slot.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDays.map(day => (
                <tr key={day}>
                  <td className="timetable-day-cell">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </td>
                  
                  {slots.map(slot => {
                    const block = getCellBlock(day, slot.id);
                    return (
                      <td
                        key={slot.id}
                        className="timetable-grid-cell"
                        style={{
                          backgroundColor: block ? 'var(--danger-light)' : 'var(--bg-primary)',
                          border: block ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                        onClick={() => handleCellClick(day, slot)}
                      >
                        {block ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>BLOCKED</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={block.reason}>
                              {block.reason || 'No reason'}
                            </span>
                          </div>
                        ) : (
                          <div className="timetable-grid-cell-empty" style={{ height: '100%' }}>
                            Block
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          Please select a faculty member above to load their unavailability schedule.
        </div>
      )}

      {/* Add Block Modal */}
      {selectedCell && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '400px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>Block Period</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Register Unavailability</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Day: {selectedCell.day} &bull; Time: {selectedCell.slot.label} ({selectedCell.slot.startTime.substring(0, 5)} - {selectedCell.slot.endTime.substring(0, 5)})
              </p>
            </div>

            <form onSubmit={handleAddBlock} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="block-reason">Reason / Notes</label>
                <input
                  id="block-reason"
                  type="text"
                  className="form-input"
                  placeholder="e.g. LAB Duties, Research Day, Leave"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button" 
                  className="logout-btn" 
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onClick={() => setSelectedCell(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '10px 20px', fontSize: '0.875rem', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                  disabled={isSubmitting || !reason.trim()}
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
