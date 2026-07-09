import { tasks } from '../mock/tasks'
import { getAllEntries, updateEntry } from '../mock/entries'
import { deriveProcessStatuses } from './entryProcess'

export const CREATE_BASIS_OPTIONS = ['任务名称', '采集员', '标注员', '标注结果']

const ACCEPT_PENDING = ['已标注', '验收不通过']

export function calcSampledCount(total, ratio) {
  const r = Number(ratio)
  if (!total || !r || r <= 0) return 0
  return Math.ceil((total * r) / 100)
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

/** 构建「新建批次」可选范围列表 */
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

/** 详情弹窗：按维度值拆分展示 */
export function buildDetailItems(projectId, basis, configItems) {
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
    const taskId = basis === '任务名称' ? item.key : null
    const scoped = taskId
      ? getProjectEntries(projectId).filter((e) => e.taskId === taskId)
      : entriesForOption(projectId, basis, item.key)

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
    entriesForOption(projectId, basis, item.key).forEach((e) => map.set(e.id, e))
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
  const acceptProgress = batch.sampledEntries
    ? Math.min(100, Math.round((reviewed / batch.sampledEntries) * 100))
    : 0

  let status = batch.status
  if (acceptProgress >= 100) status = 'completed'
  else if (acceptProgress > 0) status = 'in_progress'

  const detailItems = (batch.detailItems ?? []).map((item) => {
    if (acceptProgress < 100) return item
    const passRate = action === 'pass'
      ? Math.max(item.passRate ?? 88, 88)
      : Math.min(item.passRate ?? 40, 45)
    return { ...item, passRate }
  })

  return { passedCount: passed, acceptProgress, status, detailItems }
}

export function applyBatchOptionProcess(batch, selectedKeys, action, remark) {
  const items = (batch.configItems ?? []).filter((i) => selectedKeys.includes(i.key))
  const entries = collectEntriesForConfigItems(batch.projectId, batch.basis, items)
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
