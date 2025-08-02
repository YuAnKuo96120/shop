const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 開始測試 API 端點...\n');

  const endpoints = [
    { name: '健康檢查', url: '/health', method: 'GET' },
    { name: 'API 根路徑', url: '/api', method: 'GET' },
    { name: '餐桌列表', url: '/api/admin/tables', method: 'GET' },
    { name: '公休日列表', url: '/api/admin/holidays', method: 'GET' },
    { name: '時段列表', url: '/api/admin/time-slots', method: 'GET' },
    { name: '訂位列表', url: '/api/admin/reservations', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 測試 ${endpoint.name}...`);
      const response = await fetch(`${API_BASE}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name} - 成功 (${response.status})`);
        console.log(`   回應: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`❌ ${endpoint.name} - 失敗 (${response.status})`);
        console.log(`   錯誤: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - 錯誤`);
      console.log(`   錯誤: ${error.message}`);
    }
    console.log('');
  }

  console.log('🏁 API 測試完成！');
}

// 如果直接運行此腳本
if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { testAPI }; 