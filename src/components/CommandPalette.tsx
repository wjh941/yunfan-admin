// ⌘K 命令面板：全局搜索页面 / 用户 / 订单，键盘 ↑↓ 导航、回车跳转
// 这是现代 SaaS 的标配交互（Linear / GitHub / Notion 同款），也是本项目的差异化亮点
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Modal } from 'antd'
import { useAuth } from '../context/AuthContext'
import request from '../api/request'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Order, User } from '../types'

type PaletteItem =
  | { type: 'page'; id: string; title: string; hint: string }
  | { type: 'user'; id: number; title: string; hint: string }
  | { type: 'order'; id: string; title: string; hint: string }

const PAGES = [
  { key: '/', title: '仪表盘', hint: '数据总览', roles: ['admin', 'guest'] },
  { key: '/users', title: '用户管理', hint: '用户列表 · 新增 · 导出', roles: ['admin'] },
  { key: '/orders', title: '订单管理', hint: '订单查询 · 标记完成', roles: ['admin', 'guest'] },
  { key: '/products', title: '商品管理', hint: '上下架 · 库存', roles: ['admin'] },
]

const TYPE_LABEL = { page: '页面', user: '用户', order: '订单' }

export default function CommandPalette() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<{ users: User[]; orders: Order[] }>({
    users: [],
    orders: [],
  })
  const [active, setActive] = useState(0)

  // 全局快捷键 ⌘K / Ctrl+K：开 / 关面板（打开时重置搜索状态）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) {
          setOpen(false)
        } else {
          setQuery('')
          setRemote({ users: [], orders: [] })
          setActive(0)
          setOpen(true)
        }
      }
    }
    // 头部按钮通过自定义事件打开面板
    const onOpen = () => {
      setQuery('')
      setRemote({ users: [], orders: [] })
      setActive(0)
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('yunfan:open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('yunfan:open-palette', onOpen)
    }
  }, [open])

  // 远程搜索用户 / 订单（防抖 300ms）
  useEffect(() => {
    if (!open) return undefined
    const kw = query.trim()
    if (!kw) return undefined
    const timer = setTimeout(async () => {
      try {
        const [u, o] = await Promise.all([
          request.get<User[]>('/users', { params: { q: kw, _limit: 4 } }),
          request.get<Order[]>('/orders', { params: { q: kw, _limit: 4 } }),
        ])
        setRemote({ users: u.data, orders: o.data })
      } catch {
        /* 搜索失败静默降级 */
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open])

  const pages = useMemo(
    () =>
      PAGES.filter((p) => (user?.role ? p.roles.includes(user.role) : false)).filter(
        (p) => !query.trim() || p.title.includes(query.trim()),
      ),
    [user, query],
  )

  // 拍平结果，供键盘 ↑↓ 导航（关键词为空时派生空结果）
  const flat = useMemo<PaletteItem[]>(() => {
    const shown = query.trim() ? remote : { users: [] as User[], orders: [] as Order[] }
    return [
      ...pages.map((p) => ({ type: 'page' as const, id: p.key, title: p.title, hint: p.hint })),
      ...shown.users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.name,
        hint: u.email,
      })),
      ...shown.orders.map((o) => ({
        type: 'order' as const,
        id: o.id,
        title: `${o.id} · ${o.product}`,
        hint: `${o.userName} · ¥${o.amount.toLocaleString()}`,
      })),
    ]
  }, [pages, remote, query])

  const run = useCallback(
    (item: PaletteItem) => {
      setOpen(false)
      if (item.type === 'page') navigate(item.id)
      if (item.type === 'user') navigate('/users')
      if (item.type === 'order') navigate('/orders')
    },
    [navigate],
  )

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      run(flat[active])
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      width={560}
      style={{ top: 100 }}
      styles={{ body: { padding: 0 } }}
    >
      <Input
        size="large"
        variant="borderless"
        autoFocus
        placeholder="搜索页面、用户、订单…  ↑↓ 选择 · 回车跳转 · Esc 关闭"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onInputKey}
      />
      <div className="palette-list">
        {flat.length === 0 && <div className="palette-empty">没有匹配结果，换个关键词试试</div>}
        {flat.map((item, i) => (
          <div
            key={`${item.type}-${item.id}`}
            className={`palette-item ${i === active ? 'palette-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => run(item)}
          >
            <span className={`palette-badge palette-${item.type}`}>{TYPE_LABEL[item.type]}</span>
            <span className="palette-title">{item.title}</span>
            <span className="palette-hint">{item.hint}</span>
          </div>
        ))}
      </div>
      <div className="palette-footer">MiniFlow 团队出品 · 云帆全局搜索</div>
    </Modal>
  )
}
