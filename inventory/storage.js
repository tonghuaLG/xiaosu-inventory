// storage.js - Firebase Realtime Database 版本
// 完全替代 localStorage，使用 Firebase 实现多端实时同步

// ========== Firebase 配置 ==========
const firebaseConfig = {
  apiKey: "AIzaSyC3sN6K9pjOW5RgyalZ556Pe-e0NuT7z94",
  authDomain: "xiaosu-inventory.firebaseapp.com",
  databaseURL: "https://xiaosu-inventory-default-rtdb.firebaseio.com",
  projectId: "xiaosu-inventory",
  storageBucket: "xiaosu-inventory.firebasestorage.app",
  messagingSenderId: "183861894727",
  appId: "1:183861894727:web:c0b582cb7907aa11c61b62"
};

// ========== 全局状态 ==========
let firebaseInitialized = false;
let db = null;
let ordersRef = null;
let inventoryModsRef = null;

// 本地缓存
let localOrders = [];
let localInventoryMods = [];

// 初始化标志
let dataLoaded = false;

// 原始库存数据（用于重置，防止重复应用mod）
let originalRawData = null;

function saveOriginalData() {
  if (originalRawData) return;
  if (typeof rawData === 'undefined') {
    console.warn('[Firebase] rawData 未定义，延迟保存原始数据');
    setTimeout(saveOriginalData, 100);
    return;
  }
  originalRawData = JSON.parse(JSON.stringify(rawData));
  console.log('[Firebase] 已保存原始库存数据，共', originalRawData.length, '个服务器');
}

// 页面加载后立即保存原始数据
setTimeout(saveOriginalData, 0);

// ========== Firebase 初始化 ==========
function initFirebase() {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized) {
      resolve();
      return;
    }

    // 检查 Firebase SDK 是否已加载
    if (typeof firebase === 'undefined') {
      // 等待 SDK 加载
      const checkInterval = setInterval(() => {
        if (typeof firebase !== 'undefined') {
          clearInterval(checkInterval);
          initializeApp();
        }
      }, 100);

      // 超时保护
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Firebase SDK 加载超时'));
      }, 10000);
    } else {
      initializeApp();
    }

    function initializeApp() {
      try {
        // 初始化 Firebase App（如果尚未初始化）
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }

        // 获取 Realtime Database 引用
        db = firebase.database();
        ordersRef = db.ref('orders');
        inventoryModsRef = db.ref('inventory_mods');

        firebaseInitialized = true;
        console.log('[Firebase] 初始化成功');
        resolve();
      } catch (error) {
        console.error('[Firebase] 初始化失败:', error);
        reject(error);
      }
    }
  });
}

// ========== 数据加载 ==========

// 从 Firebase 加载所有数据到本地缓存
async function loadDataFromFirebase() {
  if (!firebaseInitialized) {
    throw new Error('Firebase 未初始化');
  }

  try {
    updateSyncStatus('syncing', '正在加载数据...');

    // 加载订单
    const ordersSnapshot = await ordersRef.once('value');
    const ordersData = ordersSnapshot.val();
    localOrders = ordersData ? Object.entries(ordersData).map(([key, order]) => ({
      ...order,
      _firebaseKey: key
    })) : [];

    // 加载库存修改记录
    const modsSnapshot = await inventoryModsRef.once('value');
    const modsData = modsSnapshot.val();
    localInventoryMods = modsData ? Object.entries(modsData).map(([key, mod]) => ({
      ...mod,
      _firebaseKey: key
    })) : [];

    dataLoaded = true;
    updateSyncStatus('success', '数据加载成功');
    console.log(`[Firebase] 数据加载完成: ${localOrders.length} 个订单, ${localInventoryMods.length} 条库存修改记录`);

    return true;
  } catch (error) {
    console.error('[Firebase] 数据加载失败:', error);
    updateSyncStatus('error', '数据加载失败');
    throw error;
  }
}

