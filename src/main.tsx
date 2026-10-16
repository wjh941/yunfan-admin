import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AntdConfig from './components/AntdConfig'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import 'dayjs/locale/zh-cn'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AntdConfig>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ErrorBoundary>
      </AntdConfig>
    </ThemeProvider>
  </React.StrictMode>,
)
