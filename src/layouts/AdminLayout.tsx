import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tabs,
  Tooltip,
  theme,
} from 'antd'
import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { hasAccess } from '../access'
import type { AccessAction } from '../access'
import type { ReactNode } from 'react'
import CommandPalette from '../components/CommandPalette'
import NotificationBell from '../components/NotificationBell'
import BackToTop from '../components/BackToTop'
import { useLocalStorage } from '../hooks/useLocalStorage'

const { Sider, Header, Content, Footer } = Layout

/** 已打开页面的标签（多标签页导航，学习 soybean-admin） */
interface PageTab {
  key: string
  label: string
}

const MENU_ITEMS: {
  key: string
  icon: ReactNode
  label: string
  access?: AccessAction
}[] = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理', access: 'viewUsers' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理', access: 'viewProducts' },
]

const TITLES: Record<string, string> = {
  '/': '仪表盘',
  '/users': '用户管理',
  '/orders': '订单管理',
  '/products': '商品管理',
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { token: themeToken } = theme.useToken()

  // 菜单权限：只显示当前角色有权限点的菜单项（判断逻辑收敛在 access.ts）
  const visibleMenuItems = MENU_ITEMS.filter(
    item => !item.access || hasAccess(user, item.access),
  )

  // 多标签页：访问过的页面自动生成标签，持久化到 localStorage
  const [tabs, setTabs] = useLocalStorage<PageTab[]>('yunfan_tabs', [{ key: '/', label: '仪表盘' }])

  useEffect(() => {
    const label = TITLES[pathname]
    if (label) {
      setTabs(ts => (ts.some(t => t.key === pathname) ? ts : [...ts, { key: pathname, label }]))
    }
  }, [pathname, setTabs, tabs])

  const removeTab = (targetKey: string) => {
    const next = tabs.filter(t => t.key !== targetKey)
    setTabs(next)
    // 关闭的是当前页 → 跳到剩余的最后一个标签
    if (targetKey === pathname && next.length > 0) {
      navigate(next[next.length - 1].key)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CommandPalette />

      <Sider
        theme="dark"
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={broken => setCollapsed(broken)}
      >
        <div className="logo">{collapsed ? '⛵' : '⛵ 云帆管理后台'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={visibleMenuItems}
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: themeToken.colorBgContainer,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Space size={16}>
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 16 }} onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 16 }} onClick={() => setCollapsed(true)} />
            )}
            <Breadcrumb
              items={[
                { title: <Link to="/">首页</Link> },
                { title: TITLES[pathname] ?? '页面' },
              ]}
            />
          </Space>

          <Space size={16}>
            {/* 全局搜索入口（也可以直接按 Ctrl/⌘ + K） */}
            <Button
              size="small"
              className="palette-trigger"
              icon={<SearchOutlined />}
              onClick={() => window.dispatchEvent(new Event('yunfan:open-palette'))}
            >
              搜索 <span className="kbd">Ctrl K</span>
            </Button>

            <Tooltip title={dark ? '切换亮色模式' : '切换暗色模式'}>
              <Button
                type="text"
                size="small"
                style={{ fontSize: 16 }}
                onClick={toggle}
              >
                {dark ? '☀️' : '🌙'}
              </Button>
            </Tooltip>

            <NotificationBell />

            <Dropdown
              menu={{
                items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    localStorage.removeItem('yunfan_tabs') // 不同角色的标签互不影响
                    logout()
                  },
                },
                ],
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#4f6ef2' }} icon={!user && <UserOutlined />}>
                  {user?.avatar}
                </Avatar>
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 多标签页导航（学习 soybean-admin）：首页标签固定不可关闭 */}
        <div className="tab-bar" style={{ background: themeToken.colorBgContainer }}>
          <Tabs
            type="editable-card"
            size="small"
            hideAdd
            activeKey={pathname}
            items={tabs.map(t => ({ key: t.key, label: t.label, closable: t.key !== '/' }))}
            onChange={key => navigate(key)}
            onEdit={(targetKey, action) => action === 'remove' && removeTab(String(targetKey))}
          />
        </div>

        <Content style={{ margin: 16 }}>
          {/* key 换页面时重新挂载，触发入场动画 */}
          <div className="page-fade" key={pathname}>
            <Outlet />
          </div>
          <BackToTop />
        </Content>

        <Footer style={{ textAlign: 'center', fontSize: 12, color: themeToken.colorTextQuaternary }}>
          云帆 Admin · React 18 + Vite + Ant Design + ECharts
        </Footer>
      </Layout>
    </Layout>
  )
}
