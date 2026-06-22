/**
 * 修复 index.html 第428行：onclick 中的单引号转义导致 HTML 属性断裂
 * 问题: ${item.n.replace(/'/g,"\\'\")} → \" 会闭合 onclick 属性
 * 修复: 改用 \x27（单引号的十六进制转义），避免嵌套引号冲突
 */
const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 查找当前有问题的行
const badPattern = /onclick="openOrder\('\$\{server\.server\}','\$\{cat\.cat\}',"\$\{item\.n\.replace\(\/'\/g,"[^"]*"\)\}',\$\{item\.q\}\)"/;
console.log('找到问题行:', badPattern.test(html));

// 替换为正确的写法：用 \x27 表示单引号，避免引号嵌套冲突
html = html.replace(
  badPattern,
  `onclick="openOrder('${'${server.server}'}','${'${cat.cat}'}','${'${item.n.replace(/\'/g, "\\\\x27")}'}',${'${item.q}'})"`
);

// 验证替换结果
if (html.includes("\\x27")) {
  console.log('✅ 已修复：使用 \\x27 转义单引号');
} else {
  console.log('⚠ 未匹配到问题行，尝试另一种方式...');
  
  // 备选方案：直接用正则匹配并替换整行 forEach
  const oldLine = `html += \`<div class="item-row">
        <span class="item-name">\${item.n.includes('雪茄') ? '🚬' : '🎁'} \${item.n}</span>
        <span><span class="item-qty \${getQtyClass(item.q)}">×\${item.q}</span>
        <span class="item-buy" onclick="openOrder('\${server.server}','\${cat.cat}','\${item.n.replace(/'/g,"\\\\'\")}',\${item.q})">购买</span></span>
      </div>\`;`;

  const newLine = `html += \`<div class="item-row">
        <span class="item-name">\${item.n.includes('雪茄') ? '🚬' : '🎁'} \${item.n}</span>
        <span><span class="item-qty \${getQtyClass(item.q)}">×\${item.q}</span>
        <span class="item-buy" data-sv="\${server.server}" data-cat="\${cat.cat}" data-item="\${item.n}" data-qty="\${item.q}" onclick="handleBuy(this)">购买</span></span>
      </div>\`;`;
  
  if (html.includes(`item.n.replace(/'/g,"`)) {
    html = html.replace(oldLine, newLine);
    console.log('✅ 已替换为 data 属性 + handleBuy 方式');
    
    // 添加 handleBuy 函数（在 openOrder 前面）
    const handleBuyFunc = `
function handleBuy(el) {
  const sv = el.getAttribute('data-sv');
  const cat = el.getAttribute('data-cat');
  const item = el.getAttribute('data-item');
  const qty = parseInt(el.getAttribute('data-qty'));
  openOrder(sv, cat, item, qty);
}

`;
    if (!html.includes('function handleBuy')) {
      html = html.replace('function openOrder(', handleBuyFunc + 'function openOrder(');
      console.log('✅ 已添加 handleBuy 函数');
    }
  } else {
    // 看看当前实际内容
    const lines = html.split('\n').filter(l => l.includes('item-buy'));
    console.log('当前 item-buy 行:');
    lines.forEach((l, i) => console.log(`  [${i}] ${l.trim().substring(0, 200)}`));
  }
}

fs.writeFileSync(path, html, 'utf8');
console.log('✅ 文件已保存');
