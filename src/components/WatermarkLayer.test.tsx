import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import WatermarkLayer from './WatermarkLayer'

// vitest 未开启 globals，需要手动做 RTL 的 DOM 清理，避免用例间元素重复
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  localStorage.clear()
  // jsdom 没有 canvas 实现：mock 掉 getContext（返回 null 时 antd Watermark 会跳过
  // 绘制，但包装层 DOM 照常挂载），同时避免 jsdom 打 "Not implemented" 报错噪音
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

// 桩 AuthContext：不触网，用户名用于水印内容
function renderWithProviders(ui: ReactNode) {
  return render(
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          token: 'test-token',
          user: { name: '王运营', role: 'admin', avatar: '🧑‍💼', permissions: [] },
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        {ui}
      </AuthContext.Provider>
    </ThemeProvider>,
  )
}

// 测试挂具：真实 ThemeProvider 驱动开关，按钮模拟设置菜单里的切换动作
function WatermarkSwitchHarness() {
  const { setWatermark } = useTheme()
  return (
    <>
      <button onClick={() => setWatermark(false)}>关闭水印</button>
      <WatermarkLayer>
        <div>页面内容</div>
      </WatermarkLayer>
    </>
  )
}

describe('WatermarkLayer 全局水印', () => {
  it('默认开启：水印层挂在内容区顶层，业务内容被包裹在内（登录后才挂载，登录页无此层）', () => {
    renderWithProviders(
      <WatermarkLayer>
        <div>页面内容</div>
      </WatermarkLayer>,
    )

    // 包装层由 antd <Watermark> children 模式渲染（position: relative + overflow: hidden），
    // 水印覆盖层（pointer-events: none）挂在它内部而不是 body
    const layer = document.querySelector('.app-watermark')
    expect(layer).toBeInTheDocument()
    expect(layer).toContainElement(screen.getByText('页面内容'))
  })

  it('设置里关闭水印：包装层从 DOM 卸载，开关状态持久化到 localStorage', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WatermarkSwitchHarness />)

    expect(document.querySelector('.app-watermark')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭水印' }))

    expect(document.querySelector('.app-watermark')).not.toBeInTheDocument()
    expect(localStorage.getItem('yunfan_watermark')).toBe('false')
  })
})
