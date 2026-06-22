const fs = require('fs');
const h = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');
console.log('has <style>:', h.includes('<style>'));
console.log('has </style>:', h.includes('</style>'));
console.log('has data.js src:', h.includes('data.js'));
console.log('has body::before:', h.includes('body::before'));
console.log('has .grid-bg:', h.includes('.grid-bg'));
console.log('has z-index:', (h.match(/z-index/g) || []).length);
// check if render function exists
console.log('has function render():', h.includes('function render()'));
// check for any syntax issue - count brackets
const scriptMatch = h.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const js = scriptMatch[1];
  const openBraces = (js.match(/\{/g) || []).length;
  const closeBraces = (js.match(/\}/g) || []).length;
  const openParens = (js.match(/\(/g) || []).length;
  const closeParens = (js.match(/\)/g) || []).length;
  console.log('JS { }:', openBraces, '/', closeBraces);
  console.log('JS ( ):', openParens, '/', closeParens);
}
