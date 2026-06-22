const fs = require('fs');
const h = fs.readFileSync('C:\\Users\\没饭局\\.qclaw\\workspace\\inventory\\index.html', 'utf-8');

const scriptMatch = h.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('NO script tag'); process.exit(1); }
const js = scriptMatch[1];

try {
  const fn = new Function('document', 'window', js);
  fn({}, {});
  console.log('JS OK - no syntax error');
} catch(e) {
  console.error('JS ERROR:', e.message);
  const lines = js.split('\n');
  // find line numbers in stack
  const stack = e.stack || '';
  const matches = stack.match(/:(\d+):(\d+)/g);
  if (matches) {
    matches.forEach(m => {
      const parts = m.match(/:(\d+):(\d+)/);
      const ln = parseInt(parts[1]);
      console.error('--- Line', ln, '---');
      for (let i=Math.max(0,ln-3); i<Math.min(lines.length,ln+3); i++) {
        console.error((i+1)+': '+lines[i]);
      }
    });
  }
}
