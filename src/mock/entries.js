import { tasks, collectors } from './tasks'
import { plans } from './plans'

/** 采集条目数据状态（平台主流程） */
export const DATA_STATUSES = [
  '已上传',
  '已解析',
  '审核不通过',
  '已审核',
  '验收不通过',
  '已验收',
]

const formats = ['h5', 'LeRobot']

const DEFAULT_ACTION_SEGMENTS = [
  { startFrame: 0, endFrame: 480, skill: 'grasp', desc: '拿起 Pick', tone: 'blue' },
  { startFrame: 481, endFrame: 1200, skill: 'move', desc: '移动', tone: 'gray' },
  { startFrame: 1201, endFrame: 2100, skill: 'open', desc: '挂 Hang', tone: 'blue' },
  { startFrame: 2101, endFrame: 3139, skill: 'grasp', desc: '拿起 Pick', tone: 'blue' },
]

const DEFAULT_REGION_FRAMES = [
  { startFrame: 0, endFrame: 800, label: '接近段' },
  { startFrame: 801, endFrame: 2000, label: '操作段' },
  { startFrame: 2001, endFrame: 3139, label: '收尾段' },
]

const seeded = (seed) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const pad = (n, len = 2) => String(n).padStart(len, '0')

function pickStatus(task, rand) {
  const pool = task.status === '已归档'
    ? ['已解析', '已审核', '已审核', '已验收', '已验收', '验收不通过']
    : task.status === '已发布'
      ? ['已上传', '已上传', '已解析', '已解析', '审核不通过', '已审核']
      : ['已上传']
  return pool[Math.floor(rand() * pool.length)]
}

function buildEntryExtras(task) {
  const plan = plans.find((p) => p.id === task?.planId)
  const shortInstruction = task?.name?.includes('分拣')
    ? '挂回货架'
    : task?.name?.includes('折叠')
      ? '折叠衣物归位'
      : task?.name?.includes('螺钉')
        ? '完成螺钉锁附'
        : `执行「${task?.name ?? '采集任务'}」`
  return {
    collectDevice: task?.robotBody ?? '—',
    collectMethod: task?.method ?? '—',
    taskInstruction: shortInstruction,
    sceneInitialState: plan?.initialScene ? '已就绪' : '—',
    sceneInitialDetail: plan?.initialScene ?? '—',
    auditScore: null,
    auditResult: null,
    auditQuality: null,
    auditTags: [],
    auditComment: '',
    auditAbnormal: false,
    acceptResult: null,
    acceptComment: '',
    actionSegments: [],
    regionFrames: [],
    totalFrames: 3140,
    fps: 30,
  }
}

export const entries = tasks.flatMap((task, ti) => {
  const rand = seeded(ti + 7)
  const count = 5 + Math.floor(rand() * 6)
  const extras = buildEntryExtras(task)
  return Array.from({ length: count }).map((_, i) => {
    const sizeMB = Math.round((80 + rand() * 1900) * 10) / 10
    const durSec = Math.round(15 + rand() * 150)
    const day = 1 + Math.floor(rand() * 28)
    const taskCollectors = Array.isArray(task.collector) ? task.collector : [task.collector]
    const uploader = rand() < 0.8
      ? taskCollectors[Math.floor(rand() * taskCollectors.length)]
      : collectors[Math.floor(rand() * collectors.length)]
    return {
      id: `E-${task.id.slice(2)}${pad(i + 1)}`,
      taskId: task.id,
      fileName: `${task.id.toLowerCase()}_episode_${pad(i + 1, 3)}`,
      size: sizeMB >= 1024 ? `${(sizeMB / 1024).toFixed(2)} GB` : `${sizeMB} MB`,
      duration: `${pad(Math.floor(durSec / 60))}:${pad(durSec % 60)}`,
      uploadTime: `2026-05-${pad(day)} ${pad(8 + Math.floor(rand() * 10))}:${pad(Math.floor(rand() * 60))}`,
      uploader,
      dataStatus: pickStatus(task, rand),
      format: formats[Math.floor(rand() * formats.length)],
      ...extras,
    }
  })
})

