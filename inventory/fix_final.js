const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 精确替换：从文件中提取的实际字符串
const oldStr = 'item-buy" onclick="openOrder(\'${server.server}\',\'${cat.cat}\',\'${item.n.replace(/\'/g,"\\\\\'")}\',${item.q})">购买</span></span>';
const newStr = 'item-buy" data-sv="${server.server}" data-cat="${cat.cat}" data-item="${item.n}" data-qty="${item.q}" onclick="handleBuy(this)">购买</span></span>';

if (html.includes(oldStr)) {
  html = html.replace(oldStr, newStr);
  console.log('OK replaced');
} else {
  // 尝试逐字符查看差异
  const pos = html.indexOf('item-buy" onclick');
  if (pos > 0) {
    console.log('Found at pos', pos);
    console.log('Actual: [' + html.substring(pos, pos + 160) + ']');
    console.log('Target: [' + oldStr + ']');
  }
}

fs.writeFileSync(path, html, 'utf8');

// 最终验证
if (html.includes("replace(/'/g,")) {
  console.log('STILL HAS ISSUE!');
} else {
  console.log('ALL CLEAN');
}
