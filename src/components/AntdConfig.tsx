import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useTheme } from '../context/ThemeContext'

/** 让 antd 组件跟随暗色模式：切换 theme.algorithm 即可全局生效 */
export default function AntdConfig({ children }: { children: ReactNode }) {
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
