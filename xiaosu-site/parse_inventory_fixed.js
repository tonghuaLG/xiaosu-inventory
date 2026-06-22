const fs = require('fs');

// 读取文件
const filename = process.argv[2] || 'inventory_raw.txt';
const outputFile = process.argv[3] || 'inventory.json';

console.log(`读取文件: ${filename}`);

let content;
try {
    content = fs.readFileSync(filename, 'utf8');
} catch (e) {
    console.error(`错误: 无法读取文件 ${filename}`);
    console.error(e.message);
    process.exit(1);
}

const lines = content.split('\n').map(l => l.trim()).filter(l => l);
const servers = {};
const serverOrder = [];

let currentServer = null;
let currentCategory = null;
let i = 0;

while (i < lines.length) {
    const line = lines[i];
    
    // 检测服务器名：包含·或天使，且不在物品关键词中
    if ((line.includes('·') || line.includes('天使') || line === '神龍界域' || line === '诸天万域') &&
        !line.includes('宝箱') && 
        !line.includes('礼包') &&
        !line.includes('之泉') &&
        !line.includes('之种') &&
        !line.includes('沉银') &&
        !line.includes('石宝箱') &&
        line !== '暂无可展示商品') {
        
        currentServer = line;
        if (!servers[currentServer]) {
            servers[currentServer] = {
                背包: {},
                雪茄: {},
                大奖: {},
                '小奖（本月）': {},
                '小奖（历史）': {}
            };
            serverOrder.push(currentServer);
        }
        currentCategory = null;
        i++;
        continue;
    }
    
    // 检测分类
    if (['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）'].includes(line)) {
        currentCategory = line;
        i++;
        
        // 检查下一行是否是"暂无可展示商品"
        if (i < lines.length && lines[i] === '暂无可展示商品') {
            i++;  // 跳过
        }
        continue;
    }
    
    // 解析物品和数量
    if (currentServer && currentCategory && i + 1 < lines.length) {
        const itemName = line;
        const nextLine = lines[i + 1];
        
        // 下一行应该是数量（数字）
        if (nextLine && /^\d+$/.test(nextLine)) {
            const count = parseInt(nextLine);
            servers[currentServer][currentCategory][itemName] = count;
            i += 2;  // 跳过物品名和数量
            continue;
        }
    }
    
    i++;
}

// 统计
let totalItems = 0;
let serverCount = 0;
for (const [serverName, serverData] of Object.entries(servers)) {
    serverCount++;
    let serverItems = 0;
    for (const [category, items] of Object.entries(serverData)) {
        const itemCount = Object.keys(items).length;
        serverItems += itemCount;
    }
    totalItems += serverItems;
    console.log(`${serverName} => ${serverItems} items`);
}

console.log(`\n总共: ${serverCount} 个服务器, ${totalItems} 种物品`);

// 保存JSON
const output = {
    updateTime: new Date().toISOString(),
    serverCount: serverCount,
    totalItems: totalItems,
    serverOrder: serverOrder,
    servers: servers
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
console.log(`\n已保存到: ${outputFile}`);
