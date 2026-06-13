/* useDynamicConfig.ts — React Hook for managing dynamic configuration state */

'use client';

import { useState, useEffect, useCallback } from 'react';
import configService from '../services/configService';
import { SlotTemplate, ConstraintConfig, ScheduleConfig } from '../types/config';

export function useDynamicConfig() {
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [constraints, setConstraints] = useState<ConstraintConfig[]>([]);
  const [scheduleConfigs, setScheduleConfigs] = useState<ScheduleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotsData, constraintsData, scheduleData] = await Promise.all([
        configService.getSlots(),
        configService.getConstraints(),
        configService.getScheduleConfigs()
      ]);
      setSlots(slotsData.sort((a, b) => a.slotNumber - b.slotNumber));
      setConstraints(constraintsData);
      setScheduleConfigs(scheduleData);
    } catch (err: any) {
      console.error('Failed to load configs:', err);
      setError(err.response?.data?.message || 'Failed to retrieve system configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const addSlot = async (slot: Omit<SlotTemplate, 'id'>) => {
    setError(null);
    try {
      const newSlot = await configService.createSlot(slot);
      setSlots(prev => [...prev, newSlot].sort((a, b) => a.slotNumber - b.slotNumber));
      return newSlot;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create slot.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const editSlot = async (id: number, slot: SlotTemplate) => {
    setError(null);
    try {
      const updatedSlot = await configService.updateSlot(id, slot);
      setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s).sort((a, b) => a.slotNumber - b.slotNumber));
      return updatedSlot;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update slot.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeSlot = async (id: number) => {
    setError(null);
    try {
      await configService.deactivateSlot(id);
      // Instead of removing it physically, the backend soft-deactivates it (is_active = false)
      // We re-fetch to get the correct database state
      await fetchConfigs();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete slot.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const saveConstraint = async (key: string, penaltyWeight: number | null, isActive: boolean | null) => {
    setError(null);
    try {
      const updated = await configService.updateConstraint(key, penaltyWeight, isActive);
      setConstraints(prev => prev.map(c => c.constraintKey === key ? updated : c));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save constraint.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const saveScheduleConfig = async (key: string, value: string) => {
    setError(null);
    try {
      const updated = await configService.updateScheduleConfig(key, value);
      setScheduleConfigs(prev => prev.map(c => c.configKey === key ? updated : c));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save schedule config.';
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    slots,
    constraints,
    scheduleConfigs,
    loading,
    error,
    refresh: fetchConfigs,
    addSlot,
    editSlot,
    removeSlot,
    saveConstraint,
    saveScheduleConfig
  };
}
