import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { VerticalAlignTopOutlined } from '@ant-design/icons'

/** 返回顶部：滚动超过一屏后出现，平滑滚回 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <Button
      type="primary"
      className="back-top"
      icon={<VerticalAlignTopOutlined />}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="返回顶部"
    />
  )
}
