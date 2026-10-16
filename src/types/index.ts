// 全局业务类型定义：接口返回值、组件 props 都从这里引用

/** 权限点：由后端登录接口下发，前端动态渲染 */
export type AccessAction = 'viewUsers' | 'viewProducts' | 'markOrderDone'

export interface AuthUser {
  name: string
  role: 'admin' | 'guest'
  avatar: string
  permissions: AccessAction[]
}

export interface LoginResult {
  token: string
  user: AuthUser
}

/** 用户管理表格里的用户（role 是展示用的业务角色） */
export interface User {
  id: number
  name: string
  age: number
  email: string
  role: string
  status: 'active' | 'disabled'
  createdAt: string
}

export type OrderStatus = 'pending' | 'paid' | 'done' | 'cancelled'

export interface Order {
  id: string
  product: string
  qty: number
  amount: number
  userName: string
  status: OrderStatus
  createdAt: string
}

export interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  onSale: boolean
}

/** 服务端分页的统一返回结构 */
export interface PagedResult<T> {
  list: T[]
  total: number
}

export interface SalesTrend {
  months: string[]
  values: number[]
}

/** 单月每日销售额（图表下钻数据） */
export interface DailySales {
  days: string[]
  values: number[]
}

export interface ChannelItem {
  name: string
  value: number
}

export interface TopProduct {
  name: string
  qty: number
  amount: number
}

export interface DashboardData {
  userCount: number
  orderCount: number
  salesAmount: number
  conversion: number
  salesTrend: SalesTrend
  salesDaily: Record<string, DailySales>
  channels: ChannelItem[]
  recentOrders: Order[]
  topProducts: TopProduct[]
}

export interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  status?: string
}
