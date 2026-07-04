'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.get('/employees');
      setEmployees(data);
    } catch {} finally { setLoading(false); }
  };

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
      e.user?.loginId?.toLowerCase().includes(s) ||
      e.department?.name?.toLowerCase().includes(s)
    );
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'PRESENT': return '🟢';
      case 'LEAVE': return '✈️';
      default: return '🟡';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'LEAVE': return 'On Leave';
      default: return 'Absent';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Employees</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {employees.length} total employees
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              className="input"
              placeholder="Search by name, ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '300px' }}
            />
          </div>

          {/* Create button */}
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <button className="btn-primary" onClick={() => router.push('/dashboard/employees/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14m-7-7h14"/>
              </svg>
              New Employee
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Loading employees...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
          {search ? 'No employees match your search' : 'No employees yet'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="card card-hover"
              onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
              style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}
            >
              {/* Status Icon - Top Right */}
              <div 
                title={getStatusLabel(emp.attendanceStatus)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.25rem' }}
              >
                {getStatusIcon(emp.attendanceStatus)}
              </div>

              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 600, fontSize: '1rem',
                flexShrink: 0,
              }}>
                {emp.profilePicture ? (
                  <img src={emp.profilePicture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>
                ) : (
                  `${emp.firstName[0]}${emp.lastName[0]}`
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {emp.firstName} {emp.lastName}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.125rem' }}>
                  {emp.designation?.name || 'No designation'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.125rem' }}>
                  {emp.department?.name || 'No department'} · {emp.user?.loginId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
