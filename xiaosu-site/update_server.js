const fs = require('fs');
const raw = fs.readFileSync('inventory_raw.txt', 'utf8');

const serverName = process.argv[2];
const newData = process.argv[3];

if (!serverName || !newData) {
  console.log('Usage: node update_server.js <serverName> <nextServerName>');
  process.exit(1);
}

const idx = raw.indexOf(serverName);
const nextIdx = raw.indexOf(newData, idx);

if (idx === -1) { console.log('未找到服务器: ' + serverName); process.exit(1); }
if (nextIdx === -1) { console.log('未找到下一个服务器: ' + newData); process.exit(1); }

const updated = raw.substring(0, idx) + newData + raw.substring(nextIdx);
fs.writeFileSync('inventory_raw.txt', updated);
console.log('已更新: ' + serverName);
