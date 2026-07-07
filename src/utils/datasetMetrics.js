import { entries } from '../mock/entries'
import { tasks } from '../mock/tasks'

export function parseSizeToMB(sizeStr) {
  const m = String(sizeStr).match(/^([\d.]+)\s*(TB|GB|MB)$/i)
  if (!m) return 0
  const val = parseFloat(m[1])
  const unit = m[2].toUpperCase()
  if (unit === 'TB') return val * 1024 * 1024
  if (unit === 'GB') return val * 1024
  return val
}

export function formatTotalSize(totalMB) {
  if (totalMB <= 0) return '0 MB'
  const totalGB = totalMB / 1024
  if (totalGB >= 1024) return `${(totalGB / 1024).toFixed(1)} TB`
  if (totalGB >= 1) return `${totalGB.toFixed(1)} GB`
  return `${Math.round(totalMB)} MB`
}

export function addSizeStrings(a, b) {
  return formatTotalSize(parseSizeToMB(a) + parseSizeToMB(b))
}

export function subtractSizeStrings(total, delta) {
  return formatTotalSize(Math.max(0, parseSizeToMB(total) - parseSizeToMB(delta)))
}

export function parseDurationToSec(duration) {
  const hourMatch = String(duration).match(/^(\d+)\s*小时$/)
  if (hourMatch) return Number(hourMatch[1]) * 3600
  const [mm, ss] = String(duration).split(':').map(Number)
  return (mm || 0) * 60 + (ss || 0)
}

export function formatTotalDuration(totalSec) {
  if (totalSec <= 0) return '0 小时'
  const hours = totalSec / 3600
  return hours >= 1 ? `${Math.round(hours)} 小时` : `${Math.round(totalSec / 60)} 分钟`
}

export function addDurationHours(durationStr, addedSec) {
  const baseSec = parseDurationToSec(durationStr)
  return formatTotalDuration(baseSec + addedSec)
}

export function subtractDurationHours(durationStr, removedSec) {
  return formatTotalDuration(Math.max(0, parseDurationToSec(durationStr) - removedSec))
}

export function filterEntriesByCriteria(taskIds, statuses, formats) {
  if (!taskIds.length || !statuses.length || !formats.length) return []
  return entries.filter(
    (e) => taskIds.includes(e.taskId)
      && statuses.includes(e.dataStatus)
      && formats.includes(e.format),
  )
}

export function computeEntryMetrics(entryList) {
  const totalMB = entryList.reduce((sum, e) => sum + parseSizeToMB(e.size), 0)
  const totalSec = entryList.reduce((sum, e) => sum + parseDurationToSec(e.duration), 0)
  return {
    count: entryList.length,
    totalSize: formatTotalSize(totalMB),
    totalDuration: formatTotalDuration(totalSec),
    totalMB,
    totalSec,
  }
}

export function countByField(entryList, field) {
  return entryList.reduce((acc, e) => {
    const key = e[field]
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

export function getDatasetEntries(dataset) {
  const taskMap = new Map(tasks.map((t) => [t.id, t.name]))
  const idSet = new Set(dataset.entryIds ?? [])
  return entries
    .filter((e) => idSet.has(e.id))
    .map((e) => ({
      ...e,
      taskName: taskMap.get(e.taskId) ?? e.taskId,
    }))
}

export function getInclusionOverview(dataset) {
  const included = entries.filter((e) => (dataset.entryIds ?? []).includes(e.id))
  const taskMap = new Map(tasks.map((t) => [t.id, t.name]))

  const taskStats = Object.entries(
    included.reduce((acc, e) => {
      acc[e.taskId] = (acc[e.taskId] ?? 0) + 1
      return acc
    }, {}),
  ).map(([taskId, count]) => ({
    taskId,
    taskName: taskMap.get(taskId) ?? taskId,
    count,
  }))

  return {
    projectId: dataset.projectId,
    projectName: dataset.projectName,
    taskIds: dataset.taskIds ?? [...new Set(included.map((e) => e.taskId))],
    statuses: dataset.statuses ?? [],
    formats: dataset.formats ?? [],
    taskStats,
    statusStats: countByField(included, 'dataStatus'),
    formatStats: countByField(included, 'format'),
    totalCount: included.length,
  }
}

export function diffInclusion(currentEntryIds, nextEntries) {
  const currentSet = new Set(currentEntryIds ?? [])
  const nextIds = nextEntries.map((e) => e.id)
  const nextSet = new Set(nextIds)

  const added = nextEntries.filter((e) => !currentSet.has(e.id))
  const removedIds = (currentEntryIds ?? []).filter((id) => !nextSet.has(id))
  const removed = entries.filter((e) => removedIds.includes(e.id))

  return {
    nextEntryIds: nextIds,
    added,
    removed,
    addedMetrics: computeEntryMetrics(added),
    removedMetrics: computeEntryMetrics(removed),
    finalMetrics: computeEntryMetrics(nextEntries),
  }
}

export function formatAppendSummary(count, statuses, formats, sizeDelta) {
  const parts = []
  if (statuses.length === 1) parts.push(statuses[0])
  else if (statuses.length > 0 && statuses.length < 4) parts.push(statuses.join('/'))
  if (formats.length === 1) parts.push(formats[0])
  else if (formats.length > 1) parts.push(formats.join('/'))
  const label = parts.length ? ` ${parts.join(' ')}` : ''
  return `追加 ${count.toLocaleString()} 条${label} 数据，+${sizeDelta}`
}

export function formatUpdateChangeSummary({ addedCount, addedSize, removedCount, removedSize }) {
  const parts = []
  if (addedCount > 0) parts.push(`追加 ${addedCount.toLocaleString()} 条，+${addedSize}`)
  if (removedCount > 0) parts.push(`移除 ${removedCount.toLocaleString()} 条，-${removedSize}`)
  return parts.length ? parts.join('；') : '无数据变更'
}

export function buildDatasetFromCriteria({
  projectId,
  projectName,
  taskIds,
  statuses,
  formats,
}) {
  const matched = filterEntriesByCriteria(taskIds, statuses, formats)
  const metrics = computeEntryMetrics(matched)
  return {
    projectId,
    projectName,
    taskIds: [...taskIds],
    statuses: [...statuses],
    formats: [...formats],
    entryIds: matched.map((e) => e.id),
    trajCount: metrics.count,
    totalSize: metrics.totalSize,
    totalDuration: metrics.totalDuration,
  }
}
