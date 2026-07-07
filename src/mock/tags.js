/* ──────────────────────────────────────────
   采集标签
────────────────────────────────────────── */
export const taskTypeTags = [
  { id: 'CT-101', name: '正式采集', description: '正式采集任务，计入统计和质检流程',                              creator: '张华', createdAt: '2026-03-10', updatedAt: '2026-03-10' },
  { id: 'CT-102', name: '试采集',   description: '试验性采集，数据仅供内部参考，不计入正式指标',                  creator: '张华', createdAt: '2026-03-10', updatedAt: '2026-04-01' },
]

/** 场景类型：三层树 场景 → 子场景 → 标签（仅一级场景有 description） */
export const sceneTypeTree = [
  {
    id: 'SC-001',
    name: '家居服务',
    description: '家庭室内环境下的机器人服务采集场景',
    creator: '李明',
    createdAt: '2026-03-12',
    updatedAt: '2026-03-12',
    subScenes: [
      {
        id: 'SC-001-01',
        name: '客厅',
        creator: '李明',
        createdAt: '2026-03-12',
        updatedAt: '2026-03-12',
        tags: [
          { id: 'CT-201-01', name: '杂物整理', creator: '李明', createdAt: '2026-03-12', updatedAt: '2026-03-12' },
          { id: 'CT-201-02', name: '地面清洁', creator: '李明', createdAt: '2026-03-14', updatedAt: '2026-03-14' },
        ],
      },
      {
        id: 'SC-001-02',
        name: '卧室',
        creator: '周杰',
        createdAt: '2026-03-15',
        updatedAt: '2026-03-15',
        tags: [
          { id: 'CT-201-03', name: '衣物折叠', creator: '周杰', createdAt: '2026-03-15', updatedAt: '2026-03-15' },
        ],
      },
    ],
  },
  {
    id: 'SC-002',
    name: '工业服务',
    description: '工厂或仓库等工业环境下的操作采集场景',
    creator: '李明',
    createdAt: '2026-03-12',
    updatedAt: '2026-04-15',
    subScenes: [
      {
        id: 'SC-002-01',
        name: '装配工位',
        creator: '李明',
        createdAt: '2026-03-12',
        updatedAt: '2026-03-12',
        tags: [
          { id: 'CT-202-01', name: '螺钉锁附', creator: '李明', createdAt: '2026-03-12', updatedAt: '2026-03-12' },
          { id: 'CT-202-02', name: '线束插接', creator: '吴磊', createdAt: '2026-03-18', updatedAt: '2026-04-01' },
        ],
      },
      {
        id: 'SC-002-02',
        name: '仓储物流',
        creator: '郑浩',
        createdAt: '2026-04-02',
        updatedAt: '2026-04-15',
        tags: [
          { id: 'CT-202-03', name: '货架补货', creator: '郑浩', createdAt: '2026-04-02', updatedAt: '2026-04-15' },
        ],
      },
    ],
  },
  {
    id: 'SC-003',
    name: '公共服务',
    description: '商场、餐厅等公共场所服务场景',
    creator: '王芳',
    createdAt: '2026-04-02',
    updatedAt: '2026-04-02',
    subScenes: [
      {
        id: 'SC-003-01',
        name: '餐饮前台',
        creator: '王芳',
        createdAt: '2026-04-02',
        updatedAt: '2026-04-02',
        tags: [
          { id: 'CT-203-01', name: '餐具回收', creator: '王芳', createdAt: '2026-04-02', updatedAt: '2026-04-02' },
        ],
      },
      {
        id: 'SC-003-02',
        name: '商超货架',
        creator: '孙丽',
        createdAt: '2026-04-05',
        updatedAt: '2026-04-08',
        tags: [
          { id: 'CT-203-02', name: '商品上架', creator: '孙丽', createdAt: '2026-04-05', updatedAt: '2026-04-08' },
          { id: 'CT-203-03', name: '导购指引', creator: '王芳', createdAt: '2026-04-10', updatedAt: '2026-04-10' },
        ],
      },
    ],
  },
]

export const collectionMethodTags = [
  { id: 'CT-301', name: 'VR遥操', description: '使用 VR 头显进行遥操作数据采集',                creator: '张华', createdAt: '2026-03-15', updatedAt: '2026-03-15' },
  { id: 'CT-302', name: '外骨骼',   description: '穿戴外骨骼同构臂进行示教数据采集',           creator: '张华', createdAt: '2026-03-15', updatedAt: '2026-05-10' },
]

