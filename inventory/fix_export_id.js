const fs = require('fs');

let html = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');

// 1. 在 exportOrders 前添加物品ID对照表
const itemMapCode = `
// 物品名称 → 物品ID 对照表（导出时使用）
var ITEM_ID_MAP = {
  "仙草皇礼包": "100332",
  "至宝仙草礼包": "100315",
  "海神神装宝箱": "100339",
  "昊天令礼包": "100343",
  "深海沉银": "102292",
  "蓝银之种": "108008",
  "唐门淬火石宝箱": "6200005",
  "冰火之泉": "108006",
  "雪茄选择宝箱1": "1036971",
  "雪茄选择宝箱2": "1038569",
  "雪茄选择宝箱3": "1038670",
  "雪茄选择宝箱4": "1038771",
  "雪茄选择宝箱5": "1038720",
  "雪茄选择宝箱（2605）": "1056271"
};
function lookupItemId(name) {
  return ITEM_ID_MAP[name] || name;
}
`;

// 找到 exportOrders 函数前插入对照表
html = html.replace('function exportOrders() {\n', itemMapCode + 'function exportOrders() {\n');

// 2. 修改表头：物品名称 → 物品ID
html = html.replace(
  `var headers = [['区服', '收货玩家', '物品名称', '物品数量', '平台版本']];`,
  `var headers = [['区服', '收货玩家', '物品ID', '物品数量', '平台版本']];`
);

// 3. 修改数据行：用 lookupItemId 替换物品名称
html = html.replace(
  `return [o.server, o.buyer, o.item, o.qty, o.platform];`,
  `return [o.server, o.buyer, lookupItemId(o.item), o.qty, o.platform];`
);

fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', html, 'utf-8');
console.log('✅ 修改完成！');
console.log('  - 表头改为：区服 | 收货玩家 | 物品ID | 物品数量 | 平台版本');
console.log('  - 导出时自动用物品ID替换物品名称');
console.log('  - 查不到ID的物品会显示原名称');
