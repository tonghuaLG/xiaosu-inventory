const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\没饭局\\.qclaw\\workspace\\xiaosu-site\\inventory_raw.txt';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split(/\r?\n/);

// 定义排序优先级：天使黄金 → 天使爆爽 → 天使集结 → 天使周年 → 天使万魂 → 其他
const typeOrder = {
  '天使黄金': 1,
  '天使爆爽': 2,
  '天使集结': 3,
  '天使周年': 4,
  '天使万魂': 5,
  '其他': 99
};

function getServerType(name) {
  if (name.includes('黄金') && !name.includes('爆爽') && !name.includes('周年')) return '天使黄金';
  if (name.includes('爆爽')) return '天使爆爽';
  if (name.includes('集结')) return '天使集结';
  if (name.includes('周年')) return '天使周年';
  if (name.includes('万魂')) return '天使万魂';
  return '其他';
}

function getServerNumber(name) {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// 解析服务器块
const servers = [];
let currentServer = null;
let currentLines = [];

for (const line of lines) {
  const isServerName = line && (
    line.includes('服') || line === '神龍界域' || line === '诸天万域'
  );
  
  if (isServerName && !line.includes('选择宝箱') && !line.includes('礼包') && !line.includes('宝箱') && !line.includes('令') && !line.includes('神装')) {
    // 遇到新的服务器名，保存上一个
    if (currentServer) {
      servers.push({ name: currentServer, lines: currentLines });
    }
    currentServer = line;
    currentLines = [line];
  } else if (currentServer) {
    currentLines.push(line);
  }
}

if (currentServer) {
  servers.push({ name: currentServer, lines: currentLines });
}

// 排序
servers.sort((a, b) => {
  const typeA = typeOrder[getServerType(a.name)] || typeOrder['其他'];
  const typeB = typeOrder[getServerType(b.name)] || typeOrder['其他'];
  
  if (typeA !== typeB) return typeA - typeB;
  
  return getServerNumber(a.name) - getServerNumber(b.name);
});

// 写回文件
const outputLines = [];
for (const server of servers) {
  outputLines.push(...server.lines);
}

fs.writeFileSync(filePath, outputLines.join('\n'), 'utf-8');

console.log('排序完成！');
for (const server of servers) {
  console.log(`${server.name} (${getServerType(server.name)})`);
}
