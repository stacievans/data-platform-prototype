import { tasks, formatReviewer } from '../mock/tasks'
import { getAllEntries, updateEntry } from '../mock/entries'
import { deriveProcessStatuses } from './entryProcess'

export const CREATE_BASIS_OPTIONS = ['任务名称', '采集员', '标注员', '标注结果']

export const REVIEW_RESULT_FILTER_OPTIONS = [
  { value: 'all', label: '全选' },
  { value: 'passed', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

const ACCEPT_PENDING = ['已标注', '验收不通过']

/** 抽检条目数：比例 × 候选，四舍五入；候选≥1 时至少 1 条，候选为 0 则为 0 */
export function calcSampledCount(total, ratio) {
  const totalN = Number(total) || 0
  if (totalN <= 0) return 0
  const r = Number(ratio)
  const n = (!r || r <= 0) ? 0 : Math.round((totalN * r) / 100)
  return Math.max(1, n)
}

export function getProjectEntries(projectId) {
  const taskIds = new Set(tasks.filter((t) => t.projectId === projectId).map((t) => t.id))
  return getAllEntries().filter((e) => taskIds.has(e.taskId))
}

function reviewSubLabel(dataStatus) {
  return dataStatus === '标注不通过' ? '标注驳回' : '标注通过'
}

function taskById(taskId) {
  return tasks.find((t) => t.id === taskId)
}

function matchesReviewResult(entry, reviewResult) {
  if (!reviewResult || reviewResult === 'all') return true
  const review = deriveProcessStatuses(entry).review
  if (reviewResult === 'passed') return review === 'passed'
  if (reviewResult === 'rejected') return review === 'rejected'
  return true
}

/** 默认筛选：标注已通过、采集员/标注员全部 */
export function defaultSamplingFilters() {
  return {
    reviewResult: 'passed',
    collectors: [],
    reviewers: [],
  }
}

export function formatReviewResultLabel(value) {
  return REVIEW_RESULT_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? '已通过'
}

export function formatSamplingFiltersSummary(filters) {
  if (!filters) return '—'
  const parts = [`标注结果：${formatReviewResultLabel(filters.reviewResult)}`]
  if (filters.collectors?.length) parts.push(`采集员：${filters.collectors.join('、')}`)
  else parts.push('采集员：全部')
  if (filters.reviewers?.length) parts.push(`标注员：${filters.reviewers.join('、')}`)
  else parts.push('标注员：全部')
  return parts.join(' · ')
}

/** 项目下可选任务行（含采集员/标注员/条目数） */
export function buildProjectTaskRows(projectId) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const entries = getProjectEntries(projectId)
  return projectTasks.map((t) => ({
    id: t.id,
    name: t.name,
    collector: formatReviewer(t.collector) || '—',
    reviewer: formatReviewer(t.reviewer) || '—',
    entryCount: entries.filter((e) => e.taskId === t.id).length,
  }))
}

export function listProjectCollectors(projectId) {
  const names = new Set()
  getProjectEntries(projectId).forEach((e) => {
    if (e.uploader) names.add(e.uploader)
  })
  tasks.filter((t) => t.projectId === projectId).forEach((t) => {
    const name = formatReviewer(t.collector)
    if (name && name !== '—') names.add(name)
  })
  return [...names].sort()
}

export function listProjectReviewers(projectId) {
  const names = new Set()
  tasks.filter((t) => t.projectId === projectId).forEach((t) => {
    const name = formatReviewer(t.reviewer)
    if (name && name !== '—') names.add(name)
  })
  return [...names].sort()
}

/** 按筛选条件缩小单任务候选条目 */
export function filterTaskCandidateEntries(projectId, taskId, filters = defaultSamplingFilters()) {
  const { reviewResult = 'passed', collectors = [], reviewers = [] } = filters
  const task = taskById(taskId)
  const taskReviewer = formatReviewer(task?.reviewer) || '—'

  return getProjectEntries(projectId).filter((e) => {
    if (e.taskId !== taskId) return false
    if (!matchesReviewResult(e, reviewResult)) return false
    if (collectors.length && !collectors.includes(e.uploader)) return false
    if (reviewers.length && !reviewers.includes(taskReviewer)) return false
    return true
  })
}

export function countTaskCandidates(projectId, taskId, filters) {
  return filterTaskCandidateEntries(projectId, taskId, filters).length
}

/** 按任务 + 筛选在候选池中抽样 */
export function pickSampleEntryIdsByTasks(projectId, configItems, filters = defaultSamplingFilters()) {
  const ids = []
  configItems.forEach((item) => {
    const entries = filterTaskCandidateEntries(projectId, item.key, filters)
    const count = calcSampledCount(item.totalEntries ?? entries.length, item.ratio)
    const pending = entries.filter((e) => ACCEPT_PENDING.includes(e.dataStatus))
    const pool = pending.length ? pending : entries
    const sorted = [...pool].sort((a, b) => b.uploadTime.localeCompare(a.uploadTime))
    ids.push(...sorted.slice(0, count).map((e) => e.id))
  })
  return [...new Set(ids)]
}

/** 任务维度明细行 */
export function buildTaskDetailItems(projectId, configItems, filters = defaultSamplingFilters()) {
  return configItems.map((item) => {
    const candidates = filterTaskCandidateEntries(projectId, item.key, filters)
    const totalEntries = item.totalEntries ?? candidates.length
    const sampledEntries = calcSampledCount(totalEntries, item.ratio)
    const accepted = candidates.filter((e) => e.dataStatus === '已验收').length
    const passRate = candidates.length
      ? Math.round((accepted / candidates.length) * 1000) / 10
      : 0
    return {
      label: item.label,
      totalEntries,
      ratio: item.ratio,
      sampledEntries,
      passRate,
    }
  })
}

/** 构建「新建批次」可选范围列表（旧 API，处理历史批次仍可用） */
export function buildSamplingOptions(projectId, basis) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const entries = getProjectEntries(projectId)

  if (basis === '任务名称') {
    return projectTasks
      .filter((t) => t.dataTotal > 0 || entries.some((e) => e.taskId === t.id))
      .map((t) => ({
        key: t.id,
        label: t.name,
        totalEntries: entries.filter((e) => e.taskId === t.id).length,
      }))
      .filter((o) => o.totalEntries > 0)
  }

  if (basis === '采集员') {
    const map = new Map()
    entries.forEach((e) => {
      map.set(e.uploader, (map.get(e.uploader) ?? 0) + 1)
    })
    return [...map.entries()].map(([name, totalEntries]) => ({
      key: `collector:${name}`,
      label: name,
      totalEntries,
    }))
  }

  if (basis === '标注员') {
    const map = new Map()
    entries.forEach((e) => {
      const task = taskById(e.taskId)
      const reviewer = task?.reviewer ?? '—'
      map.set(reviewer, (map.get(reviewer) ?? 0) + 1)
    })
    return [...map.entries()].map(([name, totalEntries]) => ({
      key: `reviewer:${name}`,
      label: name,
      totalEntries,
    }))
  }

  if (basis === '标注结果') {
    const map = new Map()
    entries.forEach((e) => {
      const task = taskById(e.taskId)
      const sub = reviewSubLabel(e.dataStatus)
      const key = `${e.taskId}:${sub}`
      const label = `${task?.name ?? e.taskId} · ${sub}`
      if (!map.has(key)) map.set(key, { key, label, totalEntries: 0 })
      map.get(key).totalEntries += 1
    })
    return [...map.values()].filter((o) => o.totalEntries > 0)
  }

  return []
}

