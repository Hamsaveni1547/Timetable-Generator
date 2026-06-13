/* ConstraintWeightPanel.tsx — UI Component for managing Hard and Soft CSP solver constraints */

'use client';

import React, { useState } from 'react';
import { ConstraintConfig } from '@/types/config';
import { Sliders, AlertTriangle, Save, RefreshCw, CheckCircle, Info } from 'lucide-react';
import '../../app/dashboard/dashboard.css';

interface ConstraintWeightPanelProps {
  constraints: ConstraintConfig[];
  onUpdate: (key: string, penaltyWeight: number | null, isActive: boolean | null) => Promise<any>;
}

export default function ConstraintWeightPanel({ constraints, onUpdate }: ConstraintWeightPanelProps) {
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, { weight: number; active: boolean }>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Group constraints
  const hardConstraints = constraints.filter(c => c.constraintKey.startsWith('HC_'));
  const softConstraints = constraints.filter(c => c.constraintKey.startsWith('SC_'));

  const getWeightValue = (c: ConstraintConfig) => {
    return dirtyKeys[c.constraintKey] !== undefined 
      ? dirtyKeys[c.constraintKey].weight 
      : (c.penaltyWeight || 0);
  };

  const getActiveValue = (c: ConstraintConfig) => {
    return dirtyKeys[c.constraintKey] !== undefined 
      ? dirtyKeys[c.constraintKey].active 
      : c.isActive;
  };

  const handleActiveToggle = (c: ConstraintConfig) => {
    const key = c.constraintKey;
    const currentActive = getActiveValue(c);
    const newActive = !currentActive;

    // Hard Constraint Warning check
    if (key.startsWith('HC_') && !newActive) {
      setConfirmKey(key);
      setConfirmValue(newActive);
      return;
    }

    updateLocalState(key, getWeightValue(c), newActive);
  };

  const handleWeightChange = (c: ConstraintConfig, val: number) => {
    updateLocalState(c.constraintKey, val, getActiveValue(c));
  };

  const updateLocalState = (key: string, weight: number, active: boolean) => {
    setDirtyKeys(prev => ({
      ...prev,
      [key]: { weight, active }
    }));
  };

  const confirmHardToggle = () => {
    if (!confirmKey) return;
    const original = constraints.find(c => c.constraintKey === confirmKey)!;
    updateLocalState(confirmKey, getWeightValue(original), confirmValue);
    setConfirmKey(null);
  };

  const saveSingle = async (c: ConstraintConfig) => {
    const key = c.constraintKey;
    const local = dirtyKeys[key];
    if (!local) return; // Not changed

    setActionError(null);
    setSavingKeys(prev => ({ ...prev, [key]: true }));

    try {
      await onUpdate(key, key.startsWith('SC_') ? local.weight : null, local.active);
      
      // Remove from dirty tracking on success
      setDirtyKeys(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || `Failed to update ${key}.`);
    } finally {
      setSavingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const resetSingle = (key: string) => {
    setDirtyKeys(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const isKeyDirty = (key: string) => {
    return dirtyKeys[key] !== undefined;
  };

  // Human-friendly description mapping
  const getFriendlyName = (key: string) => {
    return key
      .replace('HC_', 'Hard: ')
      .replace('SC_', 'Soft: ')
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {actionError && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Hard Constraints Panel */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} /> Hard Constraints
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
            Hard constraints must always be satisfied for a timetable draft to be successfully generated. Disabling these is highly discouraged and can cause clashes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hardConstraints.map(c => {
              const active = getActiveValue(c);
              const dirty = isKeyDirty(c.constraintKey);
              const saving = savingKeys[c.constraintKey];

              return (
                <div 
                  key={c.constraintKey} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'between',
                    padding: '12px var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: dirty ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getFriendlyName(c.constraintKey)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.description}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                      <input 
                        type="checkbox" 
                        checked={active} 
                        onChange={() => handleActiveToggle(c)} 
                        disabled={saving}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className={`slider ${active ? 'slider-checked' : ''}`} style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: active ? 'var(--success)' : 'var(--text-muted)',
                        borderRadius: '20px', transition: '0.2s', display: 'block'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '14px', width: '14px', left: active ? '22px' : '4px', bottom: '3px',
                          backgroundColor: 'white', borderRadius: '50%', transition: '0.2s', display: 'block'
                        }}></span>
                      </span>
                    </label>

                    {dirty && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          className="theme-toggle-btn"
                          style={{ padding: '4px 8px', color: 'var(--success)', borderColor: 'var(--success)' }}
                          onClick={() => saveSingle(c)}
                          disabled={saving}
                          title="Save change"
                        >
                          {saving ? <RefreshCw className="spin" size={12} /> : <Save size={12} />}
                        </button>
                        <button 
                          className="theme-toggle-btn"
                          style={{ padding: '4px 8px' }}
                          onClick={() => resetSingle(c.constraintKey)}
                          disabled={saving}
                          title="Reset"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Soft Constraints Panel */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Sliders size={20} style={{ color: 'var(--accent)' }} /> Soft Constraints & Penalties
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
            Soft constraints are optimized by the solver. The penalty weights specify the cost of violating them (higher weight means the solver avoids it more actively).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {softConstraints.map(c => {
              const active = getActiveValue(c);
              const weight = getWeightValue(c);
              const dirty = isKeyDirty(c.constraintKey);
              const saving = savingKeys[c.constraintKey];

              return (
                <div 
                  key={c.constraintKey} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: dirty ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '75%' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getFriendlyName(c.constraintKey)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.description}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                        <input 
                          type="checkbox" 
                          checked={active} 
                          onChange={() => handleActiveToggle(c)} 
                          disabled={saving}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className={`slider ${active ? 'slider-checked' : ''}`} style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: active ? 'var(--accent)' : 'var(--text-muted)',
                          borderRadius: '20px', transition: '0.2s', display: 'block'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '14px', width: '14px', left: active ? '22px' : '4px', bottom: '3px',
                            backgroundColor: 'white', borderRadius: '50%', transition: '0.2s', display: 'block'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {active && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: '4px' }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="0.5" 
                        value={weight} 
                        onChange={(e) => handleWeightChange(c, Number(e.target.value))}
                        disabled={saving}
                        style={{ flex: 1, accentColor: 'var(--accent)', height: '6px', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.5"
                          value={weight}
                          onChange={(e) => handleWeightChange(c, Number(e.target.value))}
                          disabled={saving}
                          style={{ width: '60px', padding: '4px 6px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>pts</span>
                      </div>
                    </div>
                  )}

                  {dirty && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                      <button 
                        className="logout-btn" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                        onClick={() => resetSingle(c.constraintKey)}
                        disabled={saving}
                      >
                        Reset
                      </button>
                      <button 
                        className="login-btn" 
                        style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => saveSingle(c)}
                        disabled={saving}
                      >
                        {saving ? <RefreshCw className="spin" size={12} /> : <Save size={12} />} Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warnings & Security Confirm Modals */}
      {confirmKey && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 110,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div className="login-card" style={{ width: '400px', transform: 'none', margin: 0, borderColor: 'var(--danger)' }}>
            <div className="login-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '8px' }}>
                <AlertTriangle size={24} />
                <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Alert</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Disable Constraint?</h2>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--spacing-lg)' }}>
              Disabling <strong>{confirmKey}</strong> may allow scheduling overlaps (e.g., room capacity overbooking or teacher double-booking). Are you sure you want to proceed?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
              <button 
                type="button" 
                className="logout-btn" 
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onClick={() => setConfirmKey(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="login-btn" 
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', height: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}
                onClick={confirmHardToggle}
              >
                Yes, Disable Constraint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