export const atomicSkillTags = [
  { id: 'CT-401', name: 'close', description: '关闭动作，如关门、关抽屉',           creator: '刘伟', createdAt: '2026-03-18', updatedAt: '2026-03-18' },
  { id: 'CT-402', name: 'open',  description: '打开动作，如开门、开抽屉',           creator: '刘伟', createdAt: '2026-03-18', updatedAt: '2026-03-18' },
  { id: 'CT-403', name: 'press', description: '按压动作，如按按钮、按开关',         creator: '刘伟', createdAt: '2026-03-20', updatedAt: '2026-03-20' },
  { id: 'CT-404', name: 'grasp', description: '抓取动作，手爪或灵巧手夹持物体',     creator: '周杰', createdAt: '2026-03-22', updatedAt: '2026-04-30' },
  { id: 'CT-405', name: 'push',  description: '推送动作，将物体向前推移',           creator: '周杰', createdAt: '2026-03-22', updatedAt: '2026-03-22' },
  { id: 'CT-406', name: 'pull',  description: '拉取动作，将物体向后拉动',           creator: '周杰', createdAt: '2026-03-22', updatedAt: '2026-03-22' },
  { id: 'CT-407', name: 'move',  description: '移动动作，将物体搬运至目标位置',     creator: '刘伟', createdAt: '2026-04-05', updatedAt: '2026-05-08' },
]

/** 审核标签（TODO：与标签管理·审核标签 Tab 运行时 store 联动） */
export const auditReviewTags = [
  { id: 'AT-001', name: '动作不完整', description: '关键步骤缺失或时长过短', creator: '孙丽', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
  { id: 'AT-002', name: '碰撞风险',   description: '轨迹存在碰撞或近距擦碰', creator: '孙丽', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
  { id: 'AT-003', name: '动作流畅',   description: '整体轨迹连贯自然',       creator: '何敏', createdAt: '2026-04-05', updatedAt: '2026-04-05' },
  { id: 'AT-004', name: '标定偏差',   description: '相机或关节标定疑似偏移', creator: '钱琳', createdAt: '2026-04-10', updatedAt: '2026-04-10' },
  { id: 'AT-005', name: '场景不符',   description: '与任务指令或初始状态不符', creator: '孙丽', createdAt: '2026-04-12', updatedAt: '2026-04-12' },
]

/* ──────────────────────────────────────────
   设备标签
────────────────────────────────────────── */
export const bodyTypeTags = [
  { id: 'DT-101', name: 'AlphaBot2',  description: 'AlphaLoop 第二代双臂协作机器人本体',             creator: '张华', createdAt: '2026-03-08', updatedAt: '2026-05-20' },
  { id: 'DT-102', name: 'AlphaBotX',  description: 'AlphaLoop 自研单臂机器人本体，适配多种末端',     creator: '张华', createdAt: '2026-03-08', updatedAt: '2026-03-08' },
]

export const endTypeTags = [
  { id: 'DT-201', name: '因时·RH56DFX 灵巧手', description: '因时 RH56DFX 灵巧手，适用于精细操作与触觉采集', creator: '李明', createdAt: '2026-03-08', updatedAt: '2026-03-08' },
  { id: 'DT-202', name: '因时·RH56BFX 灵巧手', description: '因时 RH56BFX 灵巧手，双臂协作场景常用型号',       creator: '李明', createdAt: '2026-03-08', updatedAt: '2026-04-10' },
  { id: 'DT-203', name: '因时·EG2-4B 夹爪',  description: '因时 EG2-4B 平行夹爪，适合规则形状物体抓取',     creator: '王芳', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
  { id: 'DT-204', name: '因时·EG2-4C 夹爪',  description: '因时 EG2-4C 平行夹爪，轻量高速抓取工位',         creator: '王芳', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
]

export const cameraTypeTags = [
  { id: 'DT-301', name: 'RGB相机',   description: '普通彩色图像采集相机，提供 1080p 视频流',          creator: '张华', createdAt: '2026-03-10', updatedAt: '2026-03-10' },
  { id: 'DT-302', name: '深度相机',  description: '结构光/ToF 深度相机，提供点云与深度图',            creator: '张华', createdAt: '2026-03-10', updatedAt: '2026-05-01' },
]

export const lidarTypeTags = [
  { id: 'DT-303', name: '激光雷达',  description: '机械旋转式激光雷达，用于环境建图与避障',           creator: '李明',   createdAt: '2026-03-15', updatedAt: '2026-03-15' },
]

/* ──────────────────────────────────────────
   便捷聚合导出
────────────────────────────────────────── */
export const collectTagGroups = {
  taskType:         taskTypeTags,
  collectionMethod: collectionMethodTags,
  atomicSkill:      atomicSkillTags,
}

export const deviceTagGroups = {
  bodyType:    bodyTypeTags,
  endType:     endTypeTags,
  cameraType:  cameraTypeTags,
  lidarType:   lidarTypeTags,
}
