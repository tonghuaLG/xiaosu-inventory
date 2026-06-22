const fs = require('fs');
const DB = __dirname + '/db.json';

function loadDB() { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function saveDB(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2), 'utf-8'); }

// 检查：同一个物品是否在多个分类中出现
let db = loadDB();
const sv = db.inventory.find(s => s.server === '集结·天使1服');
if (!sv) { console.log('服务器不存在'); process.exit(1); }

console.log('=== 检查物品分布 ===');
const itemMap = {};
sv.items.forEach((cat, ci) => {
  cat.list.forEach((item, ii) => {
    if (!itemMap[item.n]) itemMap[item.n] = [];
    itemMap[item.n].push({ category: cat.cat, index: ii, qty: item.q });
  });
});

// 找出重复的
for (const [name, locs] of Object.entries(itemMap)) {
  if (locs.length > 1) {
    console.log(`⚠ 重复物品「${name}」出现 ${locs.length} 次:`);
    locs.forEach(l => console.log(`   -> ${l.category}[${l.index}] qty=${l.qty}`));
  }
}

// 测试：手动扣减后立即读文件验证
console.log('\n=== 手动扣减测试 ===');
const targetItem = '仙草皇礼包';
const before = itemMap[targetItem];
console.log('扣减前:', JSON.stringify(before));

// 手动执行和 server.js 一样的扣减逻辑
db = loadDB(); // 重新加载
const sv2 = db.inventory.find(s => s.server === '集结·天使1服');
let remaining = 1;
for (const cat of sv2.items) {
  for (const it of cat.list) {
    if (it.n === targetItem && remaining > 0) {
      const deduct = Math.min(it.q, remaining);
      console.log(`找到 ${it.n} 在分类「${cat.cat}」, 当前=${it.q}, 扣减=${deduct}`);
      it.q -= deduct;
      remaining -= deduct;
      console.log(`扣减后: ${it.q}`);
    }
  }
}
console.log('remaining（未扣完）=', remaining);

saveDB(db);

// 立即重新读取文件验证
const db3 = loadDB();
const sv3 = db3.inventory.find(s => s.server === '集结·天使1服');
const afterMap = {};
sv3.items.forEach(cat => {
  cat.list.forEach(item => {
    if (!afterMap[item.n]) afterMap[item.n] = 0;
    afterMap[item.n] += item.q;
  });
});
console.log('\n扣减后文件中 仙草皇礼包 总库存:', afterMap[targetItem]);

// 恢复原始值
db3.inventory.find(s => s.server === '集结·天使1服').items.forEach(cat => {
  cat.list.forEach(item => {
    if (item.n === targetItem) item.q += 1;
  });
});
saveDB(db3);
console.log('已恢复原始库存');
