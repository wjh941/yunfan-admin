import { describe, expect, it } from 'vitest'
import { linearForecast } from './forecast'

describe('linearForecast 线性趋势外推（预测分析的数据基础）', () => {
  it('稳定增长序列：斜率为正，预测值延续增长', () => {
    const r = linearForecast([10, 20, 30, 40], 2)
    expect(r.slope).toBe(10)
    expect(r.forecast).toEqual([50, 60])
    expect(r.r2).toBe(1) // 完全线性，拟合优度满分
  })

  it('恒定序列：预测值不变且 R² = 1', () => {
    const r = linearForecast([5, 5, 5, 5], 2)
    expect(r.slope).toBe(0)
    expect(r.forecast).toEqual([5, 5])
    expect(r.r2).toBe(1)
  })

  it('下降序列：预测值继续下降（负增长）', () => {
    const r = linearForecast([40, 30, 20, 10], 1)
    expect(r.slope).toBe(-10)
    expect(r.forecast[0]).toBeLessThan(10)
  })

  it('带波动的真实序列：也能给出合理外推', () => {
    const r = linearForecast([82, 93, 101, 97, 118, 132, 129, 145, 158, 172], 2)
    expect(r.slope).toBeGreaterThan(0) // 整体上行
    expect(r.forecast[0]).toBeGreaterThan(172) // 预测 11 月继续增长
    expect(r.r2).toBeGreaterThan(0.8) // 波动较大但拟合度仍然高
  })

  it('数据不足时优雅降级不崩溃', () => {
    expect(linearForecast([42], 2).forecast).toEqual([42, 42])
    expect(linearForecast([], 2).forecast).toEqual([0, 0])
  })
})
