/* academicService.ts — Service for handling all academic and infrastructure CRUD endpoints */

import api from './api';
import { Department, Room, Section, Subject, Faculty, SubjectAllocation } from '../types/entities';

export interface AllocationRequest {
  subjectId: number;
  sectionId: number;
  facultyId: number;
  allocatedHoursPerWeek: number;
}

export interface AllocationValidationResult {
  subjectId: number;
  subjectName: string;
  requiredHoursPerWeek: number;
  allocatedTotal: number;
  isComplete: boolean;
  deficit: number;
  allocations: {
    facultyName: string;
    allocatedHours: number;
  }[];
}

const academicService = {
  // ===== Departments =====
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/departments');
    return response.data.data;
  },

  createDepartment: async (dept: Omit<Department, 'id'>): Promise<Department> => {
    const response = await api.post('/departments', dept);
    return response.data.data;
  },

  updateDepartment: async (id: number, dept: Department): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, dept);
    return response.data.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },

  // ===== Rooms =====
  getRooms: async (type?: string): Promise<Room[]> => {
    const response = await api.get('/rooms', { params: { type } });
    return response.data.data;
  },

  getRoomTypes: async (): Promise<string[]> => {
    const response = await api.get('/rooms/types');
    return response.data.data;
  },

  createRoom: async (room: Omit<Room, 'id'>): Promise<Room> => {
    const response = await api.post('/rooms', room);
    return response.data.data;
  },

  updateRoom: async (id: number, room: Room): Promise<Room> => {
    const response = await api.put(`/rooms/${id}`, room);
    return response.data.data;
  },

  deleteRoom: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },

  // ===== Sections =====
  getSections: async (deptId?: number, academicYear?: number, semester?: number): Promise<Section[]> => {
    const response = await api.get('/sections', {
      params: { deptId, academicYear, semester }
    });
    return response.data.data;
  },

  createSection: async (section: Omit<Section, 'id'>): Promise<Section> => {
    const response = await api.post('/sections', section);
    return response.data.data;
  },

  updateSection: async (id: number, section: Section): Promise<Section> => {
    const response = await api.put(`/sections/${id}`, section);
    return response.data.data;
  },

  deleteSection: async (id: number): Promise<void> => {
    await api.delete(`/sections/${id}`);
  },

  // ===== Subjects =====
  getSubjects: async (deptId?: number, semester?: number): Promise<Subject[]> => {
    const response = await api.get('/subjects', {
      params: { deptId, semester }
    });
    return response.data.data;
  },

  createSubject: async (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const response = await api.post('/subjects', subject);
    return response.data.data;
  },

  updateSubject: async (id: number, subject: Subject): Promise<Subject> => {
    const response = await api.put(`/subjects/${id}`, subject);
    return response.data.data;
  },

  deleteSubject: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },

  // ===== Faculty =====
  getFaculty: async (deptId?: number): Promise<Faculty[]> => {
    const response = await api.get('/faculty', { params: { deptId } });
    return response.data.data;
  },

  createFaculty: async (faculty: Omit<Faculty, 'id'>): Promise<Faculty> => {
    const response = await api.post('/faculty', faculty);
    return response.data.data;
  },

  updateFaculty: async (id: number, faculty: Faculty): Promise<Faculty> => {
    const response = await api.put(`/faculty/${id}`, faculty);
    return response.data.data;
  },

  deleteFaculty: async (id: number): Promise<void> => {
    await api.delete(`/faculty/${id}`);
  },

  getFacultyWorkloadSummary: async (id: number): Promise<Faculty> => {
    const response = await api.get(`/faculty/${id}/workload-summary`);
    return response.data.data;
  },

  // ===== Allocations =====
  getAllocations: async (deptId?: number, semester?: number): Promise<SubjectAllocation[]> => {
    const response = await api.get('/allocations', {
      params: { deptId, semester }
    });
    return response.data.data;
  },

  createAllocation: async (alloc: AllocationRequest): Promise<SubjectAllocation> => {
    const response = await api.post('/allocations', alloc);
    return response.data.data;
  },

  updateAllocation: async (id: number, alloc: AllocationRequest): Promise<SubjectAllocation> => {
    const response = await api.put(`/allocations/${id}`, alloc);
    return response.data.data;
  },

  deleteAllocation: async (id: number): Promise<void> => {
    await api.delete(`/allocations/${id}`);
  },

  validateAllocation: async (subjectId: number, sectionId: number): Promise<AllocationValidationResult> => {
    const response = await api.get('/allocations/validate', {
      params: { subjectId, sectionId }
    });
    return response.data.data;
  },
};

export default academicService;