// 设置实时监听
function setupRealtimeListeners() {
  if (!firebaseInitialized) {
    console.error('[Firebase] 未初始化，无法设置实时监听');
    return;
  }

  // 监听订单变化
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    localOrders = data ? Object.entries(data).map(([key, order]) => ({
      ...order,
      _firebaseKey: key
    })) : [];

    console.log('[Firebase] 订单数据实时更新，当前数量:', localOrders.length);

    // 触发自定义事件，通知页面刷新
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: localOrders }));
  });

  // 监听库存修改记录变化
  inventoryModsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    localInventoryMods = data ? Object.entries(data).map(([key, mod]) => ({
      ...mod,
      _firebaseKey: key
    })) : [];

    console.log('[Firebase] 库存修改记录实时更新，当前数量:', localInventoryMods.length);

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('inventoryModsUpdated', { detail: localInventoryMods }));
  });

  console.log('[Firebase] 实时监听已设置');
}

// ========== 库存修改记录管理 ==========

function getInventoryMods() {
  return localInventoryMods;
}

async function saveInventoryMod(server, category, item, delta) {
  if (!firebaseInitialized) {
    throw new Error('Firebase 未初始化');
  }

  const mod = {
    server: server,
    category: category,
    item: item,
    delta: delta,
    timestamp: new Date().toISOString()
  };

  const newRef = inventoryModsRef.push();
  await newRef.set(mod);

  // 更新本地缓存
  mod._firebaseKey = newRef.key;
  localInventoryMods.push(mod);

  console.log('[Firebase] 库存修改记录已保存');
}

async function applyInventoryMods() {
  if (typeof rawData === 'undefined') {
    console.warn('库存数据未加载，无法应用修改记录');
    return;
  }

  // 保存原始数据（仅首次）
  if (!originalRawData) {
    saveOriginalData();
  }

  // 重置 rawData 到原始状态，防止重复应用 mod
  if (originalRawData) {
    try {
      rawData = JSON.parse(JSON.stringify(originalRawData));
    } catch(e) {
      console.error('[Firebase] 重置库存数据失败:', e);
      return;
    }
  }

  // 如果 Firebase 数据尚未加载，先加载
  if (!dataLoaded) {
    await loadDataFromFirebase();
  }

  if (!localInventoryMods || localInventoryMods.length === 0) return;

  console.log(`应用 ${localInventoryMods.length} 条库存修改记录`);

  localInventoryMods.forEach(mod => {
    const serverData = rawData.find(s => s.server === mod.server);
    if (!serverData) {
      console.warn(`服务器不存在: ${mod.server}`);
      return;
    }

    // 查找物品并应用修改
    let found = false;
    for (const cat of serverData.items) {
      const itemData = cat.list.find(i => i.n === mod.item);
      if (itemData) {
        itemData.q += mod.delta;
        // 确保库存不为负数
        if (itemData.q < 0) {
          console.warn(`库存不足: ${mod.server} / ${mod.item}, 调整为0`);
          itemData.q = 0;
        }
        found = true;
        break;
      }
    }

    if (!found) {
      console.warn(`物品不存在: ${mod.server} / ${mod.item}`);
    }
  });
}

async function clearInventoryMods() {
  if (!firebaseInitialized) {
    throw new Error('Firebase 未初始化');
  }

  await inventoryModsRef.remove();
  localInventoryMods = [];
  console.log('[Firebase] 库存修改记录已清除');
}

// ========== 订单管理 ==========

function getOrders() {
  return localOrders;
}

