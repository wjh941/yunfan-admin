import { useEffect, useState } from 'react'
import { Button, Card, Descriptions, Drawer, Select, Space, Table, Tag, message } from 'antd'
import { STATUS_MAP } from '../constants/status'
import { useAuth } from '../context/AuthContext'
import { getOrders, markOrderDone } from '../api'
import type { Order, OrderStatus } from '../types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  ...Object.entries(STATUS_MAP).map(([value, { text }]) => ({ value, label: text })),
]

export default function Orders() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [list, setList] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState({ page: 1, pageSize: 10, status: '' })
  const [current, setCurrent] = useState<Order | null>(null) // 抽屉里展示的订单

  const [tick, setTick] = useState(0)
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getOrders(query).then(res => {
      if (ignore) return
      setList(res.list)
      setTotal(res.total)
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [query, tick])

  // 按钮级权限：只有管理员能看到「标记完成」
  const handleMarkDone = async (record: Order) => {
    await markOrderDone(record.id)
    message.success(`订单 ${record.id} 已标记为完成`)
    setTick(t => t + 1)
  }

  const columns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'id', width: 140 },
    { title: '商品', dataIndex: 'product' },
    { title: '数量', dataIndex: 'qty', width: 70 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      render: v => <strong>¥{v.toLocaleString()}</strong>,
    },
    { title: '买家', dataIndex: 'userName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: OrderStatus) => <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].text}</Tag>,
    },
    { title: '下单时间', dataIndex: 'createdAt', width: 140 },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setCurrent(record)}>
            查看详情
          </Button>
          {isAdmin && record.status !== 'done' && (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => handleMarkDone(record)}>
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Select
          options={STATUS_OPTIONS}
          value={query.status}
          style={{ width: 130 }}
          onChange={status => setQuery(q => ({ ...q, status, page: 1 }))}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 900 }}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`,
          onChange: (page, pageSize) => setQuery(q => ({ ...q, page, pageSize })),
        }}
      />

      <Drawer
        title={`订单详情：${current?.id ?? ''}`}
        width={420}
        open={!!current}
        onClose={() => setCurrent(null)}
      >
        {current && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{current.id}</Descriptions.Item>
            <Descriptions.Item label="商品">{current.product}</Descriptions.Item>
            <Descriptions.Item label="数量">{current.qty} 件</Descriptions.Item>
            <Descriptions.Item label="金额">
              ¥{current.amount.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="买家">{current.userName}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[current.status].color}>{STATUS_MAP[current.status].text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="下单时间">{current.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Card>
  )
}
