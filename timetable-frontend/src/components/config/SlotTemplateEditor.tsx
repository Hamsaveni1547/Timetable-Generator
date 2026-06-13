/* SlotTemplateEditor.tsx — UI Component for managing time slots (periods & breaks) */

'use client';

import React, { useState } from 'react';
import { SlotTemplate } from '@/types/config';
import { Plus, Edit2, Trash2, Save, X, Clock, HelpCircle, Check, AlertCircle } from 'lucide-react';
import '../../app/dashboard/dashboard.css';

interface SlotTemplateEditorProps {
  slots: SlotTemplate[];
  onAdd: (slot: Omit<SlotTemplate, 'id'>) => Promise<any>;
  onEdit: (id: number, slot: SlotTemplate) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function SlotTemplateEditor({ slots, onAdd, onEdit, onDelete }: SlotTemplateEditorProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new/edit slot
  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS_OF_WEEK.slice(0, 5)); // Default Mon-Fri
  const [isActive, setIsActive] = useState(true);

  // Open modal for adding
  const handleOpenAdd = () => {
    setActionError(null);
    const nextNum = slots.length > 0 ? Math.max(...slots.map(s => s.slotNumber)) + 1 : 1;
    setSlotNumber(nextNum);
    setLabel(`Period ${nextNum}`);
    setStartTime('09:00');
    setEndTime('09:50');
    setIsBreak(false);
    setSelectedDays(DAYS_OF_WEEK.slice(0, 5));
    setIsActive(true);
    setShowAddModal(true);
  };

  // Start editing a row inline
  const handleStartEdit = (slot: SlotTemplate) => {
    setActionError(null);
    setEditingId(slot.id);
    setSlotNumber(slot.slotNumber);
    setLabel(slot.label);
    setStartTime(slot.startTime.substring(0, 5)); // Keep HH:MM
    setEndTime(slot.endTime.substring(0, 5));
    setIsBreak(slot.isBreak);
    setSelectedDays(slot.appliesToDays ? slot.appliesToDays.split(',') : []);
    setIsActive(slot.isActive);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const validateTimes = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;
    return (startH * 60 + startM) < (endH * 60 + endM);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!label.trim()) {
      setActionError('Label is required.');
      return;
    }
    if (!validateTimes(startTime, endTime)) {
      setActionError('Start time must be before end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        slotNumber,
        label,
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        isBreak,
        appliesToDays: selectedDays.join(','),
        isActive
      });
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save slot template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    setActionError(null);
    if (!label.trim()) {
      setActionError('Label is required.');
      return;
    }
    if (!validateTimes(startTime, endTime)) {
      setActionError('Start time must be before end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(id, {
        id,
        slotNumber,
        label,
        startTime: startTime.includes(':') && startTime.split(':').length === 2 ? startTime + ':00' : startTime,
        endTime: endTime.includes(':') && endTime.split(':').length === 2 ? endTime + ':00' : endTime,
        isBreak,
        appliesToDays: selectedDays.join(','),
        isActive
      });
      setEditingId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this slot template?')) return;
    setActionError(null);
    try {
      await onDelete(id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate slot.');
    }
  };