async function addOrder(order) {
  console.log('[Firebase] 开始添加订单:', order);

  // 检查 Firebase 是否已初始化
  if (!firebaseInitialized || !ordersRef) {
    throw new Error('Firebase 未连接，无法保存订单，请刷新页面重试');
  }

  // 校验并扣减库存
  if (typeof rawData === 'undefined') {
    console.error('[Firebase] 库存数据未加载');
    throw new Error('库存数据未加载');
  }

  const serverData = rawData.find(s => s.server === order.server);
  if (!serverData) {
    throw new Error('服务器不存在: ' + order.server);
  }

  // 查找物品并计算总库存
  let totalStock = 0;
  const itemLocations = [];
  for (const cat of serverData.items) {
    for (const item of cat.list) {
      if (item.n === order.item) {
        totalStock += item.q;
        itemLocations.push({ cat: cat.cat, item, qty: item.q });
      }
    }
  }

  if (totalStock < order.qty) {
    throw new Error(`库存不足！当前库存: ${totalStock}`);
  }

  // 扣减库存（优先扣"小奖（本月）"，再扣"小奖（历史）"，最后其他）
  let remaining = order.qty;
  const priorityCats = ['小奖（本月）', '小奖（历史）'];

  // 先按优先级排序
  const sortedLocations = itemLocations.sort((a, b) => {
    const aPriority = priorityCats.includes(a.cat) ? 0 : 1;
    const bPriority = priorityCats.includes(b.cat) ? 0 : 1;
    return aPriority - bPriority;
  });

  for (const loc of sortedLocations) {
    if (remaining <= 0) break;
    const deduct = Math.min(loc.item.q, remaining);
    loc.item.q -= deduct;
    remaining -= deduct;
  }

  // 【关键】记录库存修改到 Firebase
  await saveInventoryMod(order.server, order.category, order.item, -order.qty);

  // 保存订单
  order.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  order.status = 'pending';
  order.createdAt = new Date().toISOString();

  const newRef = ordersRef.push();
  order._firebaseKey = newRef.key;

  try {
    await newRef.set(order);
    console.log('[Firebase] 订单已保存！订单ID:', order.id);
  } catch (err) {
    console.error('[Firebase] 订单保存失败:', err);
    throw new Error('订单保存失败（Firebase 写入被拒绝）：' + err.message);
  }

  // 更新本地缓存
  localOrders.push(order);

  return order;
}

async function updateOrder(id, updates) {
  const order = localOrders.find(o => o.id === id);
  if (!order) {
    console.error('[Firebase] 订单未找到:', id);
    return null;
  }

  const oldStatus = order.status;
  const newStatus = updates.status;

  // 记录完成时间
  if ((newStatus === 'shipped' || newStatus === 'cancelled') && !order.finishedAt) {
    updates.finishedAt = new Date().toISOString();
  }

  // 【关键】处理库存恢复逻辑
  if (oldStatus !== newStatus) {
    const orderData = order;

    if (newStatus === 'cancelled' && oldStatus === 'pending') {
      // 取消待发货订单 → 恢复库存
      await saveInventoryMod(orderData.server, orderData.category, orderData.item, +orderData.qty);

      // 同时更新 rawData（内存）
      const serverData = rawData.find(s => s.server === orderData.server);
      if (serverData) {
        for (const cat of serverData.items) {
          const itemData = cat.list.find(i => i.n === orderData.item);
          if (itemData) {
            itemData.q += orderData.qty;
            break;
          }
        }
      }
    } else if (newStatus === 'pending' && oldStatus === 'cancelled') {
      // 从取消恢复为待发货 → 扣减库存
      await saveInventoryMod(orderData.server, orderData.category, orderData.item, -orderData.qty);

      // 同时更新 rawData（内存）
      const serverData = rawData.find(s => s.server === orderData.server);
      if (serverData) {
        for (const cat of serverData.items) {
          const itemData = cat.list.find(i => i.n === orderData.item);
          if (itemData) {
            itemData.q -= orderData.qty;
            break;
          }
        }
      }
    }
    // 注意：shipped 状态不修改库存
  }

  // 更新 Firebase
  const orderRef = ordersRef.child(order._firebaseKey);
  await orderRef.update({ ...order, ...updates });

  // 更新本地缓存
  const index = localOrders.findIndex(o => o.id === id);
  if (index !== -1) {
    localOrders[index] = { ...localOrders[index], ...updates };
  }

  console.log('[Firebase] 订单已更新:', id);

  // 触发库存刷新（通知所有页面重新应用mod）
  window.dispatchEvent(new CustomEvent('inventoryModsUpdated', { detail: localInventoryMods }));

  return { ...order, ...updates };
}

async function deleteOrder(id) {
  const order = localOrders.find(o => o.id === id);
  if (!order) {
    console.error('[Firebase] 订单未找到:', id);
    return;
  }

  const orderRef = ordersRef.child(order._firebaseKey);
  await orderRef.remove();

  // 更新本地缓存
  localOrders = localOrders.filter(o => o.id !== id);

  console.log('[Firebase] 订单已删除:', id);
}

// ========== 其他 Storage API ==========

// 获取库存数据（从 data.js 的 rawData）
function getInventory() {
  return typeof rawData !== 'undefined' ? rawData : [];
}

