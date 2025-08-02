import React, { useEffect, useState } from 'react';
import config from '../config';

const statusMap: Record<string, string> = {
  pending: '未到店',
  arrived: '已到店',
  cancelled: '已取消',
};

interface Reservation {
  id: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  status: string;
  table_id: number | null;
  table_name: string | null;
}

interface Holiday {
  id: number;
  date: string;
  reason: string;
}

function getDatesToNextMonthEnd() {
  const dates = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // 下個月月底（month + 2, 0 會得到下個月的最後一天）
  const nextMonth = new Date(year, month + 2, 0);
  
  // 計算需要多少天
  const daysDiff = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  for (let i = 0; i < daysDiff; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    // 使用本地時間格式化日期，避免時區問題
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    dates.push({
      value: dateString,
      label: `${currentDate.getMonth() + 1}/${currentDate.getDate()} (${['日','一','二','三','四','五','六'][currentDate.getDay()]})`,
      day: currentDate.getDay()
    });
  }
  return dates;
}
function groupByWeek(dates: { value: string, label: string, day: number }[]) {
  const weeks = [];
  let week = new Array(7).fill(null);
  
  // 將星期日的 day 從 0 改為 7，讓星期一為 1，星期二為 2，...，星期日為 7
  const adjustedDates = dates.map(date => ({
    ...date,
    adjustedDay: date.day === 0 ? 7 : date.day
  }));
  
  let firstDay = adjustedDates[0].adjustedDay;
  // 填補第一週前面的空格（星期一開始）
  for (let d = 1; d < firstDay; d++) week[d - 1] = null;
  
  for (const date of adjustedDates) {
    week[date.adjustedDay - 1] = date; // 調整索引，讓星期一在索引 0
    if (date.adjustedDay === 7) { // 星期日（調整後為 7）
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  }
  if (week.some(x => x)) weeks.push(week);
  return weeks;
}
const DATE_OPTIONS = getDatesToNextMonthEnd();
const WEEKS = groupByWeek(DATE_OPTIONS);

const Reservations: React.FC = () => {
  const [data, setData] = useState<Reservation[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // 使用本地時間格式化今天的日期，避免時區問題
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
              const [reservationsRes, holidaysRes] = await Promise.all([
            fetch(`${config.API_URL}/admin/reservations`),
    fetch(`${config.API_URL}/holidays`)
        ]);
      
      const reservationsJson = await reservationsRes.json();
      const holidaysJson = await holidaysRes.json();
      
      setData(reservationsJson);
      setHolidays(holidaysJson);
    } catch (e) {
      setError('資料載入失敗');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleArrive = async (id: number) => {
    try {
      const res = await fetch(`${config.API_URL}/reservations/${id}/arrive`, { method: 'POST' });
      if (res.ok) {
        setMessage('標記到店成功！');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        setError('標記到店失敗');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e) {
      setError('標記到店失敗');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('確定要取消這個訂位嗎？')) {
      return;
    }
    
    try {
      const res = await fetch(`${config.API_URL}/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('取消訂位成功！');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      } else {
        setError('取消訂位失敗');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e) {
      setError('取消訂位失敗');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ 警告：此操作將刪除所有訂位記錄！\n\n確定要刪除所有訂位嗎？此操作無法復原！')) {
      return;
    }
    
    // 二次確認
    if (!window.confirm('最後確認：您真的要刪除所有訂位記錄嗎？\n\n此操作將永久刪除所有訂位資料！')) {
      return;
    }
    
    try {
      const res = await fetch(`${config.API_URL}/admin/reservations/all`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('已成功刪除所有訂位記錄！');
        setTimeout(() => setMessage(''), 5000);
        fetchData();
      } else {
        setError('刪除所有訂位失敗');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e) {
      setError('刪除所有訂位失敗');
      setTimeout(() => setError(''), 3000);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aDate = new Date(a.date + 'T' + a.time);
    const bDate = new Date(b.date + 'T' + b.time);
    return aDate.getTime() - bDate.getTime();
  });

  const filteredData = sortedData.filter(r => r.date === selectedDate);

  // 計算每一天的訂位數量
  const reservationCountByDate: Record<string, number> = {};
  sortedData.forEach(r => {
    reservationCountByDate[r.date] = (reservationCountByDate[r.date] || 0) + 1;
  });

  // 公休日判斷函數
  const isHoliday = (date: string) => {
    return holidays.some(holiday => holiday.date === date);
  };

  const getHolidayReason = (date: string) => {
    const holiday = holidays.find(h => h.date === date);
    return holiday?.reason || '';
  };



  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>訂位管理</h2>
        <button
          onClick={handleDeleteAll}
          style={{
            padding: '8px 16px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
        >
          🗑️ 刪除所有訂位
        </button>
      </div>
      
      {/* 訊息顯示 */}
      {message && (
        <div style={{ 
          marginBottom: 20, 
          padding: 12, 
          borderRadius: 8, 
          background: '#d1fae5', 
          color: '#065f46', 
          border: '1px solid #a7f3d0',
          fontWeight: 500
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginBottom: 20, 
          padding: 12, 
          borderRadius: 8, 
          background: '#fee2e2', 
          color: '#991b1b', 
          border: '1px solid #fca5a5',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 500, marginRight: 8 }}>選擇日期：</label>
        <div style={{ flexDirection: 'column', gap: 4, marginTop: 4, display: 'inline-block' }}>
          <div style={{ display: 'flex', gap: 8, fontWeight: 500, color: '#6366f1', marginBottom: 2 }}>
            {['一','二','三','四','五','六','日'].map(d => <div key={d} style={{ width: 60, textAlign: 'center' }}>{d}</div>)}
          </div>
          {WEEKS.map((week, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              {week.map((date, idx) => date ? (
                <button
                  type="button"
                  key={date.value}
                  onClick={() => {
                    if (!isHoliday(date.value)) {
                      setSelectedDate(date.value);
                    }
                  }}
                  style={{
                    width: 60,
                    height: 38,
                    padding: 0,
                    borderRadius: 8,
                    border: selectedDate === date.value ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    background: isHoliday(date.value) 
                      ? '#fefce8' 
                      : selectedDate === date.value 
                        ? 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)' 
                        : '#f1f5f9',
                    color: isHoliday(date.value) 
                      ? '#3b3b3b' 
                      : selectedDate === date.value 
                        ? '#fff' 
                        : '#3b3b3b',
                    fontWeight: 500,
                    cursor: isHoliday(date.value) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible'
                  }}
                  disabled={isHoliday(date.value)}
                >
                  <span style={{ zIndex: 1 }}>{date.label}</span>
                  {reservationCountByDate[date.value] ? (
                    <span style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: isHoliday(date.value) 
                        ? '#dc2626' 
                        : 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 13,
                      minWidth: 22,
                      height: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.18)',
                      padding: '0 6px',
                      fontWeight: 700,
                      border: '2px solid #fff',
                      zIndex: 2
                    }}>{reservationCountByDate[date.value]}</span>
                  ) : null}
                  {isHoliday(date.value) && (
                    <span style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      background: '#dc2626',
                      color: '#fff',
                      fontSize: 10,
                      width: 16,
                      height: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      休
                    </span>
                  )}
                </button>
              ) : (
                <div key={idx} style={{ width: 60 }} />
              ))}
            </div>
          ))}
        </div>
        

      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>載入中...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>編號</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>姓名</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>電話</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>日期</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>時間</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>人數</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>餐桌</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>狀態</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 'bold' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(r => {
                // 狀態樣式
                let statusClass = '';
                let statusText = statusMap[r.status] || r.status;
                switch(r.status) {
                  case 'pending':
                    statusClass = 'status-pending';
                    break;
                  case 'arrived':
                    statusClass = 'status-arrived';
                    break;
                  case 'cancelled':
                    statusClass = 'status-cancelled';
                    break;
                }
                
                // 餐桌資訊
                let tableInfo = '';
                if (r.table_id && r.table_name) {
                  tableInfo = r.table_name;
                } else {
                  tableInfo = 'N/A';
                }
                
                // 操作按鈕狀態
                const canArrive = r.status === 'pending';
                const canCancel = r.status === 'pending';
                
                return (
                  <tr key={r.id} style={{ 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                    <td style={{ padding: 12 }}>{r.id}</td>
                    <td style={{ padding: 12 }}>{r.name}</td>
                    <td style={{ padding: 12 }}>{r.phone}</td>
                    <td style={{ padding: 12 }}>{r.date}</td>
                    <td style={{ padding: 12 }}>{r.time}</td>
                    <td style={{ padding: 12 }}>{r.people}人</td>
                    <td style={{ padding: 12 }}>
                      {r.table_id && r.table_name ? (
                        <span style={{
                          background: '#e0f2fe',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          color: '#0277bd',
                          fontWeight: 500
                        }}>
                          {r.table_name}
                        </span>
                      ) : (
                        <span style={{
                          color: '#9e9e9e',
                          fontStyle: 'italic'
                        }}>
                          N/A
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        color: r.status === 'pending' ? '#f59e0b' : 
                               r.status === 'arrived' ? '#10b981' : 
                               r.status === 'cancelled' ? '#ef4444' : '#6b7280',
                        fontWeight: 'bold'
                      }}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button 
                        style={{ 
                          marginRight: 8,
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: 4,
                          cursor: canArrive ? 'pointer' : 'not-allowed',
                          fontSize: 12,
                          background: canArrive ? '#10b981' : '#9ca3af',
                          color: 'white',
                          transition: 'background-color 0.2s'
                        }}
                        disabled={!canArrive}
                        onClick={() => handleArrive(r.id)}
                        onMouseEnter={(e) => {
                          if (canArrive) e.currentTarget.style.background = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          if (canArrive) e.currentTarget.style.background = '#10b981';
                        }}
                      >
                        標記到店
                      </button>
                      <button 
                        style={{ 
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: 4,
                          cursor: canCancel ? 'pointer' : 'not-allowed',
                          fontSize: 12,
                          background: canCancel ? '#ef4444' : '#9ca3af',
                          color: 'white',
                          transition: 'background-color 0.2s'
                        }}
                        disabled={!canCancel}
                        onClick={() => handleCancel(r.id)}
                        onMouseEnter={(e) => {
                          if (canCancel) e.currentTarget.style.background = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          if (canCancel) e.currentTarget.style.background = '#ef4444';
                        }}
                      >
                        取消
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              {isHoliday(selectedDate) ? `該日期為公休日 (${getHolidayReason(selectedDate)})` : '該日期沒有訂位記錄'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reservations; 