function entriesForOption(projectId, basis, optionKey) {
  const entries = getProjectEntries(projectId)
  if (basis === '任务名称') return entries.filter((e) => e.taskId === optionKey)
  if (basis === '采集员') {
    const name = optionKey.replace('collector:', '')
    return entries.filter((e) => e.uploader === name)
  }
  if (basis === '标注员') {
    const name = optionKey.replace('reviewer:', '')
    return entries.filter((e) => (taskById(e.taskId)?.reviewer ?? '—') === name)
  }
  if (basis === '标注结果') {
    const [taskId, sub] = optionKey.split(':')
    return entries.filter((e) => {
      if (e.taskId !== taskId) return false
      return reviewSubLabel(e.dataStatus) === sub
    })
  }
  return []
}

/** 详情弹窗：按维度值拆分展示（兼容旧批次） */
export function buildDetailItems(projectId, basis, configItems) {
  if (basis === '任务名称' || !basis) {
    return buildTaskDetailItems(projectId, configItems)
  }

  if (basis === '标注结果') {
    return configItems.map((item) => {
      const sampled = calcSampledCount(item.totalEntries, item.ratio)
      const passRate = item.passRate ?? estimatePassRate(projectId, basis, item.key, sampled)
      return {
        label: item.label,
        totalEntries: item.totalEntries,
        ratio: item.ratio,
        sampledEntries: sampled,
        passRate,
      }
    })
  }

  const rows = []
  configItems.forEach((item) => {
    const baseLabel = item.label.split(' · ')[0]
    const scoped = entriesForOption(projectId, basis, item.key)

    const subs = [
      { sub: '标注通过', match: (e) => e.dataStatus !== '标注不通过' },
      { sub: '标注驳回', match: (e) => e.dataStatus === '标注不通过' },
    ]

    subs.forEach(({ sub, match }) => {
      const group = scoped.filter(match)
      if (!group.length) return
      const totalEntries = group.length
      const sampledEntries = calcSampledCount(totalEntries, item.ratio)
      const passed = group.filter((e) => {
        const ps = deriveProcessStatuses(e)
        return ps.accept === 'passed' || (ps.review === 'passed' && ps.accept !== 'rejected')
      }).length
      const reviewed = group.filter((e) => ['已验收', '验收不通过'].includes(e.dataStatus)).length
      const passRate = reviewed
        ? Math.round((group.filter((e) => e.dataStatus === '已验收').length / reviewed) * 1000) / 10
        : Math.round((passed / totalEntries) * 1000) / 10

      rows.push({
        label: `${baseLabel} · ${sub}`,
        totalEntries,
        ratio: item.ratio,
        sampledEntries,
        passRate,
      })
    })
  })
  return rows
}

