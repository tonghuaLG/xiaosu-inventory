const fs = require('fs');
const path = require('path');

// 读取现有数据
const oldFile = 'inventory_raw.txt';
const newFile = 'update_data_20260622.txt';
const outputFile = 'inventory_raw.txt';

// 解析存货数据文件，返回 { serverName: { 背包: {}, 雪茄: {}, 大奖: {}, 小奖（本月）: {}, 小奖（历史）: {} } }
function parseInventoryFile(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    const servers = {};
    let currentServer = null;
    let currentCategory = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测服务器名（不含数字结尾的行，且不是物品名）
        if (!line.match(/^\d+$/) && 
            !['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）', '暂无可展示商品'].includes(line) &&
            !line.includes('选择宝箱') &&
            !line.includes('礼包') &&
            !line.includes('宝箱') &&
            !line.includes('之泉') &&
            !line.includes('之种') &&
            !line.includes('沉银') &&
            !line.includes('石宝箱') &&
            (line.includes('·') || line.includes('天使') || line.includes('神龍界域') || line.includes('诸天万域'))) {
            
            // 可能是服务器名
            if (!servers[line]) {
                servers[line] = {
                    '背包': {},
                    '雪茄': {},
                    '大奖': {},
                    '小奖（本月）': {},
                    '小奖（历史）': {}
                };
            }
            currentServer = line;
            currentCategory = null;
            continue;
        }
        
        // 检测分类
        if (['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）'].includes(line)) {
            currentCategory = line;
            continue;
        }
        
        // 跳过"暂无可展示商品"
        if (line === '暂无可展示商品') {
            continue;
        }
        
        // 如果是数字，说明前一行是物品名，这一行是数量
        if (line.match(/^\d+$/) && currentServer && currentCategory && i > 0) {
            const itemName = lines[i - 1];
            const count = parseInt(line);
            
            if (servers[currentServer] && servers[currentServer][currentCategory] !== undefined) {
                servers[currentServer][currentCategory][itemName] = count;
            }
        }
    }
    
    return servers;
}

// 合并数据（新数据覆盖旧数据）
function mergeServers(oldData, newData) {
    const merged = { ...oldData };
    
    for (const [serverName, serverData] of Object.entries(newData)) {
        merged[serverName] = serverData;  // 直接覆盖
    }
    
    return merged;
}

// 生成 inventory_raw.txt 格式的文本
function generateRawText(servers) {
    const lines = [];
    
    // 服务器排序
    const serverOrder = [
        '天使黄金', '天使爆爽', '天使集结', '天使周年', '天使万魂',
        '神龍界域', '诸天万域'
    ];
    
    const sortedServers = Object.keys(servers).sort((a, b) => {
        // 按类型和数字排序
        for (const prefix of serverOrder) {
            const aStarts = a.startsWith(prefix);
            const bStarts = b.startsWith(prefix);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            if (aStarts && bStarts) {
                // 提取数字
                const aNum = parseInt(a.match(/(\d+)/)?.[1] || '0');
                const bNum = parseInt(b.match(/(\d+)/)?.[1] || '0');
                return aNum - bNum;
            }
        }
        return a.localeCompare(b);
    });
    
    for (const serverName of sortedServers) {
        const serverData = servers[serverName];
        lines.push(serverName);
        
        for (const category of ['背包', '雪茄', '大奖', '小奖（本月）', '小奖（历史）']) {
            const items = serverData[category];
            if (!items || Object.keys(items).length === 0) {
                lines.push(category);
                lines.push('暂无可展示商品');
                continue;
            }
            
            lines.push(category);
            for (const [itemName, count] of Object.entries(items)) {
                lines.push(itemName);
                lines.push(count.toString());
            }
        }
    }
    
    return lines.join('\n');
}

// 主流程
console.log('读取现有数据...');
const oldData = parseInventoryFile(oldFile);
console.log(`现有 ${Object.keys(oldData).length} 个服务器`);

console.log('读取新数据...');
const newData = parseInventoryFile(newFile);
console.log(`新数据 ${Object.keys(newData).length} 个服务器`);

console.log('合并数据...');
const merged = mergeServers(oldData, newData);
console.log(`合并后 ${Object.keys(merged).length} 个服务器`);

console.log('生成新文件...');
const output = generateRawText(merged);
fs.writeFileSync(outputFile, output, 'utf8');

console.log(`完成！输出到 ${outputFile}`);
console.log(`服务器总数: ${Object.keys(merged).length}`);
