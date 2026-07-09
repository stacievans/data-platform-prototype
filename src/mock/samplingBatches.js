import {
  CREATE_BASIS_OPTIONS,
  summarizeDetailItems,
} from '../utils/samplingHelpers'

/** 列表筛选：抽样依据 */
export const SAMPLING_BASIS_OPTIONS = ['全部', ...CREATE_BASIS_OPTIONS]

const initialBatches = [
  {
    id: 'SB-2001',
    projectId: 'P-1001',
    name: '2026年6月第一轮抽检',
    basis: '任务名称',
    totalEntries: 144,
    sampledEntries: 29,
    passedCount: 27,
    acceptProgress: 100,
    status: 'completed',
    creator: '陈静',
    createdAt: '2026-06-01 09:30:00',
    configItems: [
      { key: 'T-2001', label: '客厅杂物分拣-第1批', totalEntries: 80, ratio: 20 },
      { key: 'T-2002', label: '客厅杂物分拣-第2批', totalEntries: 64, ratio: 20 },
    ],
    detailItems: [
      { label: '客厅杂物分拣-第1批 · 标注通过', totalEntries: 80, ratio: 20, sampledEntries: 16, passRate: 93.8 },
      { label: '客厅杂物分拣-第1批 · 标注驳回', totalEntries: 40, ratio: 20, sampledEntries: 8, passRate: 87.5 },
      { label: '客厅杂物分拣-第2批 · 标注通过', totalEntries: 64, ratio: 20, sampledEntries: 13, passRate: 92.3 },
    ],
    entryIds: ['E-200201', 'E-200202', 'E-200203'],
  },
  {
    id: 'SB-2002',
    projectId: 'P-1001',
    name: '客厅场景专项抽检',
    basis: '标注结果',
    totalEntries: 120,
    sampledEntries: 24,
    passedCount: 11,
    acceptProgress: 65,
    status: 'in_progress',
    creator: '李明',
    createdAt: '2026-06-08 14:20:00',
    configItems: [
      { key: 'T-2002:标注通过', label: '客厅杂物分拣-第2批 · 标注通过', totalEntries: 80, ratio: 20 },
      { key: 'T-2002:标注驳回', label: '客厅杂物分拣-第2批 · 标注驳回', totalEntries: 40, ratio: 20 },
    ],
    detailItems: [
      { label: '客厅杂物分拣-第2批 · 标注通过', totalEntries: 80, ratio: 20, sampledEntries: 16, passRate: 93.8 },
      { label: '客厅杂物分拣-第2批 · 标注驳回', totalEntries: 40, ratio: 20, sampledEntries: 8, passRate: 87.5 },
    ],
    entryIds: ['E-200204', 'E-200205', 'E-200301'],
  },
  {
    id: 'SB-2003',
    projectId: 'P-1001',
    name: '卧室整理低通过率复核',
    basis: '标注结果',
    totalEntries: 124,
    sampledEntries: 15,
    passedCount: 6,
    acceptProgress: 100,
    status: 'completed',
    creator: '王芳',
    createdAt: '2026-06-05 11:00:00',
    configItems: [
      { key: 'T-2003:标注通过', label: '卧室物品归位采集 · 标注通过', totalEntries: 90, ratio: 10 },
      { key: 'T-2003:标注驳回', label: '卧室物品归位采集 · 标注驳回', totalEntries: 34, ratio: 15 },
    ],
    detailItems: [
      { label: '卧室物品归位采集 · 标注通过', totalEntries: 90, ratio: 10, sampledEntries: 9, passRate: 55.6 },
      { label: '卧室物品归位采集 · 标注驳回', totalEntries: 34, ratio: 15, sampledEntries: 6, passRate: 33.3 },
    ],
    entryIds: ['E-200306', 'E-200307'],
  },
  {
    id: 'SB-2101',
    projectId: 'P-1002',
    name: '烹饪操作首轮抽检',
    basis: '任务名称',
    totalEntries: 88,
    sampledEntries: 18,
    passedCount: 17,
    acceptProgress: 100,
    status: 'completed',
    creator: '赵强',
    createdAt: '2026-06-03 10:15:00',
    configItems: [
      { key: 'T-2005', label: '蔬菜切配-土豆丝', totalEntries: 50, ratio: 20 },
      { key: 'T-2007', label: '餐具清洗采集', totalEntries: 38, ratio: 20 },
    ],
    detailItems: [
      { label: '蔬菜切配-土豆丝 · 标注通过', totalEntries: 50, ratio: 20, sampledEntries: 10, passRate: 95.0 },
      { label: '餐具清洗采集 · 标注通过', totalEntries: 38, ratio: 20, sampledEntries: 8, passRate: 100 },
    ],
    entryIds: ['E-200501', 'E-200701'],
  },
  {
    id: 'SB-2102',
    projectId: 'P-1002',
    name: '切配工序专项',
    basis: '采集员',
    totalEntries: 88,
    sampledEntries: 12,
    passedCount: 4,
    acceptProgress: 42,
    status: 'in_progress',
    creator: '陈静',
    createdAt: '2026-06-09 16:40:00',
    configItems: [
      { key: 'collector:吴磊', label: '吴磊', totalEntries: 52, ratio: 15 },
      { key: 'collector:郑浩', label: '郑浩', totalEntries: 36, ratio: 15 },
    ],
    detailItems: [
      { label: '吴磊 · 标注通过', totalEntries: 52, ratio: 15, sampledEntries: 8, passRate: 75.0 },
      { label: '郑浩 · 标注通过', totalEntries: 36, ratio: 15, sampledEntries: 6, passRate: 66.7 },
    ],
    entryIds: ['E-200502', 'E-200503'],
  },
  {
    id: 'SB-2103',
    projectId: 'P-1002',
    name: '餐具清洗复核批次',
    basis: '标注员',
    totalEntries: 88,
    sampledEntries: 10,
    passedCount: 4,
    acceptProgress: 100,
    status: 'completed',
    creator: '王芳',
    createdAt: '2026-05-28 09:00:00',
    configItems: [
      { key: 'reviewer:何敏', label: '何敏', totalEntries: 88, ratio: 10 },
    ],
    detailItems: [
      { label: '何敏 · 标注通过', totalEntries: 70, ratio: 10, sampledEntries: 7, passRate: 85.7 },
      { label: '何敏 · 标注驳回', totalEntries: 18, ratio: 10, sampledEntries: 2, passRate: 50.0 },
    ],
    entryIds: ['E-200702'],
  },
]

