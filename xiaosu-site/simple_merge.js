const fs = require('fs');

// 直接从标准输入读取
let data = '';

// 或者从文件读取
const inputFile = process.argv[2] || 'update_data_20260622.txt';
const outputFile = 'inventory_raw_merged.txt';

// 读取新数据
let newData = '';
try {
    newData = fs.readFileSync(inputFile, 'utf8');
    console.log(`读取新数据: ${newData.length} 字节`);
} catch (e) {
    console.error('错误:', e.message);
    process.exit(1);
}

// 读取旧数据
let oldData = '';
try {
    oldData = fs.readFileSync('inventory_raw.txt', 'utf8');
    console.log(`读取旧数据: ${oldData.length} 字节`);
} catch (e) {
    console.log('旧数据不存在，仅使用新数据');
}

// 简单合并：新数据附加到旧数据后面
// 让 generate.js 去处理重复项
const merged = oldData + '\n' + newData;

fs.writeFileSync(outputFile, merged, 'utf8');
console.log(`合并完成，输出到: ${outputFile}`);
console.log(`总大小: ${merged.length} 字节`);
