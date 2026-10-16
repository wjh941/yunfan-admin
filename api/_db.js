// Serverless 共享模块：内存数据库 + 分页工具
// 数据从打包进函数的 _data.json 冷启动加载（由 scripts/gen-db.mjs 自动同步）
// 注意：Serverless 实例重建后数据会回到初始状态，演示足够；生产需换真数据库
import { readFileSync } from 'node:fs'

let cache = null

export function getDb() {
  if (!cache) {
    cache = JSON.parse(readFileSync(new URL('./_data.json', import.meta.url), 'utf-8'))
  }
  return cache
}

// 模拟 json-server 的分页行为：_page/_limit + X-Total-Count 响应头
export function paged(items, query, res) {
  const page = Number(query._page ?? 1)
  const limit = Number(query._limit ?? 10)
  const total = items.length
  res.setHeader('X-Total-Count', String(total))
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count')
  return items.slice((page - 1) * limit, page * limit)
}

// 与前端 Users/Orders 页面一致的通用筛选
export function applyFilters(list, query, searchFields) {
  let result = [...list]
  const q = query.q?.toLowerCase()
  if (q) {
    result = result.filter(item =>
      searchFields.some(f => String(item[f]).toLowerCase().includes(q)),
    )
  }
  if (query.status) result = result.filter(item => item.status === query.status)
  return result
}
