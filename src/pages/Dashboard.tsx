import { useRef, useState } from 'react'
import { Button, Card, Col, Row, Segmented, Skeleton, Space, Statistic, Timeline } from 'antd'
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
import { linearForecast } from '../utils/forecast'
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
  // 趋势卡视图：总览（可下钻）/ 分产品多折线 / 预测分析
  const [view, setView] = useState<'overview' | 'product' | 'forecast'>('overview')
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

  // 图表下钻：总览视图下，drillMonth 有值时切换为该月每日销售额折线
  const daily = drillMonth && view === 'overview' ? data.salesDaily[drillMonth] : undefined
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

  // 「分产品」多折线：TOP5 产品各自的月度销售额（从全量订单按月聚合）
  const SERIES_COLORS = ['#4f6ef2', '#fa8c16', '#13c2c2', '#722ed1', '#52c41a']
  const productOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: data.productTrend.series.map((s) => s.name), bottom: 0 },
    grid: { left: 70, right: 24, top: 20, bottom: 60 },
    xAxis: { type: 'category', data: data.productTrend.months },
    yAxis: { type: 'value', name: '元' },
    series: data.productTrend.series.map((s, i) => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      lineStyle: { width: 2 },
      itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
    })),
  }

  // 「预测」视图：历史实际 + 最小二乘线性外推（虚线），markLine 标出预测起点
  const fc = linearForecast(data.salesTrend.values, 2)
  const lastActual = data.salesTrend.values[data.salesTrend.values.length - 1]
  const forecastOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际销售额', '预测销售额'], bottom: 0 },
    grid: { left: 50, right: 24, top: 30, bottom: 60 },
    xAxis: { type: 'category', data: [...data.salesTrend.months, '11月', '12月'] },
    yAxis: { type: 'value', name: '万元' },
    series: [
      {
        name: '实际销售额',
        type: 'line',
        smooth: true,
        data: [...data.salesTrend.values, null, null],
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#4f6ef2' },
      },
      {
        name: '预测销售额',
        type: 'line',
        smooth: true,
        data: [...Array(data.salesTrend.values.length - 1).fill(null), lastActual, ...fc.forecast],
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#fa8c16' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#999' },
          label: { formatter: '预测起点', position: 'insideEndTop' },
          data: [{ xAxis: data.salesTrend.months[data.salesTrend.months.length - 1] }],
        },
      },
    ],
  }

  const trendOption =
    view === 'product' ? productOption : view === 'forecast' ? forecastOption : lineOption

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
            title={
              view === 'overview' && drillMonth
                ? `${drillMonth} · 每日销售额`
                : view === 'product'
                  ? '分产品销售额趋势（TOP5）'
                  : view === 'forecast'
                    ? '销售额预测 · 线性回归外推'
                    : '月度销售额趋势'
            }
            extra={
              <Space>
                {view === 'overview' && drillMonth && (
                  <Button size="small" onClick={() => setDrillMonth(null)}>
                    ← 返回全年
                  </Button>
                )}
                <Segmented
                  size="small"
                  value={view}
                  onChange={(v) => setView(v as typeof view)}
                  options={[
                    { label: '总览', value: 'overview' },
                    { label: '分产品', value: 'product' },
                    { label: '预测', value: 'forecast' },
                  ]}
                />
              </Space>
            }
          >
            <div ref={chartBoxRef}>
              {view === 'forecast' && (
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  基于近 10 个月最小二乘线性回归外推 · 拟合优度 R² = {fc.r2} · 预计 11 月{' '}
                  <strong>{fc.forecast[0]} 万</strong> / 12 月 <strong>{fc.forecast[1]} 万</strong>
                </div>
              )}
              <EChart
                option={trendOption}
                style={{ height: 300 }}
                onZrClick={view === 'overview' ? handleTrendZrClick : undefined}
              />
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
