/* page.tsx — Admin Constraints weight configuration page */

'use client';

import React from 'react';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import ConstraintWeightPanel from '@/components/config/ConstraintWeightPanel';
import { AlertCircle } from 'lucide-react';

export default function AdminConstraintsPage() {
  const { constraints, loading, error, saveConstraint } = useDynamicConfig();

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Solver Constraints</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Fine-tune the backtracking solver heuristics by activating/deactivating constraints and adjusting penalty weights.
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <ConstraintWeightPanel 
        constraints={constraints} 
        onUpdate={saveConstraint} 
      />
    </div>
  );
}
