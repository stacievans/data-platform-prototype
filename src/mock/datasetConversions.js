/** 真机数据集 · 转换记录 & 转换数据集 mock + runtime */

import { nowDateTime } from '../utils/formatDateTime'

const initialConversionJobs = [
  {
    id: 'CJ-2001',
    datasetId: 'DS-001',
    targetDatasetName: '家庭整理操作数据集 v2_转图片',
    taskType: '转图片',
    progress: 100,
    status: '已完成',
    operator: '李明',
    operatedAt: '2026-06-07 10:20:00',
    entryCount: 12,
  },
  {
    id: 'CJ-2002',
    datasetId: 'DS-003',
    targetDatasetName: '工业装配力控数据集_转视频',
    taskType: '转视频',
    progress: 100,
    status: '已完成',
    operator: '张华',
    operatedAt: '2026-06-09 16:45:00',
    entryCount: 8,
  },
]

const initialConvertedDatasets = [
  {
    id: 'CDS-3001',
    datasetId: 'DS-001',
    conversionJobId: 'CJ-2001',
    name: '家庭整理操作数据集 v2_转图片',
    type: '图片',
    fileCount: 384,
    createdBy: '李明',
    createdAt: '2026-06-07 10:25:00',
  },
  {
    id: 'CDS-3002',
    datasetId: 'DS-003',
    conversionJobId: 'CJ-2002',
    name: '工业装配力控数据集_转视频',
    type: '视频',
    fileCount: 96,
    createdBy: '张华',
    createdAt: '2026-06-09 16:50:00',
  },
]

let runtimeJobs = [...initialConversionJobs.map((j) => ({ ...j }))]
let runtimeConverted = [...initialConvertedDatasets.map((d) => ({ ...d }))]

export function getConversionJobsByDatasetId(datasetId) {
  return runtimeJobs
    .filter((j) => j.datasetId === datasetId)
    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
}

export function getConvertedDatasetsByDatasetId(datasetId) {
  return runtimeConverted
    .filter((d) => d.datasetId === datasetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getConvertedDatasetById(id) {
  return runtimeConverted.find((d) => d.id === id) ?? null
}

export function getConversionJobById(id) {
  return runtimeJobs.find((j) => j.id === id) ?? null
}

const fileCache = new Map()

export function getConvertedDatasetFiles(convertedId) {
  if (fileCache.has(convertedId)) return fileCache.get(convertedId)
  const record = getConvertedDatasetById(convertedId)
  if (!record) return []
  const isVideo = record.type === '视频'
  const ext = isVideo ? 'mp4' : 'jpg'
  const prefix = isVideo ? 'clip' : 'frame'
  const files = Array.from({ length: record.fileCount }, (_, i) => ({
    id: `${convertedId}-F${String(i + 1).padStart(4, '0')}`,
    name: `${prefix}_${String(i + 1).padStart(4, '0')}.${ext}`,
    size: isVideo ? `${(80 + (i % 40)).toFixed(1)} MB` : `${(120 + (i % 80)).toFixed(0)} KB`,
    type: record.type,
    createdAt: record.createdAt,
  }))
  fileCache.set(convertedId, files)
  return files
}

function nextConversionJobId() {
  const nums = runtimeJobs.map((j) => parseInt(j.id.replace('CJ-', ''), 10) || 0)
  return `CJ-${String(Math.max(0, ...nums, 2000) + 1).padStart(4, '0')}`
}

function nextConvertedDatasetId() {
  const nums = runtimeConverted.map((d) => parseInt(d.id.replace('CDS-', ''), 10) || 0)
  return `CDS-${String(Math.max(0, ...nums, 3000) + 1).padStart(4, '0')}`
}

export function appendConversionJob(job) {
  runtimeJobs = [{ ...job }, ...runtimeJobs]
  return job
}

export function updateConversionJob(jobId, patch) {
  runtimeJobs = runtimeJobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j))
}

export function appendConvertedDataset(record) {
  runtimeConverted = [{ ...record }, ...runtimeConverted]
  return record
}

export function createConversionJob({
  datasetId,
  datasetName,
  taskType,
  operator,
  entryCount,
}) {
  const typeLabel = taskType === '转图片' ? '转图片' : '转视频'
  const suffix = typeLabel.replace('转', '')
  const targetDatasetName = `${datasetName}_${typeLabel}`
  const now = nowDateTime()
  const job = {
    id: nextConversionJobId(),
    datasetId,
    targetDatasetName,
    taskType: typeLabel,
    progress: 35,
    status: '进行中',
    operator,
    operatedAt: now,
    entryCount,
  }
  appendConversionJob(job)
  return job
}

export function completeConversionJob(job) {
  const convertedType = job.taskType === '转图片' ? '图片' : '视频'
  const now = nowDateTime()
  updateConversionJob(job.id, { progress: 100, status: '已完成', operatedAt: now })
  const record = {
    id: nextConvertedDatasetId(),
    datasetId: job.datasetId,
    conversionJobId: job.id,
    name: job.targetDatasetName,
    type: convertedType,
    fileCount: Math.max(1, (job.entryCount ?? 1) * (convertedType === '图片' ? 32 : 12)),
    createdBy: job.operator,
    createdAt: now,
  }
  appendConvertedDataset(record)
  return { job: { ...job, progress: 100, status: '已完成', operatedAt: now }, record }
}

export const CONVERSION_TASK_TYPES = ['全部', '转图片', '转视频']
export const CONVERSION_STATUSES = ['全部', '进行中', '已完成', '失败']
export const CONVERTED_DATASET_TYPES = ['全部', '图片', '视频']
