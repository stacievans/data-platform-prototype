import * as XLSX from 'xlsx'
import { projects } from '../mock/projects'
import { getPlanById, playLayouts, resolvePlanDeviceTypeId, resolveDeviceTypeName } from '../mock/plans'
import { getTaskPurposeTags } from '../mock/tags'
import { getAllDeviceInstances } from '../mock/devices'
import { getRuntimeUsers } from '../mock/organizations'
import { tasks, nowDatetime } from '../mock/tasks'
import { canImportPreAnnotation } from './preAnnotationImport'

export { canImportPreAnnotation as canBulkCreateTasks }

export const BULK_CREATE_FILE_MAX_BYTES = 10 * 1024 * 1024

/** 批量创建任务 CSV 模板表头（与导入解析一致） */
export const BULK_CREATE_CSV_HEADERS = [
  '项目ID',
  '任务ID',
  '任务名称',
  '任务用途',
  '目标条数',
  '采集方案ID',
  '指定采集设备SN',
  '采集员ID',
  '标注员ID',
  '验收员ID',
  '布局配置',
]

export function downloadBulkCreateTaskTemplate() {
  const headerLine = BULK_CREATE_CSV_HEADERS.join(',')
  const blob = new Blob([`\uFEFF${headerLine}\n`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '批量创建任务模板.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const ALLOWED_EXT = new Set(['csv', 'xls', 'xlsx'])

const COL = {
  projectId: ['项目ID', 'projectId'],
  taskId: ['任务ID', 'taskId'],
  name: ['任务名称', 'name', 'taskName'],
  purpose: ['任务用途', 'purpose'],
  target: ['目标条数', 'target', 'collectTotal'],
  planId: ['采集方案ID', 'planId'],
  deviceSn: ['指定采集设备SN', 'deviceSn', 'sn'],
  collectorId: ['采集员ID', 'collectorId', 'collectorUid'],
  annotatorId: ['标注员ID', 'annotatorId', 'annotatorUid'],
  acceptorId: ['验收员ID', 'acceptorId', 'acceptorUid'],
  layout: ['布局配置', 'layout', 'layoutName'],
}

function pickField(row, keys) {
  for (const key of keys) {
    const val = row[key]
    if (val != null && String(val).trim() !== '') return String(val).trim()
  }
  return ''
}

export function validateBulkCreateFile(file) {
  if (!file) return { ok: false, toast: null }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return { ok: false, toast: '只能上传CSV、XLS、XLSX文件！' }
  }
  if (file.size > BULK_CREATE_FILE_MAX_BYTES) {
    return { ok: false, toast: '文件大小不能超过10MB！' }
  }
  return { ok: true }
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCsvText(text) {
  const normalized = text.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => {
      row[h.trim()] = cols[i]?.trim() ?? ''
    })
    return row
  })
}

export async function parseBulkCreateFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') {
    const text = await file.text()
    return parseCsvText(text)
  }
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

function purposeTagNames() {
  return new Set(getTaskPurposeTags().map((t) => t.name))
}

function resolveOrgUser(idOrUsername) {
  if (!idOrUsername) return null
  const users = getRuntimeUsers().filter((u) => u.status === '启用')
  const byUid = users.find((u) => u.uid === idOrUsername)
  if (byUid) return byUid
  return users.find((u) => u.username === idOrUsername) ?? null
}

function resolveLayout(projectId, layoutRaw) {
  if (!layoutRaw) return { layoutId: '' }
  const layouts = playLayouts.filter((l) => l.projectId === projectId)
  const byId = layouts.find((l) => String(l.id) === layoutRaw)
  if (byId) return { layoutId: byId.id }
  const byName = layouts.find((l) => l.name === layoutRaw)
  if (byName) return { layoutId: byName.id }
  return null
}

