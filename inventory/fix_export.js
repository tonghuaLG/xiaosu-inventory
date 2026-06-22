const fs = require('fs');

let html = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');

// 1. 在 </head> 前添加 SheetJS CDN
const sheetJSTag = '    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>\n';
html = html.replace('</head>', sheetJSTag + '</head>');

// 2. 替换 exportOrders 函数
const oldExport = `function exportOrders() {
  if (orders.length === 0) { alert('暂无订单可导出'); return; }
  var BOM = '\\ufeff';
  var header = '区服\\t收货玩家\\t物品名称\\t物品数量\\t平台版本';
  var rows = orders.map(function(o){
    return o.server + '\\t' + o.buyer + '\\t' + o.item + '\\t' + o.qty + '\\t' + o.platform;
  });
  var content = BOM + header + '\\n' + rows.join('\\n');
  var blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '订单记录_' + new Date().toISOString().slice(0,10) + '.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}`;

const newExport = `function exportOrders() {
  if (orders.length === 0) { alert('暂无订单可导出'); return; }
  // 表头（独立列）
  var headers = [['区服', '收货玩家', '物品名称', '物品数量', '平台版本']];
  // 数据行
  var rows = orders.map(function(o){
    return [o.server, o.buyer, o.item, o.qty, o.platform];
  });
  var allRows = headers.concat(rows);
  // 生成 .xlsx
  var ws = XLSX.utils.aoa_to_sheet(allRows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '订单记录');
  XLSX.writeFile(wb, '订单记录_' + new Date().toISOString().slice(0,10) + '.xlsx');
}`;

html = html.replace(oldExport, newExport);

fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', html, 'utf-8');
console.log('✅ 修改完成！');
console.log('  - 已添加 SheetJS CDN');
console.log('  - exportOrders() 已改为生成真正的 .xlsx 文件');
