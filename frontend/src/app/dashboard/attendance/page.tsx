'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AttendanceRecord } from '@/types';

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    try {
      const [status, my] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/my?month=${month}&year=${year}`),
      ]);
      setTodayStatus(status);
      setRecords(my.records);
      setSummary(my.summary);

      if (isAdminOrHR) {
        const all = await api.get(`/attendance/all?month=${month}&year=${year}`);
        setAllRecords(all);
      }
    } catch {} finally { setLoading(false); }
  };

  const checkIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      await loadData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const checkOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      await loadData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const formatTime = (t?: string) => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Attendance</h1>

      {/* Check In/Out Card */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '0.25rem' }}>Today&apos;s Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`badge ${todayStatus?.checkedIn ? 'badge-success' : 'badge-warning'}`}>
              {todayStatus?.checkedIn ? (todayStatus?.checkedOut ? 'Completed' : 'Working') : 'Not Checked In'}
            </span>
            {todayStatus?.checkInTime && <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>In: {formatTime(todayStatus.checkInTime)}</span>}
            {todayStatus?.checkOutTime && <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Out: {formatTime(todayStatus.checkOutTime)}</span>}
            {todayStatus?.workHours > 0 && <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>{todayStatus.workHours.toFixed(1)}h worked</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!todayStatus?.checkedIn && (
            <button className="btn-success" onClick={checkIn} disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem' }}>
              Check In →
            </button>
          )}
          {todayStatus?.checkedIn && !todayStatus?.checkedOut && (
            <button className="btn-danger" onClick={checkOut} disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem' }}>
              Check Out →
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16A34A' }}>{summary.presentDays}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Days Present</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#DC2626' }}>{summary.leaveDays}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Leave Days</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{summary.halfDays}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Half Days</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4F46E5' }}>{summary.totalWorkingDays}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Working Days</div>
          </div>
        </div>
      )}

      {/* Month/Year Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select className="input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <input className="input" type="number" style={{ width: '100px' }} value={year} onChange={e => setYear(+e.target.value)} />
      </div>

      {/* My Attendance Table */}
      <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>My Attendance</h3>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>No records for this period</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{formatTime(r.checkIn)}</td>
                <td>{formatTime(r.checkOut)}</td>
                <td>{r.workHours.toFixed(1)}h</td>
                <td>{r.extraHours > 0 ? `+${r.extraHours.toFixed(1)}h` : '—'}</td>
                <td><span className={`badge ${r.status === 'PRESENT' || r.status === 'LATE' ? 'badge-success' : r.status === 'LEAVE' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin/HR All Attendance */}
      {isAdminOrHR && (
        <>
          <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>All Employee Attendance</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {allRecords.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8' }}>No records</td></tr>
                ) : allRecords.map(r => (
                  <tr key={r.id}>
                    <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td>{r.employee?.department?.name || '—'}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{r.workHours.toFixed(1)}h</td>
                    <td>{r.extraHours > 0 ? `+${r.extraHours.toFixed(1)}h` : '—'}</td>
                    <td><span className={`badge ${r.status === 'PRESENT' || r.status === 'LATE' ? 'badge-success' : r.status === 'LEAVE' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
