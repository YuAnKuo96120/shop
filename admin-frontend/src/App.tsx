import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import config from './config';
import './App.css';
import { getToken } from './auth';
const Reservations = lazy(() => import('./pages/Reservations'));
const Tables = lazy(() => import('./pages/Tables'));
const Holidays = lazy(() => import('./pages/Holidays'));
const TimeSlots = lazy(() => import('./pages/TimeSlots'));
const Login = lazy(() => import('./pages/Login'));

function useAuth() {
  const [authed, setAuthed] = useState<boolean>(!!getToken());
  useEffect(() => {
    setAuthed(!!getToken());
  }, []);
  return authed;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authed = useAuth();
  const location = useLocation();
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

function Dashboard() {
  return (
    <div className="admin-dashboard">
      <h1>餐廳後台管理系統</h1>
      <div className="admin-menu">
        <Link to="/reservations" className="admin-btn">訂位管理</Link>
        <Link to="/tables" className="admin-btn">餐桌管理</Link>
        <Link to="/time-slots" className="admin-btn">可訂位時間管理</Link>
        <Link to="/holidays" className="admin-btn">公休日管理</Link>
        <Link to="/staff" className="admin-btn">員工管理</Link>
        <Link to="/report" className="admin-btn">報表分析</Link>
        <Link to="/login" className="admin-btn" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' }}>登入/登出</Link>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return <div style={{ textAlign: 'center', marginTop: 80 }}><h2>{title}</h2><p>功能開發中...</p></div>;
}

function WithBackHome({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 16px 0' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 24px', borderRadius: 8, background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16, cursor: 'pointer' }}>
          回到主頁
        </button>
      </div>
      {children}
    </div>
  );
}

function App() {
  return (
    <Router basename={config.BASE_PATH}>
      <Suspense fallback={<div style={{ textAlign: 'center', marginTop: 80 }}>載入中...</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reservations" element={<ProtectedRoute><WithBackHome><Reservations /></WithBackHome></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute><WithBackHome><Tables /></WithBackHome></ProtectedRoute>} />
          <Route path="/time-slots" element={<ProtectedRoute><WithBackHome><TimeSlots /></WithBackHome></ProtectedRoute>} />
          <Route path="/holidays" element={<ProtectedRoute><WithBackHome><Holidays /></WithBackHome></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><WithBackHome><Placeholder title="員工管理" /></WithBackHome></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><WithBackHome><Placeholder title="報表分析" /></WithBackHome></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
