import React, { useState, useEffect } from 'react';
import './Holidays.css';
import config from '../config';
import { fetchWithAuth } from '../auth';

interface Holiday {
  id: number;
  date: string;
  reason: string;
  created_at: string;
}

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const API_BASE = `${config.API_URL}/api/admin`;

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/holidays`);
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      } else {
        setError('載入公休日資料失敗');
      }
    } catch (err) {
      setError('網路連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingHoliday) {
        // 編輯單個公休日
        const url = `${API_BASE}/holidays/${editingHoliday.id}`;
        const response = await fetchWithAuth(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          setShowForm(false);
          setEditingHoliday(null);
          setFormData({ date: '', reason: '' });
          setSelectedDates([]);
          fetchHolidays();
        } else {
          setError(data.error || '操作失敗');
        }
      } else {
        // 批量新增公休日
        const promises = selectedDates.map(date => 
          fetchWithAuth(`${API_BASE}/holidays`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date,
              reason: formData.reason
            }),
          })
        );

        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(r => r.json()));

        const hasError = results.some(result => !responses[results.indexOf(result)].ok);
        
        if (hasError) {
          const errorMessages = results
            .filter((result, index) => !responses[index].ok)
            .map(result => result.error)
            .filter(Boolean);
          setError(`部分日期設定失敗：${errorMessages.join(', ')}`);
        } else {
          setShowForm(false);
          setFormData({ date: '', reason: '' });
          setSelectedDates([]);
          setIsMultiSelect(false);
          fetchHolidays();
        }
      }
    } catch (err) {
      setError('網路連線錯誤');
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      reason: holiday.reason
    });
    setSelectedDates([holiday.date]);
    setIsMultiSelect(false);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此公休日嗎？')) return;

    try {
      const response = await fetchWithAuth(`${API_BASE}/holidays/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchHolidays();
      } else {
        const data = await response.json();
        setError(data.error || '刪除失敗');
      }
    } catch (err) {
      setError('網路連線錯誤');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingHoliday(null);
    setFormData({ date: '', reason: '' });
    setSelectedDates([]);
    setIsMultiSelect(false);
    setError('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    });
  };

  // 日曆相關函數
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const isHoliday = (date: string) => {
    return holidays.some(holiday => holiday.date === date);
  };

  const handleDateClick = (date: string) => {
    if (isHoliday(date)) return; // 已設定的公休日不能重複選擇

    if (isMultiSelect) {
      setSelectedDates(prev => {
        if (prev.includes(date)) {
          return prev.filter(d => d !== date);
        } else {
          return [...prev, date];
        }
      });
    } else {
      setSelectedDates([date]);
    }
  };

  const toggleMultiSelect = () => {
    setIsMultiSelect(!isMultiSelect);
    if (!isMultiSelect) {
      setSelectedDates([]);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    
    // 填充月初的空白天數
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDates.includes(dateString);
      const isHolidayDate = isHoliday(dateString);
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isHolidayDate ? 'holiday' : ''} ${isHolidayDate ? 'disabled' : ''}`}
          onClick={() => handleDateClick(dateString)}
        >
          {day}
          {isHolidayDate && <div className="holiday-indicator">休</div>}
          {isSelected && !isHolidayDate && <div className="selected-indicator">✓</div>}
        </div>
      );
    }
    
    return days;
  };

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  return (
    <div className="holidays-container">
      <h1>公休日管理</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="holidays-content">
        {/* 日曆選擇器 */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={prevMonth} className="month-nav-btn">&lt;</button>
            <h3>{currentMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}</h3>
            <button onClick={nextMonth} className="month-nav-btn">&gt;</button>
          </div>
          
          <div className="calendar-controls">
            <label className="multi-select-toggle">
              <input
                type="checkbox"
                checked={isMultiSelect}
                onChange={toggleMultiSelect}
              />
              <span>複選模式</span>
            </label>
            {selectedDates.length > 0 && (
              <div className="selected-count">
                已選擇 {selectedDates.length} 個日期
              </div>
            )}
          </div>
          
          <div className="calendar">
            <div className="calendar-weekdays">
              <div>日</div>
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div>六</div>
            </div>
            <div className="calendar-days">
              {renderCalendar()}
            </div>
          </div>
          
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color holiday"></div>
              <span>已設定公休日</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>選中的日期</span>
            </div>
            <div className="legend-item">
              <div className="legend-color multi"></div>
              <span>複選模式</span>
            </div>
          </div>
        </div>

        {/* 公休日列表 */}
        <div className="holidays-list-section">
          <div className="holidays-header">
            <h3>公休日列表</h3>
            <button 
              className="add-btn"
              onClick={() => setShowForm(true)}
              disabled={selectedDates.length === 0}
            >
              {isMultiSelect && selectedDates.length > 1 
                ? `新增 ${selectedDates.length} 個公休日` 
                : '新增公休日'
              }
            </button>
          </div>

          <div className="holidays-list">
            {holidays.length === 0 ? (
              <div className="empty-state">
                <p>目前沒有設定任何公休日</p>
              </div>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className="holiday-item">
                  <div className="holiday-info">
                    <div className="holiday-date">
                      {formatDate(holiday.date)}
                    </div>
                    {holiday.reason && (
                      <div className="holiday-reason">
                        原因：{holiday.reason}
                      </div>
                    )}
                  </div>
                  <div className="holiday-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(holiday)}
                    >
                      編輯
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(holiday.id)}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>
              {editingHoliday 
                ? '編輯公休日' 
                : selectedDates.length > 1 
                  ? `批量新增 ${selectedDates.length} 個公休日` 
                  : '新增公休日'
              }
            </h2>
            <form onSubmit={handleSubmit}>
              {editingHoliday ? (
                <div className="form-group">
                  <label htmlFor="date">日期：</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              ) : selectedDates.length > 1 ? (
                <div className="form-group">
                  <label>選中的日期：</label>
                  <div className="selected-dates-display">
                    {selectedDates.map(date => (
                      <span key={date} className="selected-date-tag">
                        {formatDate(date)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="date">日期：</label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDates[0] || ''}
                    onChange={(e) => setSelectedDates([e.target.value])}
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="reason">原因（選填）：</label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="例如：春節、員工旅遊..."
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingHoliday ? '更新' : '新增'}
                </button>
                <button type="button" className="cancel-btn" onClick={cancelForm}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays; 