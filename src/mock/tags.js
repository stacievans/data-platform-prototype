/** 标签管理 mock + runtime store（采集方案 / 任务 / 审核工作台共用） */

const ts = (d) => `${d} 00:00:00`

export const auditReviewTagTreeSeed = [
  {
    id: 'AT-G-001',
    name: '质量评分',
    description: '对采集轨迹整体质量的分档评价',
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
]

export const sceneTypeTreeSeed = [
  {
    id: 'SC-001',
    name: '家居服务',
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

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

let auditReviewTagTreeStore = cloneDeep(auditReviewTagTreeSeed)
let sceneTypeTreeStore = cloneDeep(sceneTypeTreeSeed)
let atomicSkillStore = cloneDeep(atomicSkillSeed)
let collectionMethodStore = cloneDeep(collectionMethodSeed)
let taskPurposeStore = cloneDeep(taskPurposeSeed)

export function getAuditReviewTagTree() {
  return auditReviewTagTreeStore
}

export function setAuditReviewTagTree(next) {
  auditReviewTagTreeStore = next
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

/** 设备形态选项（设备管理维护，非标签管理 Tab） */
export const bodyTypeTags = [
  { id: 'DT-101', name: 'AlphaBot2', description: 'AlphaLoop 第二代双臂协作机器人本体', creator: '张华', createdAt: ts('2026-03-08'), updatedAt: ts('2026-05-20') },
  { id: 'DT-102', name: 'AlphaBotX', description: 'AlphaLoop 自研单臂机器人本体，适配多种末端', creator: '张华', createdAt: ts('2026-03-08'), updatedAt: ts('2026-03-08') },
]

export const endTypeTags = [
  { id: 'DT-201', name: '因时·RH56DFX 灵巧手', description: '因时 RH56DFX 灵巧手，适用于精细操作与触觉采集', creator: '李明', createdAt: ts('2026-03-08'), updatedAt: ts('2026-03-08') },
  { id: 'DT-202', name: '因时·RH56BFX 灵巧手', description: '因时 RH56BFX 灵巧手，双臂协作场景常用型号', creator: '李明', createdAt: ts('2026-03-08'), updatedAt: ts('2026-04-10') },
  { id: 'DT-203', name: '因时·EG2-4B 夹爪', description: '因时 EG2-4B 平行夹爪，适合规则形状物体抓取', creator: '王芳', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
  { id: 'DT-204', name: '因时·EG2-4C 夹爪', description: '因时 EG2-4C 平行夹爪，轻量高速抓取工况', creator: '王芳', createdAt: ts('2026-04-01'), updatedAt: ts('2026-04-01') },
]
