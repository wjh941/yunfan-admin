import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('💥 测试爆炸')
  return <div>正常内容</div>
}

describe('ErrorBoundary 全局错误边界', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('子组件正常时原样渲染', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })

  it('子组件抛错时展示兜底 UI 而不是白屏', () => {
    // React 会把组件树内的错误同步打到 console，测试时静音
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('页面出错了')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '回到首页' })).toBeInTheDocument()
  })
})
