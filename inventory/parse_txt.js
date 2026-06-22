const fs = require('fs');

const text = fs.readFileSync('C:\\Users\\没饭局\\Desktop\\更新.txt', 'utf-8');
const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

// 已知分类关键词
const CATEGORIES = ['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）'];

// 服务器名特征：包含"服"字（除"客服"等干扰词），或是特殊名称
function isServerName(line) {
  if (line === '神龍界域' || line === '诸天万域') return true;
  // 包含"服"且长度足够（排除"客服"等短干扰词），且不是分类名
  if (line.includes('服') && line.length > 3 && !CATEGORIES.includes(line)) return true;
  return false;
}

// 根据服务器名确定分组
function getGroup(serverName) {
  if (serverName.includes('集结')) return '天使集结';
  if (serverName.includes('周年')) return '天使周年';
  if (serverName === '神龍界域') return '神龍界域';
  if (serverName === '诸天万域') return '诸天万域';
  if (serverName.includes('爆爽')) return '天使爆爽';
  if (serverName.includes('万魂')) return '天使万魂';
  if (serverName.includes('黄金')) return '天使黄金';
  return '天使黄金';
}

const servers = [];
let i = 0;

while (i < lines.length) {
  // 找到第一个服务器名
  if (!isServerName(lines[i])) {
    i++;
    continue;
  }

  const serverName = lines[i];
  const group = getGroup(serverName);
  i++;

  // 解析该服务器的所有分类
  const items = [];
  let currentCat = null;
  let currentList = [];

  for (; i < lines.length; i++) {
    const line = lines[i];

    // 检查是否到了下一个服务器
    if (isServerName(line)) {
      break;
    }

    // 检查是否是分类名
    const catIdx = CATEGORIES.indexOf(line);
    if (catIdx >= 0) {
      if (currentCat) {
        items.push({ cat: currentCat, list: currentList });
      }
      currentCat = line;
      currentList = [];
      continue;
    }

    // "暂无可展示商品" - 跳过此行
    if (line === '暂无可展示商品') {
      continue;
    }

    // 否则这行是物品名，下一行是数量
    const itemName = line;
    i++;
    if (i >= lines.length) break;

    const qtyStr = lines[i].trim();
    const qty = parseInt(qtyStr);
    if (isNaN(qty)) {
      // 数量不是数字，说明这行不是物品数量，回退
      // 可能是下一个服务器名或分类名
      // 检查当前行是否是服务器名
      if (isServerName(qtyStr)) {
        i--; // 让外层循环处理这个服务器名
        break;
      }
      continue;
    }

    currentList.push({ n: itemName, q: qty });
  }

  // 保存最后一个分类
  if (currentCat) {
    items.push({ cat: currentCat, list: currentList });
  }

  // 补充缺失的分类（空数组）
  const catsInData = new Set(items.map(c => c.cat));
  CATEGORIES.forEach(c => {
    if (!catsInData.has(c)) {
      items.push({ cat: c, list: [] });
    }
  });

  // 按固定顺序排列
  const orderedItems = [];
  CATEGORIES.forEach(c => {
    const found = items.find(it => it.cat === c);
    if (found) orderedItems.push(found);
  });

  servers.push({
    server: serverName,
    group: group,
    items: orderedItems
  });

  // 因为内层循环已经 break 了，如果停在服务器名上，i 不需要回退
  // 但如果停在数量不是数字的位置，需要确保 i 指向正确位置
  // for 循环的 i++ 会在下次迭代前执行，所以用 continue
  if (i < lines.length && isServerName(lines[i])) {
    // 外层 while 会处理这个服务器名
    continue;
  }
}

// 输出结果为 JavaScript 对象数组
// 使用简洁格式
let output = '// 总服务器数: ' + servers.length + '\n';
output += 'const rawData = [\n';
servers.forEach((s, idx) => {
  output += '  { server: ' + JSON.stringify(s.server) + ', group: ' + JSON.stringify(s.group) + ', items: [\n';
  s.items.forEach((cat, cIdx) => {
    output += '    { cat: ' + JSON.stringify(cat.cat) + ', list: [\n';
    cat.list.forEach((item, lIdx) => {
      output += '      {n:' + JSON.stringify(item.n) + ',q:' + item.q + '}';
      if (lIdx < cat.list.length - 1) output += ',';
      output += '\n';
    });
    output += '    ]}';
    if (cIdx < s.items.length - 1) output += ',';
    output += '\n';
  });
  output += '  ]}';
  if (idx < servers.length - 1) output += ',';
  output += '\n';
});
output += '];\n';

// 统计信息
let totalItemCount = 0;
let totalQty = 0;
const allItems = {};
const emptyServers = [];
servers.forEach(s => {
  let hasItems = false;
  s.items.forEach(cat => {
    totalItemCount += cat.list.length;
    cat.list.forEach(item => {
      totalQty += item.q;
      allItems[item.n] = (allItems[item.n] || 0) + item.q;
    });
    if (cat.list.length > 0) hasItems = true;
  });
  if (!hasItems) emptyServers.push(s.server);
});

output += '\n// 统计: ' + servers.length + '个服务器, ' + totalItemCount + '种物品, ' + totalQty + '件总数\n';
output += '// 空服务器(' + emptyServers.length + '个): ' + emptyServers.join(', ') + '\n';
output += '// 物品去重后共 ' + Object.keys(allItems).length + ' 种\n';

fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\parsed_data.js', output, 'utf-8');
console.log('解析完成！');
console.log('服务器数:', servers.length);
console.log('物品总类数:', totalItemCount);
console.log('物品总件数:', totalQty);
console.log('去重物品种数:', Object.keys(allItems).length);
console.log('空服务器:', emptyServers.length);
console.log('结果已写入 parsed_data.js');
