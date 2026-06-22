const fs = require('fs');
const r = fs.readFileSync('inventory_raw.txt', 'utf8');
const data = fs.readFileSync('update_data.txt', 'utf8');
const target = data.split('\n')[0];
const nextServer = '黄金·天使33服';

const idx = r.indexOf(target);
const nextIdx = r.indexOf(nextServer);

if (idx >= 0) {
  const afterNext = r.indexOf(nextServer, idx);
  if (afterNext < 0) { console.log('未找到下一服务器'); process.exit(1); }
  fs.writeFileSync('inventory_raw.txt', r.substring(0,idx) + '\n' + data + '\n' + r.substring(afterNext));
  console.log('已替换: ' + target);
} else {
  if (nextIdx < 0) { console.log('未找到插入点'); process.exit(1); }
  fs.writeFileSync('inventory_raw.txt', r.substring(0,nextIdx) + data + '\n' + r.substring(nextIdx));
  console.log('已插入新服: ' + target);
}
