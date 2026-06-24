const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 18890;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据存储
const DB_FILE = path.join(__dirname, 'db.json');
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [], inventory: [] }), 'utf-8');
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// 管理员密码
const ADMIN_PASS = 'xiasu666';

// ====== 库存 API ======

// 获取库存数据
app.get('/api/inventory', (req, res) => {
  const db = loadDB();
  res.json({ servers: db.inventory || [], count: (db.inventory || []).length });
});

// 更新库存数据（管理员）
app.post('/api/inventory', (req, res) => {
  const { password, data } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  db.inventory = data;
  saveDB(db);
  res.json({ ok: true, count: data.length });
});

// 单个补货（管理员）
app.patch('/api/inventory/restock', (req, res) => {
  const { password, server, item, qty } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  if (!server || !item || !qty || qty <= 0) return res.status(400).json({ error: '参数不完整' });
  const db = loadDB();
  const sv = (db.inventory || []).find(s => s.server === server);
  if (!sv) return res.status(404).json({ error: '服务器不存在' });
  let found = false, oldQty = 0;
  for (const cat of sv.items) {
    const it = cat.list.find(i => i.n === item);
    if (it) { oldQty = it.q; it.q += qty; found = true; break; }
  }
  if (!found) return res.status(404).json({ error: '物品不存在' });
  saveDB(db);
  res.json({ ok: true, server, item, oldQty, newQty: oldQty + qty });
});

// 批量补货（管理员）
app.post('/api/inventory/batch-restock', (req, res) => {
  const { password, items } = req.body;  // items: [{server, item, qty}]
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: '请提供补货数据' });
  const db = loadDB();
  if (!db.inventory || db.inventory.length === 0) return res.status(400).json({ error: '库存数据未初始化' });
  const result = { success: 0, failed: 0, details: [] };
  items.forEach(({ server, item, qty }) => {
    if (!server || !item || !qty || qty <= 0) {
      result.failed++;
      result.details.push({ server, item, error: '参数不完整' });
      return;
    }
    const sv = db.inventory.find(s => s.server === server);
    if (!sv) {
      result.failed++;
      result.details.push({ server, item, error: '服务器不存在' });
      return;
    }
    let found = false;
    for (const cat of sv.items) {
      const it = cat.list.find(i => i.n === item);
      if (it) { it.q += qty; found = true; break; }
    }
    if (found) {
      result.success++;
      const newQty = sv.items.flatMap(c => c.list).find(i => i.n === item).q;
      result.details.push({ server, item, qty, newQty });
    } else {
      result.failed++;
      result.details.push({ server, item, error: '物品不存在' });
    }
  });
  saveDB(db);
  res.json({ ok: true, result });
});

// ====== 订单 API ======

// 获取所有订单（管理员）
app.get('/api/orders', (req, res) => {
  const db = loadDB();
  const orders = db.orders || [];
  res.json({ orders, count: orders.length });
});

// 玩家下单
app.post('/api/orders', (req, res) => {
  const { server, buyer, item, qty, platform, category } = req.body;
  if (!server || !buyer || !item || !qty || qty <= 0) {
    return res.status(400).json({ error: '请填写完整订单信息' });
  }
  const db = loadDB();
  const sv = (db.inventory || []).find(s => s.server === server || s.server.includes(server) || server.includes(s.server));
  if (!sv) return res.status(400).json({ error: '服务器不存在' });
  let stockQty = 0;
  sv.items.forEach(cat => cat.list.forEach(i => { if (i.n === item) stockQty += i.q; }));
  if (qty > stockQty) return res.status(400).json({ error: `库存不足（库存:${stockQty}）` });
  
  // 扣减库存（只扣对应分类）
  const deductLog = [];
  let remaining = qty;
  for (const cat of sv.items) {
    if (category && cat.cat !== category) continue;
    for (const it of cat.list) {
      if (it.n === item && remaining > 0) {
        const deduct = Math.min(it.q, remaining);
        it.q -= deduct;
        remaining -= deduct;
        deductLog.push(`${cat.cat}/${it.n}: -${deduct} → ${it.q}`);
      }
    }
  }
  // 立即写入文件并验证
  saveDB(db);
  // 读回验证
  const verifyDB = loadDB();
  const vSv = verifyDB.inventory.find(s => s.server === sv.server);
  let verifiedQty = 0;
  if (vSv) vSv.items.forEach(c => c.list.forEach(i => { if (i.n === item) verifiedQty += i.q; }));
  console.log(`[扣减] ${item} 扣减后文件中总库存=${verifiedQty} | 详情: ${deductLog.join(' | ')}`);
  
  const order = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    server, buyer, item, qty, platform: platform || '天使黄金',
    category: category || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    shippedAt: null
  };
  db.orders.unshift(order);
  saveDB(db);
  res.json({ ok: true, order });
});

