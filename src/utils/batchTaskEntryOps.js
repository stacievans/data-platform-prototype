import { getEntryById, updateEntry } from '../mock/entries'
import { nowDateTime } from './formatDateTime'
import {
  deriveProcessStatuses,
  formLabelToStatus,
  getEntryDisplayFileName,
  matchFormProcessFilters,
  matchProcessSubFilter,
} from './entryProcess'
import { matchColorEncodingFilter } from './colorEncoding'
import { resolveReviewOperator, resolveAcceptOperator } from '../components/entry/entryTableHelpers'
import { isAtClaimLimit } from './batchTaskClaim'

function operatorMatches(user, operator) {
  if (!operator || !user) return false
  return operator.id === user.uid || operator.nickname === user.nickname
}

export function getEntryOperators(entry, task) {
  const names = new Set()
  if (entry.uploader) names.add(entry.uploader)
  const rev = entry.reviewClaimedBy ?? resolveReviewOperator(entry, task)
  const acc = entry.acceptClaimedBy ?? resolveAcceptOperator(entry)
  if (rev?.nickname) names.add(rev.nickname)
  if (acc?.nickname) names.add(acc.nickname)
  return [...names]
}

export function isEntryLockedForUser(entry, user) {
  if (!entry || !user) return false
  const ps = deriveProcessStatuses(entry)
  if (ps.review === 'processing' && entry.reviewClaimedBy && !operatorMatches(user, entry.reviewClaimedBy)) {
    return true
  }
  if (ps.accept === 'processing' && entry.acceptClaimedBy && !operatorMatches(user, entry.acceptClaimedBy)) {
    return true
  }
  if (ps.review === 'passed' || ps.review === 'rejected') {
    // others can still view; block only active processing by other
  }
  return false
}

function nextReviewRound(entry) {
  const hist = entry.flowHistory ?? []
  const rounds = hist
    .filter((n) => String(n.label ?? '').includes('标注'))
    .map((n) => n.round ?? 1)
  return (rounds.length ? Math.max(...rounds) : 0) + 1
}

function formatFlowOperator(user) {
  const nickname = user.nickname ?? user.username ?? '当前用户'
  const id = user.uid ?? user.id ?? ''
  return id ? `${nickname}(${id})` : nickname
}

export function claimBatchEntry(entryId, mode, user, batch) {
  const entry = getEntryById(entryId)
  if (!entry) return { ok: false, toast: '条目不存在' }
  if (isEntryLockedForUser(entry, user)) return { ok: false, toast: '该条目已被他人锁定' }

  const ps = deriveProcessStatuses(entry)
  const field = mode === 'review' ? 'review' : 'accept'

  if (ps[field] === 'passed' || ps[field] === 'rejected') {
    return { ok: false, toast: '当前状态不可领取' }
  }

  if (ps[field] === 'processing') {
    const op = mode === 'review' ? entry.reviewClaimedBy : entry.acceptClaimedBy
    if (operatorMatches(user, op)) return { ok: true, entry }
    return { ok: false, toast: '该条目已被他人锁定' }
  }

  if (isAtClaimLimit(user, entryId, mode)) {
    return { ok: false, toast: '领题数已达上限，请完成处理中的题后才可领取新题' }
  }

  const at = nowDateTime()
  const operator = { nickname: user.nickname ?? user.username, id: user.uid ?? user.id ?? '' }
  const round = mode === 'review' ? nextReviewRound(entry) : 1
  const label = mode === 'review' ? '标注领取' : '验收领取'
  const flowNode = {
    label,
    round,
    time: at,
    operator: formatFlowOperator(user),
  }
  const flowHistory = [...(entry.flowHistory ?? []), flowNode]

  const patch =
    mode === 'review'
      ? { reviewClaimedBy: operator, reviewClaimedAt: at, flowHistory }
      : { acceptClaimedBy: operator, acceptClaimedAt: at, flowHistory }

  const updated = updateEntry(entryId, patch)
  return { ok: true, entry: updated, batchId: batch?.id }
}

