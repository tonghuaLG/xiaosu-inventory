const http = require("http");
const fs = require("fs");
const path = require("path");
const dir = "C:\\Users\\没饭局\\.qclaw\\workspace\\inventory";
http.createServer((req, res) => {
  let fp = path.join(dir, req.url === "/" ? "index.html" : req.url);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end("Not found"); return; }
  const ext = path.extname(fp).toLowerCase();
  const ct = {".html":"text/html;charset=utf-8",".js":"text/javascript",".css":"text/css"}[ext] || "application/octet-stream";
  res.writeHead(200, {"Content-Type": ct});
  fs.createReadStream(fp).pipe(res);
}).listen(18889, () => console.log("OK on 18889"));
