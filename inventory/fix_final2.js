const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 从文件中提取的精确字符串
const pos = html.indexOf('item-buy" onclick="openOrder');
if (pos === -1) { console.log('NOT FOUND'); process.exit(1); }

// 提取实际字符串（从 item-buy 开始到 购买结束）
const actual = html.substring(pos, html.indexOf('购买</span>', pos) + 11);
console.log('Actual length:', actual.length);
console.log('Actual:', JSON.stringify(actual));

// 用 data 属性方式替换
const replacement = 'item-buy" data-sv="${server.server}" data-cat="${cat.cat}" data-item="${item.n}" data-qty="${item.q}" onclick="handleBuy(this)">购买</span></span>';
html = html.substring(0, pos) + replacement + html.substring(pos + actual.length);

fs.writeFileSync(path, html, 'utf8');

// 验证
if (html.includes("replace(/'/g,")) {
  console.log('STILL HAS ISSUE!');
} else {
  console.log('ALL CLEAN ✅');
}
