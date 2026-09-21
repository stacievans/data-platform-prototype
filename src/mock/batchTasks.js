import { nowDateTime } from '../utils/formatDateTime'
import { users } from './misc'

const initialBatchTasks = [
  {
    id: 'BT-001',
    projectId: 'P-1001',
    name: '客厅杂物整理验收批次',
    entryCount: 10,
    acceptPassRate: 91.2,
    acceptRejectRate: 8.8,
    acceptProgress: 100,
    creator: '李明',
    createdAt: '2026-06-02 09:15:00',
    remark: '覆盖 T-2001、T-2002 已标注条目',
    status: '完成',
    deleted: false,
    entryIds: [
      'E-200101',
      'E-200102',
      'E-200103',
      'E-200104',
      'E-200105',
      'E-200106',
      'E-200107',
      'E-200108',
      'E-200109',
      'E-200110',
    ],
    reviewAssignees: [
      { username: 'sunli', nickname: '孙丽', uid: 'U-006' },
      { username: 'wulei', nickname: '吴磊', uid: 'U-011' },
    ],
    acceptAssignees: [
      { username: 'chenjing', nickname: '陈静', uid: 'U-016' },
      { username: 'linfeng', nickname: '林峰', uid: 'U-017' },
    ],
  },
  {
    id: 'BT-002',
    projectId: 'P-1001',
    name: '卧室归位专项批次',
    entryCount: 86,
    acceptPassRate: 76.5,
    acceptRejectRate: 23.5,
    acceptProgress: 68,
    creator: '陈静',
    createdAt: '2026-06-08 14:30:00',
    remark: '',
    status: '进行中',
    deleted: false,
    entryIds: [],
    reviewAssignees: [
      { username: 'sunli', nickname: '孙丽', uid: 'U-006' },
    ],
    acceptAssignees: [
      { username: 'chenjing', nickname: '陈静', uid: 'U-016' },
    ],
  },
  {
    id: 'BT-003',
    projectId: 'P-1001',
    name: '低通过率条目复核',
    entryCount: 42,
    acceptPassRate: 62.0,
    acceptRejectRate: 38.0,
    acceptProgress: 45,
    creator: '王芳',
    createdAt: '2026-06-10 11:20:00',
    remark: '优先处理上周驳回条目',
    status: '进行中',
    deleted: false,
    entryIds: [],
    reviewAssignees: [
      { username: 'sunli', nickname: '孙丽', uid: 'U-006' },
      { username: 'hemin', nickname: '何敏', uid: 'U-007' },
    ],
    acceptAssignees: [
      { username: 'chenjing', nickname: '陈静', uid: 'U-016' },
    ],
  },
  {
    id: 'BT-004',
    projectId: 'P-1001',
    name: '6月整体验收汇总',
    entryCount: 200,
    acceptPassRate: 88.0,
    acceptRejectRate: 12.0,
    acceptProgress: 12,
    creator: '李明',
    createdAt: '2026-06-12 16:00:00',
    remark: '待分配验收员',
    status: '进行中',
    deleted: false,
    entryIds: [],
    acceptAssignees: [
      { username: 'chenjing', nickname: '陈静', uid: 'U-016' },
    ],
  },
  {
    id: 'BT-101',
    projectId: 'P-1002',
    name: '厨房切配验收-试跑',
    entryCount: 56,
    acceptPassRate: 94.6,
    acceptRejectRate: 5.4,
    acceptProgress: 90,
    creator: '张华',
    createdAt: '2026-06-09 10:08:00',
    remark: '',
    status: '进行中',
    deleted: false,
    entryIds: [],
  },
]

function normalizeAssignees(batch) {
  const reviewAssignees = batch.reviewAssignees?.length
    ? batch.reviewAssignees
    : (batch.reviewers ?? []).map((nickname) => ({ username: nickname, nickname, uid: '' }))
  const acceptAssignees = batch.acceptAssignees?.length
    ? batch.acceptAssignees
    : (batch.acceptors ?? []).map((nickname) => ({ username: nickname, nickname, uid: '' }))
  return {
    ...batch,
    entryIds: batch.entryIds ?? [],
    reviewAssignees,
    acceptAssignees,
    reviewClaimLimit: batch.reviewClaimLimit ?? null,
    acceptClaimLimit: batch.acceptClaimLimit ?? null,
  }
}

let batchTaskStore = initialBatchTasks.map((b) => normalizeAssignees(b))

let idSeq = 5

export function getBatchTasksByProjectId(projectId) {
  return batchTaskStore.filter((b) => b.projectId === projectId && !b.deleted)
}

export function getBatchTaskById(id) {
  const row = batchTaskStore.find((b) => b.id === id && !b.deleted)
  return row ? normalizeAssignees({ ...row }) : null
}

export function getBatchTasksByEntryId(entryId) {
  return batchTaskStore
    .filter((b) => !b.deleted && (b.entryIds ?? []).includes(entryId))
    .map((b) => normalizeAssignees({ ...b }))
}

function toBatchAssignee(username) {
  const u = users.find((x) => x.username === username)
  return {
    username,
    nickname: u?.nickname ?? username,
    uid: u?.uid ?? '',
  }
}

