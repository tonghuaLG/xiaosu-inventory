const fs = require('fs');
const h = fs.readFileSync(__dirname + '/public/index.html', 'utf8');
const idx = [];
let p = 0;
while ((p = h.indexOf('item-buy', p)) !== -1) {
  idx.push(p);
  p++;
}
idx.forEach(i => {
  console.log('pos ' + i + ': ' + h.substring(i, i + 180));
});
console.log('---total: ' + idx.length);
