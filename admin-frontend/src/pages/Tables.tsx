import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import config from '../config';

const statusMap: Record<string, string> = {
  available: '可用',
  occupied: '已佔用',
  reserved: '已預約',
};

interface Table {
  id: number;
  name: string;
  capacity: number;
  status: string;
  area?: string;
  sort_order?: number;
}

// 可拖拉的表格行元件
const SortableTableRow: React.FC<{ table: Table; onEdit: (table: Table) => void; onDelete: (id: number) => void }> = ({ table, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{ 
        ...style,
        display: 'table-row',
        background: isDragging ? '#f1f5f9' : 'transparent'
      }}
    >
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {table.id}
      </div>
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {table.name}
      </div>
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {table.capacity}
      </div>
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {statusMap[table.status]}
      </div>
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {table.area || 'main'}
      </div>
      <div 
        style={{ 
          display: 'table-cell', 
          padding: 8, 
          textAlign: 'center', 
          borderBottom: '1px solid #e5e7eb',
          cursor: 'grab'
        }}
        {...attributes}
        {...listeners}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, color: '#6366f1' }}>⋮⋮</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>拖拉排序</span>
        </div>
      </div>
      <div style={{ display: 'table-cell', padding: 8, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <button style={{ marginRight: 8 }} onClick={() => onEdit(table)}>編輯</button>
        <button onClick={() => onDelete(table.id)}>刪除</button>
      </div>
    </div>
  );
};

const Tables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<Table|null>(null);
  const [form, setForm] = useState({ name: '', capacity: 1, status: 'available', area: 'main' });
  const [formError, setFormError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
              const res = await fetch(`${config.API_URL}/admin/tables`);
      const data = await res.json();
      setTables(data);
    } catch {
      setError('載入失敗');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const openAdd = () => {
    setEditTable(null);
    setForm({ name: '', capacity: 1, status: 'available', area: 'main' });
    setFormError('');
    setShowModal(true);
  };
  
  const openEdit = (t: Table) => {
    setEditTable(t);
    setForm({ name: t.name, capacity: t.capacity, status: t.status, area: t.area || 'main' });
    setFormError('');
    setShowModal(true);
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除這張餐桌嗎？')) return;
          await fetch(`${config.API_URL}/admin/tables/${id}`, { method: 'DELETE' });
    fetchTables();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.capacity) {
      setFormError('請填寫完整資料');
      return;
    }
    if (editTable) {
              await fetch(`${config.API_URL}/admin/tables/${editTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      // 新增時設定排序順序為最後
      const maxSortOrder = Math.max(...tables.map(t => t.sort_order || 0), 0);
                             await fetch(`${config.API_URL}/admin/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sort_order: maxSortOrder + 1 })
      });
    }
    setShowModal(false);
    fetchTables();
  };

  // 處理拖拉結束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = tables.findIndex(table => table.id === active.id);
      const newIndex = tables.findIndex(table => table.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 先更新本地狀態，讓使用者看到即時效果
        const newTables = arrayMove(tables, oldIndex, newIndex);
        
        // 更新本地資料的 sort_order
        const updatedTables = newTables.map((table, index) => ({
          ...table,
          sort_order: index + 1
        }));
        
        setTables(updatedTables);

        // 更新資料庫中的排序順序
        const updatePromises = updatedTables.map((table) => 
          fetch(`${config.API_URL}/admin/tables/${table.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: table.sort_order })
          })
        );

        try {
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('更新排序失敗:', error);
          // 如果更新失敗，重新載入資料
          fetchTables();
        }
      }
    }
  };

  const sortedTables = [...tables].sort((a, b) => {
    // 確保 sort_order 存在且為數字
    const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 0;
    const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 0;
    return aOrder - bOrder;
  });

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>餐桌管理</h2>
      {loading ? <div>載入中...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
            <div style={{ display: 'table-header-group' }}>
              <div style={{ display: 'table-row', background: '#f1f5f9' }}>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>編號</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>桌名</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>人數</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>狀態</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>區域</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>排序</div>
                <div style={{ display: 'table-cell', padding: 8, fontWeight: 'bold' }}>操作</div>
              </div>
            </div>
            <div style={{ display: 'table-row-group' }}>
              <SortableContext
                items={sortedTables.map(table => table.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedTables.map((table) => (
                  <SortableTableRow
                    key={table.id}
                    table={table}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        </DndContext>
      )}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <button onClick={openAdd}>新增餐桌</button>
      </div>
      
      {/* 新增/編輯餐桌彈窗 */}
      {showModal && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', textAlign: 'center' }}>
            <h3 style={{ color: '#6366f1', marginBottom: 12 }}>{editTable ? '編輯餐桌' : '新增餐桌'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>桌名：</label>
                <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, width: '100%' }} />
              </div>
              <div>
                <label>人數：</label>
                <input name="capacity" type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} required style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, width: '100%' }} />
              </div>
              <div>
                <label>狀態：</label>
                <select name="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, width: '100%' }}>
                  <option value="available">可用</option>
                  <option value="occupied">已佔用</option>
                  <option value="reserved">已預約</option>
                </select>
              </div>
              <div>
                <label>區域：</label>
                <select name="area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, width: '100%' }}>
                  <option value="main">主區</option>
                  <option value="vip">VIP區</option>
                  <option value="outdoor">戶外區</option>
                </select>
              </div>
              {formError && <div style={{ color: '#f43f5e', marginTop: 4 }}>{formError}</div>}
              <div style={{ marginTop: 12 }}>
                <button type="button" style={{ marginRight: 16, background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px' }} onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px' }}>確定</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables; 