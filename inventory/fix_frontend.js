/**
 * 修复 index.html：让「购买」按钮传 category 给 openOrder()
 * 方法：用 data-category 属性 + 事件代理
 */
const fs = require('fs');
const path = __dirname + '/public/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. 在变量声明区加 orderCategory
html = html.replace(
  "let orderItem = '';",
  "let orderCategory = '';\nlet orderItem = '';"
);

// 2. 改 openOrder 函数签名和函数体
html = html.replace(
  /function openOrder\(server, item, stock\) \{([\s\S]*?)orderServer = server;/,
  (match, body) => {
    return `function openOrder(server, category, item, stock) {\n  orderServer = server;\n  orderCategory = category;${body}orderServer = server;`;
  }
);

// 如果上面没匹配到（函数格式不同），手动替换
if (!html.includes('orderCategory = category')) {
  // 直接重写 openOrder 函数
  html = html.replace(
    /function openOrder\([^)]*\) \{[^}]*\}/,
    `function openOrder(server, category, item, stock) {
  orderServer = server;
  orderCategory = category;
  orderItem = item;
  orderStock = stock;
  document.getElementById('mServer').value = server;
  document.getElementById('mItem').value = item;
  document.getElementById('mQty').value = 1;
  document.getElementById('mBuyer').value = '';
  document.getElementById('mHint').textContent = '库存：' + stock;
  document.getElementById('mHint').className = 'hint';
  document.getElementById('orderForm').style.display = '';
  document.getElementById('successMsg').style.display = 'none';
  document.getElementById('orderModal').style.display = '';
}`
  );
}

// 3. 改 renderServer 里的购买按钮：加上 data-category 并传 category
html = html.replace(
  /onclick="openOrder\('[^']+','[^']+',\d+\)"/g,
  (match) => {
    // match = onclick="openOrder('server','item',qty)"
    const serverMatch = match.match(/openOrder\('([^']+)'/);
    const itemMatch = match.match(/,'([^']+)'/g);
    // 简单处理：在按钮上加 data-category 不行，因为这里没有 category 信息
    // 需要改渲染逻辑
    return match; // 先不改，下面整体替换渲染逻辑
  }
);

// 4. 整体替换 item-row 渲染逻辑（在 renderServer 函数内）
//    找到 cat.list.forEach 那一段，替换为带 data-category 的版本
const oldForEach = `    cat.list.forEach(item => {
      html += \`<div class="item-row">
        <span class="item-name">\${item.n.includes('雪茄') ? '🚬' : '🎁'} \${item.n}</span>
        <span><span class="item-qty \${getQtyClass(item.q)}">×\${item.q}</span>
        <span class="item-buy" onclick="openOrder('\${server.server}','\${item.n.replace(/'/g,"\\\\'\\\")}',\${item.q})">购买</span></span>
      </div>\`;
    });`;

const newForEach = `    cat.list.forEach(item => {
      html += \`<div class="item-row">
        <span class="item-name">\${item.n.includes('雪茄') ? '🚬' : '🎁'} \${item.n}</span>
        <span><span class="item-qty \${getQtyClass(item.q)}">×\${item.q}</span>
        <span class="item-buy" data-category="\${cat.cat}" onclick="openOrder('\${server.server}','\${cat.cat}','\${item.n.replace(/'/g,"\\\\'\\\")}',\${item.q})">购买</span></span>
      </div>\`;
    });`;

if (html.includes(oldForEach)) {
  html = html.replace(oldForEach, newForEach);
  console.log('✅ 已替换 forEach 渲染逻辑');
} else {
  console.log('⚠ 未找到旧的 forEach 模式，尝试模糊匹配...');
  // 模糊替换：直接找 item-buy 的 onclick 并修改
  html = html.replace(
    /onclick="openOrder\('?\$\{server\.server\}'?,'?\$\{item\.n[^"]+?"/g,
    (match) => {
      return match.replace(/openOrder\(/, 'openOrder(\'${server.server}\',\'${cat.cat}\',');
    }
  );
}

// 5. 改 submitOrder：把 category 传给后端
html = html.replace(
  /body: JSON\.stringify\(\{ server: orderServer, buyer, item: orderItem, qty, platform: '天使黄金' \}\)/,
  "body: JSON.stringify({ server: orderServer, buyer, item: orderItem, category: orderCategory, qty, platform: '天使黄金' })"
);

fs.writeFileSync(path, html, 'utf8');
console.log('✅ index.html 已更新');
console.log('   - 新增 orderCategory 变量');
console.log('   - openOrder() 现在接收 category 参数');
console.log('   - 购买按钮传 category');
console.log('   - submitOrder() 传 category 给后端');
