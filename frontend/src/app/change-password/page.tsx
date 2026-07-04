'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
      router.push('/dashboard/employees');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 50%, #EDE9FE 100%)',
      padding: '1rem',
    }}>
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '1rem',
        padding: '2.5rem',
        boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            marginBottom: '1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Change Password
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.5rem' }}>
            You must set a new password before continuing
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 10 chars, upper, lower, number, special"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2', color: '#991B1B',
              padding: '0.75rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.8125rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}>
            {loading ? 'Changing...' : 'Set New Password'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem', padding: '0.75rem', background: '#EEF2FF',
          borderRadius: '0.5rem', fontSize: '0.75rem', color: '#4F46E5',
        }}>
          <strong>Password Requirements:</strong>
          <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem' }}>
            <li>At least 10 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
            <li>One special character (!@#$%^&*)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
