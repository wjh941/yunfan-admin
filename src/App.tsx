import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Forbidden from './pages/Forbidden'
import PageLoading from './components/PageLoading'
import { hasAccess } from './access'
import type { AccessAction } from './access'

// 路由级代码分割：每个页面独立 chunk，echarts 等重组件只在需要时加载
// （学习 ant-design-pro / umi 的路由级拆包模式）
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))
const Orders = lazy(() => import('./pages/Orders'))
const Products = lazy(() => import('./pages/Products'))

// 路由守卫：没有 token 一律踢回登录页
function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// 角色守卫：登录了但没有对应权限点，展示 403 页面
function RequireAccess({ access, children }: { access: AccessAction; children: ReactNode }) {
  const { user } = useAuth()

  if (!hasAccess(user, access)) {
    return <Forbidden />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <RequireAccess access="viewUsers">
              <Suspense fallback={<PageLoading />}>
                <Users />
              </Suspense>
            </RequireAccess>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<PageLoading />}>
              <Orders />
            </Suspense>
          }
        />
        <Route
          path="products"
          element={
            <RequireAccess access="viewProducts">
              <Suspense fallback={<PageLoading />}>
                <Products />
              </Suspense>
            </RequireAccess>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
