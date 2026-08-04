// 采集任务（15条，跨项目）
// status: 草稿 | 已发布 | 已归档
import { nowDateTime } from '../utils/formatDateTime'
import { getPlanById, resolvePlanDeviceTypeId, resolveDeviceTypeName } from './plans'
import { getAllDeviceInstances, getAllDeviceTypes } from './devices'

export const tasks = [
  {
    id: 'T-2001', planId: 'PL-3001', name: '客厅杂物分拣-第1批', purpose: '正式采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-001', device: 'DEV-A01', method: 'VR遥操', scene: '家庭场景',
    projectId: 'P-1001', projectName: '家庭物品整理采集',
    collectTotal: 500, collectDone: 500, reviewDone: 500, acceptDone: 480, dataTotal: 500,
    status: '已归档', collectors: ['刘伟'], annotators: ['孙丽'],
    creator: '李明', createdAt: '2026-03-13 09:30:00', updatedAt: '2026-05-20 16:40:00',
  },
  {
    id: 'T-2002', planId: 'PL-3001', name: '客厅杂物分拣-第2批', purpose: '正式采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-002', device: 'DEV-A02', method: 'VR遥操', scene: '家庭场景',
    projectId: 'P-1001', projectName: '家庭物品整理采集',
    collectTotal: 500, collectDone: 386, reviewDone: 210, acceptDone: 168, dataTotal: 386,
    status: '已发布', collectors: ['刘伟', '周杰'], annotators: ['孙丽', '何敏'],
    creator: '李明', createdAt: '2026-04-08 10:15:00', updatedAt: '2026-06-08 11:22:00',
  },
  {
    id: 'T-2003', planId: 'PL-3002', name: '卧室物品归位采集', purpose: '正式采集',
    deviceTypeId: 'DTY-002', deviceInstanceId: 'INS-005', device: 'DEV-A03', method: 'VR遥操', scene: '家庭场景',
    projectId: 'P-1001', projectName: '家庭物品整理采集',
    collectTotal: 300, collectDone: 300, reviewDone: 152, acceptDone: 120, dataTotal: 300,
    status: '已发布', collectors: ['周杰'], annotators: ['孙丽'],
    creator: '李明', createdAt: '2026-04-20 14:00:00', updatedAt: '2026-06-05 09:18:00',
  },
  {
    id: 'T-2004', planId: 'PL-3003', name: '玩具收纳试采', purpose: '试采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-003', device: 'DEV-B02', method: '外骨骼', scene: '家庭场景',
    projectId: 'P-1001', projectName: '家庭物品整理采集',
    collectTotal: 100, collectDone: 100, reviewDone: 100, acceptDone: 100, dataTotal: 100,
    status: '已归档', collectors: ['周杰', '吴磊'], annotators: ['何敏'],
    creator: '李明', createdAt: '2026-03-28 11:40:00', updatedAt: '2026-04-15 17:30:00',
  },
  {
    id: 'T-2005', planId: 'PL-3004', name: '蔬菜切配-土豆丝', purpose: '正式采集',
    deviceTypeId: 'DTY-005', deviceInstanceId: 'INS-010', device: 'DEV-E01', method: '外骨骼', scene: '厨房操作',
    projectId: 'P-1002', projectName: '厨房烹饪操作采集',
    collectTotal: 400, collectDone: 268, reviewDone: 120, acceptDone: 86, dataTotal: 268,
    status: '已发布', collectors: ['吴磊'], annotators: ['何敏', '孙丽'],
    creator: '王芳', createdAt: '2026-03-22 09:00:00', updatedAt: '2026-06-09 14:05:00',
  },
  {
    id: 'T-2006', planId: 'PL-3004', name: '蔬菜切配-青椒块', purpose: '正式采集',
    deviceTypeId: 'DTY-005', deviceInstanceId: 'INS-010', device: 'DEV-E01', method: '外骨骼', scene: '厨房操作',
    projectId: 'P-1002', projectName: '厨房烹饪操作采集',
    collectTotal: 400, collectDone: 0, reviewDone: 0, acceptDone: 0, dataTotal: 0,
    status: '草稿', collectors: ['吴磊'], annotators: ['何敏'],
    creator: '王芳', layoutId: 3, createdAt: '2026-06-01 16:20:00', updatedAt: '2026-06-01 16:20:00',
  },
  {
    id: 'T-2007', planId: 'PL-3005', name: '餐具清洗采集', purpose: '正式采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-004', device: 'DEV-D01', method: 'VR遥操', scene: '厨房操作',
    projectId: 'P-1002', projectName: '厨房烹饪操作采集',
    collectTotal: 350, collectDone: 350, reviewDone: 350, acceptDone: 350, dataTotal: 350,
    status: '已归档', collectors: ['刘伟', '郑浩'], annotators: ['何敏'],
    creator: '王芳', createdAt: '2026-04-05 13:10:00', updatedAt: '2026-05-28 10:00:00',
  },
  {
    id: 'T-2008', planId: 'PL-3006', name: '螺钉锁附-M4工位', purpose: '正式采集',
    deviceTypeId: 'DTY-003', deviceInstanceId: 'INS-007', device: 'DEV-B01', method: 'VR遥操', scene: '工业装配',
    projectId: 'P-1003', projectName: '工业零件装配采集',
    collectTotal: 600, collectDone: 452, reviewDone: 430, acceptDone: 400, dataTotal: 452,
    status: '已发布', collectors: ['郑浩'], annotators: ['钱琳'],
    creator: '李明', createdAt: '2026-04-03 08:45:00', updatedAt: '2026-06-10 08:30:00',
  },
  {
    id: 'T-2009', planId: 'PL-3006', name: '螺钉锁附-M6工位', purpose: '正式采集',
    deviceTypeId: 'DTY-003', deviceInstanceId: 'INS-007', device: 'DEV-B01', method: 'VR遥操', scene: '工业装配',
    projectId: 'P-1003', projectName: '工业零件装配采集',
    collectTotal: 600, collectDone: 0, reviewDone: 0, acceptDone: 0, dataTotal: 0,
    status: '草稿', collectors: ['郑浩'], annotators: ['钱琳'],
    creator: '李明', layoutId: 5, createdAt: '2026-05-12 10:30:00', updatedAt: '2026-05-12 10:30:00',
  },
  {
    id: 'T-2010', planId: 'PL-3007', name: '线束插接采集', purpose: '正式采集',
    deviceTypeId: 'DTY-004', deviceInstanceId: 'INS-009', device: 'DEV-C01', method: 'VR遥操', scene: '工业装配',
    projectId: 'P-1003', projectName: '工业零件装配采集',
    collectTotal: 450, collectDone: 450, reviewDone: 318, acceptDone: 300, dataTotal: 450,
    status: '已归档', collectors: ['吴磊', '刘伟', '周杰'], annotators: ['钱琳'],
    creator: '李明', createdAt: '2026-04-25 09:50:00', updatedAt: '2026-05-30 18:20:00',
  },
  {
    id: 'T-2011', planId: 'PL-3009', name: '货架补货-饮料区', purpose: '正式采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-001', device: 'DEV-A01', method: 'VR遥操', scene: '零售货架',
    projectId: 'P-1004', projectName: '零售货架补货采集',
    collectTotal: 300, collectDone: 300, reviewDone: 300, acceptDone: 298, dataTotal: 300,
    status: '已归档', collectors: ['周杰'], annotators: ['孙丽'],
    creator: '周杰', createdAt: '2026-04-16 14:25:00', updatedAt: '2026-05-15 12:00:00',
  },
  {
    id: 'T-2012', planId: 'PL-3009', name: '货架补货-零食区', purpose: '试采集',
    deviceTypeId: 'DTY-001', deviceInstanceId: 'INS-002', device: 'DEV-A02', method: '外骨骼', scene: '零售货架',
    projectId: 'P-1004', projectName: '零售货架补货采集',
    collectTotal: 300, collectDone: 300, reviewDone: 300, acceptDone: 300, dataTotal: 300,
    status: '已归档', collectors: ['周杰'], annotators: ['孙丽'],
    creator: '周杰', createdAt: '2026-05-02 11:05:00', updatedAt: '2026-05-25 09:40:00',
  },
  {
    id: 'T-2013', planId: 'PL-3011', name: 'T恤折叠标准采集', purpose: '正式采集',
    deviceTypeId: 'DTY-005', deviceInstanceId: 'INS-010', device: 'DEV-E01', method: 'VR遥操', scene: '家庭场景',
    projectId: 'P-1005', projectName: '衣物折叠采集',
    collectTotal: 500, collectDone: 124, reviewDone: 60, acceptDone: 42, dataTotal: 124,
    status: '已发布', collectors: ['刘伟'], annotators: ['何敏'],
    creator: '王芳', createdAt: '2026-04-30 09:20:00', updatedAt: '2026-06-07 16:45:00',
  },
  {
    id: 'T-2014', planId: 'PL-3013', name: '餐具回收晚高峰采集', purpose: '质检回流',
    deviceTypeId: 'DTY-004', deviceInstanceId: 'INS-009', device: 'DEV-C01', method: 'VR遥操', scene: '餐饮服务',
    projectId: 'P-1006', projectName: '餐桌清理采集',
    collectTotal: 200, collectDone: 58, reviewDone: 20, acceptDone: 12, dataTotal: 58,
    status: '已发布', collectors: ['郑浩', '吴磊'], annotators: ['孙丽'],
    creator: '孙丽', createdAt: '2026-05-11 18:00:00', updatedAt: '2026-06-06 20:10:00',
  },
  {
    id: 'T-2016', planId: 'PL-3018', name: '双臂协作搬运-标准采集', purpose: '正式采集',
    deviceTypeId: 'DTY-005', method: 'VR遥操', scene: '工业装配',
    projectId: 'P-1007', projectName: '双臂协作搬运采集',
    collectTotal: 500, collectDone: 0, reviewDone: 0, acceptDone: 0, dataTotal: 0,
    status: '草稿', collectors: [], annotators: [],
    creator: '赵强', createdAt: '2026-05-18 10:30:00', updatedAt: '2026-05-18 10:30:00',
  },
  {
    id: 'T-2015', planId: 'PL-3017', name: '小物件精细抓取采集', purpose: '正式采集',
    deviceTypeId: 'DTY-002', deviceInstanceId: 'INS-006', device: 'DEV-F01', method: '外骨骼', scene: '办公整理',
    projectId: 'P-1008', projectName: '精细抓取操作采集',
    collectTotal: 800, collectDone: 215, reviewDone: 96, acceptDone: 72, dataTotal: 215,
    status: '已发布', collectors: ['吴磊'], annotators: ['钱琳', '孙丽'],
    creator: '李明', createdAt: '2026-05-27 10:00:00', updatedAt: '2026-06-10 15:30:00',
  },
]

