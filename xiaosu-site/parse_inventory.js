const fs = require('fs');

const raw = fs.readFileSync('inventory_raw.txt', 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(l => l);

const data = [];
let currentServer = '';
let currentCategory = '';

for (const line of lines) {
  // 服务器名（不含空格，且不是数字开头的数量）
  if (!/^\d+$/.test(line) && !line.includes('暂无可展示') && !line.includes('宝箱') && !line.includes('礼包') && !line.includes('之') && !line.includes('种') && !line.includes('泉') && !line.includes('银') && line.length > 2 && !line.endsWith('服') === false) {
    // 匹配服务器名
  }

  // 简化：直接用正则匹配
  if (/^(集结|黄金|周年|万魂|诸天|神龍)/.test(line)) {
    currentServer = line;
    data.push({ server: currentServer, categories: {} });
  } else if (['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）'].includes(line)) {
    currentCategory = line;
    if (data.length > 0) {
      const last = data[data.length - 1];
      if (!last.categories[currentCategory]) last.categories[currentCategory] = [];
    }
  } else {
    // 物品行：物品名 + 数量
    const match = line.match(/^(.+?)\s+(\d+)$/);
    if (match && currentCategory && data.length > 0) {
      const last = data[data.length - 1];
      if (!last.categories[currentCategory]) last.categories[currentCategory] = [];
      last.categories[currentCategory].push({ name: match[1].trim(), count: parseInt(match[2]) });
    }
  }
}

fs.writeFileSync('inventory.json', JSON.stringify(data, null, 2));
console.log('Parsed', data.length, 'servers');
data.forEach(s => {
  const total = Object.values(s.categories).flat().reduce((a, b) => a + b.count, 0);
  console.log(s.server, '=>', total, 'items');
});
