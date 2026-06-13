/* config.ts — TypeScript interfaces for configurations */

export interface ScheduleConfig {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  updatedAt?: string;
}

export interface SlotTemplate {
  id: number;
  slotNumber: number;
  label: string;
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;   // "HH:mm:ss" or "HH:mm"
  isBreak: boolean;
  appliesToDays: string; // 'ALL' or comma-separated list like 'MONDAY,TUESDAY'
  isActive: boolean;
}

export interface ConstraintConfig {
  id: number;
  constraintKey: string;
  isHard: boolean;
  penaltyWeight: number;
  isActive: boolean;
  description: string;
  updatedAt?: string;
}

export interface FacultyUnavailability {
  id: number;
  facultyId: number;
  facultyName?: string;
  dayOfWeek: string;
  slotTemplateId: number;
  slotLabel?: string;
  reason?: string;
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string;   // YYYY-MM-DD
}
