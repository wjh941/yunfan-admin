// 消息通知中心：铃铛 + 最近订单动态，React Query 每 30 秒自动轮询刷新角标
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Empty, List, Popover, Spin } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import request from '../api/request'
import type { Order, OrderStatus } from '../types'

const STATUS_TEXT: Record<OrderStatus, { text: string; emoji: string }> = {
  pending: { text: '待支付', emoji: '⏳' },
  paid: { text: '已支付', emoji: '💳' },
  done: { text: '已完成', emoji: '✅' },
  cancelled: { text: '已取消', emoji: '🚫' },
}

// 拉取最近订单（供角标与弹层共用一份缓存）
async function fetchRecentOrders(): Promise<Order[]> {
  const res = await request.get('/orders', {
    params: { _sort: 'id', _order: 'desc', _limit: 5 },
  })
  return res.data
}

export default function NotificationBell() {
  const navigate = useNavigate()

  // refetchInterval：每 30 秒自动轮询，角标实时反映最新订单
  const { data: orders = [], isFetching } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 30_000,
  })

  const content = (
    <div style={{ width: 300 }}>
      {isFetching && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 28 }}>
          <Spin />
        </div>
      ) : orders.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无新消息" style={{ padding: 12 }} />
      ) : (
        <List
          size="small"
          dataSource={orders}
          renderItem={o => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/orders')}
            >
              <List.Item.Meta
                title={
                  <span style={{ fontSize: 13 }}>
                    {STATUS_TEXT[o.status].emoji} {o.userName} 的订单
                  </span>
                }
                description={
                  <span style={{ fontSize: 12 }}>
                    {o.product} · ¥{o.amount.toLocaleString()} · {o.createdAt}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
      <Button
        type="link"
        block
        size="small"
        onClick={() => navigate('/orders')}
      >
        查看全部订单
      </Button>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Badge count={orders.length} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  )
}
