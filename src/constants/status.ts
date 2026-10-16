import type { OrderStatus } from '../types'

// 订单状态字典：状态 → 文案 / 颜色 / emoji / chip色（Tag、Timeline、统计条通用）
export const STATUS_MAP: Record<
  OrderStatus,
  { text: string; color: string; emoji: string; chipColor: string }
> = {
  pending: { text: '待支付', color: 'orange', emoji: '⏳', chipColor: '#fa8c16' },
  paid: { text: '已支付', color: 'blue', emoji: '💳', chipColor: '#1677ff' },
  done: { text: '已完成', color: 'green', emoji: '✅', chipColor: '#52c41a' },
  cancelled: { text: '已取消', color: 'default', emoji: '🚫', chipColor: '#bfbfbf' },
}
