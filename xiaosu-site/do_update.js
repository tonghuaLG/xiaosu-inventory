const fs = require('fs');
const raw = fs.readFileSync('inventory_raw.txt', 'utf8');
const data = fs.readFileSync('update_data.txt', 'utf8').trim();
const serverName = data.split('\n')[0];
const nextServer = data.split('\n')[0].replace(/·天使(\d+)服/, (m, n) => '·天使' + (parseInt(n)+1) + '服');

// Find correct next server - use the known list
const allServers = [
  '集结·天使1服','黄金·天使5服','周年·黄金天使5服','集结·天使7服','黄金爆爽·天使8服',
  '万魂·天使9服','集结·天使10服','周年·黄金天使13服','集结·天使21服','黄金爆爽·天使22服',
  '黄金·天使24服','集结·天使25服','黄金·天使26服','集结·天使26服','黄金·天使27服',
  '黄金爆爽·天使27服','万魂·天使27服','黄金·天使28服','黄金·天使31服','黄金·天使32服',
  '万魂·天使32服','黄金·天使33服','黄金爆爽·天使34服','集结·天使35服','黄金·天使40服',
  '黄金·天使50服','黄金·天使53服','黄金爆爽·天使54服','黄金·天使58服','黄金·天使63服',
  '黄金·天使72服','黄金·天使74服','黄金·天使76服','黄金·天使78服','黄金·天使82服',
  '黄金·天使83服','黄金·天使84服','黄金·天使85服','黄金·天使86服','黄金·天使89服',
  '黄金·天使91服','黄金·天使94服','黄金·天使97服','黄金·天使98服','黄金·天使100服',
  '黄金·天使103服','黄金·天使104服','黄金·天使105服','黄金·天使106服','黄金·天使108服',
  '黄金·天使110服','黄金·天使111服','黄金·天使112服','黄金·天使115服','黄金·天使116服',
  '黄金·天使117服','黄金·天使118服','黄金·天使119服','黄金·天使120服','黄金·天使121服',
  '黄金·天使123服','黄金·天使125服','黄金·天使126服','黄金·天使127服','黄金·天使128服',
  '神龍界域','诸天万域'
];

const idx = raw.indexOf(serverName);
if (idx === -1) { console.log('未找到: ' + serverName); process.exit(1); }

let nextIdx = -1;
const sIdx = allServers.indexOf(serverName);
if (sIdx >= 0 && sIdx < allServers.length - 1) {
  const nextName = allServers[sIdx + 1];
  nextIdx = raw.indexOf(nextName, idx);
}

if (nextIdx === -1) { console.log('未找到下一服务器'); process.exit(1); }

const updated = raw.substring(0, idx) + '\n' + data + '\n' + raw.substring(nextIdx);
fs.writeFileSync('inventory_raw.txt', updated);
console.log('更新成功: ' + serverName);
