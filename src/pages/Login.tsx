import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { token, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 已经登录过就直接进后台
  if (token) return <Navigate to="/" replace />

  const onFinish = async ({ username, password }: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(username, password)
      message.success('登录成功，欢迎回来')
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          ⛵ 云帆管理后台
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          React + Ant Design 后台管理系统
        </Typography.Paragraph>

        <Form
          size="large"
          onFinish={onFinish}
          initialValues={{ username: 'admin', password: '123456' }}
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          管理员：admin / 123456（全部功能）· 只读访客：guest / 123456
        </Typography.Text>
      </Card>
    </div>
  )
}
