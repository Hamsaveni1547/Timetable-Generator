/* TimetableGrid.tsx — Interactive Day/Slot timetable grid with drag-and-drop rescheduling & checks */

'use client';

import React, { useState } from 'react';
import { TimetableEntry, SwapValidationResult } from '@/types/timetable';
import { SlotTemplate } from '@/types/config';
import { Room } from '@/types/entities';
import { AlertTriangle, MapPin, User, Info, Check, X, Move, ChevronRight, HelpCircle } from 'lucide-react';
import '../../app/dashboard/dashboard.css';
import './timetable.css';

interface TimetableGridProps {
  entries: TimetableEntry[];
  slots: SlotTemplate[];
  activeDays: string[];
  rooms: Room[];
  isAdminOrHod: boolean;
  onOverride: (entryId: number, override: { newDay: string; newSlotTemplateId: number; newRoomId: number; reason: string }) => Promise<any>;
  onValidateSwap: (entryId: number, dest: { newDay: string; newSlotTemplateId: number; newRoomId: number }) => Promise<SwapValidationResult>;
}

export default function TimetableGrid({
  entries,
  slots,
  activeDays,
  rooms,
  isAdminOrHod,
  onOverride,
  onValidateSwap
}: TimetableGridProps) {
  // We can filter by Section to show a neat calendar view
  const sections = Array.from(new Set(entries.map(e => e.sectionId)))
    .map(id => {
      const entry = entries.find(e => e.sectionId === id);
      return { id, name: entry?.sectionName || `Section ${id}` };
    });

  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>(
    sections.length > 0 ? sections[0].id : ''
  );

  // States for manual adjustment overlay
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [targetDay, setTargetDay] = useState('');
  const [targetSlotId, setTargetSlotId] = useState<number>(0);
  const [targetRoomId, setTargetRoomId] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for Validation results
  const [validationResult, setValidationResult] = useState<SwapValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Drag-and-drop state tracking
  const [draggedEntryId, setDraggedEntryId] = useState<number | null>(null);

  // All active slots sorted by slot_number — includes breaks for display
  const allDisplaySlots = slots.filter(s => s.isActive).sort((a, b) => a.slotNumber - b.slotNumber);
  // Only schedulable (non-break) slots — used in the override modal dropdowns
  const schedulableSlots = allDisplaySlots.filter(s => !s.isBreak);

  // Filter entries to selected section
  const displayedEntries = selectedSectionId
    ? entries.filter(e => e.sectionId === selectedSectionId)
    : entries;

  // Get entry at cell
  const getCellEntry = (day: string, slotId: number) => {
    return displayedEntries.find(e => e.dayOfWeek === day && e.slotTemplateId === slotId);
  };

  // HTML5 Drag handlers
  const handleDragStart = (e: React.DragEvent, entryId: number) => {
    if (!isAdminOrHod) return;
    setDraggedEntryId(entryId);
    e.dataTransfer.setData('entryId', entryId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdminOrHod) return;
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, day: string, slotId: number) => {
    if (!isAdminOrHod) return;
    e.preventDefault();
    const entryIdStr = e.dataTransfer.getData('entryId') || draggedEntryId?.toString();
    if (!entryIdStr) return;

    const entryId = Number(entryIdStr);
    const entry = entries.find(ent => ent.id === entryId);
    if (!entry) return;

    // Do nothing if dropped on the same cell
    if (entry.dayOfWeek === day && entry.slotTemplateId === slotId) {
      setDraggedEntryId(null);
      return;
    }

    // Open verification overlay for this move
    handleOpenOverrideModal(entry, day, slotId);
    setDraggedEntryId(null);
  };

  // Open overlay for overrides
  const handleOpenOverrideModal = async (entry: TimetableEntry, day?: string, slotId?: number) => {
    setSelectedEntry(entry);
    setOverrideReason('Operational adjustment');
    
    const initialDay = day || entry.dayOfWeek;
    const initialSlotId = slotId || entry.slotTemplateId;
    const initialRoomId = entry.roomId;

    setTargetDay(initialDay);
    setTargetSlotId(initialSlotId);
    setTargetRoomId(initialRoomId);
    
    // Run pre-flight check immediately
    runPreflightCheck(entry.id, initialDay, initialSlotId, initialRoomId);
  };

  // Run pre-flight check API
  const runPreflightCheck = async (entryId: number, day: string, slotId: number, roomId: number) => {
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);
    try {
      const res = await onValidateSwap(entryId, {
        newDay: day,
        newSlotTemplateId: slotId,
        newRoomId: roomId
      });
      setValidationResult(res);
    } catch (err: any) {
      console.error(err);
      setValidationError(err.response?.data?.message || 'Pre-flight check query failed.');
    } finally {
      setIsValidating(false);
    }
  };

  // Trigger check manually when selectors change
  const handleFormSelectorChange = (day: string, slotId: number, roomId: number) => {
    setTargetDay(day);
    setTargetSlotId(slotId);
    setTargetRoomId(roomId);
    if (selectedEntry) {
      runPreflightCheck(selectedEntry.id, day, slotId, roomId);
    }
  };

  // Commit change to DB
  const handleCommitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !overrideReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onOverride(selectedEntry.id, {
        newDay: targetDay,
        newSlotTemplateId: targetSlotId,
        newRoomId: targetRoomId,
        reason: overrideReason
      });
      setSelectedEntry(null);
    } catch (err: any) {
      setValidationError(err.response?.data?.message || 'Failed to apply scheduling override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Top controls: Section filter */}
      <div className="dashboard-card" style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Select Class Section:</span>
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
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            {sections.length === 0 && <option value="">No Scheduled Sections</option>}
          </select>
        </div>

        {isAdminOrHod && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Move size={14} style={{ color: 'var(--accent)' }} />
            <span>Drag cards to another cell to swap times. Double-click card to edit details.</span>
          </div>
        )}
      </div>

      {/* Timetable Grid View */}
      {selectedSectionId ? (
        <div className="dashboard-card" style={{ padding: 'var(--spacing-md)', overflowX: 'auto' }}>
          <table className="timetable-grid-table">
            <thead>
              <tr>
                <th className="timetable-corner">Day</th>
                {allDisplaySlots.map(slot => (
                  <th
                    key={slot.id}
                    className={slot.isBreak ? 'timetable-break-header' : 'timetable-slot-header'}
                    style={slot.isBreak ? { minWidth: '80px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', fontStyle: 'italic' } : {}}
                  >
                    <div>{slot.label}</div>
                    <div style={{ fontSize: '0.65rem', color: slot.isBreak ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 500, opacity: 0.85 }}>
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

                  {allDisplaySlots.map(slot => {
                    // Render break cells spanning every row
                    if (slot.isBreak) {
                      return (
                        <td
                          key={slot.id}
                          style={{
                            backgroundColor: 'rgba(234, 179, 8, 0.08)',
                            borderLeft: '2px dashed rgba(234,179,8,0.4)',
                            borderRight: '2px dashed rgba(234,179,8,0.4)',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            padding: '4px 6px',
                            minWidth: '80px'
                          }}
                        >
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--warning)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {slot.label}
                          </div>
                        </td>
                      );
                    }

                    const cellEntries = displayedEntries.filter(e => e.dayOfWeek === day && e.slotTemplateId === slot.id);

                    return (
                      <td
                        key={slot.id}
                        className="timetable-grid-cell"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, slot.id)}
                        style={{ verticalAlign: 'top', padding: cellEntries.length > 1 ? '4px' : undefined }}
                      >
                        {cellEntries.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {cellEntries.map(entry => (
                              <div
                                key={entry.id}
                                draggable={isAdminOrHod}
                                onDragStart={(e) => handleDragStart(e, entry.id)}
                                onDoubleClick={() => handleOpenOverrideModal(entry)}
                                className="timetable-session-card"
                                style={{
                                  borderLeft: entry.isManuallyOverridden
                                    ? '4px solid var(--warning)'
                                    : entry.subjectType === 'LAB' || entry.subjectCode?.includes('LAB')
                                      ? '4px solid #8b5cf6'
                                      : '4px solid var(--accent)',
                                  cursor: isAdminOrHod ? 'grab' : 'default'
                                }}
                              >
                                <div className="session-card-header">
                                  <span className="session-subject-code">{entry.subjectCode}</span>
                                  {entry.isManuallyOverridden && (
                                    <span
                                      className="override-badge-dot"
                                      title={`Manually Overridden: ${entry.overrideReason || 'N/A'}`}
                                    ></span>
                                  )}
                                </div>
                                <div className="session-subject-name">{entry.subjectName}</div>
                                <div className="session-details-row">
                                  <span className="session-detail-item">
                                    <User size={10} /> {entry.facultyName}
                                  </span>
                                  <span className="session-detail-item">
                                    <MapPin size={10} /> {entry.roomName}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="timetable-grid-cell-empty">
                            {isAdminOrHod ? 'Drop slot' : ''}
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
          Select a class section above to load their timetable schedule.
        </div>
      )}

      {/* Manual Override & Pre-flight Swap Check Modal */}
      {selectedEntry && (
        <div className="drawer-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="drawer-panel" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="login-title-badge" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>Override Controls</span>
                <h3>Swap & Move &mdash; {selectedEntry.subjectCode}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Section: {selectedEntry.sectionName} • Lecturer: {selectedEntry.facultyName}
                </p>
              </div>
              <button className="theme-toggle-btn" onClick={() => setSelectedEntry(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {validationError && (
                <div className="error-banner" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <AlertTriangle size={18} />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleCommitOverride} className="login-form">
                {/* Day selector */}
                <div className="form-group">
                  <label className="form-label">Target Day</label>
                  <select 
                    className="form-input"
                    value={targetDay}
                    onChange={(e) => handleFormSelectorChange(e.target.value, targetSlotId, targetRoomId)}
                    disabled={isSubmitting}
                  >
                    {activeDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                {/* Slot Selector */}
                <div className="form-group">
                  <label className="form-label">Target Period Slot</label>
                  <select 
                    className="form-input"
                    value={targetSlotId}
                    onChange={(e) => handleFormSelectorChange(targetDay, Number(e.target.value), targetRoomId)}
                    disabled={isSubmitting}
                  >
                    {schedulableSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.label} ({slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)})</option>
                    ))}
                  </select>
                </div>

                {/* Room Selector */}
                <div className="form-group">
                  <label className="form-label">Assigned Room</label>
                  <select 
                    className="form-input"
                    value={targetRoomId}
                    onChange={(e) => handleFormSelectorChange(targetDay, targetSlotId, Number(e.target.value))}
                    disabled={isSubmitting}
                  >
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name} (Cap: {room.capacity} - Type: {room.roomType})</option>
                    ))}
                  </select>
                </div>

                {/* Pre-flight Checks Card */}
                <div style={{ margin: 'var(--spacing-md) 0', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} style={{ color: 'var(--accent)' }} /> Hard Constraint Status
                  </h4>
                  
                  {isValidating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                      <span>Verifying scheduling dependencies...</span>
                    </div>
                  ) : validationResult ? (
                    validationResult.valid ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                        <Check size={14} />
                        <span>Move is valid! No hard constraints violated.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                          <AlertTriangle size={14} />
                          <span>Constraint Clashes Detected! ({validationResult.clashes.length})</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {validationResult.clashes.map((clash, idx) => (
                            <li key={idx}>{clash}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checks pending.</span>
                  )}
                </div>

                {/* Reason input */}
                <div className="form-group">
                  <label className="form-label">Override Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter reason for tracking audit logs"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                  <button 
                    type="button" 
                    className="logout-btn" 
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    onClick={() => setSelectedEntry(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="login-btn" 
                    style={{ 
                      height: 'auto', 
                      padding: '10px 20px', 
                      fontSize: '0.875rem',
                      backgroundColor: validationResult?.valid ? 'var(--accent)' : 'var(--danger)',
                      borderColor: validationResult?.valid ? 'var(--accent)' : 'var(--danger)'
                    }}
                    disabled={isSubmitting || !overrideReason.trim() || isValidating}
                  >
                    {isSubmitting ? 'Saving...' : 'Commit Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
