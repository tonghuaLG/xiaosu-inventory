const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 精确匹配文件中的实际内容
const oldStr = 'item.n.replace(/\'/g,"\\\\\'")}';
// 直接用正则替换所有 item-buy 的 onclick
html = html.replace(
  /<span class="item-buy" onclick="openOrder\('\$\{server\.server\}','\$\{cat\.cat\}','\$\{item\.n\.replace\(\/'\/g,"\\\\\\'\)\}',\$\{item\.q\}\)"/g,
  '<span class="item-buy" data-sv="${server.server}" data-cat="${cat.cat}" data-item="${item.n}" data-qty="${item.q}" onclick="handleBuy(this)"'
);

const changedCount = (html.match(/handleBuy\(this\)/g) || []).length;
console.log('handleBuy 引用数:', changedCount);

fs.writeFileSync(path, html, 'utf8');

if (html.includes("replace(/'/g,")) {
  console.log('仍有残留！');
} else {
  console.log('✅ 所有引号转义问题已清除');
}
