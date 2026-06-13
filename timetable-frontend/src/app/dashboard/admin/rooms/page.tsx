/* page.tsx — Admin Rooms management page */

'use client';

import React, { useState, useEffect } from 'react';
import academicService from '@/services/academicService';
import { Room } from '@/types/entities';
import { Plus, Edit2, Trash2, Save, X, DoorOpen, AlertCircle, Check } from 'lucide-react';
import '../../admin/admin.css';
import '@/components/timetable/timetable.css';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Add state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('');
  const [customRoomType, setCustomRoomType] = useState('');
  const [capacity, setCapacity] = useState<number>(60);
  const [building, setBuilding] = useState('');
  const [floorNumber, setFloorNumber] = useState<number | ''>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [roomsData, typesData] = await Promise.all([
        academicService.getRooms(),
        academicService.getRoomTypes()
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve classrooms details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setRoomType(roomTypes.length > 0 ? roomTypes[0] : 'THEORY');
    setCustomRoomType('');
    setCapacity(60);
    setBuilding('Main Block');
    setFloorNumber('');
    setError(null);
    setSuccess(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (room: Room) => {
    setEditingId(room.id);
    setName(room.name);
    setRoomType(room.roomType);
    setCustomRoomType('');
    setCapacity(room.capacity);
    setBuilding(room.building || '');
    setFloorNumber(room.floorNumber !== undefined ? room.floorNumber : '');
    setError(null);
    setSuccess(null);
  };

  const getFinalRoomType = () => {
    if (roomType === 'NEW_TYPE' && customRoomType.trim()) {
      return customRoomType.trim().toUpperCase();
    }
    return roomType;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = getFinalRoomType();
    if (!name.trim() || !finalType) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const added = await academicService.createRoom({
        name,
        roomType: finalType,
        capacity,
        building: building.trim() || undefined,
        floorNumber: floorNumber !== '' ? Number(floorNumber) : undefined,
        isActive: true
      });
      
      setSuccess('Classroom registered.');
      setShowAddForm(false);
      await loadAllData(); // Reload to refresh distinct types list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const finalType = getFinalRoomType();
    if (!name.trim() || !finalType) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const original = rooms.find(r => r.id === id)!;
      const updated = await academicService.updateRoom(id, {
        ...original,
        name,
        roomType: finalType,
        capacity,
        building: building.trim() || undefined,
        floorNumber: floorNumber !== '' ? Number(floorNumber) : undefined
      });
      
      setSuccess('Classroom configuration updated.');
      setEditingId(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update classroom.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    setError(null);
    try {
      await academicService.deleteRoom(id);
      setSuccess('Classroom record deleted.');
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete room.');
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Classrooms & Labs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Configure institute layouts, block buildings, capacities, and scheduling room types.
          </p>
        </div>

        <button 
          className="login-btn" 
          style={{ padding: '8px 16px', fontSize: '0.875rem', height: 'auto' }} 
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Classroom
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="error-banner" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: 'var(--spacing-lg)' }}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="dashboard-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
          <DoorOpen size={22} style={{ color: 'var(--accent)' }} /> Institutional Classrooms
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', width: '150px' }}>Name / Room #</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Room Type</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Capacity</th>
                <th style={{ padding: '12px 8px', width: '180px' }}>Building Block</th>
                <th style={{ padding: '12px 8px', width: '100px' }}>Floor</th>
                <th style={{ padding: '12px 8px', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const isEditing = editingId === room.id;
                return (
                  <tr key={room.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '120px' }}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      ) : (
                        room.name
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            className="form-input"
                            style={{ padding: '4px 8px', width: '120px' }}
                            value={roomType}
                            onChange={(e) => setRoomType(e.target.value)}
                          >
                            {roomTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                            <option value="NEW_TYPE">+ New Custom Type</option>
                          </select>
                          {roomType === 'NEW_TYPE' && (
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Type name"
                              style={{ padding: '4px 8px', width: '120px', fontSize: '0.75rem' }}
                              value={customRoomType}
                              onChange={(e) => setCustomRoomType(e.target.value)}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="profile-role-badge" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
                          {room.roomType}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '90px' }}
                          value={capacity}
                          onChange={(e) => setCapacity(Number(e.target.value))}
                        />
                      ) : (
                        `${room.capacity} students`
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '160px' }}
                          value={building}
                          onChange={(e) => setBuilding(e.target.value)}
                        />
                      ) : (
                        room.building || '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 8px', width: '70px' }}
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(e.target.value ? Number(e.target.value) : '')}
                        />
                      ) : (
                        room.floorNumber !== undefined ? `${room.floorNumber}F` : '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                              onClick={() => handleUpdate(room.id)}
                              disabled={isSubmitting}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="theme-toggle-btn"
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="theme-toggle-btn"
                              onClick={() => handleStartEdit(room)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="theme-toggle-btn"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(room.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No classrooms configured. Click "Add Classroom" to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '450px', transform: 'none', margin: 0 }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <span className="login-title-badge">Classroom Form</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0' }}>Add New Classroom</h2>
            </div>

            <form onSubmit={handleAdd} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="room-name">Room Name / Number</label>
                <input
                  id="room-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Room 301, Lab A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-type">Room Type</label>
                <select
                  id="room-type"
                  className="form-input"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  {roomTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="NEW_TYPE">+ Add Custom Room Type</option>
                </select>
                
                {roomType === 'NEW_TYPE' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Custom Type (e.g. SEMINAR_HALL, DRAWING_STUDIO)"
                    value={customRoomType}
                    onChange={(e) => setCustomRoomType(e.target.value)}
                    required
                    style={{ marginTop: '8px' }}
                    disabled={isSubmitting}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-capacity">Student Seating Capacity</label>
                <input
                  id="room-capacity"
                  type="number"
                  className="form-input"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="room-building">Building Block</label>
                  <input
                    id="room-building"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Science Block, Annex"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="room-floor">Floor</label>
                  <input
                    id="room-floor"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value ? Number(e.target.value) : '')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button" 
                  className="logout-btn" 
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="login-btn" 
                  style={{ height: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? 'Registering...' : 'Register Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