let batchStore = initialBatches.map((b) => ({ ...b }))
const projectProcessStats = {}

export function getSamplingBatchesByProjectId(projectId) {
  return batchStore.filter((b) => b.projectId === projectId)
}

export function getBatchById(batchId) {
  return batchStore.find((b) => b.id === batchId) ?? null
}

export function updateSamplingBatch(batchId, patch) {
  batchStore = batchStore.map((b) => (b.id === batchId ? { ...b, ...patch } : b))
  return getBatchById(batchId)
}

export function getProjectProcessStats(projectId) {
  return projectProcessStats[projectId] ?? { processedCount: 0 }
}

export function addProjectProcessedCount(projectId, count) {
  const prev = getProjectProcessStats(projectId)
  projectProcessStats[projectId] = { processedCount: prev.processedCount + count }
  return projectProcessStats[projectId]
}

export function appendSamplingBatch(batch) {
  batchStore = [batch, ...batchStore]
  return batch
}

export function nextSamplingBatchId() {
  const nums = batchStore.map((b) => parseInt(b.id.replace('SB-', ''), 10) || 0)
  return `SB-${Math.max(...nums, 2000) + 1}`
}

export function calcPassRate(batch) {
  if (!batch.sampledEntries) return 0
  const reviewed = Math.round((batch.acceptProgress / 100) * batch.sampledEntries)
  const base = reviewed || batch.sampledEntries
  return Math.round((batch.passedCount / base) * 100)
}

export { summarizeDetailItems }