  // Timeline Preview helpers
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getTimelineSlots = () => {
    // Return all active templates sorted by time
    return [...slots]
      .filter(s => s.isActive)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  const activeTimelineSlots = getTimelineSlots();
  const minTime = activeTimelineSlots.length > 0 ? Math.min(...activeTimelineSlots.map(s => timeToMinutes(s.startTime))) - 30 : 480; // Default 8:00 AM
  const maxTime = activeTimelineSlots.length > 0 ? Math.max(...activeTimelineSlots.map(s => timeToMinutes(s.endTime))) + 30 : 1080; // Default 6:00 PM
  const totalMinutes = maxTime - minTime;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--spacing-lg)' }}>
      {/* Table Section */}
      <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} style={{ color: 'var(--accent)' }} /> Time Slot Grid
          </h2>
          <button className="login-btn" style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} onClick={handleOpenAdd}>
            <Plus size={16} /> Add Slot
          </button>
        </div>

        {actionError && !showAddModal && (
          <div className="error-banner" style={{ marginBottom: 'var(--spacing-md)' }}>
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px 8px', width: '70px' }}>Slot #</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Label</th>
                <th style={{ padding: '12px 8px', width: '110px' }}>Start Time</th>
                <th style={{ padding: '12px 8px', width: '110px' }}>End Time</th>
                <th style={{ padding: '12px 8px', width: '90px' }}>Type</th>
                <th style={{ padding: '12px 8px' }}>Applies To Days</th>
                <th style={{ padding: '12px 8px', width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => {
                const isEditing = editingId === slot.id;
                return (
                  <tr 
                    key={slot.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)',
                      opacity: slot.isActive ? 1 : 0.5,
                      textDecoration: slot.isActive ? 'none' : 'line-through',
                      backgroundColor: slot.isBreak ? 'rgba(234, 179, 8, 0.03)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={slotNumber}
                          onChange={(e) => setSlotNumber(Number(e.target.value))}
                          style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        slot.slotNumber
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          style={{ width: '120px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{slot.label}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        slot.startTime.substring(0, 5)
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        slot.endTime.substring(0, 5)
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <select 
                          value={isBreak ? 'break' : 'class'} 
                          onChange={(e) => setIsBreak(e.target.value === 'break')}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        >
                          <option value="class">Class</option>
                          <option value="break">Break</option>
                        </select>
                      ) : (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          backgroundColor: slot.isBreak ? 'var(--warning-light)' : 'var(--accent-light)',
                          color: slot.isBreak ? 'var(--warning)' : 'var(--accent)'
                        }}>
                          {slot.isBreak ? 'BREAK' : 'CLASS'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDayToggle(day)}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                backgroundColor: selectedDays.includes(day) ? 'var(--accent)' : 'var(--bg-secondary)',
                                color: selectedDays.includes(day) ? 'white' : 'var(--text-secondary)'
                              }}
                            >
                              {day.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {slot.appliesToDays ? slot.appliesToDays.split(',').map(d => d.substring(0, 3)).join(', ') : 'None'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button 
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleSaveEdit(slot.id)}
                              disabled={isSubmitting}
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              className="theme-toggle-btn"
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="theme-toggle-btn"
                              onClick={() => handleStartEdit(slot)}
                              title="Edit slot"
                              disabled={!slot.isActive}
                            >
                              <Edit2 size={14} />
                            </button>
                            {slot.isActive ? (
                              <button 
                                className="theme-toggle-btn"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDeleteSlot(slot.id)}
                                title="Deactivate slot"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button 
                                className="theme-toggle-btn"
                                style={{ color: 'var(--success)' }}
                                onClick={() => {
                                  onEdit(slot.id, { ...slot, isActive: true });
                                }}
                                title="Reactivate slot"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No slots templates configured yet. Click "Add Slot" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Preview Section */}
      <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'var(--accent)' }} /> Timeline Preview
        </h3>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
          Visual representation of the daily scheduling periods. Breaks are colored orange, classes purple.
        </p>

        {activeTimelineSlots.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', paddingLeft: '50px', borderLeft: '2px solid var(--border)' }}>
            {activeTimelineSlots.map(slot => {
              const startMin = timeToMinutes(slot.startTime);
              const endMin = timeToMinutes(slot.endTime);
              const duration = endMin - startMin;
              
              return (
                <div 
                  key={slot.id} 
                  style={{
                    position: 'relative',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: slot.isBreak ? 'var(--warning)' : 'var(--accent)',
                    backgroundColor: slot.isBreak ? 'var(--warning-light)' : 'var(--accent-light)',
                    color: slot.isBreak ? 'var(--warning)' : 'var(--accent)',
                    boxShadow: 'var(--glass-shadow)',
                  }}
                >
                  {/* Time label on the left */}
                  <div style={{
                    position: 'absolute',
                    left: '-52px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    textAlign: 'right',
                    width: '38px',
                    lineHeight: 1.2
                  }}>
                    <div>{slot.startTime.substring(0, 5)}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{slot.endTime.substring(0, 5)}</div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{slot.label}</div>
                  <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', opacity: 0.85, marginTop: '2px' }}>
                    <span>{duration} min</span>
                    <span>
                      {slot.appliesToDays 
                        ? slot.appliesToDays.split(',').length === 6 
                          ? 'Mon-Sat' 
                          : slot.appliesToDays.split(',').length === 5 && !slot.appliesToDays.includes('SATURDAY')
                            ? 'Mon-Fri'
                            : `${slot.appliesToDays.split(',').length} days`
                        : 'No days'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No active periods to preview.
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '450px', transform: 'none', margin: 0, boxShadow: 'var(--glass-shadow)' }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">Period Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add Slot Template</h2>
            </div>

            {actionError && (
              <div className="error-banner" style={{ marginBottom: 'var(--spacing-md)' }}>
                <AlertCircle size={18} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-slot-number">Slot Number</label>
                  <input
                    id="new-slot-number"
                    type="number"
                    className="form-input"
                    value={slotNumber}
                    onChange={(e) => setSlotNumber(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-label">Label</label>
                  <input
                    id="new-label"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Period 1, Lunch Break"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-start-time">Start Time</label>
                  <input
                    id="new-start-time"
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-end-time">End Time</label>
                  <input
                    id="new-end-time"
                    type="time"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Slot Type</label>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input 
                      type="radio" 
                      name="isBreak" 
                      checked={!isBreak} 
                      onChange={() => setIsBreak(false)} 
                      disabled={isSubmitting} 
                    />
                    Class Session
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input 
                      type="radio" 
                      name="isBreak" 
                      checked={isBreak} 
                      onChange={() => setIsBreak(true)} 
                      disabled={isSubmitting} 
                    />
                    Break Period
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Applies To Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        backgroundColor: selectedDays.includes(day) ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: selectedDays.includes(day) ? 'white' : 'var(--text-secondary)',
                        transition: 'all var(--transition-fast)'
                      }}
                      disabled={isSubmitting}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button" 
                  className="logout-btn" 
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
