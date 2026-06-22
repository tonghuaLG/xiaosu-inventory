/**
 * 将 data.js 的完整库存数据同步到 db.json
 * 问题：db.json 里只有约15个服务器，但 data.js 有86个
 * 导致前端能展示但下单时报"服务器不存在"
 */
const fs = require('fs');
const path = __dirname + '/data.js';

// 读取 data.js 并提取 rawData
let dataJsContent = fs.readFileSync(path, 'utf8');
// 去掉可能的 export 或 var/const 声明，直接 eval
const fn = new Function(dataJsContent + '\nreturn rawData;');
const rawData = fn();

console.log('从 data.js 读取到', rawData.length, '个服务器数据');

// 转换成 db.json 需要的格式
const inventory = rawData.map(sv => ({
  server: sv.server,
  group: sv.group || '',
  items: sv.items.map(cat => ({
    cat: cat.cat,
    list: cat.list.map(item => ({
      n: item.n,
      q: item.q
    }))
  }))
}));

console.log('转换后 inventory 有', inventory.length, '个服务器');

// 读取现有 db.json
const dbPath = __dirname + '/db.json';
let db = { orders: [], inventory: [] };
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log('现有 db.json 有', db.orders.length, '个订单,', db.inventory.length, '个服务器');
}

// 更新 inventory
db.inventory = inventory;

// 保存
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('已同步', inventory.length, '个服务器数据到 db.json');