export const taskStatusColor = {
  草稿: 'gray',
  已发布: 'blue',
  已归档: 'dark',
}

export const collectors = ['刘伟', '周杰', '吴磊', '郑浩']
export const reviewers  = ['孙丽', '何敏', '钱琳']

export const pct = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100))

/** 采集员、标注员均为人员数组（兼容历史单人字符串） */
export const toPeopleArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [])

export function peopleMatchQuery(value, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return toPeopleArray(value).some((name) => name.toLowerCase().includes(q))
}

export function getTaskCollectors(task) {
  return toPeopleArray(task?.collectors ?? task?.collector)
}

export function getTaskAnnotators(task) {
  return toPeopleArray(task?.annotators ?? task?.reviewer)
}

export function formatReviewer(value) {
  return toPeopleArray(value)[0] ?? '—'
}

export function formatCollectors(value) {
  return formatReviewer(value)
}

export function nextTaskId(taskList) {
  const nums = taskList.map((t) => parseInt(t.id.replace('T-', ''), 10) || 0)
  return `T-${Math.max(...nums, 2000) + 1}`
}

export function nowDatetime() {
  return nowDateTime()
}

function resolveTaskDeviceTypeId(task) {
  if (task?.deviceTypeId) return task.deviceTypeId
  const plan = getPlanById(task?.planId)
  return resolvePlanDeviceTypeId(plan)
}

