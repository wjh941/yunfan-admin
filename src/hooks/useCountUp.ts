import { useEffect, useState } from 'react'

/**
 * 数字滚动动画：目标值变化时用 easeOutCubic 缓动从 0 数到目标值
 * 让统计卡"活"起来——纯 requestAnimationFrame 实现，零依赖
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic：先快后慢
      setValue(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
