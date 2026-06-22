const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIR = __dirname;
const PORT = 18766;

// HTTP server
const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0].replace(/\/+/g, '/');
  if (p === '/') p = '/index.html';
  const fp = path.join(DIR, p);
  if (fp.startsWith(DIR) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp);
    const ct = ext === '.html' ? 'text/html; charset=utf-8' :
               ext === '.js' ? 'application/javascript' :
               ext === '.css' ? 'text/css' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(fs.readFileSync(fp));
  } else {
    res.writeHead(404);
    res.end('404');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  
  // Start localtunnel
  const ltPath = path.join(process.env.APPDATA, 'QClaw', 'npm-global', 'node_modules', 'localtunnel', 'bin', 'lt.js');
  const lt = spawn('node', [ltPath, '--port', String(PORT), '--subdomain', 'xiaosu2024'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NO_UPDATE_NOTIFIER: 'true' }
  });
  
  lt.stdout.on('data', d => {
    const out = d.toString();
    console.log('Tunnel:', out);
    if (out.includes('your url is:')) {
      console.log('\n✅ PUBLIC URL: ' + out.match(/https?:\/\/[^\s]+/)?.[0] || out);
    }
  });
  
  lt.stderr.on('data', d => console.log('Tunnel err:', d.toString()));
  lt.on('exit', code => console.log('Tunnel exited:', code));
  
  // Keep alive
  setInterval(() => {}, 60000);
});
