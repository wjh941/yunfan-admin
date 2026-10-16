import { describe, expect, it } from 'vitest'
import { hasAccess } from './access'
import type { AccessAction, AuthUser } from './types'

// 造一个带指定权限点的测试用户
function userWith(permissions: AccessAction[]): AuthUser {
  return { name: '测试用户', role: 'admin', avatar: '测', permissions }
}

describe('hasAccess 权限判断（RBAC：权限点由后端下发）', () => {
  it('未登录用户没有任何权限', () => {
    expect(hasAccess(null, 'viewUsers')).toBe(false)
    expect(hasAccess(undefined, 'markOrderDone')).toBe(false)
  })

  it('拥有权限点则允许访问', () => {
    const user = userWith(['viewUsers', 'markOrderDone'])
    expect(hasAccess(user, 'viewUsers')).toBe(true)
    expect(hasAccess(user, 'markOrderDone')).toBe(true)
  })

  it('空权限点（只读访客）全部拒绝', () => {
    const guest = userWith([])
    expect(hasAccess(guest, 'viewUsers')).toBe(false)
    expect(hasAccess(guest, 'viewProducts')).toBe(false)
    expect(hasAccess(guest, 'markOrderDone')).toBe(false)
  })

  it('部分权限不会连带其他权限（防越权）', () => {
    const editor = userWith(['viewProducts'])
    expect(hasAccess(editor, 'viewProducts')).toBe(true)
    expect(hasAccess(editor, 'viewUsers')).toBe(false)
  })
})
