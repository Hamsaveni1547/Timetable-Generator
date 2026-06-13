/* configService.ts — Service for handling system configuration endpoints */

import api from './api';
import { ScheduleConfig, SlotTemplate, ConstraintConfig } from '../types/config';

const configService = {
  // ===== Schedule Config =====
  getScheduleConfigs: async (): Promise<ScheduleConfig[]> => {
    const response = await api.get('/config/schedule');
    return response.data.data;
  },

  updateScheduleConfig: async (key: string, value: string): Promise<ScheduleConfig> => {
    const response = await api.put(`/config/schedule/${key}`, { value });
    return response.data.data;
  },

  // ===== Slot Templates =====
  getSlots: async (): Promise<SlotTemplate[]> => {
    const response = await api.get('/config/slots');
    return response.data.data;
  },

  getActiveSlots: async (): Promise<SlotTemplate[]> => {
    const response = await api.get('/config/slots/active');
    return response.data.data;
  },

  createSlot: async (slot: Omit<SlotTemplate, 'id'>): Promise<SlotTemplate> => {
    const response = await api.post('/config/slots', slot);
    return response.data.data;
  },

  updateSlot: async (id: number, slot: SlotTemplate): Promise<SlotTemplate> => {
    const response = await api.put(`/config/slots/${id}`, slot);
    return response.data.data;
  },

  deactivateSlot: async (id: number): Promise<void> => {
    await api.delete(`/config/slots/${id}`);
  },

  // ===== Constraint Config =====
  getConstraints: async (): Promise<ConstraintConfig[]> => {
    const response = await api.get('/config/constraints');
    return response.data.data;
  },

  updateConstraint: async (
    key: string,
    penaltyWeight: number | null,
    isActive: boolean | null
  ): Promise<ConstraintConfig> => {
    const response = await api.put(`/config/constraints/${key}`, {
      penaltyWeight,
      isActive,
    });
    return response.data.data;
  },
};

export default configService;
