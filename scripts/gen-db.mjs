// 一次性脚本：把前端假数据导出成两份数据库文件
// - server/db.json   → 本地 json-server 使用（--watch 可写）
// - api/_data.json   → Vercel Serverless 函数使用（打包进函数）
// 用法：node scripts/gen-db.mjs
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { users, orders, products, salesTrend, salesDaily, channels } from '../src/mock/data.ts'

mkdirSync(new URL('../server/', import.meta.url), { recursive: true })
mkdirSync(new URL('../api/', import.meta.url), { recursive: true })

const db = {
  users,
  orders,
  products,
  salesTrend,
  salesDaily,
  channels,
  dashboard: { salesAmount: 172.0, conversion: 3.6 },
}

writeFileSync(new URL('../server/db.json', import.meta.url), JSON.stringify(db, null, 2))
writeFileSync(new URL('../api/_data.json', import.meta.url), JSON.stringify(db))
console.log(
  `数据已同步：${users.length} 个用户、${orders.length} 个订单、${products.length} 个商品 → server/db.json + api/_data.json`,
)