function estimatePassRate(projectId, basis, optionKey, sampled) {
  const entries = entriesForOption(projectId, basis, optionKey)
  if (!entries.length || !sampled) return 0
  const accepted = entries.filter((e) => e.dataStatus === '已验收').length
  return Math.round((accepted / entries.length) * 1000) / 10
}

export function pickSampleEntryIds(projectId, basis, configItems) {
  if (!basis || basis === '任务名称') {
    return pickSampleEntryIdsByTasks(projectId, configItems)
  }
  const ids = []
  configItems.forEach((item) => {
    const entries = entriesForOption(projectId, basis, item.key)
    const count = calcSampledCount(item.totalEntries, item.ratio)
    const pending = entries.filter((e) => ACCEPT_PENDING.includes(e.dataStatus))
    const pool = pending.length ? pending : entries
    const sorted = [...pool].sort((a, b) => b.uploadTime.localeCompare(a.uploadTime))
    ids.push(...sorted.slice(0, count).map((e) => e.id))
  })
  return [...new Set(ids)]
}

export function findLatestPendingEntryInBatch(batch) {
  if (!batch?.entryIds?.length) return null
  const entries = getAllEntries()
    .filter((e) => batch.entryIds.includes(e.id) && ACCEPT_PENDING.includes(e.dataStatus))
  if (!entries.length) return null
  return entries.sort((a, b) => b.uploadTime.localeCompare(a.uploadTime))[0]
}

export function summarizeConfigItems(configItems) {
  const optionCount = configItems.length
  const totalEntries = configItems.reduce((s, i) => s + i.totalEntries, 0)
  const sampledEntries = configItems.reduce(
    (s, i) => s + calcSampledCount(i.totalEntries, i.ratio),
    0,
  )
  return { optionCount, totalEntries, sampledEntries }
}

