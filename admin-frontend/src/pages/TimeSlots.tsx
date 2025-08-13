import React, { useState, useEffect } from 'react';
import './TimeSlots.css';
import config from '../config';
import { fetchWithAuth } from '../auth';

interface TimeSlot {
  id: number;
  time: string;
  is_active: number;
  sort_order: number;
  created_at: string;
}

const TimeSlots: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    time: '',
    sort_order: 0
  });

  const API_BASE = config.API_URL;

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/api/admin/time-slots`);
      if (!response.ok) throw new Error('載入失敗');
      const data = await response.json();
      setTimeSlots(data);
    } catch (err) {
      setError('載入時段資料失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/admin/time-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      setShowAddModal(false);
      setFormData({ time: '', sort_order: 0 });
      loadTimeSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/admin/time-slots/${editingSlot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      setShowEditModal(false);
      setEditingSlot(null);
      setFormData({ time: '', sort_order: 0 });
      loadTimeSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此時段嗎？')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/admin/time-slots/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      loadTimeSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/admin/time-slots/${id}/toggle`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      loadTimeSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      time: slot.time,
      sort_order: slot.sort_order
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setFormData({ time: '', sort_order: 0 });
    setShowAddModal(true);
  };

  if (loading) return <div className="loading">載入中...</div>;

  return (
    <div className="time-slots-container">
      <div className="header">
        <h1>可訂位時間管理</h1>
        <button className="add-btn" onClick={openAddModal}>
          新增時段
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="time-slots-list">
        <table>
          <thead>
            <tr>
              <th>排序</th>
              <th>時間</th>
              <th>狀態</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => (
              <tr key={slot.id}>
                <td>{slot.sort_order}</td>
                <td>{slot.time}</td>
                <td>
                  <span className={`status ${slot.is_active ? 'active' : 'inactive'}`}>
                    {slot.is_active ? '啟用' : '停用'}
                  </span>
                </td>
                <td>{new Date(slot.created_at).toLocaleString('zh-TW')}</td>
                <td>
                  <button 
                    className="toggle-btn"
                    onClick={() => handleToggleStatus(slot.id)}
                  >
                    {slot.is_active ? '停用' : '啟用'}
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(slot)}
                  >
                    編輯
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(slot.id)}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增時段 Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>新增時段</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>時間 (HH:MM):</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>排序:</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-btn">儲存</button>
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編輯時段 Modal */}
      {showEditModal && editingSlot && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>編輯時段</h2>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>時間 (HH:MM):</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>排序:</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-btn">儲存</button>
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
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

export default TimeSlots; 