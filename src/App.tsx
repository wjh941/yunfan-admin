import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Forbidden from './pages/Forbidden'

// 路由守卫：没有 token 一律踢回登录页
function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// 角色守卫：登录了但角色不对，展示 403 页面
function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth()

  if (!user?.role || !roles.includes(user.role)) {
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
        <Route index element={<Dashboard />} />
        <Route
          path="users"
          element={
            <RequireRole roles={['admin']}>
              <Users />
            </RequireRole>
          }
        />
        <Route path="orders" element={<Orders />} />
        <Route
          path="products"
          element={
            <RequireRole roles={['admin']}>
              <Products />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
