const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');

// 提取 rawData
const start = html.indexOf('const rawData = [');
const end = html.indexOf('];\n\n// =====', start) + 2;
const rawData = html.substring(start, end);

// 写入独立文件
fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\data.js', rawData + ';\n', 'utf-8');
console.log('data.js 写入:', fs.statSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\data.js').size, 'bytes');

// 从 HTML 中移除 rawData，改为引用
let newHtml = html.substring(0, start) + '// rawData 已分离到 data.js\n' + html.substring(end + 2);

// 在 </head> 前加 <script src="data.js"></script>
newHtml = newHtml.replace('</head>', '<script src="data.js"><\/script>\n</head>');

fs.writeFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', newHtml, 'utf-8');
console.log('index.html 新大小:', fs.statSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html').size, 'bytes');
