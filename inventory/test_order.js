const http = require('http');

const data = JSON.stringify({
  server: '黄金·天使5服',
  item: '蛛皇之血宝箱',
  qty: 1,
  buyer: '测试买家',
  platform: '天使黄金',
  category: '小奖（本月）'
});

const options = {
  hostname: 'localhost',
  port: 18890,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', body);
    try {
      const json = JSON.parse(body);
      console.log('订单状态:', json.order?.status);
    } catch(e) {}
  });
});

req.on('error', (e) => console.log('错误:', e.message));
req.write(data);
req.end();
