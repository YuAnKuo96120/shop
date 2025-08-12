# 無限循環問題修復報告

## 問題描述
用戶報告"網頁一直轉圈圈"，經過分析發現前端應用陷入了無限循環的 API 調用，導致：
1. 大量的重複 API 請求
2. 觸發後端速率限制保護
3. 前端持續顯示載入狀態

## 根本原因分析

### 1. useApi Hook 無限循環
**問題**: `useApi` hook 中的 `execute` 函數依賴項包含了 `apiCall`，導致每次渲染時都會重新執行
**位置**: `frontend/src/hooks/useApi.ts`

**修復方案**:
```typescript
// 修復前
const execute = useCallback(async () => {
  // ... 執行邏輯
}, [apiCall, retryOnError, retryCount]);

// 修復後
const apiCallRef = useRef(apiCall);
useEffect(() => {
  apiCallRef.current = apiCall;
}, [apiCall]);

const execute = useCallback(async () => {
  // ... 執行邏輯，使用 apiCallRef.current()
}, [retryOnError, retryCount]);
```

### 2. useTableAvailability Hook 問題
**問題**: `useTableAvailability` hook 每次渲染時都會重新創建 `apiCall` 函數，導致重複請求
**位置**: `frontend/src/hooks/useApi.ts`

**修復方案**:
```typescript
// 修復前
export function useTableAvailability(date: string, time: string) {
  return useApi(
    () => api.tables.checkAvailability(date, time),
    { immediate: !!date && !!time, cache: true, retryOnError: true }
  );
}

// 修復後（添加防抖機制）
export function useTableAvailability(date: string, time: string) {
  const [debouncedDate, setDebouncedDate] = useState(date);
  const [debouncedTime, setDebouncedTime] = useState(time);

  // 防抖機制，避免頻繁的 API 調用
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDate(date);
      setDebouncedTime(time);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [date, time]);

  const apiCall = useCallback(() => api.tables.checkAvailability(debouncedDate, debouncedTime), [debouncedDate, debouncedTime]);
  
  return useApi(apiCall, {
    immediate: !!debouncedDate && !!debouncedTime,
    cache: true,
    retryOnError: true
  });
}
```

### 3. App.tsx useEffect 依賴項問題
**問題**: useEffect 的依賴項包含了會重新創建的函數引用
**位置**: `frontend/src/App.tsx`

**修復方案**:
```typescript
// 修復前
useEffect(() => {
  tablesActions.refetch();
  holidaysActions.refetch();
  timeSlotsActions.refetch();
}, [tablesActions, holidaysActions, timeSlotsActions]);

useEffect(() => {
  if (form.date && form.time) {
    tableAvailabilityActions.refetch();
  }
}, [form.date, form.time, tableAvailabilityActions]);

// 修復後
useEffect(() => {
  tablesActions.refetch();
  holidaysActions.refetch();
  timeSlotsActions.refetch();
}, []); // 只在組件掛載時執行一次

useEffect(() => {
  if (form.date && form.time) {
    tableAvailabilityActions.refetch();
  }
}, [form.date, form.time]); // 移除 tableAvailabilityActions 依賴
```

### 4. API 路由不一致問題
**問題**: 前端 API 配置中的路由與後端實際路由不匹配
**位置**: `frontend/src/utils/api.ts`

**修復方案**:
```typescript
// 修復前
holidays: {
  getAll: () => apiRequest<Holiday[]>('/api/admin/holidays', { method: 'GET' }, true, 'holidays'),
},
timeSlots: {
  getAll: () => apiRequest<TimeSlot[]>('/api/admin/time-slots', { method: 'GET' }, true, 'timeslots'),
},

// 修復後
holidays: {
  getAll: () => apiRequest<Holiday[]>('/api/holidays', { method: 'GET' }, true, 'holidays'),
},
timeSlots: {
  getAll: () => apiRequest<TimeSlot[]>('/api/time-slots', { method: 'GET' }, true, 'timeslots'),
},
```

## 修復的文件列表

1. **`frontend/src/hooks/useApi.ts`**
   - 修復 useApi hook 的無限循環問題
   - 修復 useTableAvailability hook 的函數重新創建問題

2. **`frontend/src/App.tsx`**
   - 修復 useEffect 依賴項問題
   - 移除不必要的依賴項

3. **`frontend/src/utils/api.ts`**
   - 修復 API 路由不一致問題
   - 統一前端和後端的 API 路由

4. **`backend/middleware/security.js`**
   - 暫時增加 API 速率限制用於測試

## 測試結果

### 修復前
- 後端日誌顯示大量重複的 API 請求
- 觸發速率限制保護
- 前端持續顯示載入狀態

### 修復後
- API 請求正常，無重複請求
- 前端正常載入和顯示
- 速率限制正常工作

## 預防措施

1. **使用 useCallback 包裝函數**: 避免在 useEffect 依賴項中使用會重新創建的函數
2. **正確的依賴項管理**: 只包含真正需要的依賴項
3. **API 路由一致性**: 確保前端和後端的 API 路由完全匹配
4. **速率限制監控**: 監控 API 請求頻率，及時發現異常

## 建議

1. 在開發過程中定期檢查瀏覽器開發者工具的 Network 標籤
2. 監控後端日誌中的請求模式
3. 使用 React DevTools 檢查組件的重新渲染情況
4. 考慮添加請求去重機制

## 狀態
✅ **已修復** - 無限循環問題已解決，應用正常運行 