export function summarizeDetailItems(items) {
  const totalEntries = items.reduce((s, i) => s + i.totalEntries, 0)
  const sampledEntries = items.reduce((s, i) => s + i.sampledEntries, 0)
  const reviewed = items.reduce((s, i) => s + (i.passRate != null ? i.sampledEntries : 0), 0)
  const weightedPass = reviewed
    ? items.reduce((s, i) => s + (i.passRate ?? 0) * i.sampledEntries, 0) / reviewed
    : 0
  return {
    totalEntries,
    sampledEntries,
    passRate: Math.round(weightedPass * 10) / 10,
  }
}

export function getEntriesForConfigOption(projectId, basis, optionKey) {
  return entriesForOption(projectId, basis, optionKey)
}

export function getPendingAcceptEntries(projectId) {
  return getProjectEntries(projectId).filter((e) => ACCEPT_PENDING.includes(e.dataStatus))
}

export function collectEntriesForConfigItems(projectId, basis, configItems) {
  const map = new Map()
  configItems.forEach((item) => {
    entriesForOption(projectId, basis ?? '任务名称', item.key).forEach((e) => map.set(e.id, e))
  })
  return [...map.values()]
}

export function processAcceptEntries(entryList, action, remark) {
  const nextStatus = action === 'pass' ? '已验收' : '验收不通过'
  let count = 0
  entryList.forEach((e) => {
    updateEntry(e.id, {
      dataStatus: nextStatus,
      acceptResult: action === 'pass' ? '通过' : '驳回',
      acceptComment: remark || '',
    })
    count += 1
  })
  return count
}

export function recalcBatchAfterProcess(batch, action = 'pass') {
  const sampledIds = new Set(batch.entryIds ?? [])
  const sampledEntries = getAllEntries().filter((e) => sampledIds.has(e.id))
  const reviewed = sampledEntries.filter((e) => ['已验收', '验收不通过'].includes(e.dataStatus)).length
  const passed = sampledEntries.filter((e) => e.dataStatus === '已验收').length
  const rejected = sampledEntries.filter((e) => e.dataStatus === '验收不通过').length
  const acceptProgress = batch.sampledEntries
    ? Math.min(100, Math.round((reviewed / batch.sampledEntries) * 100))
    : 0

  let status = batch.status
  if (acceptProgress >= 100) status = 'completed'
  else if (acceptProgress > 0) status = 'in_progress'
  else status = 'pending'

  const detailItems = (batch.detailItems ?? []).map((item) => {
    if (acceptProgress < 100) return item
    const passRate = action === 'pass'
      ? Math.max(item.passRate ?? 88, 88)
      : Math.min(item.passRate ?? 40, 45)
    return { ...item, passRate }
  })

  return {
    passedCount: passed,
    rejectedCount: rejected,
    acceptProgress,
    status,
    detailItems,
  }
}

export function applyBatchOptionProcess(batch, selectedKeys, action, remark) {
  const items = (batch.configItems ?? []).filter((i) => selectedKeys.includes(i.key))
  const basis = batch.basis || '任务名称'
  const entries = collectEntriesForConfigItems(batch.projectId, basis, items)
  const processed = processAcceptEntries(entries, action, remark)
  const patch = recalcBatchAfterProcess(batch, action)
  return { processed, patch }
}

export function applyBulkBatchProcess(batches, action, remark) {
  let total = 0
  const patches = new Map()
  batches.forEach((batch) => {
    const keys = (batch.configItems ?? []).map((i) => i.key)
    const { processed, patch } = applyBatchOptionProcess(batch, keys, action, remark)
    total += processed
    patches.set(batch.id, patch)
  })
  return { total, patches }
}

export function applyProjectAcceptProcess(projectId, action, remark) {
  const pending = getPendingAcceptEntries(projectId)
  return processAcceptEntries(pending, action, remark)
}

export function openAcceptWorkbench(entryId) {
  window.open(`/review/${entryId}?mode=accept`, '_blank', 'noopener,noreferrer')
}
