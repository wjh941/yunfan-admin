import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Descriptions, Drawer, Space, Steps, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, PrinterOutlined } from '@ant-design/icons'
import { STATUS_MAP } from '../constants/status'
import { useAuth } from '../context/AuthContext'
import { hasAccess } from '../access'
import { getOrders, markOrderDone } from '../api'
import type { Order, OrderStatus } from '../types'

// 订单状态流：用于 Steps 进度可视化
const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'done']

interface OrderQuery {
  page: number
  pageSize: number
  status: string
}

export default function Orders() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canMarkDone = hasAccess(user, 'markOrderDone')

  const [query, setQuery] = useState<OrderQuery>({ page: 1, pageSize: 10, status: '' })
  const [current, setCurrent] = useState<Order | null>(null) // 抽屉里展示的订单
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  // 分页列表：keepPreviousData 让翻页不闪烁
  const { data, isLoading } = useQuery({
    queryKey: ['orders', query],
    queryFn: () => getOrders(query),
    placeholderData: keepPreviousData,
  })

  // 全量订单：用于状态统计条与批量操作
  const { data: allData } = useQuery({
    queryKey: ['ordersAll'],
    queryFn: () => getOrders({ page: 1, pageSize: 9999 }),
  })

  // 统计筛选条数据：各状态订单数
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '': allData?.total ?? 0,
      pending: 0,
      paid: 0,
      done: 0,
      cancelled: 0,
    }
    for (const o of allData?.list ?? []) counts[o.status]++
    return counts
  }, [allData])

  const markDoneMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => markOrderDone(id))),
    onSuccess: (_d, ids) => {
      message.success(`已将 ${ids.length} 笔订单标记为完成`)
      setSelectedKeys([])
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['ordersAll'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  // 打印发货单：新窗口输出排版好的 HTML，自动唤起打印
  const printOrders = (orders: Order[]) => {
    const rows = orders
      .map(
        (o, i) => `<tr>
          <td>${i + 1}</td><td>${o.id}</td><td>${o.product}</td><td>${o.qty}</td>
          <td style="text-align:right">¥${o.amount.toLocaleString()}</td>
          <td>${o.userName}</td><td>${STATUS_MAP[o.status].text}</td><td>${o.createdAt}</td>
        </tr>`,
      )
      .join('')
    const totalAmount = orders.reduce((s, o) => s + o.amount, 0)
    const win = window.open('', '_blank', 'width=900,height=650')
    if (!win) {
      message.error('浏览器拦截了打印窗口，请允许弹窗后重试')
      return
    }
    win.document
      .write(`<!doctype html><html><head><meta charset="utf-8"><title>云帆商城 · 发货单</title>
      <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 32px; color: #1f2328 }
        h1 { font-size: 20px; margin: 0 0 4px }
        .sub { color: #888; font-size: 12px; margin-bottom: 20px }
        table { width: 100%; border-collapse: collapse; font-size: 13px }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left }
        th { background: #f5f6f8 }
        .total { margin-top: 14px; text-align: right; font-size: 15px; font-weight: 700 }
      </style></head><body>
      <h1>📦 云帆商城 · 发货单</h1>
      <div class="sub">打印时间：${new Date().toLocaleString('zh-CN')} · 共 ${orders.length} 单</div>
      <table><thead><tr>
        <th>#</th><th>订单号</th><th>商品</th><th>数量</th><th>金额</th><th>买家</th><th>状态</th><th>下单时间</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="total">合计金额：¥${totalAmount.toLocaleString()}</div>
    </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const columns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'id', width: 140 },
    { title: '商品', dataIndex: 'product' },
    { title: '数量', dataIndex: 'qty', width: 70 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      render: (v) => <strong>¥{v.toLocaleString()}</strong>,
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => setCurrent(record)}
          >
            详情
          </Button>
          {canMarkDone && record.status !== 'done' && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => markDoneMutation.mutate([record.id])}
            >
              标记完成
            </Button>
          )}
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            icon={<PrinterOutlined />}
            onClick={() => printOrders([record])}
          >
            发货单
          </Button>
        </Space>
      ),
    },
  ]

  // 批量标记完成：只对未完成的选中订单生效
  const pendingSelected = selectedKeys.filter((id) => {
    const o = allData?.list.find((x) => x.id === id)
    return o && o.status !== 'done'
  })

  const batchMarkDone = () => {
    if (pendingSelected.length === 0) {
      message.info('选中订单均已完成')
      return
    }
    markDoneMutation.mutate(pendingSelected)
  }

  return (
    <Card>
      {/* 统计筛选条：点击彩色圆点 chip 即可筛选（替代下拉框，更快） */}
      <div className="status-chips">
        <button
          className={`status-chip ${query.status === '' ? 'status-chip-active' : ''}`}
          onClick={() => setQuery((q) => ({ ...q, status: '', page: 1 }))}
        >
          全部 <em>{statusCounts[''] ?? 0}</em>
        </button>
        {(Object.keys(STATUS_MAP) as OrderStatus[]).map((s) => (
          <button
            key={s}
            className={`status-chip ${query.status === s ? 'status-chip-active' : ''}`}
            onClick={() => setQuery((q) => ({ ...q, status: s, page: 1 }))}
          >
            <span className="chip-dot" style={{ background: STATUS_MAP[s].chipColor }} />
            {STATUS_MAP[s].text} <em>{statusCounts[s] ?? 0}</em>
          </button>
        ))}
      </div>

      {/* 批量操作条：勾选订单后出现 */}
      {selectedKeys.length > 0 && (
        <div className="batch-bar">
          <span>已选 {selectedKeys.length} 单</span>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() =>
              printOrders(allData?.list.filter((o) => selectedKeys.includes(o.id)) ?? [])
            }
          >
            打印发货单
          </Button>
          {canMarkDone && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={batchMarkDone}>
              批量标记完成
            </Button>
          )}
          <Button size="small" type="text" onClick={() => setSelectedKeys([])}>
            取消选择
          </Button>
        </div>
      )}

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.list}
        scroll={{ x: 900 }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as string[]),
        }}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setQuery((q) => ({ ...q, page, pageSize })),
        }}
      />

      <Drawer
        title={current ? `订单详情：${current.id}` : ''}
        width={420}
        open={!!current}
        onClose={() => setCurrent(null)}
      >
        {current && (
          <div>
            {/* 状态流进度条：一眼看出订单走到哪一步（已取消的订单单独提示） */}
            {current.status === 'cancelled' ? (
              <div className="order-cancelled">🚫 该订单已取消，流程终止</div>
            ) : (
              <Steps
                size="small"
                current={STATUS_FLOW.indexOf(current.status)}
                items={STATUS_FLOW.map((s) => ({ title: STATUS_MAP[s].text }))}
                style={{ marginBottom: 24 }}
              />
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="订单号">{current.id}</Descriptions.Item>
              <Descriptions.Item label="商品">{current.product}</Descriptions.Item>
              <Descriptions.Item label="数量">{current.qty} 件</Descriptions.Item>
              <Descriptions.Item label="金额">¥{current.amount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="买家">{current.userName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[current.status].color}>
                  {STATUS_MAP[current.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">{current.createdAt}</Descriptions.Item>
            </Descriptions>
            <Button
              block
              style={{ marginTop: 16 }}
              icon={<PrinterOutlined />}
              onClick={() => printOrders([current])}
            >
              打印发货单
            </Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}
