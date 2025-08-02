import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { useTables, useHolidays, useTimeSlots, useTableAvailability, useCreateReservation } from './hooks/useApi';
import { cacheManager } from './utils/api';
import { Table, Holiday, TimeSlot } from './types';

interface FormData {
  name: string;
  phone: string;
  date: string;
  time: string;
  people: string;
}

// 日期生成函數
const getDatesToNextMonthEnd = (): Array<{ value: string; label: string; day: number }> => {
  const dates = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const nextMonth = new Date(year, month + 2, 0);
  const daysDiff = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  for (let dayIndex = 0; dayIndex < daysDiff; dayIndex++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayIndex);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    dates.push({
      value: dateString,
      label: `${currentDate.getMonth() + 1}/${currentDate.getDate()}\n${['日','一','二','三','四','五','六'][currentDate.getDay()]}`,
      day: currentDate.getDay()
    });
  }
  return dates;
};

// 將日期分組為每週一行
const groupByWeek = (dates: Array<{ value: string; label: string; day: number }>) => {
  const weeks = [];
  let week = new Array(7).fill(null);
  let firstDay = dates[0].day;
  let i = 0;
  
  for (let d = 0; d < firstDay; d++) week[d] = null;
  
  for (const date of dates) {
    week[date.day] = date;
    if (date.day === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  }
  
  if (week.some(x => x)) weeks.push(week);
  return weeks;
};

// 常數
const DATE_OPTIONS = getDatesToNextMonthEnd();
const WEEKS = groupByWeek(DATE_OPTIONS);

// 日期選擇器組件
const DatePicker = React.memo<{
  selectedDate: string;
  onDateSelect: (date: string) => void;
  holidays: Holiday[];
}>(({ selectedDate, onDateSelect, holidays }) => {
  const isHoliday = useCallback((date: string) => {
    return holidays.some(h => h.date === date);
  }, [holidays]);

  const getHolidayReason = useCallback((date: string) => {
    const holiday = holidays.find(h => h.date === date);
    return holiday?.reason;
  }, [holidays]);

  return (
    <div className="date-picker">
      <div className="date-header">
        {['日','一','二','三','四','五','六'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      {WEEKS.map((week, i) => (
        <div key={i} className="date-week">
          {week.map((date, idx) => date ? (
            <button
              type="button"
              key={date.value}
              onClick={() => onDateSelect(date.value)}
              disabled={isHoliday(date.value)}
              className={`date-button ${selectedDate === date.value ? 'selected' : ''} ${isHoliday(date.value) ? 'holiday' : ''}`}
              title={isHoliday(date.value) ? `公休日${getHolidayReason(date.value) ? `（${getHolidayReason(date.value)}）` : ''}` : ''}
            >
              {date.label}
              {isHoliday(date.value) && (
                <div className="holiday-badge">休</div>
              )}
            </button>
          ) : (
            <div key={idx} style={{ flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
});

// 時間選擇器組件
const TimePicker = React.memo<{
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  timeSlots: TimeSlot[];
}>(({ selectedTime, onTimeSelect, timeSlots }) => {
  const firstRow = timeSlots.slice(0, 4);
  const secondRow = timeSlots.slice(4);

  return (
    <div className="time-picker">
      <div className="time-row">
        {firstRow.map((slot) => (
          <button
            type="button"
            key={slot.id}
            onClick={() => onTimeSelect(slot.time)}
            className={`time-button ${selectedTime === slot.time ? 'selected' : ''}`}
          >
            {slot.time}
          </button>
        ))}
      </div>
      <div className="time-row">
        {secondRow.map((slot) => (
          <button
            type="button"
            key={slot.id}
            onClick={() => onTimeSelect(slot.time)}
            className={`time-button ${selectedTime === slot.time ? 'selected' : ''}`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
});

// 餐桌選擇器組件
const TablePicker = React.memo<{
  people: number;
  tables: Table[];
  selectedTable: number | null;
  onTableSelect: (tableId: number) => void;
  loading: boolean;
}>(({ people, tables, selectedTable, onTableSelect, loading }) => {
  const availableTables = useMemo(() => {
    if (people >= 5) return [];
    
    let filteredTables: Table[] = [];
    if (people <= 2) {
      filteredTables = tables.filter(table => table.capacity === 2);
    } else if (people === 3) {
      filteredTables = tables.filter(table => table.capacity === 4);
    } else if (people === 4) {
      filteredTables = tables.filter(table => table.capacity === 4);
    }
    
    return filteredTables.filter(table => table.available !== false);
  }, [tables, people]);

  if (people >= 5) {
    return (
      <div className="table-info">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>5人以上訂位</div>
        <div>請聯繫餐廳服務人員，我們將為您安排合適的座位，電話0900000000</div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">載入餐桌資料中...</div>;
  }

  if (availableTables.length === 0) {
    return (
      <div className="error-message">
        {people === 3 ? '目前沒有4人桌' : 
         people <= 2 ? '目前沒有2人桌' : 
         '目前沒有合適的餐桌'}
      </div>
    );
  }

  return (
    <div className="table-picker">
      <div className="table-info">
        {people === 3 ? '3人訂位只能選擇4人桌' : 
         people <= 2 ? '只能選擇2人桌' : 
         '可選擇4人桌'}
      </div>
      <div className="table-grid">
        {availableTables.map(table => (
          <button
            type="button"
            key={table.id}
            onClick={() => onTableSelect(table.id)}
            disabled={!table.available}
            className={`table-button ${selectedTable === table.id ? 'selected' : ''}`}
          >
            {table.name}（{table.capacity}人）
            {!table.available && (
              <>
                <div className="table-status">已訂</div>
                <div className="table-status-bottom">已被預訂</div>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// 成功模態框組件
const SuccessModal = React.memo<{
  reservation: any;
  onClose: () => void;
}>(({ reservation, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 style={{ color: '#22c55e' }}>訂位成功！</h3>
      <div style={{ color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>您的訂位資訊</div>
      <div className="modal-info">
        <div>姓名：{reservation.name}</div>
        <div>電話：{reservation.phone}</div>
        <div>日期：{reservation.date}</div>
        <div>時間：{reservation.time}</div>
        <div>人數：{reservation.people}</div>
      </div>
      <button 
        className="modal-button primary"
        onClick={onClose}
      >
        關閉
      </button>
    </div>
  </div>
));

// 確認模態框組件
const ConfirmModal = React.memo<{
  form: FormData;
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
}>(({ form, tableName, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 style={{ color: '#6366f1' }}>確認訂位資料</h3>
      <div className="modal-info">
        <div>姓名：{form.name}</div>
        <div>電話：{form.phone}</div>
        <div>日期：{form.date}</div>
        <div>時間：{form.time}</div>
        <div>人數：{form.people}</div>
        <div>餐桌：{tableName}</div>
      </div>
      <div className="modal-buttons">
        <button 
          className="modal-button secondary"
          onClick={onCancel}
        >
          取消
        </button>
        <button 
          className="modal-button primary"
          onClick={onConfirm}
        >
          確定
        </button>
      </div>
    </div>
  </div>
));

// 手動配位模態框組件
const ManualAssignmentModal = React.memo<{
  form: FormData;
  onClose: () => void;
}>(({ form, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 style={{ color: '#f59e0b' }}>5人以上訂位</h3>
      <div className="modal-info">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>您的訂位需求：</div>
          <div>姓名：{form.name}</div>
          <div>電話：{form.phone}</div>
          <div>日期：{form.date}</div>
          <div>時間：{form.time}</div>
          <div>人數：{form.people}人</div>
        </div>
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: 8, 
          padding: 12,
          color: '#92400e'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>需要手動配位</div>
          <div>由於人數較多，我們需要為您安排合適的座位組合。請聯繫餐廳服務人員：</div>
          <div style={{ marginTop: 8, fontWeight: 600 }}>電話：(02) 1234-5678</div>
          <div style={{ fontWeight: 600 }}>營業時間：11:30-21:00</div>
        </div>
      </div>
      <button 
        className="modal-button primary"
        onClick={onClose}
      >
        了解
      </button>
    </div>
  </div>
));

// 側邊欄組件
const Sidebar = React.memo(() => (
  <div className="sidebar-fixed">
    {/* Facebook 連結區塊 */}
    <div className="sidebar-section">
      <a
        href="https://www.facebook.com/p/%E9%9A%8E%E6%A2%AF%E4%B8%8A%E9%A3%9F%E5%A0%82-100092527248895/"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link"
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor">
          <path d="M29 0H3C1.3 0 0 1.3 0 3v26c0 1.7 1.3 3 3 3h13V20h-4v-5h4v-3.6C16 7.6 18.4 5.5 22.1 5.5c1.5 0 2.9.1 3.3.2v3.8h-2.3c-1.8 0-2.2.9-2.2 2.1V15h4.4l-.6 5h-3.8v12h7c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z"/>
        </svg>
        階梯上食堂官方 Facebook
      </a>
    </div>
    
    {/* Google 地圖與評論區塊 */}
    <div className="sidebar-section">
      <h3>Google 地圖與評論</h3>
      <div className="map-container">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps?q=25.1816674,121.6882104&hl=zh-TW&z=16&output=embed"
          width="220"
          height="160"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      <a
        href="https://www.google.com/maps/place/%E9%9A%8E%E6%A2%AF%E4%B8%8A%E9%A3%9F%E5%A0%82%EF%BC%88%E5%8F%AF%E9%A0%90%E7%B4%84%E6%88%96%E7%8F%BE%E5%A0%B4%E7%99%BB%E8%A8%98%EF%BC%8C%E9%80%BE%E6%99%82%E5%8F%96%E6%B6%88%E4%B8%8D%E5%8F%A6%E8%A1%8C%E9%80%9A%E7%9F%A5%EF%BC%89/@25.1818709,121.6858326,984m/data=!3m2!1e3!4b1!4m6!3m5!1s0x345d4d7d9d6a3679:0x1bd198bbd63e0223!8m2!3d25.1818661!4d121.6884075!16s%2Fg%2F11kq435mvh?hl=zh-TW&entry=ttu&g_ep=EgoyMDI1MDcyNy4wIKXMDSoASAFQAw%3D%3D"
        target="_blank"
        rel="noopener noreferrer"
        className="map-link"
      >
        <svg width="22" height="22" viewBox="0 0 48 48" fill="currentColor">
          <path d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 30.1 35 24 35c-6.1 0-11.3-5-11.3-11s5.2-11 11.3-11c2.7 0 5.2.9 7.2 2.5l6.1-6.1C33.7 6.2 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.7-.4-3.5z"/>
          <path d="M6.3 14.7l6.6 4.8C15.2 16.1 19.2 13 24 13c2.7 0 5.2.9 7.2 2.5l6.1-6.1C33.7 6.2 29.1 4 24 4c-6.1 0-11.3 5-11.3 11 0 2.1.6 4.1 1.6 5.7z"/>
        </svg>
        查看 Google 評論
      </a>
    </div>
    
    {/* Trustindex Google 評論區塊 */}
    <div className="sidebar-section">
      <h3>客戶評價</h3>
      <div id="trustindex-widget" style={{ width: '220px', margin: '0 auto' }}></div>
    </div>
  </div>
));

function App() {
  // 表單狀態
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    date: '',
    time: '',
    people: '1'
  });

  // UI 狀態
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const [lastReservation, setLastReservation] = useState<any>(null);

  // API hooks
  const [tablesState, tablesActions] = useTables();
  const [holidaysState, holidaysActions] = useHolidays();
  const [timeSlotsState, timeSlotsActions] = useTimeSlots();
  const [tableAvailabilityState, tableAvailabilityActions] = useTableAvailability(form.date, form.time);
  const { createReservation, loading: createLoading, error: createError, success: createSuccess, reset: resetCreate } = useCreateReservation();

  // 載入資料
  useEffect(() => {
    tablesActions.refetch();
    holidaysActions.refetch();
    timeSlotsActions.refetch();
  }, []);

  // 當日期或時間改變時檢查餐桌可用性
  useEffect(() => {
    if (form.date && form.time) {
      tableAvailabilityActions.refetch();
    }
  }, [form.date, form.time]);

  // 處理表單變更
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // 處理日期選擇
  const handleDateSelect = useCallback((date: string) => {
    const isHoliday = (holidaysState.data as Holiday[])?.some((h: Holiday) => h.date === date);
    if (isHoliday) return;
    
    setForm(prev => ({ ...prev, date }));
    setSelectedTable(null);
  }, [holidaysState.data]);

  // 處理時間選擇
  const handleTimeSelect = useCallback((time: string) => {
    setForm(prev => ({ ...prev, time }));
    setSelectedTable(null);
  }, []);

  // 處理餐桌選擇
  const handleTableSelect = useCallback((tableId: number) => {
    setSelectedTable(tableId);
  }, []);

  // 驗證表單
  const validateForm = useCallback(() => {
    if (!form.name.trim()) return '請輸入姓名';
    if (!form.phone.trim()) return '請輸入電話';
    if (!form.date) return '請選擇日期';
    if (!form.time) return '請選擇時間';
    if (!form.people || parseInt(form.people) < 1) return '請輸入正確的人數';
    
    const people = parseInt(form.people);
    if (people >= 5) {
      setShowManualAssignment(true);
      return null;
    }
    
    if (!selectedTable) return '請選擇餐桌';
    
    return null;
  }, [form, selectedTable]);

  // 處理表單提交
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (!error) {
      setShowConfirm(true);
    }
  }, [validateForm]);

  // 處理確認訂位
  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);
    
    const reservationData = {
      ...form,
      table_id: selectedTable
    };

    await createReservation(reservationData);
  }, [form, selectedTable, createReservation]);

  // 處理訂位成功
  useEffect(() => {
    if (createSuccess) {
      setLastReservation({ ...form, table: (tablesState.data as Table[])?.find((t: Table) => t.id === selectedTable)?.name });
      setShowModal(true);
      setForm({ name: '', phone: '', date: '', time: '', people: '1' });
      setSelectedTable(null);
      resetCreate();
      // 清除相關快取
      cacheManager.clearAvailabilityCache();
    }
  }, [createSuccess, form, selectedTable, tablesState.data, resetCreate]);

  // 合併餐桌資料和可用性資料
  const mergedTables = useMemo(() => {
    if (!tablesState.data) return [];
    
    if (tableAvailabilityState.data) {
      return tableAvailabilityState.data;
    }
    
    return (tablesState.data as Table[]).filter((t: Table) => t.status === 'available');
  }, [tablesState.data, tableAvailabilityState.data]);

  // 檢查是否為公休日
  const isHoliday = useCallback((date: string) => {
    return (holidaysState.data as Holiday[])?.some((h: Holiday) => h.date === date) || false;
  }, [holidaysState.data]);

  // 載入狀態
  const isLoading = tablesState.loading || holidaysState.loading || timeSlotsState.loading;

  if (isLoading) {
    return (
      <div className="App">
        <div className="card">
          <h2>餐廳線上訂位</h2>
          <div className="loading">
            載入中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="card">
        <h2>餐廳線上訂位</h2>
        
        {/* 錯誤訊息 */}
        {createError && (
          <div className="error-message" style={{ marginBottom: 16 }}>
            {createError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名：</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              placeholder="請輸入您的姓名"
            />
          </div>
          
          <div className="form-group">
            <label>電話：</label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              required 
              placeholder="請輸入您的電話號碼"
              type="tel"
            />
          </div>
          
          <div className="form-group">
            <label>日期：</label>
                         <DatePicker
               selectedDate={form.date}
               onDateSelect={handleDateSelect}
               holidays={(holidaysState.data as Holiday[]) || []}
             />
             {!form.date && <div className="error-message">請選擇日期</div>}
           </div>
           
           <div className="form-group">
             <label>時間：</label>
             <TimePicker
               selectedTime={form.time}
               onTimeSelect={handleTimeSelect}
               timeSlots={(timeSlotsState.data as TimeSlot[]) || []}
             />
             {!form.time && <div className="error-message">請選擇時段</div>}
           </div>
          
          <div className="form-group">
            <label>人數：</label>
            <input 
              name="people" 
              value={form.people} 
              onChange={handleChange} 
              type="number" 
              min={1} 
              max={10}
              required 
              placeholder="請輸入人數"
            />
          </div>
          
          <div className="form-group">
            <label>選擇餐桌：</label>
                         <TablePicker
               people={parseInt(form.people) || 1}
               tables={mergedTables as Table[]}
               selectedTable={selectedTable}
               onTableSelect={handleTableSelect}
               loading={tableAvailabilityState.loading}
             />
          </div>
          
          <button 
            type="submit" 
            disabled={!form.date || !form.time || isHoliday(form.date) || createLoading}
          >
            {createLoading ? '處理中...' : '送出訂位'}
          </button>
        </form>
      </div>
      
      {/* 側邊欄 */}
      <Sidebar />
      
      {/* 成功模態框 */}
      {showModal && lastReservation && (
        <SuccessModal
          reservation={lastReservation}
          onClose={() => setShowModal(false)}
        />
      )}
      
      {/* 確認模態框 */}
      {showConfirm && (
                 <ConfirmModal
           form={form}
           tableName={(tablesState.data as Table[])?.find((t: Table) => t.id === selectedTable)?.name || ''}
           onConfirm={handleConfirm}
           onCancel={() => setShowConfirm(false)}
         />
      )}
      
      {/* 手動配位模態框 */}
      {showManualAssignment && (
        <ManualAssignmentModal
          form={form}
          onClose={() => setShowManualAssignment(false)}
        />
      )}
    </div>
  );
}

export default App;