/** 演示用固定状态与预标注 */
const DEMO_OVERRIDES = {
  'E-200101': {
    dataStatus: '已验收',
    auditScore: 5,
    auditResult: '通过',
    auditQuality: '优秀',
    auditTags: ['动作流畅'],
    auditComment: '轨迹完整，动作语义清晰。',
    acceptResult: '通过',
    acceptComment: '同意入库。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200102': {
    dataStatus: '审核不通过',
    auditScore: 2,
    auditResult: '不通过',
    auditQuality: '差',
    auditTags: ['动作不完整', '碰撞风险'],
    auditComment: '抓取阶段轨迹抖动明显，需重采。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200103': { dataStatus: '已上传' },
  'E-200104': {
    dataStatus: '已解析',
    displayName: '20260615_145105.h5',
    taskInstruction: '挂回货架',
    sceneInitialState: '已就绪',
    collectDevice: 'AlphaBot-1 双夹爪',
    collectMethod: 'VR遥操',
    uploader: '刘伟',
    duration: '0:32',
    format: 'h5',
    auditScore: 4,
    auditResult: '通过',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
    totalFrames: 3140,
  },
  'E-200105': {
    dataStatus: '已审核',
    auditScore: 4,
    auditResult: '通过',
    auditQuality: '可接受',
    auditTags: ['动作流畅'],
    auditComment: '整体可用，部分帧可再优化。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200106': {
    dataStatus: '验收不通过',
    auditScore: 4,
    auditResult: '通过',
    auditQuality: '可接受',
    auditTags: ['动作流畅'],
    auditComment: '标注通过。',
    acceptResult: '不通过',
    acceptComment: '与任务指令不符，请复核场景初始状态。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200701': {
    dataStatus: '已验收',
    auditScore: 5,
    auditResult: '通过',
    auditQuality: '优秀',
    auditComment: '质检通过。',
    acceptResult: '通过',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200702': {
    dataStatus: '审核不通过',
    auditResult: '异常数据',
    auditAbnormal: true,
    auditComment: '传感器时间戳异常，暂按不通过处理。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
  'E-200703': {
    dataStatus: '验收不通过',
    auditScore: 3,
    auditResult: '通过',
    auditQuality: '可接受',
    acceptResult: '不通过',
    acceptComment: '需补充末端位姿标注。',
    actionSegments: DEFAULT_ACTION_SEGMENTS,
    regionFrames: DEFAULT_REGION_FRAMES,
  },
}

Object.entries(DEMO_OVERRIDES).forEach(([id, patch]) => {
  const entry = entries.find((e) => e.id === id)
  if (entry) Object.assign(entry, patch)
})

/** 会话内条目补丁（审核/验收提交等） */
const runtimePatches = {}

export function getEntryById(id) {
  const base = entries.find((e) => e.id === id)
  if (!base) return null
  return { ...base, ...(runtimePatches[id] ?? {}) }
}

export function updateEntry(id, patch) {
  runtimePatches[id] = { ...(runtimePatches[id] ?? {}), ...patch }
  const idx = entries.findIndex((e) => e.id === id)
  if (idx >= 0) Object.assign(entries[idx], runtimePatches[id])
  return getEntryById(id)
}

export function getAllEntries() {
  return entries.map((e) => ({ ...e, ...(runtimePatches[e.id] ?? {}) }))
}

export function getEntriesByTaskId(taskId) {
  return getAllEntries().filter((e) => e.taskId === taskId)
}

const REVIEW_PENDING = ['已解析', '审核不通过']
const ACCEPT_PENDING = ['已审核', '验收不通过']

/** 任务下待审核/待验收、上传时间最近的一条 */
export function findLatestPendingEntry(taskId, mode) {
  const statuses = mode === 'review' ? REVIEW_PENDING : ACCEPT_PENDING
  const pending = getAllEntries()
    .filter((e) => e.taskId === taskId && statuses.includes(e.dataStatus))
  if (!pending.length) return null
  return pending.sort((a, b) => b.uploadTime.localeCompare(a.uploadTime))[0]
}

export const dataStatusColor = {
  已上传: 'gray',
  已解析: 'blue',
  审核不通过: 'red',
  已审核: 'purple',
  验收不通过: 'orange',
  已验收: 'cyan',
}

export const dataStatusOptions = ['全部', ...DATA_STATUSES]
