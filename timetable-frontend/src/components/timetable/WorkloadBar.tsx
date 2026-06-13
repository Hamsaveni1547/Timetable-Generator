/* WorkloadBar.tsx — UI Component rendering a color-coded faculty workload progress bar with info tooltips */

'use client';

import React from 'react';
import { Faculty } from '@/types/entities';
import { AlertTriangle, CheckCircle, GraduationCap } from 'lucide-react';
import '../../app/dashboard/dashboard.css';
import './timetable.css';

interface WorkloadBarProps {
  faculty: Faculty;
}

export default function WorkloadBar({ faculty }: WorkloadBarProps) {
  const maxHours = faculty.maxHoursPerWeek || 1;
  const allocatedHours = faculty.allocatedHoursPerWeek || 0;
  const percentage = Math.min((allocatedHours / maxHours) * 100, 120); // Cap visual bar at 120%
  const isOverloaded = allocatedHours > maxHours;
  const isOptimal = allocatedHours >= maxHours * 0.75 && allocatedHours <= maxHours;

  const getStatusColor = () => {
    if (isOverloaded) return 'var(--danger)';
    if (isOptimal) return 'var(--warning)';
    return 'var(--success)';
  };

  const getStatusLabel = () => {
    if (isOverloaded) return 'Overloaded';
    if (isOptimal) return 'Optimal';
    return 'Available';
  };

  return (
    <div className="workload-card-container">
      <div className="workload-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={16} style={{ color: 'var(--text-secondary)' }} />
          <span className="faculty-name">{faculty.name}</span>
          <span className="faculty-designation">({faculty.designation || 'Faculty'})</span>
        </div>
        <span 
          className="workload-value" 
          style={{ 
            color: getStatusColor(),
            fontWeight: 700 
          }}
        >
          {allocatedHours}/{maxHours} hrs
        </span>
      </div>

      {/* Progress Bar with Tooltip wrapper */}
      <div className="workload-progress-wrapper tooltip-target">
        <div className="workload-progress-bg">
          <div 
            className="workload-progress-fill" 
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 8px ${getStatusColor()}40`
            }}
          ></div>
        </div>

        {/* Custom Tooltip */}
        <div className="workload-tooltip">
          <div className="tooltip-title">{faculty.name}</div>
          <div className="tooltip-status" style={{ color: getStatusColor() }}>
            {isOverloaded ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
            <span>{getStatusLabel()} ({allocatedHours} of {maxHours} hrs filled)</span>
          </div>
          
          <div className="tooltip-divider"></div>
          
          <div className="tooltip-breakdown">
            {faculty.allocationBreakdown && faculty.allocationBreakdown.length > 0 ? (
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '4px' }}>Subject</th>
                    <th style={{ paddingBottom: '4px' }}>Section</th>
                    <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.allocationBreakdown.map((item, idx) => (
                    <tr key={idx} style={{ opacity: 0.9 }}>
                      <td style={{ padding: '4px 0' }}>{item.subjectCode} ({item.subjectName})</td>
                      <td style={{ padding: '4px 0' }}>{item.sectionName}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{item.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="tooltip-empty">No active allocations assigned.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
