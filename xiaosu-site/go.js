const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const DIR = 'C:\\Users\\没饭局\\.qclaw\\workspace\\xiaosu-site';
const PORT = 18766;

// Start server
const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0].replace(/\/+/g, '/');
  if (p === '/') p = '/index.html';
  const fp = path.join(DIR, p);
  try {
    const c = fs.readFileSync(fp);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(c);
  } catch { res.writeHead(404); res.end('404'); }
});
server.listen(PORT, () => console.log(`Server on :${PORT}`));

// Find localtunnel
const ltDir = path.join(process.env.APPDATA, 'QClaw', 'npm-global', 'node_modules');
const ltBin = path.join(ltDir, 'localtunnel', 'bin', 'lt.js');

// Start localtunnel - we need to capture its output
const child = spawn(process.execPath, [ltBin, '--port', String(PORT), '--subdomain', 'xiaosu666'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NO_UPDATE_NOTIFIER: 'true' }
});

child.stdout.on('data', d => {
  const s = d.toString();
  process.stdout.write(s);
  const m = s.match(/https?:\/\/[^\s]+loca\.lt/);
  if (m) {
    const url = m[0];
    console.log('\n========== ✅ DEPLOYED ==========');
    console.log(`URL: ${url}`);
    console.log('==================================\n');
    // Write URL to file
    fs.writeFileSync(path.join(DIR, 'url.txt'), url);
  }
});
child.stderr.on('data', d => process.stderr.write(d.toString()));
child.on('exit', c => console.log('Tunnel exit:', c));

// Keep alive
setInterval(() => {}, 60000);
