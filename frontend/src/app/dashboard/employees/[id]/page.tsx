'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Employee, SalaryBreakdown } from '@/types';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<SalaryBreakdown | null>(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [salaryForm, setSalaryForm] = useState({
    monthlyWage: 0,
    basicValue: 50, basicType: 'PERCENTAGE',
    hraValue: 50, hraType: 'PERCENTAGE',
    standardAllowanceValue: 4167, standardAllowanceType: 'FIXED',
    performanceBonusValue: 8.33, performanceBonusType: 'PERCENTAGE',
    ltaValue: 8.333, ltaType: 'PERCENTAGE',
    pfValue: 12, pfType: 'PERCENTAGE',
    professionalTaxValue: 200, professionalTaxType: 'FIXED',
    otherDeductions: 0
  });

  const isAdmin = user?.role === 'ADMIN';
  const isHR = user?.role === 'HR';
  const isOwn = user?.employeeId === id;
  const canEdit = isAdmin || isHR || isOwn;

  useEffect(() => { loadEmployee(); }, [id]);

  const loadEmployee = async () => {
    try {
      const data = await api.get(`/employees/${id}`);
      setEmployee(data);
      setEditData(data);

      if (isAdmin || isOwn) {
        try {
          const sal = isAdmin
            ? await api.get(`/salary/${id}`)
            : await api.get('/salary/my');
          setSalary(sal);
          if (sal) {
            setSalaryForm({
              monthlyWage: sal.monthlyWage,
              basicValue: sal.basicValue, basicType: sal.basicType,
              hraValue: sal.hraValue, hraType: sal.hraType,
              standardAllowanceValue: sal.standardAllowanceValue, standardAllowanceType: sal.standardAllowanceType,
              performanceBonusValue: sal.performanceBonusValue, performanceBonusType: sal.performanceBonusType,
              ltaValue: sal.ltaValue, ltaType: sal.ltaType,
              pfValue: sal.pfValue, pfType: sal.pfType,
              professionalTaxValue: sal.professionalTaxValue, professionalTaxType: sal.professionalTaxType,
              otherDeductions: sal.otherDeductions,
            });
          }
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  const saveEmployee = async () => {
    try {
      await api.put(`/employees/${id}`, editData);
      await loadEmployee();
      setEditing(false);
    } catch {}
  };

  const saveSalary = async () => {
    try {
      const result = await api.post(`/salary/${id}`, salaryForm);
      setSalary(result);
    } catch {}
  };

  const tabs = ['resume', 'private', ...(isAdmin || isOwn ? ['salary'] : []), 'security'];
  if (isHR && !isOwn) {
    // HR can't see salary tab
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Loading...</div>;
  if (!employee) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Employee not found</div>;

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button onClick={() => router.back()} className="btn-secondary" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>

      {/* Profile Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.5rem 2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '1.5rem', flexShrink: 0,
        }}>
          {employee.firstName[0]}{employee.lastName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {employee.firstName} {employee.lastName}
          </h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0.5rem' }}>
            {employee.designation?.name || 'No designation'}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#64748B' }}>
            <span>🆔 {employee.user?.loginId}</span>
            <span>🏢 {employee.department?.name || '—'}</span>
            <span>👤 {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—'}</span>
            <span>📅 Joined {new Date(employee.joiningDate).toLocaleDateString()}</span>
          </div>
        </div>
        {canEdit && !editing && (
          <button className="btn-primary" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-list">
        {tabs.map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'resume' ? 'Resume' : t === 'private' ? 'Private Information' : t === 'salary' ? 'Salary Info' : 'Security'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card animate-fade-in" key={activeTab}>
        {activeTab === 'resume' && (
          <div>
            <Section title="About Me" value={editing ? undefined : employee.aboutMe} editing={editing}
              editField={<textarea className="input" rows={3} value={editData.aboutMe || ''} onChange={e => setEditData({...editData, aboutMe: e.target.value})} />} />
            <Section title="Experience" value={editing ? undefined : employee.experience} editing={editing}
              editField={<textarea className="input" rows={3} value={editData.experience || ''} onChange={e => setEditData({...editData, experience: e.target.value})} />} />
            <Section title="Skills" value={editing ? undefined : employee.skills} editing={editing}
              editField={<input className="input" value={editData.skills || ''} onChange={e => setEditData({...editData, skills: e.target.value})} />} />
            <Section title="Certifications" value={editing ? undefined : employee.certifications} editing={editing}
              editField={<input className="input" value={editData.certifications || ''} onChange={e => setEditData({...editData, certifications: e.target.value})} />} />
            <Section title="Hobbies" value={editing ? undefined : employee.hobbies} editing={editing}
              editField={<input className="input" value={editData.hobbies || ''} onChange={e => setEditData({...editData, hobbies: e.target.value})} />} />
            {editing && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-primary" onClick={saveEmployee}>Save</button>
                <button className="btn-secondary" onClick={() => { setEditing(false); setEditData(employee); }}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'private' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'} />
            <Field label="Gender" value={employee.gender || '—'} />
            <Field label="Marital Status" value={employee.maritalStatus || '—'} />
            <Field label="Nationality" value={employee.nationality || '—'} />
            <Field label="Personal Email" value={employee.personalEmail || '—'} />
            <Field label="Phone" value={employee.phone || '—'} />
            <Field label="Address" value={[employee.address, employee.city, employee.state, employee.zipCode, employee.country].filter(Boolean).join(', ') || '—'} />
            <Field label="Date of Joining" value={new Date(employee.joiningDate).toLocaleDateString()} />
          </div>
        )}

        {activeTab === 'salary' && (
          <div>
            {isAdmin ? (
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Salary Configuration</h3>
                
                <div style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
                  <label className="label">Monthly Wage (₹)</label>
                  <input className="input" type="number" value={salaryForm.monthlyWage} onChange={e => setSalaryForm({...salaryForm, monthlyWage: +e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Basic */}
                  <div>
                    <label className="label">Basic Component</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.basicValue} onChange={e => setSalaryForm({...salaryForm, basicValue: +e.target.value})} />
                      <select className="input" value={salaryForm.basicType} onChange={e => setSalaryForm({...salaryForm, basicType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* HRA */}
                  <div>
                    <label className="label">HRA (Based on Basic)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.hraValue} onChange={e => setSalaryForm({...salaryForm, hraValue: +e.target.value})} />
                      <select className="input" value={salaryForm.hraType} onChange={e => setSalaryForm({...salaryForm, hraType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* Standard Allowance */}
                  <div>
                    <label className="label">Standard Allowance</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.standardAllowanceValue} onChange={e => setSalaryForm({...salaryForm, standardAllowanceValue: +e.target.value})} />
                      <select className="input" value={salaryForm.standardAllowanceType} onChange={e => setSalaryForm({...salaryForm, standardAllowanceType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* Performance Bonus */}
                  <div>
                    <label className="label">Performance Bonus</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.performanceBonusValue} onChange={e => setSalaryForm({...salaryForm, performanceBonusValue: +e.target.value})} />
                      <select className="input" value={salaryForm.performanceBonusType} onChange={e => setSalaryForm({...salaryForm, performanceBonusType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* LTA */}
                  <div>
                    <label className="label">LTA</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.ltaValue} onChange={e => setSalaryForm({...salaryForm, ltaValue: +e.target.value})} />
                      <select className="input" value={salaryForm.ltaType} onChange={e => setSalaryForm({...salaryForm, ltaType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* PF */}
                  <div>
                    <label className="label">PF Deduction</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.pfValue} onChange={e => setSalaryForm({...salaryForm, pfValue: +e.target.value})} />
                      <select className="input" value={salaryForm.pfType} onChange={e => setSalaryForm({...salaryForm, pfType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* Professional Tax */}
                  <div>
                    <label className="label">Professional Tax</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" step="0.01" value={salaryForm.professionalTaxValue} onChange={e => setSalaryForm({...salaryForm, professionalTaxValue: +e.target.value})} />
                      <select className="input" value={salaryForm.professionalTaxType} onChange={e => setSalaryForm({...salaryForm, professionalTaxType: e.target.value})} style={{ width: '100px' }}>
                        <option value="PERCENTAGE">%</option><option value="FIXED">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* Other Deductions */}
                  <div>
                    <label className="label">Other Deductions (₹)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" type="number" value={salaryForm.otherDeductions} onChange={e => setSalaryForm({...salaryForm, otherDeductions: +e.target.value})} />
                    </div>
                  </div>
                </div>

                <button className="btn-primary" onClick={saveSalary}>Save Salary Structure</button>
              </div>
            ) : null}

            {salary?.breakdown && (
              <div style={{ marginTop: isAdmin ? '2rem' : 0, borderTop: isAdmin ? '1px solid #E2E8F0' : 'none', paddingTop: isAdmin ? '1.5rem' : 0 }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Salary Breakdown</h3>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Component</th><th style={{ textAlign: 'right' }}>Amount (₹)</th></tr></thead>
                    <tbody>
                      <tr><td>Basic Salary</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.basic.toLocaleString()}</td></tr>
                      <tr><td>HRA</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.hra.toLocaleString()}</td></tr>
                      <tr><td>Standard Allowance</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.standardAllowance.toLocaleString()}</td></tr>
                      <tr><td>Performance Bonus</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.performanceBonus.toLocaleString()}</td></tr>
                      <tr><td>LTA</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.lta.toLocaleString()}</td></tr>
                      <tr><td>Residual Allowance</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.residualAllowance.toLocaleString()}</td></tr>
                      <tr style={{ background: '#F8FAFC', fontWeight: 600 }}><td>Gross Salary</td><td style={{ textAlign: 'right' }}>₹{salary.breakdown.grossSalary.toLocaleString()}</td></tr>
                      <tr><td>PF Deduction</td><td style={{ textAlign: 'right', color: '#DC2626' }}>- ₹{salary.breakdown.pfDeduction.toLocaleString()}</td></tr>
                      <tr><td>Professional Tax</td><td style={{ textAlign: 'right', color: '#DC2626' }}>- ₹{salary.breakdown.professionalTax.toLocaleString()}</td></tr>
                      <tr><td>Other Deductions</td><td style={{ textAlign: 'right', color: '#DC2626' }}>- ₹{salary.breakdown.otherDeductions.toLocaleString()}</td></tr>
                      <tr style={{ background: '#EEF2FF', fontWeight: 700 }}><td>Net Salary</td><td style={{ textAlign: 'right', color: '#4F46E5' }}>₹{salary.breakdown.netSalary.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <Field label="Login ID" value={employee.user?.loginId || '—'} />
            <Field label="Last Password Change" value={employee.user?.lastPasswordChange ? new Date(employee.user.lastPasswordChange).toLocaleDateString() : 'Never'} />
            <Field label="MFA Status" value={employee.user?.mfaEnabled ? 'Enabled' : 'Disabled'} />
            {isOwn && (
              <button className="btn-primary" onClick={() => router.push('/change-password')} style={{ marginTop: '1rem' }}>
                Change Password
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, value, editing, editField }: { title: string; value?: string | null; editing: boolean; editField: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#0F172A' }}>{title}</h4>
      {editing ? editField : <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>{value || '—'}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div className="label">{label}</div>
      <div style={{ fontSize: '0.9375rem' }}>{value}</div>
    </div>
  );
}
