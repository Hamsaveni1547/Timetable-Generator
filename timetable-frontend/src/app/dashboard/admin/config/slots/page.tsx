/* page.tsx — Admin Time Slots configuration page */

'use client';

import React from 'react';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import SlotTemplateEditor from '@/components/config/SlotTemplateEditor';
import { AlertCircle } from 'lucide-react';

export default function AdminSlotsPage() {
  const { slots, loading, error, addSlot, editSlot, removeSlot } = useDynamicConfig();

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Period Templates</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Manage period slot timings, break times, and days for class scheduling templates.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <SlotTemplateEditor 
        slots={slots} 
        onAdd={addSlot} 
        onEdit={editSlot} 
        onDelete={removeSlot} 
      />
    </div>
  );
}
