/* useWorkload.ts — React Hook for managing faculty workload aggregates in real-time */

'use client';

import { useState, useEffect, useCallback } from 'react';
import academicService, { AllocationRequest } from '../services/academicService';
import { Faculty, SubjectAllocation, Subject, Section } from '../types/entities';

export function useWorkload(deptId?: number, semester?: number) {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkloadData = useCallback(async () => {
    if (!deptId) return;
    setLoading(true);
    setError(null);
    try {
      const [facData, allocData, subjData, sectData] = await Promise.all([
        academicService.getFaculty(deptId),
        academicService.getAllocations(deptId, semester),
        academicService.getSubjects(deptId, semester),
        academicService.getSections(deptId, undefined, semester)
      ]);

      // Map allocations to compute workloads client-side
      const computedFaculty = facData.map(fac => {
        const facAllocations = allocData.filter(a => a.facultyId === fac.id);
        const allocatedHours = facAllocations.reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);
        
        const breakdown = facAllocations.map(a => ({
          subjectName: a.subjectName || subjData.find(s => s.id === a.subjectId)?.name || 'Unknown Subject',
          subjectCode: a.subjectCode || subjData.find(s => s.id === a.subjectId)?.code || 'N/A',
          sectionName: a.sectionName || sectData.find(s => s.id === a.sectionId)?.name || 'Unknown Section',
          hours: a.allocatedHoursPerWeek
        }));

        return {
          ...fac,
          allocatedHoursPerWeek: allocatedHours,
          remainingCapacity: fac.maxHoursPerWeek - allocatedHours,
          allocationBreakdown: breakdown
        };
      });

      setFacultyList(computedFaculty);
      setAllocations(allocData);
      setSubjects(subjData);
      setSections(sectData);
    } catch (err: any) {
      console.error('Failed to load workload data:', err);
      setError(err.response?.data?.message || 'Failed to fetch workloads.');
    } finally {
      setLoading(false);
    }
  }, [deptId, semester]);

  useEffect(() => {
    fetchWorkloadData();
  }, [fetchWorkloadData]);

  const addAllocation = async (request: AllocationRequest) => {
    setError(null);
    try {
      const newAlloc = await academicService.createAllocation(request);
      await fetchWorkloadData(); // Re-fetch to recalculate everything properly
      return newAlloc;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add subject allocation.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const editAllocation = async (id: number, request: AllocationRequest) => {
    setError(null);
    try {
      const updated = await academicService.updateAllocation(id, request);
      await fetchWorkloadData();
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update subject allocation.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeAllocation = async (id: number) => {
    setError(null);
    try {
      await academicService.deleteAllocation(id);
      await fetchWorkloadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove subject allocation.';
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    facultyList,
    allocations,
    subjects,
    sections,
    loading,
    error,
    refresh: fetchWorkloadData,
    addAllocation,
    editAllocation,
    removeAllocation
  };
}
