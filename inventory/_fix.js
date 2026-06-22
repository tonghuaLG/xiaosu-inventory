const fs = require('fs');
const p = 'C:/Users/没饭局/.qclaw/workspace/inventory/public/admin.html';
let c = fs.readFileSync(p, 'utf8');
// Fix: replace event.target with loop-based active tab
c = c.replace('event.target.classList.add("active")', 'function(){for(const b of document.querySelectorAll(".tab-btn")){if(b.textContent.includes(tab==="orders"?"订单":"补货")){b.classList.add("active");break;}}}()');
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed');
