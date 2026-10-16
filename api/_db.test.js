// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { applyFilters, paged } from './_db.js'

const items = [
  { id: 1, name: 'apple', status: 'active' },
  { id: 2, name: 'banana', status: 'disabled' },
  { id: 3, name: 'cherry', status: 'active' },
]

function mockRes() {
  return { setHeader: vi.fn() }
}

describe('applyFilters 通用筛选（Serverless 接口的过滤逻辑）', () => {
  it('无筛选条件返回全部', () => {
    expect(applyFilters(items, {}, ['name'])).toHaveLength(3)
  })

  it('q 关键词大小写不敏感', () => {
    expect(applyFilters(items, { q: 'APPLE' }, ['name'])).toHaveLength(1)
  })

  it('status 精确过滤', () => {
    expect(applyFilters(items, { status: 'active' }, ['name'])).toHaveLength(2)
  })

  it('q 与 status 组合过滤（banana 是 disabled 被排除）', () => {
    expect(applyFilters(items, { q: 'a', status: 'active' }, ['name'])).toHaveLength(1)
  })

  it('搜索字段之外的命中不生效', () => {
    // status 不在搜索字段里，q='disabled' 只按 name 找 → 0 条
    expect(applyFilters(items, { q: 'disabled' }, ['name'])).toHaveLength(0)
  })
})

describe('paged 服务端分页', () => {
  it('按 _page/_limit 切片并写入 X-Total-Count 响应头', () => {
    const res = mockRes()
    const page2 = paged(items, { _page: 2, _limit: 2 }, res)
    expect(page2).toEqual([items[2]])
    expect(res.setHeader).toHaveBeenCalledWith('X-Total-Count', '3')
  })

  it('超出范围的页码返回空数组，total 保持不变', () => {
    const res = mockRes()
    expect(paged(items, { _page: 9, _limit: 2 }, res)).toEqual([])
    expect(res.setHeader).toHaveBeenCalledWith('X-Total-Count', '3')
  })

  it('缺少分页参数时默认第一页 10 条', () => {
    const res = mockRes()
    expect(paged(items, {}, res)).toHaveLength(3)
  })
})
