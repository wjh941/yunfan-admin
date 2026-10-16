import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface ThemeContextValue {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useLocalStorage('yunfan_dark', false)

  const value = useMemo(
    () => ({
      dark,
      toggle: () => setDark((d) => !d),
    }),
    [dark, setDark],
  )

  // body 挂 class，让 antd 之外的元素（登录页背景等）也跟随主题
  document.body.classList.toggle('dark', dark)

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- Context 与配套 Hook 同文件是社区惯例
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 <ThemeProvider> 内使用')
  return ctx
}
