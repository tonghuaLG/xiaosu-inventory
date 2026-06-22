const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\没饭局\\Desktop\\发货格式.xlsx');

// 读取物品对照表（H列=物品名称，I列=物品ID）
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, {header:1});

// 提取物品名称→ID的映射
const itemMap = {};
data.forEach(row => {
  if (row[7] && row[8]) {  // H列=物品名称, I列=物品ID
    const name = String(row[7]).trim();
    const id = String(row[8]).trim();
    if (name && id) {
      itemMap[name] = id;
    }
  }
});

console.log('物品对照表条目数:', Object.keys(itemMap).length);
console.log('\n前20个对照:');
Object.entries(itemMap).slice(0, 20).forEach(([name, id]) => {
  console.log(`"${name}": "${id}"`);
});

// 生成JS对象字符串
let jsCode = 'const ITEM_ID_MAP = {\n';
Object.entries(itemMap).forEach(([name, id]) => {
  jsCode += `  "${name.replace(/"/g, '\\"')}": "${id}",\n`;
});
jsCode += '};\n';

// 保存到文件
const fs = require('fs');
fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\item_id_map.js', jsCode, 'utf-8');
console.log('\n已保存到 item_id_map.js');
