'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: 'sans-serif', padding: 20, boxSizing: 'border-box' }}>
      
      {/* Main Login Box */}
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: 35, borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #dcdde1', marginBottom: 20 }}>
        
        <div style={{ display: 'inline-block', backgroundColor: '#e8f4fd', padding: '3px 10px', borderRadius: 12, marginBottom: 8, border: '1px solid #d0e8fc' }}>
          <span style={{ fontSize: 9, fontWeight: 'bold', color: '#0984e3', letterSpacing: 1, textTransform: 'uppercase' }}>Secure Authentication</span>
        </div>

        <h2 style={{ marginBottom: 6, color: '#1e272e', fontSize: 22, fontWeight: '800' }}>Admin Login</h2>
        <p style={{ color: '#718093', fontSize: 13, marginBottom: 20, fontWeight: '500' }}>
          Enter password to access CTPL Dynamic Diary Hub.
        </p>

        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 15 }}>{error}</p>}

        <label style={{ fontSize: 13, fontWeight: '600', color: '#2f3640', display: 'block', marginBottom: 5 }}>Password</label>
        
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={{ width: '100%', padding: '12px 45px 12px 12px', borderRadius: 8, border: '1px solid #dcdde1', fontSize: 14, boxSizing: 'border-box', backgroundColor: '#f8f9fa', color: '#2f3640' }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#718093',
              fontWeight: '600',
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" style={{ width: '100%', backgroundColor: '#273c75', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 10px rgba(39, 60, 117, 0.2)' }}>
          Login to Dashboard
        </button>
      </form>

      {/* ========================================= */}
      {/* SEPARATE DEVELOPER CREDIT BOX             */}
      {/* ========================================= */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #dcdde1', textAlign: 'center', boxSizing: 'border-box' }}>
        <div style={{ width: '50px', height: '2px', backgroundColor: '#273c75', margin: '0 auto 10px auto', borderRadius: 2 }}></div>
        <p style={{ fontSize: 10, color: '#718093', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0', fontWeight: 'bold' }}>
          CTPL Dynamic Diary Hub
        </p>
        <p style={{ fontSize: 13, color: '#57606f', margin: '0 0 6px 0', fontWeight: '500' }}>
          Designed & Developed by <strong style={{ color: '#273c75' }}>Traffic Warden M. Afzal Bhatti</strong>
        </p>
        <p style={{ fontSize: 12, color: '#0984e3', fontWeight: '600', margin: 0 }}>
          📱 <a href="https://wa.me/923334080780" target="_blank" rel="noopener noreferrer" style={{ color: '#0984e3', textDecoration: 'none' }}>+92 333 4080780</a>
        </p>
      </div>

    </main>
  );
}