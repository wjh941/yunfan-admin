import type { OrderStatus } from '../types'

// 订单状态字典：状态 → 文案 / 颜色（Tag、Timeline 通用）
export const STATUS_MAP: Record<OrderStatus, { text: string; color: string }> = {
  pending: { text: '待支付', color: 'orange' },
  paid: { text: '已支付', color: 'blue' },
  done: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
}
