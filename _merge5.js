const XLSX = require('xlsx');
const files = [
  'C:\\Users\\没饭局\\Desktop\\天使123.xlsx',
  'C:\\Users\\没饭局\\Desktop\\天使100.xlsx',
  'C:\\Users\\没饭局\\Desktop\\天使104.xlsx',
  'C:\\Users\\没饭局\\Desktop\\天使117.xlsx',
  'C:\\Users\\没饭局\\Desktop\\天使120.xlsx'
];
const header = ['账号', '密码', '小号', '类型', '版本'];
let allRows = [header];
let total = 0;

files.forEach(f => {
  const wb = XLSX.readFile(f);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = data.slice(1).filter(r => r[0] !== '' && r[0] != null);
  rows.forEach(r => allRows.push([String(r[0]), String(r[1]), r[2] || '', r[3] || '', r[4] || '']));
  total += rows.length;
});

const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.aoa_to_sheet(allRows);
newWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
XLSX.utils.book_append_sheet(newWb, newWs, '汇总');
XLSX.writeFile(newWb, 'C:\\Users\\没饭局\\Desktop\\天使5个合并.xlsx');
console.log('Done. Files:', files.length, 'Total records:', total);
