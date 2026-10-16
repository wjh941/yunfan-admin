// 自封装 ECharts 组件。
// 为什么不用 echarts-for-react？它内部全量 import 'echarts'，会导致按需引入失效。
// 这里的实现只依赖 echarts/core，配合 utils/echarts.js 注册的图表类型实现真正的 tree-shaking
import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import echarts from '../utils/echarts'

interface EChartProps {
  option: EChartsCoreOption
  style?: CSSProperties
}

export default function EChart({ option, style }: EChartProps) {
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