/** 项目人员：按成员同步其在各批次上的标注/验收分配（taskIds 为批次任务 ID） */
export function syncMemberBatchAssignments(projectId, username, memberRole, batchIds) {
  const selected = new Set(batchIds ?? [])
  const isReviewer = memberRole === '标注员'
  getBatchTasksByProjectId(projectId).forEach((batch) => {
    const row = batchTaskStore.find((b) => b.id === batch.id)
    if (!row) return
    let reviewAssignees = [...(row.reviewAssignees ?? [])]
    let acceptAssignees = [...(row.acceptAssignees ?? [])]
    if (isReviewer) {
      reviewAssignees = reviewAssignees.filter((a) => a.username !== username)
      if (selected.has(batch.id)) reviewAssignees.push(toBatchAssignee(username))
    } else {
      acceptAssignees = acceptAssignees.filter((a) => a.username !== username)
      if (selected.has(batch.id)) acceptAssignees.push(toBatchAssignee(username))
    }
    updateBatchTaskAssignment(batch.id, { reviewAssignees, acceptAssignees })
  })
}

export function batchTaskListForPicker(projectId) {
  return getBatchTasksByProjectId(projectId).map((b) => ({ id: b.id, name: b.name }))
}

export function updateBatchTaskAssignment(batchId, payload) {
  const {
    reviewAssignees = [],
    acceptAssignees = [],
    reviewClaimLimit = null,
    acceptClaimLimit = null,
  } = payload
  updateBatchTask(batchId, {
    reviewAssignees,
    acceptAssignees,
    reviewers: reviewAssignees.map((a) => a.nickname),
    acceptors: acceptAssignees.map((a) => a.nickname),
    reviewClaimLimit: reviewClaimLimit === '' || reviewClaimLimit == null ? null : Number(reviewClaimLimit),
    acceptClaimLimit: acceptClaimLimit === '' || acceptClaimLimit == null ? null : Number(acceptClaimLimit),
  })
}

/** 项目内已进入任意批次任务的条目 ID */
export function getEntryIdsInBatchTasks(projectId) {
  const ids = new Set()
  batchTaskStore.forEach((b) => {
    if (b.deleted || b.projectId !== projectId) return
    ;(b.entryIds ?? []).forEach((eid) => ids.add(eid))
  })
  return ids
}

export function removeEntryFromBatchTask(batchId, entryId) {
  const batch = batchTaskStore.find((b) => b.id === batchId && !b.deleted)
  if (!batch || !entryId) return false
  const nextIds = (batch.entryIds ?? []).filter((id) => id !== entryId)
  if (nextIds.length === (batch.entryIds ?? []).length) return false
  updateBatchTask(batchId, { entryIds: nextIds, entryCount: nextIds.length })
  return true
}

export function addEntriesToBatchTask(batchId, entryIds) {
  const batch = batchTaskStore.find((b) => b.id === batchId && !b.deleted)
  if (!batch || !entryIds?.length) return 0
  const set = new Set(batch.entryIds ?? [])
  let added = 0
  entryIds.forEach((id) => {
    if (!id || set.has(id)) return
    set.add(id)
    added += 1
  })
  const nextIds = [...set]
  updateBatchTask(batchId, {
    entryIds: nextIds,
    entryCount: nextIds.length,
  })
  return added
}

export function isBatchTaskNameTaken(projectId, name, excludeId = null) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return false
  return batchTaskStore.some(
    (b) =>
      !b.deleted
      && b.projectId === projectId
      && b.id !== excludeId
      && b.name.trim() === trimmed,
  )
}

export function nextBatchTaskId() {
  const n = idSeq++
  return `BT-${String(n).padStart(3, '0')}`
}

export function appendBatchTask(record) {
  const row = normalizeAssignees({ deleted: false, entryIds: [], ...record, entryIds: record.entryIds ?? [] })
  batchTaskStore = [row, ...batchTaskStore]
  return row
}

export function updateBatchTask(id, patch) {
  batchTaskStore = batchTaskStore.map((b) => (b.id === id ? { ...b, ...patch } : b))
}

export function softDeleteBatchTask(id) {
  updateBatchTask(id, { deleted: true })
}

export function createBatchTaskFromForm({ projectId, name, remark, creator }) {
  return appendBatchTask({
    id: nextBatchTaskId(),
    projectId,
    name: name.trim(),
    remark: (remark ?? '').trim(),
    entryCount: 0,
    acceptPassRate: 0,
    acceptRejectRate: 0,
    acceptProgress: 0,
    creator,
    createdAt: nowDateTime(),
    status: '进行中',
    reviewers: [],
    acceptors: [],
    taskId: null,
    entryIds: [],
  })
}

function resolveUniqueBatchTaskName(projectId, baseName, taskId) {
  const trimmed = (baseName ?? '').trim()
  if (!isBatchTaskNameTaken(projectId, trimmed)) return trimmed
  const withId = `${trimmed}（${taskId}）`
  if (!isBatchTaskNameTaken(projectId, withId)) return withId
  return `${withId}-${Date.now()}`
}

/** 按采集任务逐一创建批次任务 */
export function bulkCreateBatchTasksFromCollectionTasks({
  projectId,
  collectionTasks,
  reviewers = [],
  acceptors = [],
  creator,
}) {
  const created = []
  collectionTasks.forEach((task) => {
    const name = resolveUniqueBatchTaskName(projectId, task.name, task.id)
    const row = appendBatchTask({
      id: nextBatchTaskId(),
      projectId,
      taskId: task.id,
      name,
      remark: `由采集任务 ${task.id} 批量创建`,
      entryCount: 0,
      entryIds: [],
      acceptPassRate: 0,
      acceptRejectRate: 0,
      acceptProgress: 0,
      creator,
      createdAt: nowDateTime(),
      status: '进行中',
      reviewers: [...reviewers],
      acceptors: [...acceptors],
    })
    created.push(row)
  })
  return created
}