// 更新订单状态（管理员）
app.patch('/api/orders/:id', (req, res) => {
  const { password, status } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const oldStatus = order.status;

  // 库存处理
  const targetCats = order.category ? [order.category] : null;
  if (oldStatus !== 'cancelled' && status === 'cancelled') {
    // 取消订单 → 返还库存（只返对应分类）
    const sv = db.inventory.find(s => s.server === order.server);
    if (sv) {
      const cats = targetCats ? sv.items.filter(c => targetCats.includes(c.cat)) : sv.items;
      for (const cat of cats) {
        for (const it of cat.list) {
          if (it.n === order.item) { it.q += order.qty; break; }
        }
      }
    }
    console.log(`[库存] 取消订单返还: ${order.server} ${order.item} +${order.qty} ${order.category || '(全部)'}`);
  } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
    // 从取消恢复 → 重新扣库存（只扣对应分类）
    const sv = db.inventory.find(s => s.server === order.server);
    if (sv) {
      const cats = targetCats ? sv.items.filter(c => targetCats.includes(c.cat)) : sv.items;
      let remaining = order.qty;
      for (const cat of cats) {
        for (const it of cat.list) {
          if (it.n === order.item && remaining > 0) {
            const deduct = Math.min(it.q, remaining);
            it.q -= deduct;
            remaining -= deduct;
          }
        }
      }
    }
    console.log(`[库存] 恢复订单重扣: ${order.server} ${order.item} -${order.qty} ${order.category || '(全部)'}`);
  }

  order.status = status;
  if (status === 'shipped') order.shippedAt = new Date().toISOString();
  saveDB(db);
  res.json({ ok: true, order });
});

// 删除订单（管理员）
app.delete('/api/orders/:id', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  const order = db.orders.find(o => o.id === req.params.id);
  // 删除未取消的订单时，返还库存（只返对应分类）
  if (order && order.status !== 'cancelled') {
    const sv = db.inventory.find(s => s.server === order.server);
    if (sv) {
      const cats = order.category ? sv.items.filter(c => c.cat === order.category) : sv.items;
      for (const cat of cats) {
        for (const it of cat.list) {
          if (it.n === order.item) { it.q += order.qty; break; }
        }
      }
    }
    console.log(`[库存] 删除订单返还: ${order.server} ${order.item} +${order.qty} ${order.category || '(全部)'}`);
  }
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// 清空所有订单（管理员）
app.delete('/api/orders', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  const count = (db.orders || []).length;
  db.orders = [];
  saveDB(db);
  console.log(`[订单] 清空所有订单，共 ${count} 条`);
  res.json({ ok: true, count });
});

// 导出订单为 Excel 数据（管理员）
app.post('/api/orders/export', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  res.json({ orders: db.orders || [] });
});

// ====== 启动 ======
app.listen(PORT, () => {
  console.log(`🚀 小酥存货系统启动成功！`);
  console.log(`   玩家端: http://localhost:${PORT}`);
  console.log(`   管理端: http://localhost:${PORT}/admin.html`);
  console.log(`   管理密码: ${ADMIN_PASS}`);
  const db = loadDB();
  if (!db.inventory || db.inventory.length === 0) {
    const dataPath = path.join(__dirname, 'data.js');
    if (fs.existsSync(dataPath)) {
      try {
        const content = fs.readFileSync(dataPath, 'utf-8');
        const fn = new Function(content + '; return rawData;');
        const data = fn();
        db.inventory = data;
        saveDB(db);
        console.log(`   ✅ 已加载 ${data.length} 个服务器数据`);
      } catch(e) {
        console.log('   ⚠ 解析 data.js 失败:', e.message);
      }
    }
  }
});
