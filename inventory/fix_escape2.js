const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 替换所有残留的旧 onclick 写法（用字符串而非模板字面量）
const oldStr = 'item.n.replace(/\'/g,"\\\\\'")}';
const newStr = 'item.n" data-qty="${item.q}" onclick="handleBuy(this)';

let count = 0;
while (html.includes(oldStr)) {
  html = html.replace(oldStr, newStr);
  count++;
}
if (count > 0) {
  console.log('已替换', count, '处残留的旧 onclick');
} else {
  console.log('未找到旧模式，检查当前内容...');
  const matches = html.match(/item-buy[^>]+/g);
  if (matches) matches.forEach((m, i) => console.log('[' + i + ']', m.substring(0, 150)));
}

fs.writeFileSync(path, html, 'utf8');

if (html.includes("replace(/'/g,")) {
  console.log('仍有残留！');
} else {
  console.log('所有引号转义问题已清除');
}
