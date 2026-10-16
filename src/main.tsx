import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import type { ReactNode } from 'react'
import './styles.css'

// 服务端状态管理：缓存、去重、失效刷新都交给 React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 失败自动重试一次
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30 秒内复用缓存，切页不再重复请求
    },
  },
})

// 让 antd 组件跟随暗色模式：切换 theme.algorithm 即可全局生效
function AntdConfig({ children }: { children: ReactNode }) {
  const { dark } = useTheme()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#4f6ef2', borderRadius: 8 },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AntdConfig>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntdConfig>
    </ThemeProvider>
  </React.StrictMode>,
)
