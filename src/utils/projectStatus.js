/** 采集项目三态：开启 / 关闭 / 归档（与任务、方案状态独立） */

export const PROJECT_STATUS = {
  open: { label: '开启', color: 'blue' },
  closed: { label: '关闭', color: 'orange' },
  archived: { label: '归档', color: 'gray' },
}

export const PROJECT_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'open', label: '开启' },
  { value: 'closed', label: '关闭' },
  { value: 'archived', label: '归档' },
]

const LEGACY_OPEN = new Set(['not_started', 'in_progress', 'completed', 'open'])

/** 兼容旧 mock 值 */
export function normalizeProjectStatus(status) {
  if (!status) return 'open'
  if (LEGACY_OPEN.has(status)) return 'open'
  if (status === 'archived') return 'archived'
  if (status === 'closed') return 'closed'
  return status
}

export function getProjectStatusMeta(status) {
  const key = normalizeProjectStatus(status)
  return PROJECT_STATUS[key] ?? { label: status, color: 'gray' }
}

export function canAcceptProject(status) {
  const s = normalizeProjectStatus(status)
  return s === 'open' || s === 'closed'
}

export function canProjectMutate(status) {
  return normalizeProjectStatus(status) === 'open'
}

export function getProjectMutateDisabledTip(status) {
  const s = normalizeProjectStatus(status)
  if (s === 'closed') return '项目已关闭，无法新建'
  if (s === 'archived') return '项目已归档，无法新建'
  return ''
}
