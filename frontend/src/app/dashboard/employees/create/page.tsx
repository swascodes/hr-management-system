'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Department, Designation } from '@/types';

export default function CreateEmployeePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ loginId: string; temporaryPassword: string } | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    departmentId: '', designationId: '', managerId: '',
    joiningDate: new Date().toISOString().split('T')[0], role: 'EMPLOYEE',
  });

  useEffect(() => {
    api.get('/departments').then(setDepartments).catch(() => {});
    api.get('/employees/designations').then(setDesignations).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/employees', form);
      setResult({ loginId: data.loginId, temporaryPassword: data.temporaryPassword });
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Employee Created!</h2>
          <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Share these credentials with the employee</p>

          <div style={{ background: '#F8FAFC', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="label">Login ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 600, color: '#4F46E5' }}>{result.loginId}</div>
            </div>
            <div>
              <div className="label">Temporary Password</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 600, color: '#DC2626' }}>{result.temporaryPassword}</div>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
            The employee must change this password on first login.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => router.push('/dashboard/employees')}>View Employees</button>
            <button className="btn-secondary" onClick={() => { setResult(null); setForm({ firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', managerId: '', joiningDate: new Date().toISOString().split('T')[0], role: 'EMPLOYEE' }); }}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button onClick={() => router.back()} className="btn-secondary" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Employee</h1>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">First Name *</label>
            <input className="input" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Designation</label>
            <select className="input" value={form.designationId} onChange={e => setForm({...form, designationId: e.target.value})}>
              <option value="">Select designation</option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Joining Date *</label>
            <input className="input" type="date" required value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Officer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
