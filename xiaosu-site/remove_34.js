const fs = require('fs');
let r = fs.readFileSync('inventory_raw.txt', 'utf8');

const target = '黄金爆爽·天使34服';
const i = r.indexOf(target);
if (i < 0) { console.log('NOT FOUND'); process.exit(1); }

const end = r.indexOf('黄金爆爽·天使52服');
let block = r.substring(i, end);

// 移除 "蓝银之种\n136\n"（注意换行符）
const toRemove = '蓝银之种\n136\n';
if (block.includes(toRemove)) {
  block = block.replace(toRemove, '');
  r = r.substring(0, i) + block + r.substring(end);
  fs.writeFileSync('inventory_raw.txt', r, 'utf8');
  console.log('已移除：蓝银之种 136');
} else {
  console.log('未找到要移除的内容，当前block:');
  console.log(block.substring(block.indexOf('至宝仙草礼包'), block.indexOf('雪茄')));
}
