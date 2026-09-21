import { deriveProcessStatuses } from './entryProcess'
import { getEntriesByTaskId, updateEntry } from '../mock/entries'
import { nowDateTime } from './formatDateTime'
import { normalizeAuditQuality } from '../pages/Review/constants/workbenchTags'

export const PRE_ANNOTATION_FILE_MAX_BYTES = 10 * 1024 * 1024

export const ENTRIES_CHANGED_EVENT = 'platform-entries-changed'

export function notifyEntriesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ENTRIES_CHANGED_EVENT))
  }
}

/** 组织管理员，或创建该项目的平台运营 */
export function canImportPreAnnotation(user, project) {
  if (!user || !project) return false
  const roles = String(user.role ?? '')
    .split('&')
    .map((s) => s.trim())
    .filter(Boolean)
  if (roles.includes('超级管理员') || roles.includes('组织管理员')) return true
  if (roles.includes('平台运营') && user.nickname === project.creator) return true
  return false
}

export function validatePreAnnotationFile(file) {
  if (!file) return { ok: false, toast: null }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'json') {
    return { ok: false, toast: '只能上传JSON文件！' }
  }
  if (file.size > PRE_ANNOTATION_FILE_MAX_BYTES) {
    return { ok: false, toast: '文件大小不能超过10MB！' }
  }
  return { ok: true }
}

export function parsePreAnnotationPayload(text) {
  const parsed = JSON.parse(text)
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed.entries ?? parsed.items ?? parsed.data ?? [])
  if (!Array.isArray(list)) {
    throw new Error('INVALID_SHAPE')
  }
  return list
}

function normalizeEntryKey(item) {
  return item?.entryId ?? item?.id ?? item?.条目ID ?? null
}

function buildDraftFromItem(item) {
  const {
    entryId,
    id,
    条目ID,
    fragmentSegmentsByType,
    auditQuality,
    auditTags,
    auditComment,
    auditResult,
    ...rest
  } = item
  return {
    auditQuality: auditQuality ?? rest.quality ?? null,
    auditTags: auditTags ?? rest.tags ?? [],
    auditComment: auditComment ?? rest.comment ?? '',
    auditResult: auditResult ?? null,
    fragmentSegmentsByType: fragmentSegmentsByType ?? rest.fragments ?? null,
    raw: rest,
    importedAt: nowDateTime(),
  }
}

/**
 * @param {string} taskId
 * @param {object[]} items 解析后的 JSON 条目数组
 * @param {{ retryFailedOnly?: boolean }} options 再次导入时仅重试上次失败的条目
 */
export function runPreAnnotationImport(taskId, items, options = {}) {
  const { retryFailedOnly = false } = options
  const byEntryId = new Map()
  for (const item of items) {
    const key = normalizeEntryKey(item)
    if (key) byEntryId.set(String(key), item)
  }

  const taskEntries = getEntriesByTaskId(taskId)
  let success = 0
  let fail = 0
  let skipped = 0

  for (const entry of taskEntries) {
    const ps = deriveProcessStatuses(entry)
    if (ps.accept === 'passed') {
      skipped += 1
      continue
    }

    if (retryFailedOnly && !entry.preAnnotationImportFailed) {
      continue
    }

    const payloadItem = byEntryId.get(entry.id)
    if (!payloadItem) {
      updateEntry(entry.id, { preAnnotationImportFailed: true })
      fail += 1
      continue
    }

    try {
      updateEntry(entry.id, {
        preAnnotationDraft: buildDraftFromItem(payloadItem),
        preAnnotationImportFailed: false,
      })
      success += 1
    } catch {
      updateEntry(entry.id, { preAnnotationImportFailed: true })
      fail += 1
    }
  }

  notifyEntriesChanged()
  return { success, fail, skipped }
}

export function taskHasPreAnnotationImportFailures(taskId) {
  return getEntriesByTaskId(taskId).some((e) => e.preAnnotationImportFailed)
}

/** 标注页加载：无正式标注结果时合并预标注草稿 */
export function mergePreAnnotationDraftIntoReviewState(entry, form, fragmentSegmentsByType) {
  const draft = entry?.preAnnotationDraft
  if (!draft || entry.auditResult) {
    return { form, fragmentSegmentsByType }
  }
  const nextForm = { ...form }
  if (draft.auditQuality) nextForm.auditQuality = normalizeAuditQuality(draft.auditQuality)
  if (Array.isArray(draft.auditTags) && draft.auditTags.length) nextForm.auditTags = draft.auditTags
  if (draft.auditComment) nextForm.auditComment = draft.auditComment
  if (draft.auditResult === '通过') nextForm.auditConclusion = 'pass'
  if (draft.auditResult === '不通过') nextForm.auditConclusion = 'reject'

  let nextFragments = fragmentSegmentsByType
  if (draft.fragmentSegmentsByType && typeof draft.fragmentSegmentsByType === 'object') {
    nextFragments = { ...fragmentSegmentsByType, ...draft.fragmentSegmentsByType }
  }
  return { form: nextForm, fragmentSegmentsByType: nextFragments }
}
