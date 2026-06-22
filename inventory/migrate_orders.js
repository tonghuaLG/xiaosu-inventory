/**
 * 迁移脚本：为所有没有 status 字段的订单添加 status: 'pending'
 * 问题：之前创建的订单没有 status 字段，导致管理端显示为"已取消"
 */
const fs = require('fs');
const path = __dirname + '/db.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

let migrated = 0;
db.orders.forEach(o => {
  if (!o.status) {
    o.status = 'pending';
    migrated++;
  }
});

if (migrated > 0) {
  fs.writeFileSync(path, JSON.stringify(db, null, 2), 'utf8');
  console.log('已迁移', migrated, '个订单，添加 status: pending');
} else {
  console.log('所有订单已有 status 字段，无需迁移');
}
