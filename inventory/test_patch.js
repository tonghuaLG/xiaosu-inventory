const http = require('http');

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  // 1. 创建订单
  const orderBody = JSON.stringify({server:'集结·天使1服',buyer:'测试玩家',item:'仙草皇礼包',qty:1,platform:'天使黄金'});
  const r1 = await req({
    hostname:'localhost', port:18890, path:'/api/orders', method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(orderBody)}
  }, orderBody);
  console.log('1. POST status:', r1.status, 'body:', r1.body);
  const order = JSON.parse(r1.body);
  console.log('   订单ID:', order.order.id);

  // 2. 用错误密码 PATCH
  const patchWrong = JSON.stringify({password:'wrong',status:'shipped'});
  const r2 = await req({
    hostname:'localhost', port:18890, path:`/api/orders/${order.order.id}`, method:'PATCH',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(patchWrong)}
  }, patchWrong);
  console.log('2. 错误密码:', r2.status, r2.body);

  // 3. 用正确密码 PATCH
  const patchRight = JSON.stringify({password:'xiasu666',status:'shipped'});
  const r3 = await req({
    hostname:'localhost', port:18890, path:`/api/orders/${order.order.id}`, method:'PATCH',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(patchRight)}
  }, patchRight);
  console.log('3. 正确密码:', r3.status, r3.body);

  // 4. 验证
  const r4 = await req({hostname:'localhost',port:18890,path:'/api/orders',method:'GET'});
  const data = JSON.parse(r4.body);
  const updated = data.orders.find(o => o.id === order.order.id);
  console.log('4. 订单状态:', updated ? updated.status : 'NOT FOUND');

  // 5. 清理
  const delBody = JSON.stringify({password:'xiasu666'});
  const r5 = await req({
    hostname:'localhost', port:18890, path:`/api/orders/${order.order.id}`, method:'DELETE',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(delBody)}
  }, delBody);
  console.log('5. 删除:', r5.status);
}

main().catch(e => console.error('错误:', e));
