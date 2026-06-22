# 小酥存货系统 - 订单管理版

## 架构

**前后端分离**，Node.js + JSON 数据存储，本地运行。

```
inventory/
├── server.js          # 后端服务 (Express)
├── data.js            # 库存原始数据 (86服)
├── db.json            # 订单数据库 (自动生成)
├── package.json
├── 启动.bat            # 双击启动
└── public/
    ├── index.html      # 玩家端 (浏览库存 + 下单)
    └── admin.html      # 管理端 (订单管理 + 发货 + 导出)
```

## 使用方式

### 启动服务
双击 `启动.bat` 或手动运行：
```bash
cd inventory
node server.js
```

### 访问地址
- 🎮 **玩家端**：http://localhost:18890
- 🔐 **管理端**：http://localhost:18890/admin.html
- 管理密码：`xiasu666`

## 功能

### 玩家端
- 查看 86 个服务器库存（按大区分组）
- 搜索服务器/物品名称
- 按大区筛选（天使黄金/爆爽/集结/周年/万魂/神龍界域/诸天万域）
- 一键下单（自动校验库存）
- 赛博霓虹风格 UI

### 管理端
- 密码保护登录
- 查看所有订单（按状态筛选/搜索）
- 标记发货/取消/撤回
- 📊 一键导出 Excel（区服, 收货玩家, 物品ID, 数量, 平台版本）
- 自动 30 秒刷新
- 订单状态统计卡片

### API
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/inventory` | GET | 获取库存 |
| `/api/inventory` | POST | 更新库存 (需密码) |
| `/api/orders` | GET | 获取订单列表 |
| `/api/orders` | POST | 玩家下单 |
| `/api/orders/:id` | PATCH | 更新订单状态 (需密码) |
| `/api/orders/:id` | DELETE | 删除订单 (需密码) |

## 更新库存数据

1. 将新数据写入 `data.js`（保持 `const rawData = [...]` 格式）
2. 删除 `db.json` 
3. 重启服务（自动从 data.js 加载）

## 已知限制
- 数据存储在 JSON 文件中（适合小规模使用）
- 需要本地运行 Node.js 服务
- 外网访问需配合内网穿透工具
