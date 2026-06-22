const fs = require('fs');

const raw = fs.readFileSync('inventory_raw.txt', 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(l => l);

const CATEGORIES = new Set(['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）']);

function isServerName(line) {
  if (CATEGORIES.has(line)) return false;
  if (line === '暂无可展示商品') return false;
  return /服$/.test(line) || /域$/.test(line);
}

// ====== PARSE ======
const servers = [];
let currentServer = null;
let currentCategory = null;
let expectingCount = false;
let currentItemName = '';

for (const line of lines) {
  if (isServerName(line)) {
    currentServer = { name: line, categories: {} };
    servers.push(currentServer);
    currentCategory = null;
    expectingCount = false;
  }
  else if (CATEGORIES.has(line)) {
    currentCategory = line;
    if (currentServer && !currentServer.categories[currentCategory]) {
      currentServer.categories[currentCategory] = [];
    }
    expectingCount = false;
  }
  else if (line === '暂无可展示商品') {
    expectingCount = false;
  }
  else if (expectingCount && /^\d+$/.test(line)) {
    if (currentServer && currentCategory && currentItemName) {
      currentServer.categories[currentCategory].push({ name: currentItemName, count: parseInt(line) });
    }
    expectingCount = false;
  }
  else {
    currentItemName = line;
    expectingCount = true;
  }
}

// ====== REPORT ======
let totalItems = 0;
for (const s of servers) {
  let serverItems = 0;
  for (const items of Object.values(s.categories)) {
    serverItems += items.length;
    totalItems += items.length;
  }
  console.log(`  ${s.name}: ${serverItems} 种物品`);
}
console.log(`\n共解析 ${servers.length} 个服务器，${totalItems} 种物品`);

// ====== GENERATE HTML ======
function htmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(servers) {
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>小酥 - 斗罗大陆H5 存货展示</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0f23;color:#e0e0e0;padding:20px}
.header{text-align:center;padding:40px 20px 20px}
.header h1{color:#ffd700;font-size:2.2em;text-shadow:0 0 20px rgba(255,215,0,0.3)}
.header .sub{color:#888;margin-top:8px;font-size:0.95em}
.stats{text-align:center;margin:15px 0 25px;font-size:0.9em;color:#aaa}
.stats span{display:inline-block;margin:0 10px;padding:4px 12px;background:rgba(255,215,0,0.1);border-radius:20px;border:1px solid rgba(255,215,0,0.2)}
.search-box{max-width:500px;margin:0 auto 30px}
.search-box input{width:100%;padding:10px 15px;border-radius:25px;border:1px solid #333;background:#1a1a3e;color:#fff;font-size:1em;outline:none}
.search-box input:focus{border-color:#ffd700}
.grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.server-card{background:linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.06);transition:box-shadow 0.2s}
.server-card:hover{box-shadow:0 4px 20px rgba(255,215,0,0.08)}
.server-card h2{color:#ffd700;font-size:1.05em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,215,0,0.15)}
.cat{margin:6px 0}
.cat-title{color:#888;font-size:0.8em;font-weight:600;margin:6px 0 4px;text-transform:uppercase;letter-spacing:1px}
.items{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.item{display:flex;justify-content:space-between;padding:3px 6px;font-size:0.85em;border-radius:4px}
.item:nth-child(odd){background:rgba(255,255,255,0.02)}
.item-name{color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.item-count{color:#ffd700;font-weight:600;min-width:35px;text-align:right}
.empty-cat{color:#555;font-size:0.8em;font-style:italic;padding:2px 6px}
</style>
</head>
<body>
<div class="header">
  <h1>🎮 小酥</h1>
  <div class="sub">斗罗大陆H5 · 游戏存货展示</div>
</div>
<div class="stats">
  <span>📦 ${servers.length} 个区服</span>
  <span>📋 ${totalItems} 种物品</span>
</div>
<div class="search-box">
  <input type="text" id="search" placeholder="🔍 搜索区服..." oninput="filterServers()">
</div>
<div class="grid" id="cardGrid">`;

  for (const server of servers) {
    const nameEsc = htmlEscape(server.name);
    html += `<div class="server-card" data-name="${nameEsc.toLowerCase()}"><h2>${nameEsc}</h2>`;
    for (const [cat, items] of Object.entries(server.categories)) {
      html += `<div class="cat"><div class="cat-title">${cat}</div><div class="items">`;
      if (items.length === 0) {
        html += `<div class="empty-cat">暂无可展示商品</div>`;
      } else {
        for (const item of items) {
          const iname = htmlEscape(item.name);
          html += `<div class="item"><span class="item-name" title="${iname}">${iname}</span><span class="item-count">${item.count}</span></div>`;
        }
      }
      html += `</div></div>`;
    }
    html += `</div>`;
  }

  html += `</div>
<script>
function filterServers(){
  const q=document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.server-card').forEach(c=>{
    c.style.display=c.dataset.name.includes(q)?'':'none';
  });
}
</script>
</body>
</html>`;

  return html;
}

fs.writeFileSync('index.html', buildHtml(servers));
console.log('✅ 已生成 index.html');
