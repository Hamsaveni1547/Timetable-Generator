/* page.tsx — Dashboard index page which redirects users to their role-specific portal */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardIndex() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Redirect to role-specific dashboard homepages
    if (user.role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else if (user.role === 'HOD') {
      router.push('/dashboard/hod');
    } else if (user.role === 'FACULTY') {
      router.push('/dashboard/faculty');
    } else if (user.role === 'STUDENT') {
      router.push('/dashboard/student');
    }
  }, [user, loading, isAuthenticated, router]);

  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
    </div>
  );
}
