const fs = require('fs');
const path = 'C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html';
let html = fs.readFileSync(path, 'utf-8');

// 1. 更新筛选按钮
const oldFilter = `<div class="filter-btns">
        <button class="filter-btn active" data-group="all" onclick="filterGroup(this, 'all')">全部</button>
        <button class="filter-btn" data-group="万魂" onclick="filterGroup(this, '万魂')">万魂</button>
        <button class="filter-btn" data-group="黄金" onclick="filterGroup(this, '黄金')">黄金</button>
        <button class="filter-btn" data-group="熊猫" onclick="filterGroup(this, '熊猫')">熊猫</button>
      </div>`;

const newFilter = `<div class="filter-btns">
        <button class="filter-btn active" data-group="all" onclick="filterGroup(this, 'all')">全部</button>
        <button class="filter-btn" data-group="天使黄金" onclick="filterGroup(this, '天使黄金')">👑 天使黄金</button>
        <button class="filter-btn" data-group="天使爆爽" onclick="filterGroup(this, '天使爆爽')">💥 天使爆爽</button>
        <button class="filter-btn" data-group="天使集结" onclick="filterGroup(this, '天使集结')">⚔️ 天使集结</button>
        <button class="filter-btn" data-group="天使周年" onclick="filterGroup(this, '天使周年')">🎂 天使周年</button>
        <button class="filter-btn" data-group="天使万魂" onclick="filterGroup(this, '天使万魂')">⚔️ 天使万魂</button>
        <button class="filter-btn" data-group="神龍界域" onclick="filterGroup(this, '神龍界域')">🐉 神龍界域</button>
        <button class="filter-btn" data-group="诸天万域" onclick="filterGroup(this, '诸天万域')">🌌 诸天万域</button>
      </div>`;

html = html.replace(oldFilter, newFilter);

// 2. 更新 groupOrder
html = html.replace(
  "const groupOrder = ['万魂', '黄金', '熊猫'];",
  "const groupOrder = ['天使黄金', '天使爆爽', '天使集结', '天使周年', '天使万魂', '神龍界域', '诸天万域'];"
);

// 3. 更新 getShortGroup
const oldShortGroup = `function getShortGroup(name) {
  if (name.startsWith('万魂')) return '万魂';
  if (name.startsWith('黄金')) return '黄金';
  return '熊猫';
}`;

const newShortGroup = `function getShortGroup(name) {
  if (name.includes('集结')) return '天使集结';
  if (name.includes('周年')) return '天使周年';
  if (name.includes('爆爽')) return '天使爆爽';
  if (name.includes('万魂')) return '天使万魂';
  if (name.includes('黄金')) return '天使黄金';
  if (name === '神龍界域') return '神龍界域';
  if (name === '诸天万域') return '诸天万域';
  return '天使黄金';
}`;

html = html.replace(oldShortGroup, newShortGroup);

// 4. 更新组标题图标
html = html.replace(
  "\${g === '万魂' ? '⚔️' : g === '黄金' ? '👑' : '🐼'}",
  "\${g === '天使黄金' ? '👑' : g === '天使爆爽' ? '💥' : g === '天使集结' ? '⚔️' : g === '天使周年' ? '🎂' : g === '天使万魂' ? '⚔️' : g === '神龍界域' ? '🐉' : '🌌'}"
);

// 5. 更新 getBadge
html = html.replace(
  "if (serverName.startsWith('万魂')) return 'badge-wan';",
  "if (serverName.includes('万魂')) return 'badge-wan';"
);
html = html.replace(
  "if (serverName.startsWith('黄金')) return 'badge-huang';",
  "if (serverName.includes('黄金')) return 'badge-huang';"
);
html = html.replace(
  "return 'badge-xiong';",
  "if (serverName.includes('神龍')) return 'badge-xiong';\n  return 'badge-huang';"
);

fs.writeFileSync(path, html, 'utf-8');
console.log('✅ 所有分组和筛选更新完成！');
console.log('新文件大小:', html.length, '字节');
