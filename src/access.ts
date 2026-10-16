// 权限判断模块 —— RBAC：权限点由后端登录接口下发（存在 user.permissions 里），
// 前端不再硬编码角色映射，只负责「按权限点渲染」。
// 加角色 / 改权限只动后端一处，前端零改动。
import type { AccessAction, AuthUser } from './types'

export type { AccessAction }

export function hasAccess(
  user: AuthUser | null | undefined,
  action: AccessAction,
): boolean {
  return user?.permissions?.includes(action) ?? false
}
