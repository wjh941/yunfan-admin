/**
 * 最小二乘法线性趋势外推
 * 基于历史序列拟合 y = a + b·x，再外推未来 periods 期
 */
export interface ForecastResult {
  /** 未来 periods 期的预测值 */
  forecast: number[]
  /** 斜率（每期平均增量），正值代表增长趋势 */
  slope: number
  /** 拟合优度 R²（0~1，越接近 1 越可信） */
  r2: number
}

export function linearForecast(values: number[], periods = 2): ForecastResult {
  const n = values.length
  if (n < 2) {
    return { forecast: Array(periods).fill(values[0] ?? 0), slope: 0, r2: 0 }
  }

  const sumX = ((n - 1) * n) / 2
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((s, y, x) => s + x * y, 0)
  const sumX2 = values.reduce((s, _, x) => s + x * x, 0)
  const denom = n * sumX2 - sumX * sumX
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const a = (sumY - b * sumX) / n

  const forecast = Array.from({ length: periods }, (_, i) => +(a + b * (n + i)).toFixed(1))

  // 拟合优度 R² = 1 - SSE/SST
  const meanY = sumY / n
  const ssTot = values.reduce((s, y) => s + (y - meanY) ** 2, 0)
  const ssRes = values.reduce((s, y, x) => s + (y - (a + b * x)) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : +(1 - ssRes / ssTot).toFixed(3)

  return { forecast, slope: +b.toFixed(2), r2 }
}
