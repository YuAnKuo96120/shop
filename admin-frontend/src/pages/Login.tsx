import React, { useState } from 'react';
import config from '../config';
import { setToken, clearToken, getToken } from '../auth';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登入失敗');
        return;
      }
      setToken(data.token);
      window.location.href = (process.env.NODE_ENV === 'production' ? '/admin' : '/') + '';
    } catch (e) {
      setError('網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    window.location.reload();
  };

  const existing = getToken();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, textAlign: 'center' }}>管理員登入</h2>
        <p style={{ marginTop: 0, marginBottom: 24, textAlign: 'center', color: '#64748b' }}>請輸入管理密碼</p>
        {existing && (
          <div style={{ background: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc', padding: 8, borderRadius: 8, marginBottom: 12 }}>
            已存在登入令牌，若遇權限錯誤請登出重登。
          </div>
        )}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: 8, borderRadius: 8, marginBottom: 12 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入管理密碼"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '登入中...' : '登入'}
          </button>
          <button type="button" onClick={handleLogout} style={{ marginTop: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 500, cursor: 'pointer' }}>
            登出
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


