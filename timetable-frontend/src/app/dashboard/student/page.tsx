/* page.tsx — Student schedule portal page */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import timetableService from '@/services/timetableService';
import academicService from '@/services/academicService';
import configService from '@/services/configService';
import { TimetableEntry, GenerationStatus } from '@/types/timetable';
import { SlotTemplate } from '@/types/config';
import { Section } from '@/types/entities';
import { AlertCircle, Clock, MapPin, User, Download, Calendar } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function StudentPortalPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  
  const [generation, setGeneration] = useState<GenerationStatus | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5));
  
  const [loading, setLoading] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sections and slots
  useEffect(() => {
    async function loadSections() {
      if (!deptId) return;
      setLoading(true);
      setError(null);
      try {
        const [sectData, slotsData, scheduleConfigs, generations] = await Promise.all([
          academicService.getSections(deptId),
          configService.getSlots(),
          configService.getScheduleConfigs(),
          timetableService.getGenerations(deptId)
        ]);

        setSections(sectData.filter(s => s.isActive));
        setSlots(slotsData.filter(s => s.isActive && !s.isBreak));

        const daysConfig = scheduleConfigs.find(c => c.configKey === 'ACTIVE_DAYS');
        if (daysConfig && daysConfig.configValue) {
          setActiveDays(daysConfig.configValue.split(',').filter(Boolean));
        }

        // Set default section
        if (sectData.length > 0) {
          setSelectedSectionId(sectData[0].id);
        }

        // Find latest published timetable
        const published = generations.find(g => g.status === 'PUBLISHED');
        if (published) {
          setGeneration(published);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load student portal details.');
      } finally {
        setLoading(false);
      }
    }
    loadSections();
  }, [deptId]);

  // Load timetable entries when section changes
  const loadSectionTimetable = useCallback(async () => {
    if (!selectedSectionId || !generation) {
      setEntries([]);
      return;
    }
    setLoadingGrid(true);
    setError(null);
    try {
      const data = await timetableService.getSectionTimetable(Number(selectedSectionId), generation.id);
      setEntries(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load section schedule.');
    } finally {
      setLoadingGrid(false);
    }
  }, [selectedSectionId, generation]);

  useEffect(() => {
    loadSectionTimetable();
  }, [loadSectionTimetable]);

  const getCellEntry = (day: string, slotId: number) => {
    return entries.find(e => e.dayOfWeek === day && e.slotTemplateId === slotId);
  };

  const handlePrint = () => {
    window.print();
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Class Section Timetable</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Read-only term schedule for your department class sections.
          </p>
        </div>

        {generation && selectedSectionId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="print-btn-hide">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Class Section:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : '')}
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
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Yr {s.academicYear} • Sem {s.semester})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="login-btn"
              style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} />
              <span>Export PDF / Print</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {generation ? (
        selectedSectionId ? (
          <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)', position: 'relative' }}>
            {loadingGrid && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div className="spinner"></div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <Calendar size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Weekly Schedule &mdash; Section {sections.find(s => s.id === selectedSectionId)?.name}
              </h3>
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
                      const entry = getCellEntry(day, slot.id);
                      return (
                        <td key={slot.id} className="timetable-grid-cell">
                          {entry ? (
                            <div 
                              className="timetable-session-card"
                              style={{ borderLeft: '4px solid var(--accent)', padding: '6px' }}
                            >
                              <div className="session-card-header">
                                <span className="session-subject-code" style={{ fontSize: '0.75rem' }}>{entry.subjectCode}</span>
                              </div>
                              <div className="session-subject-name" style={{ fontSize: '0.7rem' }}>{entry.subjectName}</div>
                              <div className="session-details-row" style={{ marginTop: '4px' }}>
                                <span className="session-detail-item" style={{ fontSize: '0.65rem' }}>
                                  <User size={9} /> {entry.facultyName}
                                </span>
                                <span className="session-detail-item" style={{ fontSize: '0.65rem' }}>
                                  <MapPin size={9} /> {entry.roomName}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="timetable-grid-cell-empty">
                              Free
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
            No class sections available.
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '64px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <Clock size={36} style={{ marginBottom: '12px', strokeWidth: 1.5 }} />
          <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>No Published Timetable</p>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>The administration has not published a finalized timetable schedule for this semester yet.</p>
        </div>
      )}
    </div>
  );
}
