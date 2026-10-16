import { useEffect, useState } from 'react'
import { Card, Popconfirm, Switch, Table, Tag, message } from 'antd'
import { getProducts, toggleProduct } from '../api'
import type { Product } from '../types'
import type { ColumnsType } from 'antd/es/table'

const CATEGORY_COLORS: Record<string, string> = { 数码: 'geekblue', 配件: 'volcano', 家居: 'green' }

export default function Products() {
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProducts().then(res => {
      setList(res)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (record: Product) => {
    const next = !record.onSale
    await toggleProduct(record.id, next)
    const res = await getProducts() // 重新拉取列表，让接口数据作为唯一数据源
    setList(res)
    message.success(`「${record.name}」已${next ? '上架' : '下架'}`)
  }

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '商品名称', dataIndex: 'name' },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: c => <Tag color={CATEGORY_COLORS[c]}>{c}</Tag>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: v => <strong>¥{v.toLocaleString()}</strong>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 100,
      render: v => (v < 150 ? <span style={{ color: '#fa541c' }}>{v}（偏低）</span> : v),
    },
    {
      title: '上架状态',
      dataIndex: 'onSale',
      width: 120,
      render: (onSale, record) => (
        <Popconfirm
          title={`确认${onSale ? '下架' : '上架'}「${record.name}」？`}
          onConfirm={() => handleToggle(record)}
        >
          <Switch checked={onSale} size="small" />
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card title="商品列表">
      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} />
    </Card>
  )
}
