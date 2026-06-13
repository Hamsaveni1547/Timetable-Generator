/* page.tsx — Login Page with glassmorphic cards and demo account pre-fills */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, User as UserIcon, AlertTriangle } from 'lucide-react';
import './login.css';

function LoginContent() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if redirect due to session expiration
    if (searchParams.get('expired')) {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    try {
      await login({ username, password });
    } catch (err: any) {
      console.error('Login failed:', err);
      const msg = err.response?.data?.message || 'Invalid username or password.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill demo accounts to help testing
  const handlePrefill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <main className="login-container">
      {/* Decorative Blur Spheres */}
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>

      <div className="login-card">
        <div className="login-header">
          <span className="login-title-badge">Institution Portal</span>
          <h1>Timetable Generator</h1>
          <p className="login-subtitle">Sign in to manage schedules & view allocations</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                id="username"
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Quick-Login section */}
        <div className="demo-accounts">
          <div className="demo-title">Quick Demo Logins</div>
          <div className="demo-chips">
            <button 
              className="demo-chip"
              onClick={() => handlePrefill('admin', '123456789')}
              disabled={isSubmitting}
            >
              Admin (admin)
            </button>
            <button 
              className="demo-chip"
              onClick={() => handlePrefill('mcahod', '123456789')}
              disabled={isSubmitting}
            >
              HOD (mcahod)
            </button>
            <button 
              className="demo-chip"
              onClick={() => handlePrefill('csefaculty1', '123456789')}
              disabled={isSubmitting}
            >
              Faculty (csefaculty1)
            </button>
            <button 
              className="demo-chip"
              onClick={() => handlePrefill('csestudent1', '123456789')}
              disabled={isSubmitting}
            >
              Student (csestudent1)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="login-container">
        <div className="login-bg-shape shape-1"></div>
        <div className="login-bg-shape shape-2"></div>
        <div className="login-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
