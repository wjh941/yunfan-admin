import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import { PlusOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { deleteUser, getUsers, saveUser } from '../api'
import type { User } from '../types'
import type { ColumnsType } from 'antd/es/table'

const ROLE_OPTIONS = ['管理员', '运营', '编辑', '访客'].map(v => ({ value: v, label: v }))
const ROLE_COLORS: Record<string, string> = {
  管理员: 'purple',
  运营: 'blue',
  编辑: 'cyan',
  访客: 'default',
}
const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'disabled', label: '禁用' },
]

export default function Users() {
  const [list, setList] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState({ page: 1, pageSize: 10, keyword: '', status: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null) // null 表示新增，否则是正在编辑的记录
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  // query 或 tick 变化时重新拉取列表（tick 用于新增/删除后强制刷新）
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getUsers(query).then(res => {
      if (ignore) return
      setList(res.list)
      setTotal(res.total)
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [query, tick])

  // 一键导出全部用户为 CSV（带 BOM，Excel 打开中文不乱码）
  const handleExport = async () => {
    message.loading({ content: '正在导出…', key: 'export', duration: 0 })
    const { list } = await getUsers({ page: 1, pageSize: 9999 })
    const header = ['ID', '姓名', '年龄', '邮箱', '角色', '状态', '注册时间']
    const rows = list.map(u => [
      u.id,
      u.name,
      u.age,
      u.email,
      u.role,
      u.status === 'active' ? '正常' : '禁用',
      u.createdAt,
    ])
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `yunfan-users-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success({ content: `已导出 ${list.length} 条用户数据`, key: 'export' })
  }

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: User) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = (await form.validateFields()) as UserFormValues
    setSaving(true)
    try {
      await saveUser({ ...values, id: editing?.id })
      message.success(editing ? '修改成功' : '新增成功')
      setModalOpen(false)
      setTick(t => t + 1)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record: User) => {
    await deleteUser(record.id)
    message.success(`已删除「${record.name}」`)
    // 当前页只剩这一条时往前翻一页
    if (list.length === 1 && query.page > 1) {
      setQuery(q => ({ ...q, page: q.page - 1 }))
    } else {
      setTick(t => t + 1)
    }
  }

  interface UserFormValues {
    name: string
    age: number
    email: string
    role: string
    status: 'active' | 'disabled'
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '姓名', dataIndex: 'name', width: 110 },
    { title: '年龄', dataIndex: 'age', width: 70 },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      width: 90,
      render: (role: string) => <Tag color={ROLE_COLORS[role]}>{role}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: s =>
        s === 'active' ? (
          <Badge status="success" text="正常" />
        ) : (
          <Badge status="error" text="禁用" />
        ),
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 110 },
    {
      title: '操作',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.name}」吗？`}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索姓名 / 邮箱 / ID"
          style={{ width: 240 }}
          onChange={e => setQuery(q => ({ ...q, keyword: e.target.value, page: 1 }))}
        />
        <Select
          options={STATUS_OPTIONS}
          value={query.status}
          style={{ width: 120 }}
          onChange={status => setQuery(q => ({ ...q, status, page: 1 }))}
        />
      </Space>

      <Space style={{ float: 'right', marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出 CSV
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          新增用户
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 860 }}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`,
          onChange: (page, pageSize) => setQuery(q => ({ ...q, page, pageSize })),
        }}
      />

      <Modal
        title={editing ? `编辑用户：${editing.name}` : '新增用户'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ role: '访客', status: 'active' }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
            <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="请输入年龄" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group
              options={[
                { value: 'active', label: '正常' },
                { value: 'disabled', label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
