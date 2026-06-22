const http = require('http');
const fs = require('fs');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync('青春帝皇服福利.html', 'utf-8'));
});
server.listen(18889, () => {
  console.log('Server running at http://localhost:18889/');
});
