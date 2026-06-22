const express = require('express');
// cors removed (same-origin)
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 18890;

// 中间件
// cors not needed (same-origin)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 简易 SQLite 替代：JSON 文件存储
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

// 管理员密码（简单校验）
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

// ====== 订单 API ======

// 获取所有订单（管理员）
app.get('/api/orders', (req, res) => {
  const db = loadDB();
  const orders = db.orders || [];
  res.json({ orders, count: orders.length });
});

// 玩家下单
app.post('/api/orders', (req, res) => {
  const { server, buyer, item, qty, platform } = req.body;
  if (!server || !buyer || !item || !qty || qty <= 0) {
    return res.status(400).json({ error: '请填写完整订单信息' });
  }
  
  // 库存校验
  const db = loadDB();
  const sv = (db.inventory || []).find(s => s.server === server || s.server.includes(server) || server.includes(s.server));
  if (!sv) return res.status(400).json({ error: '服务器不存在' });
  
  let stockQty = 0;
  sv.items.forEach(cat => cat.list.forEach(i => { if (i.n === item) stockQty += i.q; }));
  if (qty > stockQty) return res.status(400).json({ error: `库存不足（库存:${stockQty}）` });
  
  const order = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    server, buyer, item, qty, platform: platform || '天使黄金',
    status: 'pending', // pending / shipped / cancelled
    createdAt: new Date().toISOString(),
    shippedAt: null
  };
  
  db.orders.unshift(order); // 最新的排前面
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
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// 导出订单为 Excel 数据（管理员）
app.post('/api/orders/export', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: '密码错误' });
  const db = loadDB();
  // 返回纯数据，前端用 SheetJS 生成 .xlsx
  res.json({ orders: db.orders || [] });
});

// ====== 启动 ======
app.listen(PORT, () => {
  console.log(`🚀 小酥存货系统启动成功！`);
  console.log(`   玩家端: http://localhost:${PORT}`);
  console.log(`   管理端: http://localhost:${PORT}/admin.html`);
  console.log(`   管理密码: ${ADMIN_PASS}`);
  
  // 初始化库存数据
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

