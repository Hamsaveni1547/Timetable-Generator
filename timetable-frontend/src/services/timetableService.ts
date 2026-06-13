/* timetableService.ts — Service for handling timetable generation, overrides, and views */

import api from './api';
import { GenerationStatus, TimetableEntry, SwapValidationResult } from '../types/timetable';
import { FacultyUnavailability } from '../types/config';

export interface GenerateTimetableRequest {
  departmentId: number;
  academicYear: number;
  semester: number;
}

export interface OverrideEntryRequest {
  newDay: string;
  newSlotTemplateId: number;
  newRoomId: number;
  reason: string;
}

export interface UnavailabilityRequest {
  dayOfWeek: string;
  slotTemplateId: number;
  reason?: string;
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string | null;
}

const timetableService = {
  // ===== Generation Controls =====
  generate: async (request: GenerateTimetableRequest): Promise<GenerationStatus> => {
    const response = await api.post('/timetable/generate', request);
    return response.data.data;
  },

  getGenerations: async (deptId: number): Promise<GenerationStatus[]> => {
    const response = await api.get('/timetable/generations', { params: { deptId } });
    return response.data.data;
  },

  getGeneration: async (id: number): Promise<GenerationStatus> => {
    const response = await api.get(`/timetable/generations/${id}`);
    return response.data.data;
  },

  getEntries: async (generationId: number): Promise<TimetableEntry[]> => {
    const response = await api.get(`/timetable/generations/${generationId}/entries`);
    return response.data.data;
  },

  publish: async (generationId: number): Promise<GenerationStatus> => {
    const response = await api.post(`/timetable/generations/${generationId}/publish`);
    return response.data.data;
  },

  deleteGeneration: async (id: number): Promise<void> => {
    await api.delete(`/timetable/generations/${id}`);
  },

  // ===== Swaps & Manual Overrides =====
  validateSwap: async (
    entryId: number,
    generationId: number,
    request: Omit<OverrideEntryRequest, 'reason'>
  ): Promise<SwapValidationResult> => {
    const response = await api.post(`/timetable/entries/${entryId}/validate-swap`, request, {
      params: { generationId }
    });
    return response.data.data;
  },

  commitOverride: async (entryId: number, request: OverrideEntryRequest): Promise<TimetableEntry> => {
    const response = await api.put(`/timetable/entries/${entryId}`, request);
    return response.data.data;
  },

  // ===== Role-Scoped Views =====
  getFacultyTimetable: async (facultyId: number, generationId: number): Promise<TimetableEntry[]> => {
    const response = await api.get(`/timetable/faculty/${facultyId}`, {
      params: { generationId }
    });
    return response.data.data;
  },

  getSectionTimetable: async (sectionId: number, generationId: number): Promise<TimetableEntry[]> => {
    const response = await api.get(`/timetable/section/${sectionId}`, {
      params: { generationId }
    });
    return response.data.data;
  },

  getRoomTimetable: async (roomId: number, generationId: number): Promise<TimetableEntry[]> => {
    const response = await api.get(`/timetable/room/${roomId}`, {
      params: { generationId }
    });
    return response.data.data;
  },

  getFacultyActualWorkload: async (facultyId: number, generationId: number): Promise<number> => {
    const response = await api.get(`/timetable/faculty/${facultyId}/workload-actual`, {
      params: { generationId }
    });
    return response.data.data;
  },

  // ===== Faculty Unavailability =====
  getFacultyUnavailability: async (facultyId: number): Promise<FacultyUnavailability[]> => {
    const response = await api.get(`/faculty/${facultyId}/unavailability`);
    return response.data.data;
  },

  addFacultyUnavailability: async (
    facultyId: number,
    request: UnavailabilityRequest
  ): Promise<FacultyUnavailability> => {
    const response = await api.post(`/faculty/${facultyId}/unavailability`, request);
    return response.data.data;
  },

  deleteFacultyUnavailability: async (id: number): Promise<void> => {
    await api.delete(`/faculty/unavailability/${id}`);
  },

  getDepartmentUnavailability: async (deptId: number): Promise<FacultyUnavailability[]> => {
    const response = await api.get(`/departments/${deptId}/unavailability`);
    return response.data.data;
  },
};

export default timetableService;
