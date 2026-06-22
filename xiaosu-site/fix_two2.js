const fs = require('fs');
let r = fs.readFileSync('inventory_raw.txt', 'utf-8');

const updates = [
  {
    // 黄金·天使96服 - find the server name line start
    find: '黄金·天使96服',
    block: `黄金·天使96服
背包
仙草皇礼包
9
冰火之泉
258
唐门淬火石宝箱
69
昊天令礼包
313
海神神装宝箱
2
深海沉银
17
至宝仙草礼包
41
蓝银之种
30
雪茄
暂无可展示商品
大奖
暂无可展示商品
小奖（本月）
蛛皇之血宝箱
1
小奖（历史）
蓝银之种宝箱10
3
蛛皇之血宝箱
1`
  },
  {
    find: '黄金爆爽·天使34服',
    block: `黄金爆爽·天使34服
背包
仙草皇礼包
15
冰火之泉
262
唐门淬火石宝箱
88
昊天令礼包
473
海神神装宝箱
17
深海沉银
51
至宝仙草礼包
67
蓝银之种
136
雪茄
暂无可展示商品
大奖
天马流星宝箱
3
真龙骨骼宝箱
2
赤焱龙心宝箱
27
龙纹琉璃宝箱
36
小奖（本月）
七杀领域宝箱
2
剑痴领域宝箱
45
天梦领域宝箱
13
极冰领域宝箱
14
海神领域宝箱
21
破魔领域宝箱
15
蛛皇之血宝箱
42
小奖（历史）
七杀领域宝箱
2
剑痴领域宝箱
45
天梦领域宝箱
13
极冰领域宝箱
14
海神领域宝箱
21
破魔领域宝箱
15
蛛皇之血宝箱
42`
  }
];

// Servers that mark end of a block
const serverMarkers = ['黄金·', '集结·', '周年·', '万魂·', '神龍', '诸天'];

for (const u of updates) {
  const namePos = r.indexOf(u.find);
  if (namePos < 0) { console.log('NOT FOUND: ' + u.find); continue; }

  // Block starts at the server name
  const blockStart = namePos;

  // Find the end: scan forward for the next server name line
  let end = r.length;
  const remaining = r.substring(namePos + u.find.length);

  for (const marker of serverMarkers) {
    const idx = remaining.indexOf('\n' + marker);
    if (idx >= 0 && (end === r.length || idx < end - blockStart - u.find.length)) {
      end = blockStart + idx + 1; // include the \n
      break;
    }
  }

  const oldLen = end - blockStart;
  r = r.substring(0, blockStart) + u.block + r.substring(end);
  console.log('Updated: ' + u.find + ' (old len: ' + oldLen + ', new len: ' + u.block.length + ')');
}

fs.writeFileSync('inventory_raw.txt', r, 'utf-8');
console.log('Done! File size: ' + r.length);
