const http = require('http');
const fs = require('fs');
const DB_PATH = __dirname + '/db.json';

// 先看当前库存
let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
let sv = db.inventory.find(s => s.server === '集结·天使1服');
let beforeQty = 0;
if (sv) {
  sv.items.forEach(c => c.list.forEach(i => { if (i.n === '仙草皇礼包') beforeQty = i.q; }));
}
console.log('下单前 仙草皇礼包 库存:', beforeQty);

// 发起下单请求
const postData = JSON.stringify({ server: '集结·天使1服', buyer: '测试玩家', item: '仙草皇礼包', qty: 1, platform: '天使黄金' });
const req = http.request({
  hostname: 'localhost', port: 18890,
  path: '/api/orders', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('响应状态:', res.statusCode);
    console.log('响应内容:', body);

    // 再读库存
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    sv = db.inventory.find(s => s.server === '集结·天使1服');
    let afterQty = 0;
    if (sv) {
      sv.items.forEach(c => c.list.forEach(i => { if (i.n === '仙草皇礼包') afterQty = i.q; }));
    }
    console.log('下单后 仙草皇礼包 库存:', afterQty);
    console.log('变化:', beforeQty - afterQty);
    
    // 清理测试订单
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    db.orders = db.orders.filter(o => o.buyer !== '测试玩家');
    // 回库
    sv = db.inventory.find(s => s.server === '集结·天使1服');
    if (sv) sv.items.forEach(c => c.list.forEach(i => { if (i.n === '仙草皇礼包') i.q += 1; }));
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('已清理测试订单并回库');
  });
});
req.write(postData);
req.end();
