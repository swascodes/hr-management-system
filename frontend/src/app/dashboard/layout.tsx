'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Notification } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user?.mustChangePassword) {
      router.replace('/change-password');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {}
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navItems = [
    { label: 'Employees', href: '/dashboard/employees' },
    { label: 'Attendance', href: '/dashboard/attendance' },
    { label: 'Time Off', href: '/dashboard/time-off' },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ label: 'Audit Logs', href: '/dashboard/audit-logs' });
  }

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.loginId.substring(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top Navigation */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Logo */}
            <div
              onClick={() => router.push('/dashboard/employees')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
                HR-Made Easy
              </span>
            </div>

            {/* Nav Links */}
            <nav style={{ display: 'flex', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#4F46E5' : '#64748B',
                      background: isActive ? '#EEF2FF' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Notifications + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
                style={{
                  width: 40, height: 40, borderRadius: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#DC2626', color: 'white',
                    fontSize: '0.625rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="animate-slide-down" style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
                  width: '360px', maxHeight: '400px', overflowY: 'auto',
                  background: 'white', borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                }}>
                  <div style={{
                    padding: '0.875rem 1rem', borderBottom: '1px solid #E2E8F0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        style={{ fontSize: '0.75rem', color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{
                        padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9',
                        background: n.isRead ? 'white' : '#F8FAFC',
                      }}>
                        <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.125rem' }}>{n.message}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  color: 'white', fontWeight: 600, fontSize: '0.8125rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {initials}
              </button>

              {showAvatarMenu && (
                <div className="animate-slide-down" style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
                  width: '200px',
                  background: 'white', borderRadius: '0.5rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.loginId}</div>
                    <span className={`badge badge-info`} style={{ marginTop: '0.25rem' }}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { router.push('/dashboard/profile'); setShowAvatarMenu(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.625rem 1rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.8125rem', color: '#0F172A',
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={logout}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.625rem 1rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.8125rem', color: '#DC2626', borderTop: '1px solid #E2E8F0',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Click-away handler */}
      {(showAvatarMenu || showNotifications) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 30 }}
          onClick={() => { setShowAvatarMenu(false); setShowNotifications(false); }}
        />
      )}

      {/* Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
