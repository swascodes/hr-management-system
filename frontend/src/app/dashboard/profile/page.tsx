'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.employeeId) {
      router.replace(`/dashboard/employees/${user.employeeId}`);
    }
  }, [user, router]);

  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
      Redirecting to your profile...
    </div>
  );
}
