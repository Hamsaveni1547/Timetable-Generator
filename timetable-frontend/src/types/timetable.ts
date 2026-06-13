/* timetable.ts — TypeScript interfaces for timetable generation, entries, and solver reports */

export interface BottleneckItem {
  category: string;   // e.g. "RESOURCE_SHORTAGE", "FACULTY_OVERLOAD", "UNAVAILABILITY_CONFLICT"
  entityType: string; // e.g. "ROOM", "FACULTY", "SUBJECT", "SECTION"
  entityIds?: number[];
  description: string;
}

export interface BottleneckReport {
  type: string; // "UNSOLVABLE", "TIMEOUT", "INCOMPLETE_ALLOCATIONS"
  bottlenecks: BottleneckItem[];
  suggestedActions: string[];
}

export interface GenerationStatus {
  id: number;
  departmentId: number;
  departmentName: string;
  academicYear: number;
  semester: number;
  status: 'IN_PROGRESS' | 'DRAFT' | 'PUBLISHED' | 'FAILED';
  solverDurationMs?: number;
  bottleneckReport?: BottleneckReport | null;
  generatedAt: string;
  publishedAt?: string | null;
}

export interface TimetableEntry {
  id: number;
  generationId: number;
  
  sectionId: number;
  sectionName: string;
  
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  
  facultyId: number;
  facultyName: string;
  
  roomId: number;
  roomName: string;
  
  slotTemplateId: number;
  slotLabel: string;
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;   // "HH:mm:ss" or "HH:mm"
  
  dayOfWeek: string; // 'MONDAY', 'TUESDAY', etc.
  isManuallyOverridden: boolean;
  overrideReason?: string | null;
  overrideBy?: number | null;
}

export interface SwapValidationResult {
  valid: boolean;
  clashes: string[];
}
