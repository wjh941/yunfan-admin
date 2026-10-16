import { Spin } from 'antd'

/** 路由懒加载时的统一占位 */
export default function PageLoading() {
  return <Spin size="large" style={{ display: 'block', margin: '140px auto' }} />
}
