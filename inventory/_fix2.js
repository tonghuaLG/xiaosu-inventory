const fs = require('fs');
const p = 'C:/Users/没饭局/.qclaw/workspace/inventory/public/admin.html';
let c = fs.readFileSync(p, 'utf8');

// Replace the entire switchTab function
const oldFunc = `function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');`;

const newFunc = `function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  // Find and activate the correct tab button by text content
  const btns = document.querySelectorAll('.tab-btn');
  for (let i = 0; i < btns.length; i++) {
    if (btns[i].getAttribute('onclick') && btns[i].getAttribute('onclick').includes(tab)) {
      btns[i].classList.add('active');
      break;
    }
  }
  document.getElementById('tab-' + tab).classList.add('active');`;

if (c.includes(oldFunc)) {
  c = c.replace(oldFunc, newFunc);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed switchTab function');
} else {
  console.log('Pattern not found exactly, checking...');
  const idx = c.indexOf('event.target.classList.add("active")');
  console.log('event.target found at index:', idx);
}
