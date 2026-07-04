'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { LeaveAllocation, LeaveRequest, LeaveType } from '@/types';

export default function TimeOffPage() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', remarks: '' });

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [allocs, reqs, types] = await Promise.all([
        api.get('/leave/my/allocations'),
        api.get('/leave/my/requests'),
        api.get('/leave/types'),
      ]);
      setAllocations(allocs);
      setRequests(reqs);
      setLeaveTypes(types);

      if (isAdminOrHR) {
        const all = await api.get('/leave/all');
        setAllRequests(all);
      }
    } catch {} finally { setLoading(false); }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leave/request', form);
      setShowForm(false);
      setForm({ leaveTypeId: '', startDate: '', endDate: '', remarks: '' });
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const approveRequest = async (id: string) => {
    try {
      await api.post(`/leave/${id}/approve`, {});
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const rejectRequest = async (id: string) => {
    try {
      await api.post(`/leave/${id}/reject`, {});
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Time Off</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
          New Request
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {allocations.map(a => (
          <div key={a.id} className="card" style={{ borderLeft: `4px solid ${a.leaveType.name === 'PAID_TIME_OFF' ? '#4F46E5' : a.leaveType.name === 'SICK_LEAVE' ? '#DC2626' : '#F59E0B'}` }}>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '0.5rem' }}>{a.leaveType.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A' }}>{a.remaining}</span>
              <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>/ {a.allocated} days</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>{a.used} used</div>
          </div>
        ))}
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Leave Request</h2>
            <form onSubmit={submitRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Leave Type *</label>
                <select className="input" required value={form.leaveTypeId} onChange={e => setForm({...form, leaveTypeId: e.target.value})}>
                  <option value="">Select type</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input className="input" type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Remarks</label>
                <textarea className="input" rows={3} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary">Submit Request</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Requests */}
      <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>My Leave Requests</h3>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr><th>Leave Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>No leave requests</td></tr>
            ) : requests.map(r => (
              <tr key={r.id}>
                <td>{r.leaveType.label}</td>
                <td>{new Date(r.startDate).toLocaleDateString()}</td>
                <td>{new Date(r.endDate).toLocaleDateString()}</td>
                <td>{r.days}</td>
                <td>
                  <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin/HR: All Requests with Approve/Reject */}
      {isAdminOrHR && (
        <>
          <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>All Leave Requests</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Leave Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {allRequests.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8' }}>No requests</td></tr>
                ) : allRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td>{r.leaveType.label}</td>
                    <td>{new Date(r.startDate).toLocaleDateString()}</td>
                    <td>{new Date(r.endDate).toLocaleDateString()}</td>
                    <td>{r.days}</td>
                    <td>
                      <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn-success" onClick={() => approveRequest(r.id)}>Approve</button>
                          <button className="btn-danger" onClick={() => rejectRequest(r.id)}>Reject</button>
                        </div>
                      )}
                    </td>
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
