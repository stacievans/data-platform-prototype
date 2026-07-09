import { formatDateTime, formatDateFromDate } from './formatDateTime'

/** 三工序状态：passed | rejected | pending | none */
export function deriveProcessStatuses(dataStatus) {
  switch (dataStatus) {
    case '已上传':
    case '已解析':
      return { qc: 'passed', review: 'pending', accept: 'none' }
    case '审核不通过':
      return { qc: 'passed', review: 'rejected', accept: 'none' }
    case '已审核':
      return { qc: 'passed', review: 'passed', accept: 'pending' }
    case '验收不通过':
      return { qc: 'passed', review: 'passed', accept: 'rejected' }
    case '已验收':
      return { qc: 'passed', review: 'passed', accept: 'passed' }
    default:
      return { qc: 'none', review: 'none', accept: 'none' }
  }
}

export const PROCESS_STATUS_LABEL = {
  passed: '已通过',
  rejected: '已驳回',
  pending: '待处理',
  none: '—',
}

export function formatOperatorTooltip(operator) {
  if (!operator) return ''
  if (typeof operator === 'string') return `用户:${operator}`
  const { nickname, id } = operator
  if (!nickname) return ''
  return id ? `用户:${nickname}(${id})` : `用户:${nickname}`
}

export function getEntryDisplayFileName(entry) {
  if (entry.displayName) return entry.displayName
  const ext = entry.format === 'LeRobot' ? 'lerobot' : 'h5'
  return `${entry.fileName}.${ext}`
}


export function getEntryCollectTime(entry) {
  return formatDateTime(entry.collectTime ?? entry.uploadTime)
}

/** 无显式 flowHistory 时，由 dataStatus 推导基础流转节点（时间倒序） */
export function resolveFlowHistory(entry, task) {
  if (entry.flowHistory?.length) return entry.flowHistory

  const reviewer = entry.reviewOperator ?? defaultReviewOperator(task)
  const acceptor = entry.acceptOperator ?? { nickname: '陈静', id: 'U-2002' }
  const qcTime = formatDateTime(entry.qcTime ?? entry.uploadTime)
  const nodes = []

  const push = (node) => nodes.unshift(node)

  switch (entry.dataStatus) {
    case '已验收':
      push({
        label: '验收通过（第1轮）',
        time: entry.acceptTime ?? shiftTime(qcTime, 48),
        operator: formatOperatorPlain(acceptor),
      })
      push({
        label: '审核通过（第1轮）',
        time: entry.reviewTime ?? shiftTime(qcTime, 24),
        operator: formatOperatorPlain(reviewer),
      })
      push({ label: '质检通过', time: qcTime, operator: '系统自动' })
      break
    case '验收不通过':
      push({
        label: '验收驳回（第1轮）',
        time: entry.acceptTime ?? shiftTime(qcTime, 48),
        operator: formatOperatorPlain(acceptor),
      })
      push({
        label: '审核通过（第1轮）',
        time: entry.reviewTime ?? shiftTime(qcTime, 24),
        operator: formatOperatorPlain(reviewer),
      })
      push({ label: '质检通过', time: qcTime, operator: '系统自动' })
      break
    case '已审核':
      push({
        label: '审核通过（第1轮）',
        time: entry.reviewTime ?? shiftTime(qcTime, 24),
        operator: formatOperatorPlain(reviewer),
      })
      push({ label: '质检通过', time: qcTime, operator: '系统自动' })
      break
    case '审核不通过':
      push({
        label: '审核驳回（第1轮）',
        time: entry.reviewTime ?? shiftTime(qcTime, 24),
        operator: formatOperatorPlain(reviewer),
      })
      push({ label: '质检通过', time: qcTime, operator: '系统自动' })
      break
    case '已上传':
    case '已解析':
      push({ label: '质检通过', time: qcTime, operator: '系统自动' })
      break
    default:
      break
  }

  return nodes
}

