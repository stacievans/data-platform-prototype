// 采集方案
export const plans = [
  {
    id: 'PL-3001', projectId: 'P-1001', name: '客厅杂物分拣方案',
    robotBody: 'AlphaBot-1 双夹爪', method: 'VR遥操',
    initialScene: '桌面杂物随机摆放，收纳筐置于桌右侧，确保筐口朝上',
    durationMin: 30, durationMax: 60,
    steps: [
      { description: '定位目标杂物', atomicSkill: 'grasp', duration: 5, deviation: 1 },
      { description: '移动末端至抓取位', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '抓取杂物', atomicSkill: 'grasp', duration: 8, deviation: 2 },
      { description: '移动至收纳筐上方', atomicSkill: 'move', duration: 7, deviation: 1 },
      { description: '释放物品入筐', atomicSkill: 'open', duration: 4, deviation: 1 },
      { description: '返回初始姿态', atomicSkill: 'move', duration: 5, deviation: 1 },
    ],
    taskCount: 2, status: '已发布',
  },
  {
    id: 'PL-3002', projectId: 'P-1001', name: '卧室物品归位方案',
    robotBody: 'AlphaBot-1 双灵巧手', method: 'VR遥操',
    initialScene: '卧室床头柜物品散落，目标归位区已用胶带标记',
    durationMin: 40, durationMax: 90,
    steps: [
      { description: '识别并接近目标物品', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '抓取第一件物品', atomicSkill: 'grasp', duration: 8, deviation: 2 },
      { description: '提起物品', atomicSkill: 'pull', duration: 5, deviation: 1 },
      { description: '移动至归位区上方', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '放下物品', atomicSkill: 'open', duration: 4, deviation: 1 },
      { description: '返回至下一目标位置', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '抓取第二件物品', atomicSkill: 'grasp', duration: 8, deviation: 2 },
      { description: '归位放下', atomicSkill: 'open', duration: 4, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3003', projectId: 'P-1001', name: '玩具收纳方案',
    robotBody: 'AlphaBot-1 双夹爪', method: '外骨骼',
    initialScene: '玩具散落地面，收纳箱开盖置于角落，操作区域无遮挡',
    durationMin: 25, durationMax: 50,
    steps: [
      { description: '接近玩具', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '抓起玩具', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '携玩具移向收纳箱', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '投入箱中', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '返回起始位置', atomicSkill: 'move', duration: 5, deviation: 1 },
    ],
    taskCount: 1, status: '草稿',
  },
  {
    id: 'PL-3004', projectId: 'P-1002', name: '蔬菜切配方案',
    robotBody: 'AlphaBot-2 左灵巧手右夹爪', method: 'VR遥操',
    initialScene: '菜板固定于操作台，蔬菜预处理完毕放于左侧托盘，刀具归位于右侧刀架',
    durationMin: 60, durationMax: 120,
    steps: [
      { description: '左手抓取蔬菜', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '放置到菜板固定', atomicSkill: 'press', duration: 5, deviation: 1 },
      { description: '右手取刀对准切位', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '向下切割', atomicSkill: 'push', duration: 5, deviation: 1 },
      { description: '完成全段切割', atomicSkill: 'push', duration: 5, deviation: 1 },
      { description: '移开刀具', atomicSkill: 'move', duration: 4, deviation: 1 },
      { description: '左手松开蔬菜', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '收集切好的菜', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '移至备菜盘', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '放入备菜盘', atomicSkill: 'open', duration: 3, deviation: 1 },
    ],
    taskCount: 2, status: '已发布',
  },
  {
    id: 'PL-3005', projectId: 'P-1002', name: '餐具清洗方案',
    robotBody: 'AlphaBot-1 双夹爪', method: '外骨骼',
    initialScene: '待洗餐具叠放于水槽左侧，清洗槽注水完毕，晾置架位于右侧',
    durationMin: 40, durationMax: 80,
    steps: [
      { description: '抓取餐具', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '移至水槽上方', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '浸入水中', atomicSkill: 'push', duration: 4, deviation: 1 },
      { description: '前后清洗动作', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '提出水面', atomicSkill: 'pull', duration: 4, deviation: 1 },
      { description: '移至晾置区', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '放下餐具', atomicSkill: 'open', duration: 3, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3006', projectId: 'P-1003', name: '螺钉锁附方案',
    robotBody: 'AlphaBot-1 双灵巧手', method: 'VR遥操',
    initialScene: '工件固定于夹具，螺钉和螺丝刀位于指定托盘，锁附位已标记',
    durationMin: 60, durationMax: 120,
    steps: [
      { description: '移至螺钉托盘', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '拾取螺钉', atomicSkill: 'grasp', duration: 5, deviation: 2 },
      { description: '移至锁附位置', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '对准螺孔', atomicSkill: 'press', duration: 4, deviation: 1 },
      { description: '初次压入螺钉', atomicSkill: 'push', duration: 5, deviation: 1 },
      { description: '取螺丝刀', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '夹持螺丝刀', atomicSkill: 'grasp', duration: 4, deviation: 1 },
      { description: '对准螺钉头', atomicSkill: 'move', duration: 4, deviation: 1 },
      { description: '施加预紧力', atomicSkill: 'press', duration: 5, deviation: 1 },
      { description: '旋转锁紧', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '退出螺丝刀', atomicSkill: 'pull', duration: 4, deviation: 1 },
      { description: '移回初始位置', atomicSkill: 'move', duration: 5, deviation: 1 },
    ],
    taskCount: 2, status: '已发布',
  },
  {
    id: 'PL-3007', projectId: 'P-1003', name: '线束插接方案',
    robotBody: 'AlphaBot-2 左夹爪右灵巧手', method: 'VR遥操',
    initialScene: '线束连接器置于操作台，插头端朝上，插座固定在夹具，空间净高 ≥ 15cm',
    durationMin: 45, durationMax: 90,
    steps: [
      { description: '移至线束取件位', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '右手抓取连接器插头', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '对准插座位置', atomicSkill: 'move', duration: 7, deviation: 2 },
      { description: '初步插入', atomicSkill: 'press', duration: 5, deviation: 2 },
      { description: '完全压合', atomicSkill: 'push', duration: 6, deviation: 2 },
      { description: '拉力确认锁止', atomicSkill: 'pull', duration: 4, deviation: 1 },
      { description: '左手辅助稳定', atomicSkill: 'press', duration: 4, deviation: 1 },
      { description: '松开末端', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '返回待机位', atomicSkill: 'move', duration: 5, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3008', projectId: 'P-1003', name: '轴承压装方案',
    robotBody: 'AlphaBot-1 双夹爪', method: '外骨骼',
    initialScene: '轴承置于对中夹具，压装工件固定于压机工作台，导向销已插入',
    durationMin: 30, durationMax: 60,
    steps: [
      { description: '拾取轴承', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '对准安装位', atomicSkill: 'move', duration: 7, deviation: 2 },
      { description: '初始接触', atomicSkill: 'press', duration: 5, deviation: 2 },
      { description: '匀速压入', atomicSkill: 'push', duration: 8, deviation: 2 },
      { description: '到位压实', atomicSkill: 'press', duration: 5, deviation: 1 },
      { description: '退回至安全位置', atomicSkill: 'move', duration: 4, deviation: 1 },
    ],
    taskCount: 0, status: '草稿',
  },
  {
    id: 'PL-3009', projectId: 'P-1004', name: '货架补货方案',
    robotBody: 'AlphaBot-1 双夹爪', method: 'VR遥操',
    initialScene: '货架指定层位空缺，补货车备好商品位于货架前 0.5m，货位标签已扫描确认',
    durationMin: 40, durationMax: 80,
    steps: [
      { description: '接近补货车', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '抓取商品', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '移向货架指定位', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '将商品推入货位', atomicSkill: 'push', duration: 5, deviation: 1 },
      { description: '松开末端', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '退出货位区', atomicSkill: 'move', duration: 4, deviation: 1 },
      { description: '接近下一商品', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '抓取下一件', atomicSkill: 'grasp', duration: 7, deviation: 2 },
    ],
    taskCount: 2, status: '草稿',
  },
  {
    id: 'PL-3010', projectId: 'P-1004', name: '商品理货方案',
    robotBody: 'AlphaBot-1 双夹爪', method: '外骨骼',
    initialScene: '货架商品排列混乱，标准摆放示意贴于货架侧面，理货区段已划定',
    durationMin: 30, durationMax: 60,
    steps: [
      { description: '抓取错位商品', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '取出商品', atomicSkill: 'pull', duration: 5, deviation: 1 },
      { description: '对准标准位', atomicSkill: 'move', duration: 6, deviation: 1 },
      { description: '推回正位', atomicSkill: 'push', duration: 5, deviation: 1 },
      { description: '松开商品', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '退回查看位', atomicSkill: 'move', duration: 4, deviation: 1 },
    ],
    taskCount: 0, status: '草稿',
  },
  {
    id: 'PL-3011', projectId: 'P-1005', name: 'T恤折叠方案',
    robotBody: 'AlphaBot-2 左灵巧手右夹爪', method: 'VR遥操',
    initialScene: 'T恤展开平铺于折叠台，领口朝上，台面清洁无皱褶',
    durationMin: 60, durationMax: 120,
    steps: [
      { description: '定位左袖端点', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '抓取左袖', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '左袖向内折叠', atomicSkill: 'move', duration: 7, deviation: 2 },
      { description: '放下左袖', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '定位右袖端点', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '抓取右袖', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '右袖向内折叠', atomicSkill: 'move', duration: 7, deviation: 2 },
      { description: '放下右袖', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '抓取下摆中心', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '向上对折', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '压平完成放下', atomicSkill: 'press', duration: 4, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3012', projectId: 'P-1005', name: '毛巾对折方案',
    robotBody: 'AlphaBot-1 双灵巧手', method: '外骨骼',
    initialScene: '毛巾平铺于操作台，长边朝前，台面边缘与毛巾边缘留 5cm 余量',
    durationMin: 20, durationMax: 40,
    steps: [
      { description: '抓取毛巾一端', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '提起并保持平展', atomicSkill: 'pull', duration: 7, deviation: 2 },
      { description: '向另一端移动折叠', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '压平折痕', atomicSkill: 'press', duration: 5, deviation: 1 },
      { description: '松开并整理', atomicSkill: 'open', duration: 4, deviation: 1 },
    ],
    taskCount: 0, status: '已发布',
  },
  {
    id: 'PL-3013', projectId: 'P-1006', name: '餐具回收方案',
    robotBody: 'AlphaBot-2 左夹爪右灵巧手', method: 'VR遥操',
    initialScene: '餐桌清空，脏餐具摆放于桌面中央，回收车停于桌侧 0.3m 处',
    durationMin: 35, durationMax: 70,
    steps: [
      { description: '接近餐桌', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '抓取餐盘', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '移至回收车托盘位', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '放下餐盘', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '抓取杯子', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '移至回收车杯架', atomicSkill: 'move', duration: 7, deviation: 2 },
      { description: '放入杯架', atomicSkill: 'open', duration: 3, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3014', projectId: 'P-1006', name: '桌面擦拭方案',
    robotBody: 'AlphaBot-1 双夹爪', method: '外骨骼',
    initialScene: '桌面有污迹，清洁布已湿润置于托盘，擦拭路径从左至右',
    durationMin: 20, durationMax: 45,
    steps: [
      { description: '抓取清洁布', atomicSkill: 'grasp', duration: 5, deviation: 1 },
      { description: '贴合桌面施压', atomicSkill: 'press', duration: 4, deviation: 1 },
      { description: '匀速横向擦拭全程', atomicSkill: 'move', duration: 12, deviation: 3 },
      { description: '归还清洁布', atomicSkill: 'open', duration: 4, deviation: 1 },
    ],
    taskCount: 0, status: '已发布',
  },
  {
    id: 'PL-3015', projectId: 'P-1007', name: '箱体协同搬运方案',
    robotBody: 'AlphaBot-2 左灵巧手右夹爪', method: 'VR遥操',
    initialScene: '箱体置于起始工位，目标工位标记清晰，双臂初始展开确认无干涉',
    durationMin: 50, durationMax: 100,
    steps: [
      { description: '双臂接近箱体两侧', atomicSkill: 'move', duration: 6, deviation: 2 },
      { description: '左臂抓取左侧把手', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '右臂抓取右侧把手', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '协同抬起箱体', atomicSkill: 'pull', duration: 8, deviation: 2 },
      { description: '向目标工位平移', atomicSkill: 'move', duration: 10, deviation: 3 },
      { description: '缓慢下降至目标位', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '左臂释放', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '右臂释放', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '双臂退回待机位', atomicSkill: 'move', duration: 6, deviation: 2 },
    ],
    taskCount: 1, status: '草稿',
  },
  {
    id: 'PL-3016', projectId: 'P-1007', name: '码垛堆叠方案',
    robotBody: 'AlphaBot-2 左夹爪右灵巧手', method: '外骨骼',
    initialScene: '托盘箱体置于输送带末端，码垛区标记完成，已有两层底座',
    durationMin: 40, durationMax: 80,
    steps: [
      { description: '抓取箱体', atomicSkill: 'grasp', duration: 7, deviation: 2 },
      { description: '提起箱体', atomicSkill: 'pull', duration: 5, deviation: 1 },
      { description: '移至码垛位上方', atomicSkill: 'move', duration: 8, deviation: 2 },
      { description: '调整箱体姿态对齐', atomicSkill: 'move', duration: 6, deviation: 2 },
      { description: '缓慢下放', atomicSkill: 'push', duration: 7, deviation: 2 },
      { description: '释放箱体', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '退回取件位', atomicSkill: 'move', duration: 5, deviation: 1 },
    ],
    taskCount: 0, status: '草稿',
  },
  {
    id: 'PL-3017', projectId: 'P-1008', name: '小物件精细抓取方案',
    robotBody: 'AlphaBot-1 双灵巧手', method: 'VR遥操',
    initialScene: '精密零件散布于工作台，放大镜辅助标定完成，照明充足无反光',
    durationMin: 30, durationMax: 60,
    steps: [
      { description: '定位目标小物件', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '调整灵巧手姿态', atomicSkill: 'press', duration: 4, deviation: 1 },
      { description: '精细抓取物件', atomicSkill: 'grasp', duration: 8, deviation: 3 },
      { description: '微量提起', atomicSkill: 'pull', duration: 4, deviation: 2 },
      { description: '移至目标位', atomicSkill: 'move', duration: 6, deviation: 2 },
      { description: '对准放置孔位', atomicSkill: 'move', duration: 5, deviation: 2 },
      { description: '缓慢放入', atomicSkill: 'open', duration: 5, deviation: 2 },
      { description: '退回待机位', atomicSkill: 'move', duration: 4, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
  {
    id: 'PL-3018', projectId: 'P-1008', name: '卡片翻取方案',
    robotBody: 'AlphaBot-2 左灵巧手右夹爪', method: '外骨骼',
    initialScene: '卡片叠放于卡槽，翻取目标卡标记在第 3 张，背景台面为深色',
    durationMin: 20, durationMax: 40,
    steps: [
      { description: '接近卡片叠', atomicSkill: 'move', duration: 5, deviation: 1 },
      { description: '按压定位卡片', atomicSkill: 'press', duration: 4, deviation: 1 },
      { description: '展开灵巧手手指', atomicSkill: 'open', duration: 3, deviation: 1 },
      { description: '夹取目标卡片', atomicSkill: 'grasp', duration: 6, deviation: 2 },
      { description: '抽出卡片', atomicSkill: 'pull', duration: 5, deviation: 2 },
      { description: '移至目标位置', atomicSkill: 'move', duration: 6, deviation: 1 },
    ],
    taskCount: 1, status: '已发布',
  },
]

/** robotBody（方案字段）→ 设备类型 ID，用于实例级联 */
export const ROBOT_BODY_TO_DEVICE_TYPE = {
  'AlphaBot-1 双夹爪':         'DTY-001',
  'AlphaBot-1 双灵巧手':        'DTY-002',
  'AlphaBot-2 双灵巧手':        'DTY-003',
  'AlphaBot-2 左夹爪右灵巧手':  'DTY-004',
  'AlphaBot-2 左灵巧手右夹爪':  'DTY-005',
  'AlphaBot-2 双夹爪':         'DTY-001',
}

let runtimePlans = plans.map((p) => ({
  ...p,
  deviceTypeId: p.deviceTypeId ?? ROBOT_BODY_TO_DEVICE_TYPE[p.robotBody] ?? '',
}))

export function getAllPlans() {
  return runtimePlans
}

export function getPlansByProjectId(projectId) {
  return runtimePlans.filter((p) => p.projectId === projectId)
}

export function getPlanById(id) {
  return runtimePlans.find((p) => p.id === id) ?? null
}

export function appendPlan(plan) {
  runtimePlans = [{ ...plan }, ...runtimePlans]
  return plan
}

export function updatePlanInStore(id, patch) {
  runtimePlans = runtimePlans.map((p) => (p.id === id ? { ...p, ...patch } : p))
  return getPlanById(id)
}

export function deletePlanFromStore(id) {
  runtimePlans = runtimePlans.filter((p) => p.id !== id)
}

export function publishPlanInStore(id) {
  return updatePlanInStore(id, { status: '已发布' })
}

export function copyPlanInStore(sourceId) {
  const source = getPlanById(sourceId)
  if (!source) return null
  const newId = nextPlanId()
  const copy = {
    ...source,
    id: newId,
    name: `${source.name}_副本${newId}`,
    taskCount: 0,
    status: '草稿',
    steps: (source.steps ?? []).map((s) => ({
      ...s,
      atomicSkills: Array.isArray(s.atomicSkills) ? [...s.atomicSkills] : undefined,
    })),
    scenePath: source.scenePath ? { ...source.scenePath } : undefined,
  }
  appendPlan(copy)
  return copy
}

export const planStatusColor = {
  草稿: 'gray',
  已发布: 'blue',
}

export function nextPlanId() {
  const nums = runtimePlans.map((p) => {
    const m = p.id.match(/^PL-(\d+)$/)
    return m ? parseInt(m[1], 10) : 0
  })
  return `PL-${Math.max(...nums, 3000) + 1}`
}

export function resolvePlanDeviceTypeId(plan) {
  if (plan?.deviceTypeId) return plan.deviceTypeId
  return ROBOT_BODY_TO_DEVICE_TYPE[plan?.robotBody] ?? ''
}

export function deviceTypeIdToRobotBody(typeId) {
  const found = Object.entries(ROBOT_BODY_TO_DEVICE_TYPE).find(([, id]) => id === typeId)
  return found?.[0] ?? ''
}

// 质检方案（按项目，固定质检项模板）
const QC_ITEM_TEMPLATES = [
  { name: '可解析性检查', type: '完整性', rule: '文件可被 HDF5 工具正常打开和解析，无报错。' },
  { name: '非零文件大小检查', type: '完整性', rule: '文件大小 > 0 KB。' },
  { name: '时间戳记录非空检查', type: '完整性', rule: '时间戳记录条数 > 0。' },
  { name: '帧率完整性检查', type: '完整性', rule: '实际帧率与额定帧率偏差在允许容差范围内。' },
  { name: '全模态帧数一致性检查', type: '一致性', rule: '各 Topic 帧数与时间戳帧数差值低于阈值。' },
  { name: '持续时长范围检查', type: '有效性', rule: '持续时长在最小值与最大值阈值之间。' },
]

const QC_PROJECT_IDS = ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005', 'P-1006', 'P-1007', 'P-1008']

export const QC_TYPE_OPTIONS = ['全部', '完整性', '一致性', '有效性']

export const qcTypeColor = {
  完整性: 'blue',
  一致性: 'cyan',
  有效性: 'orange',
}

export const qcItems = QC_PROJECT_IDS.flatMap((projectId) =>
  QC_ITEM_TEMPLATES.map((item, index) => ({
    id: `QC-${projectId.slice(2)}-${String(index + 1).padStart(2, '0')}`,
    projectId,
    ...item,
    enabled: index < 5,
  })),
)

let runtimeQcItems = qcItems.map((item) => ({ ...item }))

export function getQcItemsByProjectId(projectId) {
  return runtimeQcItems.filter((q) => q.projectId === projectId)
}

export function updateQcItemInStore(id, patch) {
  runtimeQcItems = runtimeQcItems.map((q) => (q.id === id ? { ...q, ...patch } : q))
  return runtimeQcItems.find((q) => q.id === id) ?? null
}

// 播放布局（按项目）
export const playLayouts = [
  { id: 1, projectId: 'P-1001', name: '默认四宫格布局', date: '2026-03-13', description: '主视角 + 双腕部相机 + 轨迹曲线' },
  { id: 2, projectId: 'P-1001', name: '审核专用布局', date: '2026-03-25', description: '主视角大屏 + 质检项悬浮面板' },
  { id: 3, projectId: 'P-1002', name: '厨房双视角布局', date: '2026-03-21', description: '俯视 + 侧视双视角，附力控曲线' },
  { id: 4, projectId: 'P-1002', name: '动捕回放布局', date: '2026-04-01', description: '骨骼点云 + RGB 同步回放' },
  { id: 5, projectId: 'P-1003', name: '装配工位布局', date: '2026-04-03', description: '工位全景 + 末端特写 + 六维力曲线' },
  { id: 6, projectId: 'P-1004', name: '货架巡检布局', date: '2026-04-16', description: '货架全景 + 抓取特写' },
  { id: 7, projectId: 'P-1005', name: '折叠关键帧布局', date: '2026-04-29', description: '主视角 + 形变关键帧缩略条' },
  { id: 8, projectId: 'P-1006', name: '服务场景布局', date: '2026-05-10', description: '全景 + 末端相机双画面' },
  { id: 9, projectId: 'P-1007', name: '双臂监控布局', date: '2026-05-19', description: '左右臂分屏 + 同步性指标' },
  { id: 10, projectId: 'P-1008', name: '灵巧手特写布局', date: '2026-05-27', description: '指尖特写 + 触觉热力图' },
]
