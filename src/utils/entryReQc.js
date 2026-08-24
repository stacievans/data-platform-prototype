import { nowDateTime } from './formatDateTime'
import {
  deriveProcessStatuses,
  resolveFlowHistory,
  sortFlowHistoryChronological,
} from './entryProcess'

function formatOperatorPlain(operator) {
  if (!operator) return '—'
  if (typeof operator === 'string') return operator
  const { nickname, id } = operator
  if (!nickname) return '—'
  return id ? `${nickname}(${id})` : nickname
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

function clearAcceptData(patch) {
  Object.assign(patch, {
    acceptResult: null,
    acceptComment: '',
    acceptOperator: null,
    acceptTime: null,
  })
}

function nextQcRound(entry) {
  let max = 0
  ;(entry.flowHistory ?? []).forEach((node) => {
    if (!String(node.label ?? '').includes('质检')) return
    const m = String(node.label).match(/第(\d+)轮/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })
  return max + 1
}

/** 条目是否已有可保留的标注标签/标注内容 */
export function entryHasReviewTagHistory(entry) {
  const ps = deriveProcessStatuses(entry)
  const reviewed = ps.review === 'passed' || ps.review === 'rejected'
  const hasContent = (entry.auditTags ?? []).some(Boolean)
    || Boolean(entry.auditQuality)
    || (entry.actionSegments ?? []).length > 0
    || Boolean(entry.fragmentSegmentsByType)
    || Boolean(entry.auditComment?.trim())
    || Boolean(entry.auditRejectReason?.trim())
    || entry.auditAbnormal
    || entry.auditResult === '不通过'
    || entry.auditResult === '异常数据'
  return reviewed && hasContent
}

/** 重新质检：质检待处理、标注/验收未开始（—） */
export function buildReQcPatch(entry, { keepReviewTags, operator, task }) {
  const time = nowDateTime()
  const existingHistory = entry.flowHistory?.length
    ? sortFlowHistoryChronological(entry.flowHistory)
    : resolveFlowHistory(entry, task)

  const patch = {
    dataStatus: '已上传',
    batchQcPending: true,
    qcTime: null,
    reviewClaimedBy: null,
    reviewClaimedAt: null,
    acceptClaimedBy: null,
    acceptClaimedAt: null,
    lastBatchTransfer: null,
    flowHistory: [
      ...existingHistory,
      {
        label: '重新质检',
        time,
        operator: formatOperatorPlain(operator),
        round: nextQcRound(entry),
        batchDetail: '重新质检 -> 质检待处理',
      },
    ],
  }

  clearAcceptData(patch)
  clearReviewData(patch, keepReviewTags)
  return patch
}

export function anyEntryHasReviewTagHistory(entries, entryIds) {
  const idSet = new Set(entryIds)
  return entries.some((e) => idSet.has(e.id) && entryHasReviewTagHistory(e))
}
