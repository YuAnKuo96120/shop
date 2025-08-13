import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import config from './config';
import './App.css';
import Reservations from './pages/Reservations';
import Tables from './pages/Tables';
import Holidays from './pages/Holidays';
import TimeSlots from './pages/TimeSlots';

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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reservations" element={<WithBackHome><Reservations /></WithBackHome>} />
        <Route path="/tables" element={<WithBackHome><Tables /></WithBackHome>} />
        <Route path="/time-slots" element={<WithBackHome><TimeSlots /></WithBackHome>} />
        <Route path="/holidays" element={<WithBackHome><Holidays /></WithBackHome>} />
        <Route path="/staff" element={<WithBackHome><Placeholder title="員工管理" /></WithBackHome>} />
        <Route path="/report" element={<WithBackHome><Placeholder title="報表分析" /></WithBackHome>} />
      </Routes>
    </Router>
  );
}

export default App;
