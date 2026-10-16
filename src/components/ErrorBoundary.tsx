import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button, Result, Space } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * 全局错误边界：捕获子树内任何渲染期错误，展示兜底 UI 而不是整页白屏。
 * componentDidCatch 是预留的错误上报点，生产环境可接 Sentry 等监控平台。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: 接入监控平台后在这里上报 error + info.componentStack
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="页面出错了"
          subTitle="别担心，这不是你的问题。点击下方按钮即可恢复。"
          extra={
            <Space>
              <Button type="primary" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
              <Button onClick={() => window.location.assign('/')}>回到首页</Button>
            </Space>
          }
        />
      )
    }
    return this.props.children
  }
}