function validateRow(row, ctx) {
  const {
    project,
    purposeNames,
    projectTaskNames,
    globalTaskIds,
  } = ctx

  const projectId = pickField(row, COL.projectId)
  const taskId = pickField(row, COL.taskId)
  const name = pickField(row, COL.name)
  const purpose = pickField(row, COL.purpose)
  const targetRaw = pickField(row, COL.target)
  const planId = pickField(row, COL.planId)
  const deviceSn = pickField(row, COL.deviceSn)
  const collectorRaw = pickField(row, COL.collectorId)
  const annotatorRaw = pickField(row, COL.annotatorId)
  const acceptorRaw = pickField(row, COL.acceptorId)
  const layoutRaw = pickField(row, COL.layout)

  if (projectId !== project.id) return { valid: false }
  if (!taskId || globalTaskIds.has(taskId)) return { valid: false }
  if (!name || projectTaskNames.has(name)) return { valid: false }
  if (!purpose || !purposeNames.has(purpose)) return { valid: false }

  const target = Number.parseInt(targetRaw, 10)
  if (!targetRaw || Number.isNaN(target) || target < 1) return { valid: false }

  const plan = getPlanById(planId)
  if (!plan || plan.projectId !== project.id || plan.status !== '已发布') return { valid: false }

  const instance = getAllDeviceInstances().find((i) => i.sn === deviceSn)
  if (!deviceSn || !instance) return { valid: false }

  const collector = resolveOrgUser(collectorRaw)
  const annotator = resolveOrgUser(annotatorRaw)
  const acceptor = resolveOrgUser(acceptorRaw)
  if (!collector || !annotator || !acceptor) return { valid: false }

  const layoutResolved = resolveLayout(project.id, layoutRaw)
  if (layoutRaw && !layoutResolved) return { valid: false }

  const deviceTypeId = resolvePlanDeviceTypeId(plan)
  const now = nowDatetime()
  const projMeta = projects.find((p) => p.id === project.id)

  const task = {
    id: taskId,
    planId,
    name,
    purpose,
    deviceTypeId,
    deviceTypeName: resolveDeviceTypeName(deviceTypeId) || '—',
    deviceInstanceId: instance.id,
    device: instance.code,
    method: plan.method,
    scene: plan.sceneLabel ?? '—',
    projectId: project.id,
    projectName: projMeta?.name ?? project.name,
    collectTotal: target,
    collectDone: 0,
    reviewDone: 0,
    acceptDone: 0,
    dataTotal: 0,
    status: '已发布',
    collectors: [collector.username],
    annotators: [annotator.username],
    acceptors: [acceptor.username],
    creator: ctx.creatorNickname,
    createdAt: now,
    updatedAt: now,
    ...(layoutResolved?.layoutId ? { layoutId: layoutResolved.layoutId } : {}),
  }

  return { valid: true, task }
}

/**
 * @returns {{ success: number, skipped: number, createdTasks: object[] }}
 */
export function runBulkCreateTasks(rows, { project, creatorNickname }) {
  if (!project?.id || !Array.isArray(rows)) {
    return { success: 0, skipped: 0, createdTasks: [] }
  }

  const purposeNames = purposeTagNames()
  const projectTaskNames = new Set(
    tasks.filter((t) => t.projectId === project.id).map((t) => t.name),
  )
  const globalTaskIds = new Set(tasks.map((t) => t.id))

  const createdTasks = []
  let skipped = 0

  for (const row of rows) {
    const result = validateRow(row, {
      project,
      purposeNames,
      projectTaskNames,
      globalTaskIds,
      creatorNickname,
    })
    if (!result.valid) {
      skipped += 1
      continue
    }
    createdTasks.push(result.task)
    globalTaskIds.add(result.task.id)
    projectTaskNames.add(result.task.name)
  }

  if (createdTasks.length) {
    tasks.splice(0, tasks.length, ...createdTasks, ...tasks)
  }

  return { success: createdTasks.length, skipped, createdTasks }
}
