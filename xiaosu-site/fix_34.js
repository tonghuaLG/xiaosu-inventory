const fs = require('fs');
let r = fs.readFileSync('inventory_raw.txt', 'utf8');

const i = r.indexOf('黄金爆爽·天使34服');
const end = r.indexOf('黄金爆爽·天使52服');
const block = r.substring(i, end);
const oldLine = '蓝银之种\n138';
const newLine = '蓝银之种\n136';

if (block.includes(oldLine)) {
  const newBlock = block.replace(oldLine, newLine);
  r = r.substring(0, i) + newBlock + r.substring(end);
  fs.writeFileSync('inventory_raw.txt', r, 'utf8');
  console.log('已改蓝银之种: 138→136');
} else {
  console.log('未找到蓝银之种 138');
  const idx = block.indexOf('蓝银之种');
  console.log('当前该位置:', block.substring(idx, idx + 20));
}
