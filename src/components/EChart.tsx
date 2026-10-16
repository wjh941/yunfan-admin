// 自封装 ECharts 组件。
// 为什么不用 echarts-for-react？它内部全量 import 'echarts'，会导致按需引入失效。
// 这里的实现只依赖 echarts/core，配合 utils/echarts.ts 注册的图表类型实现真正的 tree-shaking
import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import echarts from '../utils/echarts'

/** 事件处理器表：如 { click: params => ... }（参数为 ECharts 的事件对象） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartEventHandlers = Record<string, (params: any) => void>

interface EChartProps {
  option: EChartsCoreOption
  style?: CSSProperties
  onEvents?: ChartEventHandlers
  /** 画布级点击（zrender 层）：不依赖点中图形，适合"点哪算哪"的区域下钻交互 */
  onZrClick?: (position: { offsetX: number; offsetY: number }) => void
}

export default function EChart({ option, style, onEvents, onZrClick }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.EChartsType | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }
    // notMerge = true：option 变化时丢弃旧配置，避免残留系列
    chartRef.current.setOption(option, true)
  }, [option])

  // 事件绑定与 option 分离：图表实例只创建一次，事件随 props 更新
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !onEvents) return
    for (const [event, handler] of Object.entries(onEvents)) {
      chart.off(event)
      chart.on(event, handler)
    }
  }, [onEvents])

  // zrender 画布级点击
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !onZrClick) return
    const zr = chart.getZr()
    const handler = (e: { offsetX: number; offsetY: number }) =>
      onZrClick({ offsetX: e.offsetX, offsetY: e.offsetY })
    zr.on('click', handler)
    return () => zr.off('click', handler)
  }, [onZrClick])

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={style} />
}
