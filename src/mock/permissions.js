import { projectMembers } from './misc'

/** 操作类型文案 */
export const ACTION_LABELS = {
  view: '查看',
  create: '新建',
  edit: '编辑',
  delete: '删除',
  archive: '归档',
  download: '下载',
  import: '导入',
  update: '更新',
  export: '导出',
  assignPerm: '编辑权限',
}

/**
 * 权限目录：与侧边栏模块对齐
 * leaf 节点 id 即 permission key 前缀，如 collection.project.view
 */
export const permissionCatalog = [
  { id: 'dashboard', name: '运营看板', actions: ['view'] },
  {
    id: 'collection',
    name: '数据采集',
    children: [
      { id: 'collection.project', name: '采集项目', actions: ['view', 'create', 'edit', 'delete', 'archive'] },
      { id: 'collection.task', name: '采集任务', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 'collection.upload', name: '采集条目', actions: ['view', 'download', 'delete'] },
    ],
  },
  {
    id: 'dataset',
    name: '数据集管理',
    children: [
      { id: 'dataset.self', name: '真机数据集', actions: ['view', 'create', 'edit', 'delete', 'update', 'download'] },
      { id: 'dataset.open', name: '开源数据集', actions: ['view', 'import', 'download'] },
    ],
  },
  { id: 'tag', name: '标签管理', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'device', name: '设备管理', actions: ['view', 'create', 'edit', 'delete'] },
  {
    id: 'system',
    name: '系统管理',
    children: [
      { id: 'system.user', name: '用户管理', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 'system.role', name: '角色权限', actions: ['view', 'create', 'assignPerm'] },
    ],
  },
]

/** 路由 → 所需 view 权限（最长前缀匹配） */
export const ROUTE_VIEW_PERMISSION = [
  { prefix: '/dashboard', permission: 'dashboard.view' },
  { prefix: '/collection/project', permission: 'collection.project.view' },
  { prefix: '/collection/task', permission: 'collection.task.view' },
  { prefix: '/collection/upload', permission: 'collection.upload.view' },
  { prefix: '/review', permission: 'collection.task.view' },
  { prefix: '/dataset/self', permission: 'dataset.self.view' },
  { prefix: '/tag', permission: 'tag.view' },
  { prefix: '/device', permission: 'device.view' },
  { prefix: '/system/role', permission: 'system.role.view' },
  { prefix: '/system/user', permission: 'system.user.view' },
  { prefix: '/system', permission: 'system.user.view', alt: 'system.role.view' },
]

/** 侧边栏菜单项 → view 权限 */
export const MENU_VIEW_PERMISSION = {
  '/dashboard': 'dashboard.view',
  '/collection/project': 'collection.project.view',
  '/collection/task': 'collection.task.view',
  '/collection/upload': 'collection.upload.view',
  '/dataset/self': 'dataset.self.view',
  '/tag': 'tag.view',
  '/device': 'device.view',
  '/system/user': 'system.user.view',
  '/system/role': 'system.role.view',
}

export function getLeafModules(catalog = permissionCatalog) {
  const leaves = []
  for (const item of catalog) {
    if (item.children) {
      for (const child of item.children) leaves.push(child)
    } else if (item.actions) {
      leaves.push(item)
    }
  }
  return leaves
}

export function buildAllPermissionKeys(catalog = permissionCatalog) {
  return getLeafModules(catalog).flatMap((leaf) =>
    leaf.actions.map((action) => `${leaf.id}.${action}`),
  )
}

export function countPermittedModules(permissions) {
  const modules = new Set()
  for (const key of permissions) {
    const dot = key.lastIndexOf('.')
    if (dot > 0) modules.add(key.slice(0, dot))
  }
  return modules.size
}

export function resolveRouteViewPermission(pathname) {
  const sorted = [...ROUTE_VIEW_PERMISSION].sort((a, b) => b.prefix.length - a.prefix.length)
  const match = sorted.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
  return match ?? null
}

const ALL_KEYS = buildAllPermissionKeys()

/** 采集员 / 标注员共用功能权限 */
const COLLECTOR_ANNOTATOR_KEYS = [
  'dashboard.view',
  'collection.project.view',
  'collection.task.view',
  'collection.upload.view',
  'collection.upload.download',
  'dataset.self.view',
  'dataset.self.download',
  'dataset.open.view',
  'dataset.open.download',
  'tag.view',
  'device.view',
]

