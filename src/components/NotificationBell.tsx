// 消息通知中心：铃铛 + 最近订单动态，点击跳转订单页
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await request.get('/orders', {
        params: { _sort: 'id', _order: 'desc', _limit: 5 },
      })
      setOrders(res.data)
    } catch {
      /* 拉取失败保持空态 */
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div style={{ width: 300 }}>
      {loading ? (
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
              onClick={() => {
                setOpen(false)
                navigate('/orders')
              }}
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
        onClick={() => {
          setOpen(false)
          navigate('/orders')
        }}
      >
        查看全部订单
      </Button>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={visible => {
        setOpen(visible)
        if (visible) load()
      }}
    >
      <Badge count={orders.length} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  )
}
