// 权限收敛模块 —— 学习 ant-design-pro 的 src/access.ts 模式：
// 把散落在各组件里的角色判断收敛成一张「角色 → 权限点」映射表，
// 未来加角色/加权限只改这里，不改业务组件
import type { AuthUser } from './types'

/** 权限点：一个可执行的动作或可访问的资源 */
export type AccessAction =
  | 'viewUsers' // 进入用户管理
  | 'viewProducts' // 进入商品管理
  | 'markOrderDone' // 标记订单完成

/** 角色 → 权限点映射表（RBAC 雏形） */
const ROLE_ACCESS: Record<string, AccessAction[]> = {
  admin: ['viewUsers', 'viewProducts', 'markOrderDone'],
  guest: [],
}

export function hasAccess(
  user: AuthUser | null | undefined,
  action: AccessAction,
): boolean {
  if (!user) return false
  return ROLE_ACCESS[user.role]?.includes(action) ?? false
}
