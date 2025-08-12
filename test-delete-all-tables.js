// 使用 Node.js 內建的 fetch (Node.js 18+)

const API_BASE = 'http://localhost:3001';

async function testDeleteAllTables() {
  console.log('🧪 測試批量刪除餐桌功能...\n');

  try {
    // 1. 首先獲取當前餐桌列表
    console.log('📋 1. 獲取當前餐桌列表...');
    const getResponse = await fetch(`${API_BASE}/api/admin/tables`);
    const tables = await getResponse.json();
    console.log(`   當前有 ${tables.length} 張餐桌`);
    
    if (tables.length === 0) {
      console.log('   ⚠️ 沒有餐桌可以刪除');
      return;
    }

    // 2. 測試批量刪除 API
    console.log('\n🗑️ 2. 測試批量刪除 API...');
    const deleteResponse = await fetch(`${API_BASE}/api/admin/tables`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log(`   ✅ 刪除成功！`);
      console.log(`   訊息: ${result.message}`);
      console.log(`   刪除數量: ${result.deletedCount}`);
    } else {
      const error = await deleteResponse.json();
      console.log(`   ❌ 刪除失敗: ${error.error}`);
    }

    // 3. 驗證刪除結果
    console.log('\n🔍 3. 驗證刪除結果...');
    const verifyResponse = await fetch(`${API_BASE}/api/admin/tables`);
    const remainingTables = await verifyResponse.json();
    console.log(`   剩餘餐桌數量: ${remainingTables.length}`);
    
    if (remainingTables.length === 0) {
      console.log('   ✅ 所有餐桌已成功刪除！');
    } else {
      console.log('   ⚠️ 還有餐桌未刪除');
    }

  } catch (error) {
    console.log(`❌ 測試失敗: ${error.message}`);
  }

  console.log('\n🏁 測試完成！');
}

// 如果直接運行此腳本
if (require.main === module) {
  testDeleteAllTables().catch(console.error);
}

module.exports = { testDeleteAllTables }; 