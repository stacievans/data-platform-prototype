import { deriveProcessStatuses } from './entryProcess'

const TAB_PROCESS_LABEL = {
  qc: '质检工序',
  review: '标注工序',
  accept: '验收工序',
}

export const BULK_DATA_SCOPE_OPTIONS = {
  qc: ['待处理', '处理中', '已驳回'],
  review: ['待处理', '处理中'],
  accept: ['待处理', '处理中', '已通过', '已驳回'],
}

const SCOPE_TO_STATUS = {
  待处理: 'pending',
  处理中: 'processing',
  已驳回: 'rejected',
  已通过: 'passed',
}

export function bulkDataScopeLabel(processTab, scopeLabel) {
  const prefix = TAB_PROCESS_LABEL[processTab] ?? '工序'
  return `${prefix}/${scopeLabel}`
}

export function matchBulkDataScope(entry, processTab, scopeLabel) {
  if (!scopeLabel) return true
  const field = processTab === 'qc' ? 'qc' : processTab === 'review' ? 'review' : 'accept'
  const want = SCOPE_TO_STATUS[scopeLabel]
  if (!want) return true
  return deriveProcessStatuses(entry)[field] === want
}

export function entryHasAnnotationResult(entry) {
  if (!entry) return false
  if (entry.auditTags?.length) return true
  if (entry.actionSegments?.length) return true
  if (entry.auditResult && entry.auditResult !== '—') return true
  if (entry.auditScore != null && entry.auditScore !== '') return true
  if (entry.regionFrames?.length) return true
  return false
}

export function filterDrawerEntries(selectedEntries, { drawerProcess, drawerStatus }) {
  return selectedEntries.filter((entry) => {
    const ps = deriveProcessStatuses(entry)
    if (drawerProcess === '标注') {
      if (!(ps.review === 'pending' || ps.review === 'processing' || ps.review === 'passed' || ps.review === 'rejected')) {
        if (ps.review === 'none' && drawerStatus === '待处理') return true
        if (ps.review === 'none') return false
      }
    }
    if (drawerProcess === '审核') {
      const qcOk = ps.qc === 'pending' || ps.qc === 'processing' || ps.qc === 'passed' || ps.qc === 'rejected'
      if (!qcOk && ps.qc === 'none') return drawerStatus === '待处理'
    }
    if (drawerProcess === '验收') {
      if (ps.accept === 'none' && drawerStatus === '待处理') return ps.review === 'passed'
    }
    if (drawerProcess === '完成') {
      return ps.accept === 'passed'
    }

    const statusKey = drawerStatus === '待处理' ? 'pending' : 'rejected'
    if (drawerProcess === '标注') return ps.review === statusKey || (drawerStatus === '待处理' && ps.review === 'processing')
    if (drawerProcess === '审核') return ps.qc === statusKey || (drawerStatus === '待处理' && ps.qc === 'processing')
    if (drawerProcess === '验收') {
      return ps.accept === statusKey || (drawerStatus === '待处理' && ps.accept === 'processing')
    }
    return true
  })
}

/** mock：从勾选条目中随机抽取最多 30%（至少 1 条）进入验收待处理 */
export function pickRandomAcceptEntryIds(entryIds) {
  if (!entryIds?.length) return []
  const shuffled = [...entryIds].sort(() => Math.random() - 0.5)
  const n = Math.max(1, Math.ceil(shuffled.length * 0.3))
  return shuffled.slice(0, n)
}
