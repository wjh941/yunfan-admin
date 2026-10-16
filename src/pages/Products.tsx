import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Popconfirm, Switch, Table, Tag, message } from 'antd'
import { getProducts, toggleProduct } from '../api'
import type { Product } from '../types'
import type { ColumnsType } from 'antd/es/table'

const CATEGORY_COLORS: Record<string, string> = { 数码: 'geekblue', 配件: 'volcano', 家居: 'green' }

export default function Products() {
  const queryClient = useQueryClient()

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

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '商品名称', dataIndex: 'name' },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (c: string) => <Tag color={CATEGORY_COLORS[c]}>{c}</Tag>,
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
          onConfirm={() => {
            toggleMutation.mutate(
              { id: record.id, onSale: !onSale },
              {
                onSuccess: () =>
                  message.success(`「${record.name}」已${!onSale ? '上架' : '下架'}`),
              },
            )
          }}
        >
          <Switch checked={onSale} size="small" loading={toggleMutation.isPending} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card title="商品列表">
      <Table rowKey="id" loading={isLoading} columns={columns} dataSource={list} pagination={false} />
    </Card>
  )
}