function resolveCollectDeviceSn(deviceInstanceId, deviceCode) {
  let inst = null
  if (deviceInstanceId) {
    inst = getAllDeviceInstances().find((i) => i.id === deviceInstanceId)
  } else if (deviceCode && deviceCode !== '—') {
    inst = getAllDeviceInstances().find((i) => i.code === deviceCode || i.sn === deviceCode)
  }
  return inst?.sn ?? ''
}

/** 运行时解析设备类型名称与实例编号（device / deviceTypeName 为创建时快照，不随类型库变更） */
export function enrichTask(task) {
  if (!task) return null
  const deviceTypeId = resolveTaskDeviceTypeId(task)
  const deviceTypeName = task.deviceTypeName ?? (resolveDeviceTypeName(deviceTypeId) || '—')
  const robotBody = deviceTypeName

  let deviceInstanceId = task.deviceInstanceId ?? ''
  let device = task.device ?? '—'

  if (deviceInstanceId) {
    const inst = getAllDeviceInstances().find((i) => i.id === deviceInstanceId)
    if ((!device || device === '—') && inst?.code) device = inst.code
  } else if (device && device !== '—') {
    const inst = getAllDeviceInstances().find((i) => i.code === device || i.sn === device)
    if (inst) {
      deviceInstanceId = inst.id
      device = inst.code ?? device
    }
  }

  const deviceSn = resolveCollectDeviceSn(deviceInstanceId, device)

  const collectors = getTaskCollectors(task)
  const annotators = getTaskAnnotators(task)

  return {
    ...task,
    collectors,
    annotators,
    collector: collectors,
    reviewer: annotators,
    deviceTypeId,
    deviceTypeName,
    robotBody,
    device,
    deviceInstanceId,
    deviceSn,
  }
}

/** 同步更新全局任务 mock（项目人员分配、任务列表等共用） */
export function syncTasks(updater) {
  const next = typeof updater === 'function' ? updater([...tasks]) : updater
  tasks.splice(0, tasks.length, ...next)
  return [...tasks]
}

