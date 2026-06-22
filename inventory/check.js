const fs = require('fs');
const h = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');
console.log('文件大小:', h.length);
console.log('<html>:', h.includes('<html'));
console.log('</html>:', h.includes('</html>'));
console.log('<body>:', h.includes('<body'));
console.log('</body>:', h.includes('</body>'));
console.log('appStock:', h.includes('id="appStock"'));
console.log('appOrder:', h.includes('id="appOrder"'));
console.log('server: 数量:', (h.match(/server:/g) || []).length);

// 检查 rawData
const s = h.indexOf('const rawData = [');
const e = h.indexOf('];', s) + 2;
console.log('rawData 位置:', s, '-', e);

if (s > 0 && e > 1) {
  const rawStr = h.substring(s, e).replace(/const rawData = /, '');
  // 转换为合法 JSON
  const jsonStr = rawStr.replace(/(\w+):/g, '"$1":');
  try {
    JSON.parse(jsonStr);
    console.log('✅ rawData JSON 合法');
  } catch(x) {
    console.error('❌ rawData JSON 错误:', x.message);
    // 找到错误位置附近
    const pos = parseInt(x.message.match(/position (\d+)/)?.[1] || '0');
    if (pos > 0) {
      console.error('错误附近内容:', jsonStr.substring(Math.max(0,pos-50), pos+50));
    }
  }
}

// 检查 script 标签
const scripts = h.match(/<script>([\s\S]*?)<\/script>/g);
console.log('script 标签数量:', scripts ? scripts.length : 0);

// 检查是否有未闭合标签
const openTags = (h.match(/<\w+[^>]*>/g) || []).length;
const closeTags = (h.match(/<\/\w+>/g) || []).length;
console.log('开标签数:', openTags, '闭标签数:', closeTags);
