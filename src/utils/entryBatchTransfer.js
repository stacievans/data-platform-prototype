import { nowDateTime } from './formatDateTime'
import {
  deriveProcessStatuses,
  PROCESS_STATUS_LABEL,
  getProcessFieldKey,
  resolveFlowHistory,
  sortFlowHistoryChronological,
  getEntryDisplayFileName,
} from './entryProcess'
export const BATCH_PROCESS_TABS = [
  { key: 'qc', label: '质检' },
  { key: 'review', label: '标注' },
  { key: 'accept', label: '验收' },
]

export const BATCH_SOURCE_STATUS_OPTIONS = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '进行中' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

export const BATCH_TARGET_STATUS_OPTIONS = [
  { key: 'pending', label: '待处理' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

export const ACCEPT_RESET_SOURCE_OPTIONS = [
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

export const ACCEPT_RESET_TARGET_OPTIONS = [
  { key: 'pending', label: '待处理' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

export function acceptProcessStatusLabel(statusKey) {
  return `验收工序/${statusKeyLabel(statusKey)}`
}

export function processTabLabel(key) {
  return BATCH_PROCESS_TABS.find((t) => t.key === key)?.label ?? key
}

export function statusKeyLabel(key) {
  return PROCESS_STATUS_LABEL[key] ?? '—'
}

function nextRound(entry, processKey) {
  const keyword = processKey === 'qc' ? '质检' : processKey === 'review' ? '标注' : '验收'
  let max = 0
  ;(entry.flowHistory ?? []).forEach((node) => {
    if (!String(node.label ?? '').includes(keyword)) return
    const m = String(node.label).match(/第(\d+)轮/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })
  return max + 1
}

function formatOperatorPlain(operator) {
  if (!operator) return '—'
  if (typeof operator === 'string') return operator
  const { nickname, id } = operator
  if (!nickname) return '—'
  return id ? `${nickname}(${id})` : nickname
}

/** 批量流转后的工序状态 → dataStatus */
function dataStatusFromProcessStates(qc, review, accept) {
  if (qc === 'pending') return '已上传'
  if (qc === 'rejected') return '质检不通过'
  if (review === 'rejected') return '标注不通过'
  if (accept === 'rejected') return '验收不通过'
  if (accept === 'passed') return '已验收'
  if (review === 'passed' && (accept === 'pending' || accept === 'processing')) return '已标注'
  if (qc === 'passed' && (review === 'pending' || review === 'processing' || review === 'none')) {
    return review === 'none' ? '已上传' : '已解析'
  }
  return '已上传'
}

function targetProcessStates(targetProcess, targetStatus) {
  switch (`${targetProcess}:${targetStatus}`) {
    case 'qc:pending':
      return { qc: 'pending', review: 'none', accept: 'none' }
    case 'qc:rejected':
      return { qc: 'rejected', review: 'none', accept: 'none' }
    case 'review:pending':
      return { qc: 'passed', review: 'pending', accept: 'none' }
    case 'review:rejected':
      return { qc: 'passed', review: 'rejected', accept: 'pending' }
    case 'accept:pending':
      return { qc: 'passed', review: 'passed', accept: 'pending' }
    case 'accept:passed':
      return { qc: 'passed', review: 'passed', accept: 'passed' }
    case 'accept:rejected':
      return { qc: 'passed', review: 'passed', accept: 'rejected' }
    default:
      return null
  }
}

function clearReviewData(patch, keepTags) {
  if (keepTags) return
  Object.assign(patch, {
    auditScore: null,
    auditResult: null,
    auditQuality: null,
    auditTags: [],
    auditComment: '',
    auditRejectReason: '',
    auditAbnormal: false,
    actionSegments: [],
    regionFrames: [],
    fragmentSegmentsByType: undefined,
    reviewOperator: null,
    reviewTime: null,
  })
}

function clearAcceptData(patch, keepTags) {
  if (keepTags) return
  Object.assign(patch, {
    acceptResult: null,
    acceptComment: '',
    acceptOperator: null,
    acceptTime: null,
  })
}

function getExistingFlowHistory(entry, task) {
  if (entry.flowHistory?.length) return sortFlowHistoryChronological(entry.flowHistory)
  return resolveFlowHistory(entry, task)
}

/**
 * 对单条条目应用批量流转，返回 patch（不含 id）
 */
export function buildBatchTransferPatch(entry, {
  targetProcess,
  targetStatus,
  sourceProcess,
  sourceStatus,
  operator,
  keepReviewTags = true,
  keepAcceptTags = true,
  task,
  flowLabelPrefix = '批量流转',
}) {
  const states = targetProcessStates(targetProcess, targetStatus)
  if (!states) return null

  const afterLabel = targetStatus === 'pending'
    ? '待处理'
    : targetStatus === 'passed'
      ? '已通过'
      : '已驳回'
  const sourceLabel = sourceProcess && sourceStatus
    ? `${processTabLabel(sourceProcess)}${statusKeyLabel(sourceStatus)}`
    : `${processTabLabel(targetProcess)}${statusKeyLabel(deriveProcessStatuses(entry)[targetProcess])}`
  const targetLabel = `${processTabLabel(targetProcess)}${afterLabel}`
  const detail = `${sourceLabel} -> ${targetLabel}`

  const time = nowDateTime()
  const round = nextRound(entry, targetProcess)
  const existingHistory = getExistingFlowHistory(entry, task)
  const flowNode = {
    label: `${flowLabelPrefix}-${targetLabel}`,
    time,
    operator: formatOperatorPlain(operator),
    round,
    batchDetail: detail,
    batchOp: true,
  }

  const patch = {
    dataStatus: dataStatusFromProcessStates(states.qc, states.review, states.accept),
    reviewClaimedBy: null,
    reviewClaimedAt: null,
    acceptClaimedBy: null,
    acceptClaimedAt: null,
    batchQcPending: targetProcess === 'qc' && targetStatus === 'pending',
    flowHistory: [...existingHistory, flowNode],
    lastBatchTransfer: {
      targetProcess,
      targetStatus,
      sourceProcess,
      sourceStatus,
      opStatus: afterLabel,
      round,
      operator,
      time,
      detail,
    },
  }

  if (targetProcess === 'qc') {
    patch.qcTime = targetStatus === 'rejected' ? time : null
    if (targetStatus === 'pending') {
      clearReviewData(patch, false)
      clearAcceptData(patch, false)
    }
  }

  if (targetProcess === 'review') {
    patch.qcTime = entry.qcTime ?? time
    if (targetStatus === 'pending') {
      clearReviewData(patch, keepReviewTags)
      clearAcceptData(patch, false)
    }
    if (targetStatus === 'rejected') {
      patch.reviewOperator = operator
      patch.reviewTime = time
      patch.auditResult = '不通过'
      clearAcceptData(patch, false)
    }
  }

  if (targetProcess === 'accept') {
    patch.qcTime = entry.qcTime ?? time
    if (targetStatus === 'pending') {
      clearAcceptData(patch, keepAcceptTags)
    }
    if (targetStatus === 'passed') {
      patch.acceptOperator = operator
      patch.acceptTime = time
      patch.acceptResult = '通过'
    }
    if (targetStatus === 'rejected') {
      patch.acceptOperator = operator
      patch.acceptTime = time
      patch.acceptResult = '不通过'
    }
  }

  return patch
}

/**
 * 验收重置：仅将验收工序改为待处理，保留原质检/标注状态与详情数据；不写入 lastBatchTransfer
 */
export function buildAcceptResetPatch(entry, { sourceStatus, operator, task }) {
  const ps = deriveProcessStatuses(entry)
  const time = nowDateTime()
  const existingHistory = getExistingFlowHistory(entry, task)
  const sourceLabel = statusKeyLabel(sourceStatus)

  const patch = {
    dataStatus: dataStatusFromProcessStates(ps.qc, ps.review, 'pending'),
    acceptClaimedBy: null,
    acceptClaimedAt: null,
    lastBatchTransfer: null,
    flowHistory: [
      ...existingHistory,
      {
        label: '验收重置',
        time,
        operator: formatOperatorPlain(operator),
        round: nextRound(entry, 'accept'),
        batchDetail: `验收${sourceLabel} -> 验收待处理`,
      },
    ],
  }

  clearAcceptData(patch, false)
  return patch
}

export function filterEntriesByBatchScope(entries, processKey, statusKey) {
  const field = getProcessFieldKey(processKey)
  if (!field || !statusKey) return []
  return entries.filter((entry) => deriveProcessStatuses(entry)[field] === statusKey)
}

export function filterEntriesForAcceptReset(entries, sourceStatus, filters = {}) {
  if (!sourceStatus) return []
  const entryIdQ = String(filters.entryId ?? '').trim().toLowerCase()
  const fileIdQ = String(filters.fileId ?? '').trim().toLowerCase()
  const fileNameQ = String(filters.fileName ?? '').trim().toLowerCase()

  return entries.filter((entry) => {
    const ps = deriveProcessStatuses(entry)
    if (ps.accept !== sourceStatus) return false
    if (entryIdQ && !String(entry.id).toLowerCase().includes(entryIdQ)) return false
    const fid = entry.fileId ?? entry.id.replace('E-', 'F-')
    if (fileIdQ && !String(fid).toLowerCase().includes(fileIdQ)) return false
    if (fileNameQ) {
      const name = getEntryDisplayFileName(entry)
      if (!String(name).toLowerCase().includes(fileNameQ)) return false
    }
    return true
  })
}

export function isBatchTargetDisabled(sourceProcess, sourceStatus, targetProcess, targetStatus) {
  return sourceProcess === targetProcess && sourceStatus === targetStatus
}