/** 内置角色权限 preset */
export function buildRolePermissionPreset(roleName) {
  switch (roleName) {
    case '管理员':
      return [...ALL_KEYS]
    case '平台运营':
      return ALL_KEYS.filter((k) => {
        if (k.startsWith('system.')) return false
        if (k.startsWith('tag.') && k !== 'tag.view') return false
        if (k.startsWith('device.') && k !== 'device.view') return false
        return true
      })
    case '采集员':
    case '标注员':
      return [...COLLECTOR_ANNOTATOR_KEYS]
    case '工程师':
      return [
        'dashboard.view',
        'dataset.self.view',
        'dataset.self.download',
        'dataset.open.view',
        'dataset.open.download',
        'tag.view',
        'device.view',
      ]
    case '游客':
      return [
        'dashboard.view',
        'dataset.self.view',
        'dataset.open.view',
        'tag.view',
        'device.view',
      ]
    default:
      return []
  }
}

// ── 数据范围（基于 projectMembers） ──

/** 仅管理员全量数据 */
export function hasFullDataScope(roleName) {
  return roleName === '管理员'
}

function isProjectManager(member) {
  return member?.roles?.includes('平台运营')
}

function isCollectorMember(member) {
  return member?.roles?.includes('采集员')
}

function isAnnotatorMember(member) {
  return member?.roles?.includes('标注员')
}

/** 当前用户可访问的项目 ID 集合；null 表示全量 */
export function getAccessibleProjectIds(nickname, roleName) {
  if (hasFullDataScope(roleName)) return null
  const ids = new Set()
  for (const [projectId, members] of Object.entries(projectMembers)) {
    const member = members.find((m) => m.name === nickname)
    if (!member) continue
    if (roleName === '平台运营' && isProjectManager(member)) ids.add(projectId)
    if (roleName === '采集员' && isCollectorMember(member)) ids.add(projectId)
    if (roleName === '标注员' && isAnnotatorMember(member)) ids.add(projectId)
  }
  return ids
}

export function canAccessProject(projectId, nickname, roleName) {
  if (hasFullDataScope(roleName)) return true
  const ids = getAccessibleProjectIds(nickname, roleName)
  return ids?.has(projectId) ?? false
}

/** 采集员/标注员：项目人员 taskIds 并集 */
export function getAssignedTaskIds(nickname, roleName) {
  const ids = new Set()
  for (const members of Object.values(projectMembers)) {
    const member = members.find((m) => m.name === nickname)
    if (!member) continue
    if (roleName === '采集员' && !isCollectorMember(member)) continue
    if (roleName === '标注员' && !isAnnotatorMember(member)) continue
    ;(member.taskIds ?? []).forEach((tid) => ids.add(tid))
  }
  return ids
}

export function filterProjectsByDataScope(projects, nickname, roleName) {
  if (hasFullDataScope(roleName)) return projects
  const ids = getAccessibleProjectIds(nickname, roleName)
  if (!ids) return projects
  return projects.filter((p) => ids.has(p.id))
}

export function filterTasksByDataScope(tasks, nickname, roleName) {
  if (hasFullDataScope(roleName)) return tasks
  if (roleName === '平台运营') {
    const ids = getAccessibleProjectIds(nickname, roleName)
    return tasks.filter((t) => ids?.has(t.projectId))
  }
  if (roleName === '采集员' || roleName === '标注员') {
    const assigned = getAssignedTaskIds(nickname, roleName)
    return tasks.filter((t) => assigned.has(t.id))
  }
  return tasks
}

export function canAccessTask(task, nickname, roleName) {
  if (hasFullDataScope(roleName)) return true
  if (roleName === '平台运营') {
    return canAccessProject(task.projectId, nickname, roleName)
  }
  if (roleName === '采集员' || roleName === '标注员') {
    return getAssignedTaskIds(nickname, roleName).has(task.id)
  }
  return false
}

/** 条目：采集员仅本人上传；标注员/平台运营为可见任务下全部 */
export function filterEntriesByDataScope(entries, nickname, roleName) {
  if (hasFullDataScope(roleName)) return entries
  if (roleName === '采集员') {
    return entries.filter((e) => e.uploader === nickname)
  }
  return entries
}

export function filterUploadsByDataScope(records, nickname, roleName, tasks) {
  if (hasFullDataScope(roleName)) return records
  const visibleTaskIds = new Set(filterTasksByDataScope(tasks, nickname, roleName).map((t) => t.id))
  let scoped = records.filter((r) => visibleTaskIds.has(r.taskId))
  if (roleName === '采集员') {
    scoped = scoped.filter((r) => r.uploader === nickname)
  }
  return scoped
}
