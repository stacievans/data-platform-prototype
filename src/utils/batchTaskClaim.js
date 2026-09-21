import { getAllEntries, getEntryById } from '../mock/entries'
import { getBatchTasksByEntryId } from '../mock/batchTasks'

export const CLAIM_LIMIT_TOAST = '领题数已达上限，请完成处理中的题后才可领取新题'

function claimOperatorMatches(user, operator) {
  if (!operator || !user) return false
  return operator.id === user.uid || operator.nickname === user.nickname
}

export function isReviewClaimInProgress(entry) {
  return entry?.reviewClaimedBy
    && ['已解析', '标注不通过'].includes(entry.dataStatus)
}

export function isAcceptClaimInProgress(entry) {
  return entry?.acceptClaimedBy
    && ['已标注', '验收不通过'].includes(entry.dataStatus)
}

export function isClaimInProgress(entry, mode) {
  return mode === 'review' ? isReviewClaimInProgress(entry) : isAcceptClaimInProgress(entry)
}

function getClaimLimit(batch, mode) {
  const raw = mode === 'review' ? batch.reviewClaimLimit : batch.acceptClaimLimit
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function getPrimaryBatchForEntry(entryId) {
  const batches = getBatchTasksByEntryId(entryId)
  return batches[0] ?? null
}

function countActiveClaims(user, mode, batch) {
  const ids = new Set(batch.entryIds ?? [])
  if (!ids.size) return 0
  return getAllEntries().filter(
    (e) => ids.has(e.id)
      && isClaimInProgress(e, mode)
      && claimOperatorMatches(user, mode === 'review' ? e.reviewClaimedBy : e.acceptClaimedBy),
  ).length
}

export function wouldAutoClaimOnOpen(entry, mode) {
  if (!entry) return false
  if (mode === 'review') {
    return ['已解析', '标注不通过'].includes(entry.dataStatus) && !entry.reviewClaimedBy
  }
  return ['已标注', '验收不通过'].includes(entry.dataStatus) && !entry.acceptClaimedBy
}

export function isAtClaimLimit(user, entryId, mode) {
  const batch = getPrimaryBatchForEntry(entryId)
  if (!batch) return false
  const limit = getClaimLimit(batch, mode)
  if (limit == null) return false
  return countActiveClaims(user, mode, batch) >= limit
}

export function findEarliestClaimedEntryId(user, mode, batch) {
  const ids = new Set(batch?.entryIds ?? [])
  const rows = getAllEntries()
    .filter(
      (e) => ids.has(e.id)
        && isClaimInProgress(e, mode)
        && claimOperatorMatches(user, mode === 'review' ? e.reviewClaimedBy : e.acceptClaimedBy),
    )
    .sort((a, b) => {
      const ta = mode === 'review' ? a.reviewClaimedAt : a.acceptClaimedAt
      const tb = mode === 'review' ? b.reviewClaimedAt : b.acceptClaimedAt
      return String(ta ?? '').localeCompare(String(tb ?? ''))
    })
  return rows[0]?.id ?? null
}

/**
 * @returns {{ action: 'open'|'block'|'redirect', entryId: string, toast?: string }}
 */
export function resolveWorkbenchNavigation(entryId, mode, user) {
  if (mode !== 'review' && mode !== 'accept') {
    return { action: 'open', entryId }
  }
  const entry = getEntryById(entryId)
  if (!entry) return { action: 'open', entryId }

  const batch = getPrimaryBatchForEntry(entryId)
  if (!batch) return { action: 'open', entryId }

  const alreadyMine = isClaimInProgress(entry, mode)
    && claimOperatorMatches(user, mode === 'review' ? entry.reviewClaimedBy : entry.acceptClaimedBy)

  if (alreadyMine || !wouldAutoClaimOnOpen(entry, mode)) {
    return { action: 'open', entryId }
  }

  if (!isAtClaimLimit(user, entryId, mode)) {
    return { action: 'open', entryId }
  }

  const redirectId = findEarliestClaimedEntryId(user, mode, batch) ?? entryId
  return { action: 'redirect', entryId: redirectId, toast: CLAIM_LIMIT_TOAST }
}

export function shouldBlockSiblingNavigation(targetEntryId, mode, user) {
  const target = getEntryById(targetEntryId)
  if (!target || !wouldAutoClaimOnOpen(target, mode)) return false
  return isAtClaimLimit(user, targetEntryId, mode)
}

export function shouldSkipAutoClaim(entryId, mode, user) {
  const entry = getEntryById(entryId)
  if (!entry || !wouldAutoClaimOnOpen(entry, mode)) return false
  return isAtClaimLimit(user, entryId, mode)
}