export function applyProcessStatusChange(entryId, field, statusLabel, user) {
  const entry = getEntryById(entryId)
  if (!entry) return null
  const target = formLabelToStatus(statusLabel)
  if (!target) return entry

  const ps = { ...deriveProcessStatuses(entry) }
  ps[field] = target

  if (field === 'qc' && target === 'passed') {
    if (ps.review === 'none') ps.review = 'pending'
  }
  if (field === 'review' && target === 'passed') {
    if (ps.accept === 'none') ps.accept = 'pending'
  }
  if (field === 'accept' && target === 'rejected') {
    ps.review = 'pending'
    ps.accept = 'pending'
  }

  let dataStatus = '已上传'
  if (ps.qc === 'rejected') dataStatus = '质检不通过'
  else if (ps.review === 'rejected') dataStatus = '标注不通过'
  else if (ps.accept === 'rejected') dataStatus = '验收不通过'
  else if (ps.accept === 'passed') dataStatus = '已验收'
  else if (ps.review === 'passed') dataStatus = '已标注'
  else if (ps.qc === 'passed') dataStatus = '已解析'

  const patch = { dataStatus }
  if (target !== 'processing' && field === 'review') {
    patch.reviewClaimedBy = null
    patch.reviewClaimedAt = null
  }
  if (target !== 'processing' && field === 'accept') {
    patch.acceptClaimedBy = null
    patch.acceptClaimedAt = null
  }
  if (target === 'processing' && field === 'review' && !entry.reviewClaimedBy) {
    const operator = { nickname: user.nickname, id: user.uid ?? user.id }
    patch.reviewClaimedBy = operator
    patch.reviewClaimedAt = nowDateTime()
  }
  if (target === 'processing' && field === 'accept' && !entry.acceptClaimedBy) {
    const operator = { nickname: user.nickname, id: user.uid ?? user.id }
    patch.acceptClaimedBy = operator
    patch.acceptClaimedAt = nowDateTime()
  }

  return updateEntry(entryId, patch)
}

function reviewOperatorNickname(entry, task) {
  const op = entry.reviewClaimedBy ?? resolveReviewOperator(entry, task)
  if (!op) return ''
  return typeof op === 'string' ? op : (op.nickname ?? '')
}

function acceptOperatorNickname(entry) {
  const op = entry.acceptClaimedBy ?? resolveAcceptOperator(entry)
  if (!op) return ''
  return typeof op === 'string' ? op : (op.nickname ?? '')
}

export function filterBatchTaskEntries(
  entries,
  {
    keyword,
    entryId,
    fileName,
    format,
    colorEncoding,
    collectors,
    reviewOperators,
    acceptOperators,
    qcStatus,
    reviewStatus,
    acceptStatus,
    processTab,
    subStatus,
  },
  getTask,
) {
  return entries.filter((entry) => {
    if (!matchProcessSubFilter(entry, processTab, subStatus)) return false

    const idKw = (entryId ?? '').trim().toLowerCase()
    if (idKw && !entry.id.toLowerCase().includes(idKw)) return false

    const fileKw = (fileName ?? '').trim().toLowerCase()
    if (fileKw) {
      const display = getEntryDisplayFileName(entry).toLowerCase()
      if (!display.includes(fileKw) && !entry.fileName.toLowerCase().includes(fileKw)) return false
    }

    const kw = (keyword ?? '').trim().toLowerCase()
    if (kw) {
      const display = getEntryDisplayFileName(entry).toLowerCase()
      if (!entry.id.toLowerCase().includes(kw) && !display.includes(kw) && !entry.fileName.toLowerCase().includes(kw)) {
        return false
      }
    }

    if (format && format !== '全部' && entry.format !== format) return false
    if (colorEncoding && colorEncoding !== '全部' && !matchColorEncodingFilter(entry, colorEncoding)) return false

    if (collectors?.length && !collectors.includes(entry.uploader)) return false

    if (reviewOperators?.length) {
      const name = reviewOperatorNickname(entry, getTask?.(entry))
      if (!name || !reviewOperators.includes(name)) return false
    }

    if (acceptOperators?.length) {
      const name = acceptOperatorNickname(entry)
      if (!name || !acceptOperators.includes(name)) return false
    }

    if (!matchFormProcessFilters(entry, { qcStatus, reviewStatus, acceptStatus })) return false

    return true
  })
}
