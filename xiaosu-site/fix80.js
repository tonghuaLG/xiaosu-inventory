const fs = require('fs');
let r = fs.readFileSync('inventory_raw.txt', 'utf-8');

// Find 黄金·天使80服 block
const i = r.indexOf('黄金·天使80服');
if (i < 0) { console.log('not found'); process.exit(1); }

// Find next server after 80服
const after80 = r.substring(i);
const nextMatch = after80.match(/\n(?:黄金·|集结·|周年·|万魂·|神龍|诸天)/);
const end = nextMatch ? i + nextMatch.index : r.length;

const newBlock = `黄金·天使80服
背包
唐门淬火石宝箱
100
昊天令礼包
423
海神神装宝箱
28
深海沉银
45
至宝仙草礼包
1
蓝银之种
57
雪茄
雪茄选择宝箱1
38
雪茄选择宝箱（2605）
5
大奖
星神剑魂宝箱
74
死之乐章宝箱
11
小奖（本月）
七杀领域宝箱
16
剑痴领域宝箱
8
天梦领域宝箱
21
极冰领域宝箱
15
海神领域宝箱
12
破魔领域宝箱
9
蛛皇之血宝箱
49
小奖（历史）
七杀领域宝箱
16
剑痴领域宝箱
8
天梦领域宝箱
21
极冰领域宝箱
15
死之乐章宝箱
11
海神领域宝箱
12
破魔领域宝箱
9
蓝银之种宝箱5
15
蛛皇之血宝箱
49`;

const oldBlock = r.substring(i, end);
console.log('旧数据长度:', oldBlock.length);

r = r.substring(0, i) + newBlock + r.substring(end);
fs.writeFileSync('inventory_raw.txt', r, 'utf-8');
console.log('替换成功');
