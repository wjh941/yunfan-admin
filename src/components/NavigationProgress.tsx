// 路由切换进度条（学习 shadcn-admin 的 navigation-progress）
// 纯 CSS 动画实现：pathname 变化时 key 重挂载自动重播动画，零 JS 状态
import { useLocation } from 'react-router-dom'

export default function NavigationProgress() {
  const { pathname } = useLocation()

  return <div key={pathname} className="nav-progress" />
}