/** 设备实例是否已绑定采集任务（含 deviceInstanceId 及历史 device 编号匹配） */
export function isDeviceInstanceBoundToTask(instance) {
  if (!instance?.id) return false
  const { id, code, sn } = instance
  return tasks.some((t) => {
    if (t.deviceInstanceId === id) return true
    if (code && t.device === code) return true
    if (sn && t.device === sn) return true
    return false
  })
}

/** 设备类型是否已绑定采集任务（含 task.deviceTypeId 及采集方案关联解析） */
export function isDeviceTypeBoundToTask(deviceType) {
  if (!deviceType?.id) return false
  const typeId = deviceType.id
  return tasks.some((t) => resolveTaskDeviceTypeId(t) === typeId)
}

function tagFieldMatches(tag, fieldValue) {
  if (!tag || fieldValue == null || fieldValue === '') return false
  const values = [tag.name, tag.value].filter(Boolean)
  return values.includes(fieldValue)
}

function collectionMethodMatches(tag, method) {
  if (!method) return false
  if (tagFieldMatches(tag, method)) return true
  if (method === '外骨骼' && String(tag.name ?? '').includes('外骨骼')) return true
  return false
}

/** 任务用途标签是否已绑定采集任务 */
export function isTaskPurposeTagBoundToTask(tag) {
  return tasks.some((t) => tagFieldMatches(tag, t.purpose))
}

/** 采集方式标签是否已绑定采集任务（含任务与方案上的 method） */
export function isCollectionMethodTagBoundToTask(tag) {
  return tasks.some((t) => {
    if (collectionMethodMatches(tag, t.method)) return true
    const plan = getPlanById(t.planId)
    return plan && collectionMethodMatches(tag, plan.method)
  })
}

/** 原子技能标签是否已绑定采集任务（方案步骤引用） */
export function isAtomicSkillTagBoundToTask(tag) {
  const keys = [tag?.name, tag?.value].filter(Boolean)
  if (!keys.length) return false
  return tasks.some((t) => {
    const plan = getPlanById(t.planId)
    return plan?.steps?.some((step) => keys.includes(step.atomicSkill))
  })
}

/** 本体机型标签是否已绑定采集任务（经设备类型间接关联） */
export function isBodyTypeTagBoundToTask(tag) {
  const bodyName = tag?.name
  if (!bodyName) return false
  const typeIds = getAllDeviceTypes()
    .filter((dt) => dt.body === bodyName)
    .map((dt) => dt.id)
  if (!typeIds.length) return false
  return tasks.some((t) => typeIds.includes(resolveTaskDeviceTypeId(t)))
}

/** 末端类型标签是否已绑定采集任务（经设备类型间接关联） */
export function isEndTypeTagBoundToTask(tag) {
  const endName = tag?.name
  if (!endName) return false
  const typeIds = getAllDeviceTypes()
    .filter((dt) => dt.leftEnd === endName || dt.rightEnd === endName)
    .map((dt) => dt.id)
  if (!typeIds.length) return false
  return tasks.some((t) => typeIds.includes(resolveTaskDeviceTypeId(t)))
}

/** 场景标签（一级）是否已绑定采集任务（方案 scenePath 引用） */
export function isSceneTypeBoundToTask(scene) {
  if (!scene?.id) return false
  return tasks.some((t) => {
    const plan = getPlanById(t.planId)
    const scenePath = plan?.scenePath
    return scenePath?.sceneId === scene.id
  })
}

export function getTaskById(id) {
  const raw = tasks.find((t) => t.id === id)
  return raw ? enrichTask(raw) : null
}

for (const task of tasks) {
  const typeId = resolveTaskDeviceTypeId(task)
  if (!task.deviceTypeName) {
    task.deviceTypeName = resolveDeviceTypeName(typeId) || '—'
  } else {
    task.deviceTypeName = task.deviceTypeName.replace(/AlphaBotX/g, 'AlphaBot1')
  }

  if (task.deviceInstanceId) {
    const inst = getAllDeviceInstances().find((i) => i.id === task.deviceInstanceId)
    if (inst) {
      task.device = inst.code
      if (inst.typeId !== typeId) {
        task.deviceTypeId = inst.typeId
        task.deviceTypeName = resolveDeviceTypeName(inst.typeId) || '—'
      }
    }
  } else if (task.device && task.device !== '—') {
    const inst = getAllDeviceInstances().find((i) => i.code === task.device || i.sn === task.device)
    if (inst) {
      task.deviceInstanceId = inst.id
      task.device = inst.code
      if (inst.typeId !== typeId) {
        task.deviceTypeId = inst.typeId
        task.deviceTypeName = resolveDeviceTypeName(inst.typeId) || '—'
      }
    }
  }
}
