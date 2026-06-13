/* BottleneckReport.tsx — UI Component displaying CSP solver failure reports and suggested resolutions */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottleneckReport as BottleneckReportType } from '@/types/timetable';
import { AlertCircle, ArrowRight, ShieldAlert, Cpu, CalendarOff, Users } from 'lucide-react';
import '../../app/dashboard/dashboard.css';
import './timetable.css';

interface BottleneckReportProps {
  report: BottleneckReportType;
  isAdmin?: boolean;
}

export default function BottleneckReport({ report, isAdmin = false }: BottleneckReportProps) {
  const router = useRouter();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'RESOURCE_SHORTAGE':
        return <Cpu size={18} />;
      case 'FACULTY_OVERLOAD':
        return <Users size={18} />;
      case 'UNAVAILABILITY_CONFLICT':
        return <CalendarOff size={18} />;
      default:
        return <ShieldAlert size={18} />;
    }
  };

  const getFixRoute = (item: any) => {
    const type = item.entityType || '';
    const desc = item.description || '';
    
    if (desc.includes('allocation') || type === 'SUBJECT' || type === 'SECTION') {
      return '/dashboard/hod/allocations';
    }
    if (type === 'ROOM') {
      return isAdmin ? '/dashboard/admin/rooms' : null;
    }
    if (type === 'FACULTY' || desc.includes('unavailability')) {
      return '/dashboard/hod/unavailability';
    }
    return null;
  };

  const handleFixRedirect = (route: string) => {
    router.push(route);
  };

  return (
    <div className="bottleneck-panel-container">
      <div className="bottleneck-header-summary">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
          <AlertCircle size={22} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Solver Execution Blocked</h3>
        </div>
        <span className="bottleneck-status-badge">
          Type: {report.type}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 var(--spacing-lg) 0', lineHeight: 1.4 }}>
        The scheduling engine could not satisfy all active hard constraints. Below are the resource bottlenecks and conflict boundaries identified during backtracking.
      </p>

      {/* Bottlenecks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {report.bottlenecks && report.bottlenecks.map((item, index) => {
          const route = getFixRoute(item);
          return (
            <div key={index} className="bottleneck-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="bottleneck-category-icon-wrapper">
                  {getCategoryIcon(item.category)}
                </span>
                <span className="bottleneck-category-tag">{item.category}</span>
                {item.entityType && (
                  <span className="bottleneck-entity-tag">Target: {item.entityType}</span>
                )}
              </div>
              <p className="bottleneck-description">{item.description}</p>
              
              {route && (
                <button 
                  onClick={() => handleFixRedirect(route)}
                  className="bottleneck-fix-btn"
                >
                  <span>Resolve Conflict</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}

        {/* General Recommendations */}
        {report.suggestedActions && report.suggestedActions.length > 0 && (
          <div className="recommendations-box">
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} /> Recommended Fix Actions
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {report.suggestedActions.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