function defaultReviewOperator(task) {
  const reviewer = Array.isArray(task?.reviewer) ? task.reviewer[0] : task?.reviewer
  return reviewer ? { nickname: reviewer, id: 'U-2001' } : { nickname: '孙丽', id: 'U-2001' }
}

function formatOperatorPlain(operator) {
  if (typeof operator === 'string') return operator
  return operator?.id ? `${operator.nickname}(${operator.id})` : (operator?.nickname ?? '—')
}

function shiftTime(timeStr, hours) {
  if (!timeStr || timeStr === '—') return timeStr
  const d = new Date(formatDateTime(timeStr).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return formatDateTime(timeStr)
  d.setHours(d.getHours() + hours)
  return formatDateFromDate(d)
}

export const PROCESS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'qc', label: '质检' },
  { key: 'review', label: '审核' },
  { key: 'accept', label: '验收' },
]

export const PROCESS_SUB_STATUS_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

export const FORM_PROCESS_STATUS_OPTIONS = ['全部', '待处理', '已通过', '已驳回']

export function getProcessFieldKey(tab) {
  if (tab === 'qc') return 'qc'
  if (tab === 'review') return 'review'
  if (tab === 'accept') return 'accept'
  return null
}

export function formLabelToStatus(label) {
  const map = { 待处理: 'pending', 已通过: 'passed', 已驳回: 'rejected' }
  return map[label] ?? null
}

export function matchFormProcessFilters(entry, { qcStatus, reviewStatus, acceptStatus }) {
  const ps = deriveProcessStatuses(entry.dataStatus)
  if (qcStatus && qcStatus !== '全部') {
    const s = formLabelToStatus(qcStatus)
    if (s && ps.qc !== s) return false
  }
  if (reviewStatus && reviewStatus !== '全部') {
    const s = formLabelToStatus(reviewStatus)
    if (s && ps.review !== s) return false
  }
  if (acceptStatus && acceptStatus !== '全部') {
    const s = formLabelToStatus(acceptStatus)
    if (s && ps.accept !== s) return false
  }
  return true
}

export function matchProcessSubFilter(entry, tab, subStatus) {
  if (tab === 'all' || !subStatus || subStatus === 'all') return true
  const field = getProcessFieldKey(tab)
  if (!field) return true
  return deriveProcessStatuses(entry.dataStatus)[field] === subStatus
}

export function countProcessSubStatuses(entries, tab) {
  const counts = { all: entries.length, pending: 0, passed: 0, rejected: 0 }
  const field = getProcessFieldKey(tab)
  if (!field) return counts
  entries.forEach((entry) => {
    const status = deriveProcessStatuses(entry.dataStatus)[field]
    if (status === 'pending') counts.pending += 1
    else if (status === 'passed') counts.passed += 1
    else if (status === 'rejected') counts.rejected += 1
  })
  return counts
}

export function filterEntriesByForm(entry, filters, resolveScope) {
  const { entryId, fileName, projectName, taskName, qcStatus, reviewStatus, acceptStatus, format } = filters
  const displayName = getEntryDisplayFileName(entry)
  const scope = resolveScope?.(entry) ?? {}
  const entryProjectName = entry.projectName ?? scope.projectName ?? ''
  const entryTaskName = entry.taskName ?? scope.taskName ?? ''

  if (entryId && !entry.id.toLowerCase().includes(entryId.toLowerCase())) return false
  if (fileName && !displayName.toLowerCase().includes(fileName.toLowerCase())
    && !entry.fileName.toLowerCase().includes(fileName.toLowerCase())) return false
  if (projectName && !entryProjectName.toLowerCase().includes(projectName.toLowerCase())) return false
  if (taskName && !entryTaskName.toLowerCase().includes(taskName.toLowerCase())) return false
  if (format && format !== '全部' && entry.format !== format) return false
  if (!matchFormProcessFilters(entry, { qcStatus, reviewStatus, acceptStatus })) return false
  return true
}
