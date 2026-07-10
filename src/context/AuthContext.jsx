import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { getRuntimeUsers } from '../mock/organizations'
import {
  DEMO_PERSONAS,
  USER_EMAILS,
  getRuntimeRoles,
  updateRolePermissions as persistRolePermissions,
  appendRuntimeRole,
  setRoleStatus as persistRoleStatus,
  deleteRuntimeRole,
} from '../mock/rbac'
import { resolveRouteViewPermission, buildRolePermissionPreset, SUPER_ADMIN_ROLE } from '../mock/permissions'

const DEFAULT_UID = 'U-000'

function userFromUid(uid) {
  const u = getRuntimeUsers().find((x) => x.uid === uid)
  if (!u) return null
  return {
    uid: u.uid,
    username: u.username,
    nickname: u.nickname,
    role: u.role,
    phone: u.phone,
    status: u.status,
    orgId: u.orgId,
    email: USER_EMAILS[u.nickname] ?? u.email ?? `${u.username}@ai2robotics.com`,
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userFromUid(DEFAULT_UID))
  const [roles, setRoles] = useState(() => getRuntimeRoles())

  const permissionSet = useMemo(() => {
    if (!user?.role) return new Set()
    if (user.role === SUPER_ADMIN_ROLE) {
      return new Set(buildRolePermissionPreset(SUPER_ADMIN_ROLE))
    }
    const role = roles.find((r) => r.name === user.role)
    return new Set(role?.permissions ?? buildRolePermissionPreset(user.role))
  }, [roles, user?.role])

  const can = useCallback((key) => permissionSet.has(key), [permissionSet])

  const canAccessRoute = useCallback(
    (pathname) => {
      const rule = resolveRouteViewPermission(pathname)
      if (!rule) return true
      if (can(rule.permission)) return true
      if (rule.alt && can(rule.alt)) return true
      return false
    },
    [can],
  )

  const switchUser = useCallback((uid) => {
    const next = userFromUid(uid)
    if (!next || next.status !== '启用') return false
    setUser(next)
    return true
  }, [])

  const refreshRoles = useCallback(() => {
    setRoles(getRuntimeRoles())
  }, [])

  const saveRolePermissions = useCallback((roleId, permissions) => {
    persistRolePermissions(roleId, permissions)
    setRoles(getRuntimeRoles())
  }, [])

  const addRole = useCallback((role) => {
    appendRuntimeRole(role)
    setRoles(getRuntimeRoles())
  }, [])

  const toggleRoleStatus = useCallback((roleId) => {
    const role = getRuntimeRoles().find((r) => r.id === roleId)
    if (!role) return null
    const next = role.status === '启用' ? '停用' : '启用'
    persistRoleStatus(roleId, next)
    setRoles(getRuntimeRoles())
    return { name: role.name, status: next }
  }, [])

  const deleteRole = useCallback((roleId) => {
    deleteRuntimeRole(roleId)
    setRoles(getRuntimeRoles())
  }, [])

  const enabledRoles = useMemo(
    () => roles.filter((r) => r.status === '启用'),
    [roles],
  )

  const value = useMemo(
    () => ({
      user,
      roles,
      enabledRoles,
      demoPersonas: DEMO_PERSONAS,
      can,
      canAccessRoute,
      switchUser,
      refreshRoles,
      saveRolePermissions,
      addRole,
      toggleRoleStatus,
      deleteRole,
    }),
    [user, roles, enabledRoles, can, canAccessRoute, switchUser, refreshRoles, saveRolePermissions, addRole, toggleRoleStatus, deleteRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** 便捷：当前登录用户昵称（创建人自动填充等） */
export function useCurrentNickname() {
  return useAuth().user?.nickname ?? ''
}

/** 当前登录用户登录名 */
export function useCurrentUsername() {
  return useAuth().user?.username ?? ''
}
