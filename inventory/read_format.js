const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\没饭局\\Desktop\\发货格式.xlsx');
console.log('工作表:', wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, {header:1});
console.log('总行数:', data.length);
console.log('\n前15行内容:');
data.slice(0, 15).forEach((r, i) => console.log(i+1, JSON.stringify(r)));