// 补货（增加库存）
async function restock(server, itemName, delta) {
  if (typeof rawData === 'undefined') return false;
  const serverData = rawData.find(s => s.server === server);
  if (!serverData) return false;

  // 找到第一个匹配的物品并增加库存
  for (const cat of serverData.items) {
    const item = cat.list.find(i => i.n === itemName);
    if (item) {
      item.q += delta;

      // 保存库存修改记录
      await saveInventoryMod(server, cat.cat, itemName, +delta);

      return true;
    }
  }
  return false;
}

// 批量补货
async function batchRestock(items) {
  const result = { success: 0, failed: 0, details: [] };

  if (typeof rawData === 'undefined') {
    return { success: 0, failed: items.length, details: items.map(i => ({
      server: i.server,
      item: i.item,
      error: '库存数据未加载'
    }))};
  }

  for (const { server, item, qty } of items) {
    if (!server || !item || !qty || qty <= 0) {
      result.failed++;
      result.details.push({ server, item, error: '参数不完整' });
      continue;
    }

    const serverData = rawData.find(s => s.server === server);
    if (!serverData) {
      result.failed++;
      result.details.push({ server, item, error: '服务器不存在' });
      continue;
    }

    let found = false;
    for (const cat of serverData.items) {
      const itemData = cat.list.find(i => i.n === item);
      if (itemData) {
        const oldQty = itemData.q;
        itemData.q += qty;
        found = true;
        result.success++;
        result.details.push({ server, item, qty, oldQty, newQty: itemData.q });

        // 保存库存修改记录
        await saveInventoryMod(server, cat.cat, item, +qty);

        break;
      }
    }

    if (!found) {
      result.failed++;
      result.details.push({ server, item, error: '物品不存在' });
    }
  }

  return result;
}

// 导出订单为 JSON 文件
async function exportOrders() {
  const orders = getOrders();
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xiaosu_orders_${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 从 JSON 文件导入订单
async function importOrders(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const orders = JSON.parse(e.target.result);
        if (!Array.isArray(orders)) {
          reject(new Error('文件格式错误：不是有效的订单数组'));
          return;
        }

        // 批量写入 Firebase
        const promises = orders.map(order => {
          return new Promise((resolve, reject) => {
            const newRef = ordersRef.push();
            order._firebaseKey = newRef.key;
            newRef.set(order, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
        });

        await Promise.all(promises);

        // 重新加载本地缓存
        await loadDataFromFirebase();

        resolve(orders.length);
      } catch (err) {
        reject(new Error('文件解析失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

// 验证管理员密码（前端简单验证）
function verifyPassword(password) {
  return password === 'xiasu666';
}

// ========== 初始化函数 ==========

// 初始化云同步
async function initCloudSync() {
  console.log('[Firebase] 初始化云同步...');

  try {
    await initFirebase();
    await loadDataFromFirebase();
    setupRealtimeListeners();

    console.log('[Firebase] 云同步已启用');
    return true;
  } catch (error) {
    console.error('[Firebase] 初始化失败:', error);
    updateSyncStatus('error', 'Firebase初始化失败');
    return false;
  }
}

// 更新同步状态指示器
function updateSyncStatus(status, message) {
  const statusEl = document.getElementById('sync-status');
  if (!statusEl) return;

  const statusConfig = {
    'syncing': { icon: '🔄', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)' },
    'success': { icon: '✅', color: '#51cf66', bg: 'rgba(81, 207, 102, 0.1)' },
    'error': { icon: '❌', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' }
  };

  const config = statusConfig[status] || statusConfig['syncing'];

  statusEl.innerHTML = `${config.icon} ${message}`;
  statusEl.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 1000;
    background: ${config.bg};
    color: ${config.color};
    border: 1px solid ${config.color}33;
    transition: all 0.3s;
  `;

  // 成功或失败后，3秒后隐藏
  if (status !== 'syncing') {
    setTimeout(() => {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 300);
    }, 3000);
  } else {
    statusEl.style.display = 'block';
    statusEl.style.opacity = '1';
  }
}

// ========== 主存储对象 ==========
const Storage = {
  getInventoryMods,
  saveInventoryMod,
  applyInventoryMods,
  clearInventoryMods,
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getInventory,
  restock,
  batchRestock,
  exportOrders,
  importOrders,
  verifyPassword,
  initCloudSync
};
