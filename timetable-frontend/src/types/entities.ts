/* entities.ts — TypeScript interfaces for academic entities */

export interface Department {
  id: number;
  name: string;
  code: string;
  hodUserId?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: number;
  name: string;
  roomType: string;
  capacity: number;
  building?: string;
  floorNumber?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Section {
  id: number;
  name: string;
  academicYear: number;
  semester: number;
  studentCount: number;
  departmentId: number;
  departmentName?: string;
  roomId?: number | null;
  roomName?: string | null;
  isActive: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  departmentName?: string;
  semester: number;
  credits: number;
  hoursPerWeek: number;
  subjectType: string; // e.g., 'THEORY', 'LAB'
  requiredRoomType?: string;
  consecutiveSlotsRequired: number;
  minDaysBetweenSessions: number;
  maxSessionsPerDay: number;
}

export interface AllocationBreakdown {
  subjectName: string;
  subjectCode: string;
  sectionName: string;
  hours: number;
}

export interface Faculty {
  id: number;
  name: string;
  employeeId: string;
  email: string;
  phone?: string;
  departmentId: number;
  departmentName?: string;
  maxHoursPerWeek: number;
  designation?: string;
  userId?: number;
  linkedUsername?: string;
  isActive: boolean;
  
  // Optional workload aggregates (loaded on-demand)
  allocatedHoursPerWeek?: number;
  remainingCapacity?: number;
  allocationBreakdown?: AllocationBreakdown[];
}

export interface SubjectAllocation {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  sectionId: number;
  sectionName: string;
  facultyId: number;
  facultyName: string;
  allocatedHoursPerWeek: number;
}
