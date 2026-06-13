/* page.tsx — HOD Timetable review and rescheduling grid page */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import timetableService from '@/services/timetableService';
import configService from '@/services/configService';
import academicService from '@/services/academicService';
import { TimetableEntry, GenerationStatus, SwapValidationResult } from '@/types/timetable';
import { SlotTemplate } from '@/types/config';
import { Room } from '@/types/entities';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import { AlertCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';
import '@/app/dashboard/admin/admin.css';
import '@/components/timetable/timetable.css';

export default function HodTimetableReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const genId = Number(params.id);

  const [generation, setGeneration] = useState<GenerationStatus | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const loadAllData = useCallback(async () => {
    if (isNaN(genId)) {
      setError('Invalid generation ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [genData, entriesData, slotsData, roomsData, scheduleConfigs] = await Promise.all([
        timetableService.getGeneration(genId),
        timetableService.getEntries(genId),
        configService.getSlots(),
        academicService.getRooms(),
        configService.getScheduleConfigs()
      ]);

      setGeneration(genData);
      setEntries(entriesData);
      setSlots(slotsData);
      setRooms(roomsData.filter(r => r.isActive));

      const daysConfig = scheduleConfigs.find(c => c.configKey === 'ACTIVE_DAYS');
      if (daysConfig && daysConfig.configValue) {
        setActiveDays(daysConfig.configValue.split(',').filter(Boolean));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve timetable details.');
    } finally {
      setLoading(false);
    }
  }, [genId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handlePublish = async () => {
    if (!generation || !window.confirm('Confirm publication? This locks manual overrides and exposes the timetable to all students and faculty.')) return;

    setPublishing(true);
    setError(null);
    setActionSuccess(null);
    try {
      const updated = await timetableService.publish(generation.id);
      setGeneration(updated);
      setActionSuccess('This timetable draft has been successfully published!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish draft.');
    } finally {
      setPublishing(false);
    }
  };

  const handleOverride = async (entryId: number, override: { newDay: string; newSlotTemplateId: number; newRoomId: number; reason: string }) => {
    try {
      await timetableService.commitOverride(entryId, {
        newDay: override.newDay,
        newSlotTemplateId: override.newSlotTemplateId,
        newRoomId: override.newRoomId,
        reason: override.reason
      });
      
      setActionSuccess('Timetable override saved.');
      // Refresh entries
      const updatedEntries = await timetableService.getEntries(genId);
      setEntries(updatedEntries);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to apply schedule override.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleValidateSwap = async (entryId: number, dest: { newDay: string; newSlotTemplateId: number; newRoomId: number }) => {
    return await timetableService.validateSwap(entryId, genId, dest);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const isDraft = generation?.status === 'DRAFT';
  const isAdminOrHod = (user?.role === 'ADMIN' || user?.role === 'HOD') && isDraft;
  const breakSlots = slots.filter(slot => slot.isBreak);

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="theme-toggle-btn" 
            style={{ padding: '8px' }}
            onClick={() => router.push('/dashboard/hod/generate')}
            title="Back to Control Room"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
              Timetable Details &mdash; Run #{genId}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Semester {generation?.semester} (Year {generation?.academicYear}) &bull; Status:{' '}
              <span style={{ 
                fontWeight: 700, 
                color: generation?.status === 'PUBLISHED' ? 'var(--success)' : 'var(--accent)'
              }}>
                {generation?.status}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="theme-toggle-btn"
            style={{ padding: '8px' }}
            onClick={loadAllData}
            title="Reload timetable"
          >
            <RefreshCw size={18} />
          </button>
          
          {isDraft && (
            <button
              onClick={handlePublish}
              className="login-btn"
              style={{ height: '38px', padding: '0 18px', fontSize: '0.85rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={publishing}
            >
              {publishing ? <div className="spinner" style={{ width: '12px', height: '12px', borderColor: 'white', borderTopColor: 'transparent' }}></div> : <Check size={16} />}
              <span>Publish Timetable</span>
            </button>
          )}
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

      {breakSlots.length > 0 && (
        <div className="dashboard-card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700 }}>Break Periods</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {breakSlots.map(slot => (
                <span key={slot.id} className="profile-role-badge" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                  {slot.label} {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Component */}
      <TimetableGrid 
        entries={entries}
        slots={slots}
        activeDays={activeDays}
        rooms={rooms}
        isAdminOrHod={isAdminOrHod}
        onOverride={handleOverride}
        onValidateSwap={handleValidateSwap}
      />
    </div>
  );
}
