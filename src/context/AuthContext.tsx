import { createContext, useContext, useEffect, useMemo } from 'react'
import * as api from '../api'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// 导出 Context 本体是为了组件测试时可以注入桩数据（正常业务代码请使用 useAuth）
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>('yunfan_token', null)
  const [user, setUser] = useLocalStorage<AuthUser | null>('yunfan_user', null)

  // 一次性迁移：旧版本的登录态没有 permissions 字段（RBAC 之前的数据），自动登出重新获取
  useEffect(() => {
    if (user && !Array.isArray(user.permissions)) {
      setToken(null)
      setUser(null)
    }
  }, [user, setToken, setUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      async login(username, password) {
        const res = await api.login(username, password)
        setToken(res.token)
        setUser(res.user)
      },
      logout() {
        setToken(null)
        setUser(null)
      },
    }),
    [token, user, setToken, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- Context 与配套 Hook 同文件是社区惯例
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 <AuthProvider> 内使用')
  return ctx
}
