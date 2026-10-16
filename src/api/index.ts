// 接口层：页面只调这里的函数，不关心数据从哪来
// 底层实现：开发环境 json-server（localhost:3001），生产环境 Vercel 同域 /api
import request from './request'
import type {
  DashboardData,
  LoginResult,
  Order,
  OrderQuery,
  PagedResult,
  Product,
  User,
  UserQuery,
} from '../types'

// 分页请求通用封装：json-server / Serverless 都用 X-Total-Count 响应头返回总条数
async function paged<T>(url: string, params: Record<string, unknown>): Promise<PagedResult<T>> {
  const res = await request.get(url, { params })
  return { list: res.data, total: Number(res.headers['x-total-count'] ?? res.data.length) }
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await request.post('/login', { username, password })
  return res.data
}

export async function getDashboard(): Promise<DashboardData> {
  const [usersRes, ordersRes, dashboardRes, salesTrendRes, channelsRes, recentRes, allOrdersRes] =
    await Promise.all([
      request.get('/users', { params: { _limit: 1 } }),
      request.get('/orders', { params: { _limit: 1 } }),
      request.get('/dashboard'),
      request.get('/salesTrend'),
      request.get('/channels'),
      request.get('/orders', { params: { _sort: 'id', _order: 'desc', _limit: 5 } }),
      request.get('/orders', { params: { _limit: 9999 } }),
    ])

  // 聚合商品销量 TOP5（前端聚合，两个后端实现都能用）
  const acc = new Map<string, { name: string; qty: number; amount: number }>()
  for (const o of allOrdersRes.data as Order[]) {
    const cur = acc.get(o.product) ?? { name: o.product, qty: 0, amount: 0 }
    cur.qty += o.qty
    cur.amount += o.amount
    acc.set(o.product, cur)
  }
  const topProducts = [...acc.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)

  return {
    userCount: Number(usersRes.headers['x-total-count']),
    orderCount: Number(ordersRes.headers['x-total-count']),
    salesAmount: dashboardRes.data.salesAmount,
    conversion: dashboardRes.data.conversion,
    salesTrend: salesTrendRes.data,
    channels: channelsRes.data,
    recentOrders: recentRes.data,
    topProducts,
  }
}

export async function getUsers(query: UserQuery = {}): Promise<PagedResult<User>> {
  const { page = 1, pageSize = 10, keyword = '', status = '' } = query
  const params: Record<string, unknown> = { _page: page, _limit: pageSize, _sort: 'id', _order: 'desc' }
  if (keyword) params.q = keyword // json-server 的全文搜索
  if (status) params.status = status
  return paged<User>('/users', params)
}

export async function saveUser(data: Partial<User> & { id?: number }): Promise<void> {
  if (data.id) {
    await request.patch(`/users/${data.id}`, data)
    return
  }
  const { id: _ignored, ...rest } = data
  await request.post('/users', rest) // json-server 自动分配自增 id
}

export async function deleteUser(id: number): Promise<void> {
  await request.delete(`/users/${id}`)
}

export async function getOrders(query: OrderQuery = {}): Promise<PagedResult<Order>> {
  const { page = 1, pageSize = 10, status = '' } = query
  const params: Record<string, unknown> = { _page: page, _limit: pageSize, _sort: 'id', _order: 'desc' }
  if (status) params.status = status
  return paged<Order>('/orders', params)
}

// 按钮级权限演示：只有管理员能看到的操作
export async function markOrderDone(id: string): Promise<void> {
  await request.patch(`/orders/${id}`, { status: 'done' })
}

export async function getProducts(): Promise<Product[]> {
  const res = await request.get('/products')
  return res.data
}

export async function toggleProduct(id: number, onSale: boolean): Promise<void> {
  await request.patch(`/products/${id}`, { onSale })
}
