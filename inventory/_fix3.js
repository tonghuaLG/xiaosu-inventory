const fs = require('fs');
const p = 'C:/Users/没饭局/.qclaw/workspace/inventory/server.js';
let c = fs.readFileSync(p, 'utf8');

// 找到下单API中检查库存后、创建订单前的位置，插入扣减逻辑
const oldCode = `  if (qty > stockQty) return res.status(400).json({ error: \`库存不足（库存:\${stockQty}）\` });
  const order = {`;

const newCode = `  if (qty > stockQty) return res.status(400).json({ error: \`库存不足（库存:\${stockQty}）\` });
  
  // 扣减库存
  let remaining = qty;
  for (const cat of sv.items) {
    for (const it of cat.list) {
      if (it.n === item && remaining > 0) {
        const deduct = Math.min(it.q, remaining);
        it.q -= deduct;
        remaining -= deduct;
      }
    }
  }
  saveDB(db);
  
  const order = {`;

if (!c.includes(oldCode)) {
  console.log('Pattern not found!');
  process.exit(1);
}

c = c.replace(oldCode, newCode);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed: 下单时自动扣减库存');
