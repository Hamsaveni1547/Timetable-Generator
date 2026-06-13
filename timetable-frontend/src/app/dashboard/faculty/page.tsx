/* page.tsx — Faculty schedule portal page */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import timetableService from '@/services/timetableService';
import academicService from '@/services/academicService';
import configService from '@/services/configService';
import { TimetableEntry, GenerationStatus } from '@/types/timetable';
import { SlotTemplate } from '@/types/config';
import { Faculty } from '@/types/entities';
import { AlertCircle, Clock, MapPin, CheckCircle, Award, Calendar } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function FacultyPortalPage() {
  const { user } = useAuth();
  const deptId = user?.departmentId;

  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [generation, setGeneration] = useState<GenerationStatus | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5));
  const [actualHours, setActualHours] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFacultySchedule() {
      if (!deptId || !user) return;
      setLoading(true);
      setError(null);
      try {
        // 1. Load faculty members to find the corresponding faculty record
        const [facList, slotsData, scheduleConfigs, generations] = await Promise.all([
          academicService.getFaculty(deptId),
          configService.getSlots(),
          configService.getScheduleConfigs(),
          timetableService.getGenerations(deptId)
        ]);

        const currentFaculty = facList.find(f => f.userId === user.userId);
        if (!currentFaculty) {
          setError('Could not locate a faculty account matching your login credentials. Contact your HOD.');
          setLoading(false);
          return;
        }
        setFaculty(currentFaculty);
        setSlots(slotsData.filter(s => s.isActive && !s.isBreak));

        const daysConfig = scheduleConfigs.find(c => c.configKey === 'ACTIVE_DAYS');
        if (daysConfig && daysConfig.configValue) {
          setActiveDays(daysConfig.configValue.split(',').filter(Boolean));
        }

        // 2. Find latest published timetable
        const published = generations.find(g => g.status === 'PUBLISHED');
        if (published) {
          setGeneration(published);
          
          // 3. Load personal entries
          const personalEntries = await timetableService.getFacultyTimetable(currentFaculty.id, published.id);
          setEntries(personalEntries);

          // 4. Load actual assigned hours
          const hours = await timetableService.getFacultyActualWorkload(currentFaculty.id, published.id);
          setActualHours(hours);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load faculty schedule.');
      } finally {
        setLoading(false);
      }
    }
    loadFacultySchedule();
  }, [deptId, user]);

  const getCellEntry = (day: string, slotId: number) => {
    return entries.find(e => e.dayOfWeek === day && e.slotTemplateId === slotId);
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
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Personal Teaching Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          View your assigned classes, sections, and classroom allocations in the active timetable.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {generation ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
          {/* Schedule Grid */}
          <div className="dashboard-card" style={{ padding: 'var(--spacing-md)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <Calendar size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Weekly Classes</h3>
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
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                                Class: {entry.sectionName}
                              </div>
                              <div className="session-details-row">
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

          {/* Workload Status Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Workload Summary */}
            <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} style={{ color: 'var(--accent)' }} /> Workload Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>Allocated Syllabus Hours</span>
                    <span>{faculty?.allocatedHoursPerWeek || 0} hrs/wk</span>
                  </div>
                  <div className="workload-progress-bg">
                    <div 
                      className="workload-progress-fill" 
                      style={{ 
                        width: `${Math.min(((faculty?.allocatedHoursPerWeek || 0) / (faculty?.maxHoursPerWeek || 1)) * 100, 100)}%`,
                        backgroundColor: 'var(--accent)'
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>Actual Assigned Classes</span>
                    <span>{actualHours} hrs/wk</span>
                  </div>
                  <div className="workload-progress-bg">
                    <div 
                      className="workload-progress-fill" 
                      style={{ 
                        width: `${Math.min((actualHours / (faculty?.maxHoursPerWeek || 1)) * 100, 100)}%`,
                        backgroundColor: 'var(--success)'
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Maximum weekly allowance: {faculty?.maxHoursPerWeek || 0} hours.
                  </span>
                </div>
              </div>
            </div>

            {/* Timetable specs */}
            <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)', fontSize: '0.85rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Active Schedule Specs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>Term: {generation.departmentName}</div>
                <div>Semester: Semester {generation.semester}</div>
                <div>Published: {new Date(generation.publishedAt || '').toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <Clock size={36} style={{ marginBottom: '12px', strokeWidth: 1.5 }} />
          <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>No Published Timetable</p>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Your HOD has not published a finalized timetable schedule for this semester yet.</p>
        </div>
      )}
    </div>
  );
}
