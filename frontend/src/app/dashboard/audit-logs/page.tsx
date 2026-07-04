'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, [page, moduleFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (moduleFilter) params.set('module', moduleFilter);
      const data = await api.get(`/audit?${params}`);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Audit Logs</h1>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <select className="input" style={{ width: 'auto' }} value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }}>
          <option value="">All Modules</option>
          <option value="auth">Auth</option>
          <option value="employee">Employee</option>
          <option value="attendance">Attendance</option>
          <option value="leave">Leave</option>
          <option value="salary">Salary</option>
        </select>
        <span style={{ fontSize: '0.8125rem', color: '#64748B', alignSelf: 'center' }}>{total} total records</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Module</th><th>Action</th><th>Details</th><th>IP</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>No audit logs</td></tr>
            ) : logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: '0.8125rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.user?.loginId || '—'}</td>
                <td><span className="badge badge-info">{l.module}</span></td>
                <td>{l.action}</td>
                <td style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || '—'}</td>
                <td style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{l.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: '#64748B' }}>Page {page}</span>
          <button className="btn-secondary" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
