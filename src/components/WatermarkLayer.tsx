import { Watermark } from 'antd'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

/** 没有登录用户信息时的兜底文案（登录页不挂水印层，正常业务走不到这里） */
const FALLBACK_TEXT = '云帆 Admin'

/**
 * 全局水印（学习 ant-design-pro / ProLayout 的企业级水印能力，内部系统防截图泄露）：
 * - 内容取当前登录用户名，截图可溯源
 * - 基于 antd 5 内置 <Watermark>：Canvas 平铺背景、旋转 -22°、低透明度（跟随主题
 *   token.colorFill）、pointer-events: none；自带 MutationObserver 防篡改——
 *   覆盖层被删除或改样式会自动重挂，"隐藏元素"伎俩也会被还原
 * - 以包装层形式挂在后台布局顶层而不是 body 全局悬浮层：登录页在 AdminLayout
 *   之外，天然无水印；Sider/Header/Content/Footer 全部覆盖
 */
export default function WatermarkLayer({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { watermark } = useTheme()

  // 设置里关掉 → 不渲染包装层，DOM 里查无水印
  if (!watermark) return <>{children}</>

  return (
    // rotate=-22 是 antd 默认值，这里写出来是为了跟需求显式对齐；zIndex 默认 9，
    // 低于 BackToTop(99)/命令面板(200)/antd 弹层(1050+)，不会挡交互
    <Watermark
      className="app-watermark"
      content={user?.name ?? FALLBACK_TEXT}
      rotate={-22}
      font={{ fontSize: 14 }}
    >
      {children}
    </Watermark>
  )
}
