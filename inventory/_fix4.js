const fs = require('fs');
const p = 'C:/Users/没饭局/.qclaw/workspace/inventory/server.js';
let c = fs.readFileSync(p, 'utf8');

// 在扣减前后加详细日志
const oldDeduct = `  // 扣减库存
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
  saveDB(db);`;

const newDeduct = `  // 扣减库存
  console.log('[扣减] 开始扣减: server=' + server + ' item=' + item + ' qty=' + qty);
  let remaining = qty;
  let totalDeducted = 0;
  for (const cat of sv.items) {
    for (const it of cat.list) {
      if (it.n === item && remaining > 0) {
        console.log('[扣减] 找到物品: ' + it.n + ' 当前库存=' + it.q);
        const deduct = Math.min(it.q, remaining);
        console.log('[扣减] 扣减数量: ' + deduct);
        it.q -= deduct;
        totalDeducted += deduct;
        remaining -= deduct;
        console.log('[扣减] 扣减后库存: ' + it.q);
      }
    }
  }
  console.log('[扣减] 总共扣减: ' + totalDeducted + ' 剩余未扣: ' + remaining);
  saveDB(db);
  console.log('[扣减] 已保存db.json');`;

c = c.replace(oldDeduct, newDeduct);
fs.writeFileSync(p, c, 'utf8');
console.log('Added debug logs');
