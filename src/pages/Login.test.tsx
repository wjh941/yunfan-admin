import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'
import { AuthContext } from '../context/AuthContext'

// vitest 未开启 globals，需要手动做 RTL 的 DOM 清理，避免用例间元素重复
afterEach(() => cleanup())

// 用桩 AuthContext 渲染登录页（不触网）
function renderLogin(login: (username: string, password: string) => Promise<void>) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ token: null, user: null, login, logout: vi.fn() }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Login 登录页', () => {
  it('渲染标题与双角色演示账号提示', () => {
    renderLogin(vi.fn())
    expect(screen.getByText('⛵ 云帆管理后台')).toBeInTheDocument()
    expect(screen.getByText(/只读访客/)).toBeInTheDocument()
  })

  it('用户名为空时提交显示校验错误', async () => {
    const user = userEvent.setup()
    renderLogin(vi.fn())
    await user.clear(screen.getByPlaceholderText('用户名'))
    await user.click(screen.getByRole('button', { name: /登/ }))
    expect(await screen.findByText('请输入用户名')).toBeInTheDocument()
  })

  it('提交时用表单值调用 login（默认预填 admin / 123456）', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderLogin(login)
    await user.click(screen.getByRole('button', { name: /登/ }))
    await vi.waitFor(() => expect(login).toHaveBeenCalledWith('admin', '123456'))
  })
})
