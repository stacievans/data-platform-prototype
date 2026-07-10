import { buildRolePermissionPreset, countPermittedModules } from './permissions'
import { users } from './misc'

const initialRoles = [
  {
    id: 'R-001',
    name: '管理员',
    description: '平台最高权限，可操作全部功能模块',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-002',
    name: '平台运营',
    description: '管理采集项目和任务，查看数据集与报表',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-003',
    name: '采集员',
    description: '执行采集任务，上传采集数据',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-004',
    name: '标注员',
    description: '标注采集数据，进行质检标注操作',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-005',
    name: '游客',
    description: '查看数据集、标签与设备信息',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-006',
    name: '工程师',
    description: '查看并下载数据集、标签与设备信息',
    createdAt: '2026-03-01 00:00:00',
    type: '内置',
    status: '启用',
  },
  {
    id: 'R-007',
    name: '数据审核员',
    description: '负责数据集审核与导出审批，无平台配置权限',
    createdAt: '2026-05-20 10:00:00',
    type: '自定义',
    status: '启用',
  },
  {
    id: 'R-008',
    name: '区域协调员',
    description: '协调区域采集资源与任务排期',
    createdAt: '2026-05-22 14:30:00',
    type: '自定义',
    status: '启用',
  },
]

function memberCountForRole(roleName) {
  return users.filter((u) => u.role === roleName).length
}

function enrichRole(role) {
  const permissions = role.permissions ?? buildRolePermissionPreset(role.name)
  return {
    ...role,
    status: role.status ?? '启用',
    permissions,
    moduleCount: countPermittedModules(permissions),
    memberCount: memberCountForRole(role.name),
  }
}

let runtimeRoles = initialRoles.map(enrichRole)

export function getRuntimeRoles() {
  return runtimeRoles.map(enrichRole)
}

export function updateRolePermissions(roleId, permissions) {
  runtimeRoles = runtimeRoles.map((r) =>
    r.id === roleId
      ? { ...r, permissions: [...permissions], moduleCount: countPermittedModules(permissions) }
      : r,
  )
  return getRuntimeRoles()
}

export function appendRuntimeRole(role) {
  const permissions = role.permissions ?? []
  runtimeRoles = [
    ...runtimeRoles,
    enrichRole({ status: '启用', ...role, permissions }),
  ]
  return getRuntimeRoles()
}

export function setRoleStatus(roleId, status) {
  runtimeRoles = runtimeRoles.map((r) => (r.id === roleId ? { ...r, status } : r))
  return getRuntimeRoles()
}

export function deleteRuntimeRole(roleId) {
  runtimeRoles = runtimeRoles.filter((r) => r.id !== roleId)
  return getRuntimeRoles()
}

export function getRoleByName(name) {
  return getRuntimeRoles().find((r) => r.name === name)
}

/** 顶栏演示身份切换（启用用户） */
export const DEMO_PERSONAS = [
  { uid: 'U-001', label: '管理员（张华）' },
  { uid: 'U-002', label: '平台运营（李明）' },
  { uid: 'U-004', label: '采集员（刘伟）' },
  { uid: 'U-006', label: '标注员（孙丽）' },
  { uid: 'U-009', label: '游客（赵研）' },
  { uid: 'U-010', label: '工程师（陈工）' },
]

export const USER_EMAILS = {
  张华: 'zhanghua@ai2robotics.com',
  李明: 'ming.li@ai2robotics.com',
  王芳: 'wangfang@ai2robotics.com',
  刘伟: 'liuwei@ai2robotics.com',
  周杰: 'zhoujie@ai2robotics.com',
  孙丽: 'sunli@ai2robotics.com',
  何敏: 'hemin@ai2robotics.com',
  钱琳: 'qianlin@ai2robotics.com',
  赵研: 'zhao.yan@ai2robotics.com',
  陈工: 'cheng.gong@ai2robotics.com',
}
