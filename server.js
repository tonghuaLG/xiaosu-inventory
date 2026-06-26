'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 18890;

// Increase body size limit to 10MB for large imports
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database storage
const DB_FILE = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [], inventory: [] }), 'utf-8');
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

// Async save to avoid blocking event loop
function saveDB(db) {
  const data = JSON.stringify(db, null, 2);
  fs.writeFile(DB_FILE, data, 'utf-8', (err) => {
    if (err) console.error('[saveDB] Write error:', err.message);
    else console.log('[saveDB] Saved successfully, size:', data.length, 'bytes');
  });
}

// Admin password
const ADMIN_PASS = 'xiasu666';

// ===== Inventory API =====

// Get inventory data
app.get('/api/inventory', (req, res) => {
  const db = loadDB();
  res.json({ servers: db.inventory || [], count: (db.inventory || []).length });
});

// Update inventory (admin)
app.post('/api/inventory', (req, res) => {
  const { password, data } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  const db = loadDB();
  db.inventory = data;
  saveDB(db);
  res.json({ ok: true, count: data.length });
});

// Text import inventory (admin)
// Key fix: handle large payloads asynchronously
app.post('/api/inventory/import-text', (req, res) => {
  const { password, servers } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  if (!Array.isArray(servers) || servers.length === 0) {
    return res.status(400).json({ error: 'empty_data' });
  }

  console.log(`[import-text] Receiving ${servers.length} servers...`);

  // Use async approach - respond immediately, save in background
  const db = loadDB();
  if (!db.inventory) db.inventory = [];

  let newCount = 0, updated = 0;
  servers.forEach(s => {
    if (!s.server || !Array.isArray(s.items)) return;
    const idx = db.inventory.findIndex(x => x.server === s.server);
    if (idx >= 0) { db.inventory[idx] = s; updated++; }
    else { db.inventory.push(s); newCount++; }
  });

  console.log(`[import-text] Processed: ${servers.length} servers (new:${newCount}, updated:${updated})`);

  // Respond to client FIRST, then save in background
  res.json({ ok: true, count: servers.length, new: newCount, updated });

  // Async save after response
  const data = JSON.stringify(db, null, 2);
  fs.writeFile(DB_FILE, data, 'utf-8', (err) => {
    if (err) {
      console.error('[import-text] saveDB error:', err.message);
    } else {
      console.log('[import-text] DB saved, size:', data.length, 'bytes');
    }
  });
});

// Single item restock (admin)
app.patch('/api/inventory/restock', (req, res) => {
  const { password, server, item, qty } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  if (!server || !item || !qty || qty <= 0) return res.status(400).json({ error: 'param_incomplete' });
  const db = loadDB();
  const sv = (db.inventory || []).find(s => s.server === server);
  if (!sv) return res.status(404).json({ error: 'server_not_found' });
  let found = false, oldQty = 0;
  for (const cat of sv.items) {
    const it = cat.list.find(i => i.n === item);
    if (it) { oldQty = it.q; it.q += qty; found = true; break; }
  }
  if (!found) return res.status(404).json({ error: 'item_not_found' });
  saveDB(db);
  res.json({ ok: true, server, item, oldQty, newQty: oldQty + qty });
});

// Batch restock (admin)
app.post('/api/inventory/batch-restock', (req, res) => {
  const { password, items } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'empty_items' });
  const db = loadDB();
  if (!db.inventory || db.inventory.length === 0) return res.status(400).json({ error: 'db_not_init' });
  const result = { success: 0, failed: 0, details: [] };
  items.forEach(({ server, item, qty }) => {
    if (!server || !item || !qty || qty <= 0) { result.failed++; result.details.push({ server, item, error: 'param_incomplete' }); return; }
    const sv = db.inventory.find(s => s.server === server);
    if (!sv) { result.failed++; result.details.push({ server, item, error: 'server_not_found' }); return; }
    let found = false;
    for (const cat of sv.items) {
      const it = cat.list.find(i => i.n === item);
      if (it) { it.q += qty; found = true; break; }
    }
    if (found) { result.success++; result.details.push({ server, item, qty, newQty: qty }); }
    else { result.failed++; result.details.push({ server, item, error: 'item_not_found' }); }
  });
  saveDB(db);
  res.json({ ok: true, result });
});

// ===== Orders API =====

// Get all orders
app.get('/api/orders', (req, res) => {
  const db = loadDB();
  let orders = db.orders || [];
  if (req.query.buyer) {
    const buyer = req.query.buyer.trim();
    orders = orders.filter(o => o.buyer === buyer);
  }
  res.json({ orders, count: orders.length });
});

