import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Col, Drawer, Popconfirm, Row, Switch, Tag, message } from 'antd'
import { getProducts, toggleProduct } from '../api'
import type { Product } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  数码: '#4f6ef2',
  配件: '#fa8c16',
  家居: '#52c41a',
}

export default function Products() {
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState<Product | null>(null) // 详情抽屉

  // 列表数据由 React Query 管理：缓存 30 秒，切页回来秒开
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, onSale }: { id: number; onSale: boolean }) => toggleProduct(id, onSale),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleToggle = (record: Product) => {
    const next = !record.onSale
    toggleMutation.mutate(
      { id: record.id, onSale: next },
      {
        onSuccess: () => {
          message.success(`「${record.name}」已${next ? '上架' : '下架'}`)
          setCurrent((cur) => (cur && cur.id === record.id ? { ...cur, onSale: next } : cur))
        },
      },
    )
  }

  const renderCard = (p: Product) => (
    <Col xs={24} sm={12} lg={8} key={p.id}>
      <Card hoverable className="product-card" onClick={() => setCurrent(p)}>
        <div className="product-cover" data-category={p.category}>
          <span className="product-emoji">{p.emoji}</span>
          {!p.onSale && <span className="product-off-tag">已下架</span>}
        </div>
        <div className="product-name">{p.name}</div>
        <div className="product-desc">{p.desc}</div>
        <div className="product-meta">
          <span className="product-price">¥{p.price.toLocaleString()}</span>
          <span className="product-sold">已售 {p.sold}</span>
        </div>
        <div
          className="product-foot"
          onClick={(e) => e.stopPropagation() /* 开关区不触发卡片详情 */}
        >
          <Tag color={CATEGORY_COLORS[p.category]}>{p.category}</Tag>
          <span className="product-stock" style={p.stock < 150 ? { color: '#fa541c' } : undefined}>
            库存 {p.stock}
          </span>
          <Popconfirm
            title={`确认${p.onSale ? '下架' : '上架'}「${p.name}」？`}
            onConfirm={() => handleToggle(p)}
          >
            <Switch checked={p.onSale} size="small" loading={toggleMutation.isPending} />
          </Popconfirm>
        </div>
      </Card>
    </Col>
  )

  return (
    <div>
      <Row gutter={[16, 16]}>
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <Card loading />
              </Col>
            ))
          : list.map(renderCard)}
      </Row>

      <Drawer
        title={current ? `${current.emoji} ${current.name}` : ''}
        width={400}
        open={!!current}
        onClose={() => setCurrent(null)}
      >
        {current && (
          <div>
            <div
              className="product-cover product-cover-lg"
              data-category={current.category}
              style={{ fontSize: 80, height: 160 }}
            >
              {current.emoji}
            </div>
            <div className="product-price" style={{ fontSize: 24, margin: '12px 0' }}>
              ¥{current.price.toLocaleString()}
            </div>
            <p style={{ color: '#999', marginBottom: 20 }}>{current.desc}</p>
            <dl className="product-attrs">
              <div>
                <dt>分类</dt>
                <dd>
                  <Tag color={CATEGORY_COLORS[current.category]}>{current.category}</Tag>
                </dd>
              </div>
              <div>
                <dt>库存</dt>
                <dd>{current.stock} 件</dd>
              </div>
              <div>
                <dt>已售</dt>
                <dd>{current.sold} 件</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{current.onSale ? '🟢 上架中' : '⚪ 已下架'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  )
}
