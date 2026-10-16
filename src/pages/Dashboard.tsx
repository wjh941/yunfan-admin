import { useRef, useState } from 'react'
import { Button, Card, Col, Row, Skeleton, Statistic, Timeline } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpOutlined,
  DollarOutlined,
  FallOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import EChart from '../components/EChart'
import { STATUS_MAP } from '../constants/status'
import { hasAccess } from '../access'
import { getDashboard } from '../api'
import { useAuth } from '../context/AuthContext'
import type { AccessAction } from '../types'

function StatCard({
  icon,
  bg,
  title,
  value,
  precision,
  suffix,
  extra,
  onClick,
}: {
  icon: ReactNode
  bg: string
  title: string
  value: number
  precision?: number
  suffix?: string
  extra: ReactNode
  onClick?: () => void
}) {
  return (
    <Card
      className="stat-card"
      hoverable={!!onClick}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Statistic title={title} value={value} precision={precision} suffix={suffix} />
        <div className="stat-icon" style={{ background: bg }}>
          {icon}
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>{extra}</div>
    </Card>
  )
}

// 加载骨架屏：占位结构与真实布局一致，加载完成不会跳动
function DashboardSkeleton() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        {[0, 1, 2, 3].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  // 图表下钻状态：null = 全年月度视图，'1月' 等 = 该月每日视图
  const [drillMonth, setDrillMonth] = useState<string | null>(null)
  // Hooks 必须在任何条件 return 之前调用
  const chartBoxRef = useRef<HTMLDivElement | null>(null)
  // 数据由 React Query 管理：30 秒缓存内切页秒开，invalidate 后自动刷新
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (!data) return <DashboardSkeleton />

  // 权限感知的卡片跳转：没有对应权限点的卡片不可点击
  const cardClick = (action: AccessAction, path: string) =>
    hasAccess(user, action) ? () => navigate(path) : undefined

  // 区域下钻：点击趋势图任意位置，按横坐标换算出最近的月份
  const handleTrendZrClick = (e: { offsetX: number; offsetY: number }) => {
    if (drillMonth || !chartBoxRef.current) return
    const months = data.salesTrend.months
    const gridLeft = 50
    const plotWidth = chartBoxRef.current.clientWidth - gridLeft - 24
    const idx = Math.round(((e.offsetX - gridLeft) / plotWidth) * (months.length - 1))
    const clamped = Math.min(months.length - 1, Math.max(0, idx))
    setDrillMonth(months[clamped])
  }

  // 图表下钻：drillMonth 有值时切换为该月每日销售额折线
  const daily = drillMonth ? data.salesDaily[drillMonth] : undefined
  const lineOption = daily
    ? {
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 24, top: 30, bottom: 34 },
        xAxis: { type: 'category', data: daily.days },
        yAxis: { type: 'value', name: '万元' },
        series: [
          {
            name: `${drillMonth}每日销售额`,
            type: 'line',
            smooth: true,
            data: daily.values,
            areaStyle: { opacity: 0.15 },
            itemStyle: { color: '#fa8c16' },
          },
        ],
      }
    : {
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 24, top: 30, bottom: 34 },
        xAxis: { type: 'category', data: data.salesTrend.months },
        yAxis: { type: 'value', name: '万元' },
        series: [
          {
            name: '销售额',
            type: 'line',
            smooth: true,
            data: data.salesTrend.values,
            areaStyle: { opacity: 0.15 },
            itemStyle: { color: '#4f6ef2' },
          },
        ],
      }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}：{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['42%', '66%'],
        data: data.channels,
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  }

  // 横向条形图：销量升序排列，第一名的柱子显示在最上面
  const topAsc = [...data.topProducts].reverse()
  const topOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        const item = data.topProducts.find((x) => x.name === p.name)
        return `${p.name}<br/>销量 ${p.value} 件 · 销售额 ¥${(item?.amount ?? 0).toLocaleString()}`
      },
    },
    grid: { left: 110, right: 40, top: 10, bottom: 24 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: topAsc.map((p) => p.name) },
    series: [
      {
        type: 'bar',
        data: topAsc.map((p) => p.qty),
        barWidth: 14,
        itemStyle: { color: '#4f6ef2', borderRadius: [0, 7, 7, 0] },
      },
    ],
  }

  const timelineItems = data.recentOrders.map((o) => ({
    color: STATUS_MAP[o.status].color,
    children: (
      <div key={o.id} style={{ fontSize: 13 }}>
        <div>
          <strong>{o.userName}</strong> 下单了「{o.product}」
        </div>
        <div style={{ color: '#999', fontSize: 12 }}>
          {STATUS_MAP[o.status].text} · ¥{o.amount.toLocaleString()} · {o.createdAt}
        </div>
      </div>
    ),
  }))

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            bg="#4f6ef2"
            title="总用户数"
            value={data.userCount}
            extra={
              <span>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较上月 +12.4%
              </span>
            }
            onClick={cardClick('viewUsers', '/users')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ShoppingOutlined />}
            bg="#722ed1"
            title="订单总数"
            value={data.orderCount}
            extra={
              <span>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较上月 +8.1%
              </span>
            }
            onClick={() => navigate('/orders')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<DollarOutlined />}
            bg="#fa8c16"
            title="本月销售额"
            value={data.salesAmount}
            precision={1}
            suffix="万"
            extra={
              <span>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较上月 +9.0%
              </span>
            }
            onClick={() => navigate('/orders')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FallOutlined />}
            bg="#13c2c2"
            title="支付转化率"
            value={data.conversion}
            precision={1}
            suffix="%"
            extra={
              <span>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较上月 +0.3%
              </span>
            }
            onClick={cardClick('viewProducts', '/products')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={drillMonth ? `${drillMonth} · 每日销售额` : '月度销售额趋势'}
            extra={
              drillMonth ? (
                <Button size="small" onClick={() => setDrillMonth(null)}>
                  ← 返回全年
                </Button>
              ) : (
                <span style={{ fontSize: 12, color: '#999' }}>
                  点击图表任意位置可查看当月每日明细
                </span>
              )
            }
          >
            <div ref={chartBoxRef}>
              <EChart option={lineOption} style={{ height: 300 }} onZrClick={handleTrendZrClick} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="流量渠道占比">
            <EChart option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="商品销量 TOP5">
            <EChart option={topOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最新动态">
            <Timeline items={timelineItems} style={{ marginTop: 12 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