// Place order (player)
app.post('/api/orders', (req, res) => {
  const { server, buyer, item, qty, platform, category } = req.body;
  if (!server || !buyer || !item || !qty || qty <= 0) {
    return res.status(400).json({ error: 'incomplete_order_info' });
  }
  const db = loadDB();
  const sv = (db.inventory || []).find(s => s.server === server || s.server.includes(server) || server.includes(s.server));
  if (!sv) return res.status(400).json({ error: 'server_not_exists' });

  let stockQty = 0;
  sv.items.forEach(cat => cat.list.forEach(i => { if (i.n === item) stockQty += i.q; }));
  if (qty > stockQty) return res.status(400).json({ error: `insufficient_stock` });

  // Deduct stock (category-specific)
  const deductLog = [];
  let remaining = qty;
  for (const cat of sv.items) {
    if (category && cat.cat !== category) continue;
    for (const it of cat.list) {
      if (it.n === item && remaining > 0) {
        const deduct = Math.min(it.q, remaining);
        it.q -= deduct;
        remaining -= deduct;
        deductLog.push(`${cat.cat}/${it.n}: -${deduct}`);
      }
    }
  }
  saveDB(db);

  const order = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    server, buyer, item, qty,
    platform: platform || 'android',
    category: category || '',
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    paidAt: null,
    shippedAt: null
  };
  db.orders.unshift(order);
  saveDB(db);
  res.json({ ok: true, order });
});

// Update order status (admin)
app.patch('/api/orders/:id', (req, res) => {
  const { password, status } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  const db = loadDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'order_not_found' });

  const oldStatus = order.status;
  const targetCats = order.category ? [order.category] : null;

  if (oldStatus === 'unpaid' && status === 'paid') {
    order.paidAt = new Date().toISOString();
    console.log(`[order] paid: ${order.server} ${order.item} x${order.qty} buyer:${order.buyer}`);
  } else if (oldStatus !== 'cancelled' && status === 'cancelled') {
    const sv = db.inventory.find(s => s.server === order.server);
    if (sv) {
      const cats = targetCats ? sv.items.filter(c => targetCats.includes(c.cat)) : sv.items;
      for (const cat of cats) {
        for (const it of cat.list) {
          if (it.n === order.item) { it.q += order.qty; break; }
        }
      }
    }
    console.log(`[inventory] cancelled order restored: ${order.server} ${order.item} +${order.qty}`);
  } else if (oldStatus === 'cancelled' && status === 'unpaid') {
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
    console.log(`[inventory] restored order re-deduct: ${order.server} ${order.item} -${order.qty}`);
  }

  order.status = status;
  if (status === 'shipped') order.shippedAt = new Date().toISOString();
  saveDB(db);
  res.json({ ok: true, order });
});

// Delete order (admin)
app.delete('/api/orders/:id', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  const db = loadDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (order && order.status !== 'cancelled') {
    const sv = db.inventory.find(s => s.server === order.server);
    if (sv) {
      const cats = order.category ? sv.items.filter(c => c.cat === order.category) : sv.items;
      for (const cat of cats) {
        for (const it of cat.list) { if (it.n === order.item) { it.q += order.qty; break; } }
      }
    }
    console.log(`[inventory] deleted order restored: ${order.server} ${order.item} +${order.qty}`);
  }
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// Clear all orders (admin)
app.delete('/api/orders', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  const db = loadDB();
  const count = (db.orders || []).length;
  db.orders = [];
  saveDB(db);
  console.log(`[orders] cleared all ${count} orders`);
  res.json({ ok: true, count });
});

// Export orders (admin)
app.post('/api/orders/export', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  const db = loadDB();
  res.json({ orders: db.orders || [] });
});

// Self-update endpoint: accepts base64-encoded server.js, writes it, and restarts
app.post('/api/admin/selfupdate', (req, res) => {
  const { password, code } = req.body;
  if (password !== ADMIN_PASS) return res.status(403).json({ error: 'password_error' });
  if (!code) return res.status(400).json({ error: 'no_code' });
  try {
    const buf = Buffer.from(code, 'base64');
    const myPath = __filename;
    fs.writeFileSync(myPath + '.new', buf);
    const { execSync } = require('child_process');
    // Restart in background, then exit
    execSync(`cp ${myPath} ${myPath}.bak && mv ${myPath}.new ${myPath} && kill -9 $(lsof -t -i:${PORT}) && sleep 1 && cd ${path.dirname(myPath)} && nohup node ${myPath} >> server.log 2>&1 &`);
    res.json({ ok: true, size: buf.length });
    setTimeout(() => process.exit(0), 500);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Startup =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Player: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin.html`);
  console.log(`Admin password: ${ADMIN_PASS}`);

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
        console.log(`Loaded ${data.length} servers from data.js`);
      } catch(e) {
        console.log('Failed to load data.js:', e.message);
      }
    }
  } else {
    console.log(`DB has ${db.inventory.length} servers`);
  }
});
