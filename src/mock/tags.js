/** 标签管理 mock + runtime store（采集方案 / 任务 / 审核工作台共用） */

const ts = (d) => `${d} 00:00:00`

export const APPLICATION_SCOPE_OPTIONS = ['全局', '通过', '驳回']

export const auditReviewTagTreeSeed = [
  {
    id: 'AT-G-001',
    name: '质量评分',
    description: '对采集轨迹整体质量的分档评价',
    applicationScope: '通过',
    creator: '孙丽',
    createdAt: ts('2026-04-01'),
    updatedAt: ts('2026-04-01'),
    children: [
      { id: 'AT-001', name: '高质量', value: '高质量', description: '动作完整、轨迹流畅、无明显异常', creator: '孙丽', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
      { id: 'AT-002', name: '中质量', value: '中质量', description: '整体可用，存在轻微瑕疵', creator: '孙丽', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
      { id: 'AT-003', name: '低质量', value: '低质量', description: '问题较多，不建议纳入正式数据集', creator: '何敏', createdAt: ts('2026-04-05'), updatedAt: ts('2026-04-05') },
    ],
  },
  {
    id: 'AT-G-002',
    name: '问题标签',
    description: '标注过程中发现的具体问题类型',
    applicationScope: '驳回',
    creator: '孙丽',
    createdAt: ts('2026-04-01'),
    updatedAt: ts('2026-04-01'),
    children: [
      { id: 'AT-101', name: '未完成任务要求', value: '未完成任务要求', description: '关键步骤缺失或未达任务目标', creator: '孙丽', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
      { id: 'AT-102', name: '机械臂卡顿', value: '机械臂卡顿', description: '运动过程中出现明显停顿或抖动', creator: '孙丽', createdAt: ts('2026-04-02'), updatedAt: ts('2026-04-02') },
      { id: 'AT-103', name: '操作停顿', value: '操作停顿', description: '步骤衔接处长时间静止', creator: '钱琳', createdAt: ts('2026-04-03'), updatedAt: ts('2026-04-03') },
      { id: 'AT-104', name: '剧烈碰撞', value: '剧烈碰撞', description: '末端或物体发生明显碰撞', creator: '孙丽', createdAt: ts('2026-04-04'), updatedAt: ts('2026-04-04') },
      { id: 'AT-105', name: '夹爪开合严重不匹配', value: '夹爪开合严重不匹配', description: '夹爪动作与抓取意图不符', creator: '何敏', createdAt: ts('2026-04-05'), updatedAt: ts('2026-04-05') },
      { id: 'AT-106', name: '夹爪延迟过多', value: '夹爪延迟过多', description: '开合指令相对轨迹明显滞后', creator: '钱琳', createdAt: ts('2026-04-06'), updatedAt: ts('2026-04-06') },
      { id: 'AT-107', name: '夹爪值异常波动', value: '夹爪值异常波动', description: '夹爪开合度信号异常跳变', creator: '孙丽', createdAt: ts('2026-04-07'), updatedAt: ts('2026-04-07') },
      { id: 'AT-108', name: '帧率检查不合格', value: '帧率检查不合格', description: '多模态帧率不一致或低于阈值', creator: '钱琳', createdAt: ts('2026-04-08'), updatedAt: ts('2026-04-08') },
    ],
  },
  {
    id: 'AT-G-003',
    name: '通用备注',
    description: '适用于任意标注结论的补充说明标签',
    applicationScope: '全局',
    creator: '钱琳',
    createdAt: ts('2026-04-10'),
    updatedAt: ts('2026-04-10'),
    children: [
      { id: 'AT-201', name: '需复核', value: '需复核', description: '建议二次人工复核', creator: '钱琳', createdAt: ts('2026-04-10'), updatedAt: ts('2026-04-10') },
      { id: 'AT-202', name: '边界模糊', value: '边界模糊', description: '分段边界存在争议', creator: '钱琳', createdAt: ts('2026-04-11'), updatedAt: ts('2026-04-11') },
    ],
  },
]

export const sceneTypeTreeSeed = [
  {
    id: 'SC-001',
    name: '家居服务',
    value: 'home_service',
    description: '家庭室内环境下的机器人服务采集场景',
    creator: '李明',
    createdAt: ts('2026-03-12'),
    updatedAt: ts('2026-03-12'),
    subScenes: [
      {
        id: 'SC-001-01',
        name: '客厅',
        creator: '李明',
        createdAt: ts('2026-03-12'),
        updatedAt: ts('2026-03-12'),
        tags: [
          { id: 'CT-201-01', name: '杂物整理', creator: '李明', createdAt: ts('2026-03-12'), updatedAt: ts('2026-03-12') },
          { id: 'CT-201-02', name: '地面清洁', creator: '李明', createdAt: ts('2026-03-14'), updatedAt: ts('2026-03-14') },
        ],
      },
      {
        id: 'SC-001-02',
        name: '卧室',
        creator: '周杰',
        createdAt: ts('2026-03-15'),
        updatedAt: ts('2026-03-15'),
        tags: [
          { id: 'CT-201-03', name: '衣物折叠', creator: '周杰', createdAt: ts('2026-03-15'), updatedAt: ts('2026-03-15') },
        ],
      },
    ],
  },
  {
    id: 'SC-002',
    name: '工业服务',
    value: 'industrial_service',
    description: '工厂或仓库等工业环境下的操作采集场景',
    creator: '李明',
    createdAt: ts('2026-03-12'),
    updatedAt: ts('2026-04-15'),
    subScenes: [
      {
        id: 'SC-002-01',
        name: '装配工位',
        creator: '李明',
        createdAt: ts('2026-03-12'),
        updatedAt: ts('2026-03-12'),
        tags: [
          { id: 'CT-202-01', name: '螺钉锁附', creator: '李明', createdAt: ts('2026-03-12'), updatedAt: ts('2026-03-12') },
          { id: 'CT-202-02', name: '线束插接', creator: '吴磊', createdAt: ts('2026-03-18'), updatedAt: ts('2026-04-01') },
        ],
      },
      {
        id: 'SC-002-02',
        name: '仓储物流',
        creator: '郑浩',
        createdAt: ts('2026-04-02'),
        updatedAt: ts('2026-04-15'),
        tags: [
          { id: 'CT-202-03', name: '货架补货', creator: '郑浩', createdAt: ts('2026-04-02'), updatedAt: ts('2026-04-15') },
        ],
      },
    ],
  },
  {
    id: 'SC-003',
    name: '公共服务',
    value: 'public_service',
    description: '商场、餐厅等公共场所服务场景',
    creator: '王芳',
    createdAt: ts('2026-04-02'),
    updatedAt: ts('2026-04-02'),
    subScenes: [
      {
        id: 'SC-003-01',
        name: '餐饮前台',
        creator: '王芳',
        createdAt: ts('2026-04-02'),
        updatedAt: ts('2026-04-02'),
        tags: [
          { id: 'CT-203-01', name: '餐具回收', creator: '王芳', createdAt: ts('2026-04-02'), updatedAt: ts('2026-04-02') },
        ],
      },
      {
        id: 'SC-003-02',
        name: '商超货架',
        creator: '孙丽',
        createdAt: ts('2026-04-05'),
        updatedAt: ts('2026-04-08'),
        tags: [
          { id: 'CT-203-02', name: '商品上架', creator: '孙丽', createdAt: ts('2026-04-05'), updatedAt: ts('2026-04-08') },
          { id: 'CT-203-03', name: '导购指引', creator: '王芳', createdAt: ts('2026-04-10'), updatedAt: ts('2026-04-10') },
        ],
      },
    ],
  },
]

const atomicSkillSeed = [
  { id: 'SK-001', name: 'close', value: 'close', description: '关闭动作，如关门、关抽屉', creator: '刘伟', createdAt: ts('2026-03-18'), updatedAt: ts('2026-03-18') },
  { id: 'SK-002', name: 'open', value: 'open', description: '打开动作，如开门、开抽屉', creator: '刘伟', createdAt: ts('2026-03-18'), updatedAt: ts('2026-03-18') },
  { id: 'SK-003', name: 'press', value: 'press', description: '按压动作，如按按钮、按开关', creator: '刘伟', createdAt: ts('2026-03-20'), updatedAt: ts('2026-03-20') },
  { id: 'SK-004', name: 'grasp', value: 'grasp', description: '抓取动作，手爪或灵巧手夹持物体', creator: '周杰', createdAt: ts('2026-03-22'), updatedAt: ts('2026-04-30') },
  { id: 'SK-005', name: 'push', value: 'push', description: '推送动作，将物体向前推移', creator: '周杰', createdAt: ts('2026-03-22'), updatedAt: ts('2026-03-22') },
  { id: 'SK-006', name: 'pull', value: 'pull', description: '拉取动作，将物体向后拉动', creator: '周杰', createdAt: ts('2026-03-22'), updatedAt: ts('2026-03-22') },
  { id: 'SK-007', name: 'move', value: 'move', description: '移动动作，将物体搬运至目标位置', creator: '刘伟', createdAt: ts('2026-04-05'), updatedAt: ts('2026-05-08') },
  { id: 'SK-008', name: 'place', value: 'place', description: '放置动作，将物体放到指定位置', creator: '刘伟', createdAt: ts('2026-04-08'), updatedAt: ts('2026-04-08') },
  { id: 'SK-009', name: 'pick', value: 'pick', description: '拾取动作，从表面拿起物体', creator: '周杰', createdAt: ts('2026-04-10'), updatedAt: ts('2026-04-10') },
]

const collectionMethodSeed = [
  { id: 'CM-001', name: '算法采集', value: '5', description: '基于算法自动生成或补全轨迹数据', creator: '张华', createdAt: ts('2026-03-15'), updatedAt: ts('2026-03-15') },
  { id: 'CM-002', name: '便携设备遥操', value: '4', description: '使用便携遥操设备进行示教采集', creator: '张华', createdAt: ts('2026-03-16'), updatedAt: ts('2026-03-16') },
  { id: 'CM-003', name: 'VR遥操', value: '3', description: '使用 VR 头显进行遥操作数据采集', creator: '张华', createdAt: ts('2026-03-15'), updatedAt: ts('2026-03-15') },
  { id: 'CM-004', name: '同构外骨骼', value: '2', description: '穿戴同构外骨骼进行示教数据采集', creator: '张华', createdAt: ts('2026-03-17'), updatedAt: ts('2026-05-10') },
  { id: 'CM-005', name: '自定义采集', value: '1', description: '项目自定义采集方式', creator: '李明', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
]

const taskPurposeSeed = [
  { id: 'TP-001', name: '正式采集', value: '正式采集', description: '正式采集任务，计入统计和质检流程', creator: '张华', createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
  { id: 'TP-002', name: '试采集', value: '试采集', description: '试验性采集，数据仅供内部参考', creator: '张华', createdAt: ts('2026-03-10'), updatedAt: ts('2026-04-01') },
]

const bodyTypeSeed = [
  { id: 'BT-001', name: 'AlphaBot2', value: '2', description: 'AlphaLoop 第二代双臂协作机器人本体', creator: '张华', createdAt: ts('2026-03-08'), updatedAt: ts('2026-05-20') },
  { id: 'BT-002', name: 'AlphaBot1', value: '1', description: 'AlphaLoop 自研单臂机器人本体，适配多种末端', creator: '张华', createdAt: ts('2026-03-08'), updatedAt: ts('2026-03-08') },
]

const endTypeSeed = [
  { id: 'ET-201', name: '因时·RH56DFX 灵巧手', value: '因时·RH56DFX 灵巧手', description: '因时 RH56DFX 灵巧手，适用于精细操作与触觉采集', creator: '李明', createdAt: ts('2026-03-08'), updatedAt: ts('2026-03-08') },
  { id: 'ET-202', name: '因时·RH56BFX 灵巧手', value: '因时·RH56BFX 灵巧手', description: '因时 RH56BFX 灵巧手，双臂协作场景常用型号', creator: '李明', createdAt: ts('2026-03-08'), updatedAt: ts('2026-04-10') },
  { id: 'ET-203', name: '因时·EG2-4B 夹爪', value: '因时·EG2-4B 夹爪', description: '因时 EG2-4B 平行夹爪，适合规则形状物体抓取', creator: '王芳', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
  { id: 'ET-204', name: '因时·EG2-4C 夹爪', value: '因时·EG2-4C 夹爪', description: '因时 EG2-4C 平行夹爪，轻量高速抓取工况', creator: '王芳', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
]

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

let auditReviewTagTreeStore = cloneDeep(auditReviewTagTreeSeed)
let bodyTypeTagStore = cloneDeep(bodyTypeSeed)
let endTypeTagStore = cloneDeep(endTypeSeed)

/** 已被数据条目勾选的审核模板子标签 ID（mock） */
const usedAuditTagChildIds = new Set(['AT-001', 'AT-003', 'AT-102', 'AT-104'])

const trialTemplateTagTree = [
  {
    id: 'AT-G-T01',
    name: '试采集质量',
    description: '试采集任务质量快速评估',
    applicationScope: '通过',
    creator: '何敏',
    createdAt: ts('2026-05-10'),
    updatedAt: ts('2026-05-10'),
    children: [
      { id: 'AT-T01', name: '可用', value: '可用', description: '可用于内部参考', creator: '何敏', createdAt: ts('2026-05-10'), updatedAt: ts('2026-05-10') },
      { id: 'AT-T02', name: '不可用', value: '不可用', description: '不建议继续使用', creator: '何敏', createdAt: ts('2026-05-10'), updatedAt: ts('2026-05-10') },
    ],
  },
  {
    id: 'AT-G-T02',
    name: '试采集问题',
    description: '试采集驳回常用问题',
    applicationScope: '驳回',
    creator: '何敏',
    createdAt: ts('2026-05-10'),
    updatedAt: ts('2026-05-10'),
    children: [
      { id: 'AT-T03', name: '轨迹不完整', value: '轨迹不完整', description: '试采阶段轨迹缺失', creator: '何敏', createdAt: ts('2026-05-10'), updatedAt: ts('2026-05-10') },
    ],
  },
]

export const auditTemplateSeed = [
  {
    id: 'ATM-001',
    name: '标准标注模板',
    description: '适用于常规采集任务的标注与验收标签配置',
    taskCount: 3,
    creator: '孙丽',
    createdAt: ts('2026-04-01'),
    updatedAt: ts('2026-04-15'),
    deleted: false,
    tagTree: cloneDeep(auditReviewTagTreeSeed),
  },
  {
    id: 'ATM-002',
    name: '试采集专用模板',
    description: '试采集任务使用的精简标签模板',
    taskCount: 0,
    creator: '何敏',
    createdAt: ts('2026-05-10'),
    updatedAt: ts('2026-05-10'),
    deleted: false,
    tagTree: cloneDeep(trialTemplateTagTree),
  },
  {
    id: 'ATM-003',
    name: '工业场景模板',
    description: '工业分拣与装配场景标注标签',
    taskCount: 5,
    creator: '钱琳',
    createdAt: ts('2026-04-20'),
    updatedAt: ts('2026-06-01'),
    deleted: false,
    tagTree: cloneDeep(auditReviewTagTreeSeed.filter((g) => g.id !== 'AT-G-003')),
  },
]

let auditTemplateStore = cloneDeep(auditTemplateSeed)
const auditTemplateRuntimePatches = {}

export function isAuditTagChildInUse(childId) {
  return usedAuditTagChildIds.has(childId)
}

export function getAuditTemplates({ includeDeleted = false } = {}) {
  return auditTemplateStore
    .map((t) => ({ ...t, ...(auditTemplateRuntimePatches[t.id] ?? {}) }))
    .filter((t) => includeDeleted || !t.deleted)
}

export function getAuditTemplateById(id) {
  const base = auditTemplateStore.find((t) => t.id === id)
  if (!base) return null
  return { ...base, ...(auditTemplateRuntimePatches[id] ?? {}) }
}

export function isAuditTemplateNameTaken(name, excludeId = null) {
  const trimmed = name.trim()
  return getAuditTemplates().some((t) => t.id !== excludeId && t.name === trimmed)
}

export function upsertAuditTemplate(template) {
  const idx = auditTemplateStore.findIndex((t) => t.id === template.id)
  if (idx >= 0) auditTemplateStore[idx] = { ...auditTemplateStore[idx], ...template }
  else auditTemplateStore.unshift(template)
  auditTemplateRuntimePatches[template.id] = {
    ...(auditTemplateRuntimePatches[template.id] ?? {}),
    ...template,
  }
  return getAuditTemplateById(template.id)
}

export function softDeleteAuditTemplate(id) {
  return upsertAuditTemplate({ ...getAuditTemplateById(id), deleted: true })
}

export function saveAuditTemplateTagTree(templateId, tagTree) {
  const tpl = getAuditTemplateById(templateId)
  if (!tpl) return null
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return upsertAuditTemplate({ ...tpl, tagTree, updatedAt: ts })
}

export function nextAuditTemplateId() {
  const nums = getAuditTemplates({ includeDeleted: true })
    .map((t) => parseInt(String(t.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `ATM-${String(next).padStart(3, '0')}`
}

export function getBodyTypeTags() {
  return bodyTypeTagStore
}

export function setBodyTypeTags(next) {
  bodyTypeTagStore = next
}

export function getEndTypeTags() {
  return endTypeTagStore
}

export function setEndTypeTags(next) {
  endTypeTagStore = next
}

/** 设备类型弹窗/筛选：本体机型选项名 */
export function getBodyTypeTagNames() {
  return getBodyTypeTags().map((t) => t.name)
}

/** 设备类型弹窗/筛选：末端类型选项名 */
export function getEndTypeTagNames() {
  return getEndTypeTags().map((t) => t.name)
}
let sceneTypeTreeStore = cloneDeep(sceneTypeTreeSeed)
let atomicSkillStore = cloneDeep(atomicSkillSeed)
let collectionMethodStore = cloneDeep(collectionMethodSeed)
let taskPurposeStore = cloneDeep(taskPurposeSeed)

export function getAuditReviewTagTree() {
  const defaultTpl = getAuditTemplateById('ATM-001')
  return defaultTpl?.tagTree ?? auditReviewTagTreeStore
}

export function setAuditReviewTagTree(next) {
  auditReviewTagTreeStore = next
  const tpl = getAuditTemplateById('ATM-001')
  if (tpl) upsertAuditTemplate({ ...tpl, tagTree: next })
}

export function getSceneTypeTree() {
  return sceneTypeTreeStore
}

export function setSceneTypeTree(next) {
  sceneTypeTreeStore = next
}

export function getAtomicSkillTags() {
  return atomicSkillStore
}

export function setAtomicSkillTags(next) {
  atomicSkillStore = next
}

export function getCollectionMethodTags() {
  return collectionMethodStore
}

export function setCollectionMethodTags(next) {
  collectionMethodStore = next
}

export function getTaskPurposeTags() {
  return taskPurposeStore
}

export function setTaskPurposeTags(next) {
  taskPurposeStore = next
}

/** @deprecated 请使用 getSceneTypeTree() */
export const sceneTypeTree = sceneTypeTreeSeed

/** @deprecated 请使用 getTaskPurposeTags() */
export const taskTypeTags = taskPurposeSeed

export function getAuditReviewTagGroups() {
  return getAuditReviewTagTree().map((group) => ({
    groupName: group.name,
    tags: (group.children ?? []).map((c) => c.name),
  }))
}

export function getAuditReviewTagLeaves() {
  return getAuditReviewTagTree().flatMap((g) => g.children ?? [])
}

/** @deprecated 请使用 getAuditReviewTagLeaves() */
export const auditReviewTags = getAuditReviewTagLeaves()

export const collectTagGroups = {
  taskType: taskPurposeSeed,
  collectionMethod: collectionMethodSeed,
  atomicSkill: atomicSkillSeed,
}
