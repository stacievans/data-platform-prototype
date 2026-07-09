import { ACCEPTED_DATA_STATUS, buildDatasetFromCriteria } from '../utils/datasetMetrics'

const DATA_FORMATS = ['h5', 'LeRobot']

function makeDataset(base, binding) {
  const bound = buildDatasetFromCriteria({
    projectId: base.projectId,
    projectName: base.projectName,
    projectIds: base.projectIds,
    taskIds: binding.taskIds,
    formats: binding.formats ?? DATA_FORMATS,
    acceptedOnly: true,
  })
  return {
    ...base,
    projectIds: bound.projectIds,
    projectNames: bound.projectNames,
    taskIds: bound.taskIds,
    statuses: [ACCEPTED_DATA_STATUS],
    formats: bound.formats,
    entryIds: bound.entryIds,
    trajCount: bound.trajCount,
    totalSize: bound.totalSize,
    totalDuration: bound.totalDuration,
    autoSync: base.autoSync ?? true,
  }
}

// 真机数据集（5条）— taskIds / statuses / formats / entryIds 与 mock 条目联动
export const selfDatasets = [
  makeDataset({
    id: 'DS-001',
    name: '家庭整理操作数据集 v2',
    description: '覆盖客厅杂物分拣与卧室归位任务的真机轨迹快照。',
    projectId: 'P-1001',
    projectName: '家庭物品整理采集',
    createdBy: '李明',
    createdAt: '2026-04-10 10:00:00',
    updatedBy: '李明',
    updatedAt: '2026-06-08 15:20:00',
    updateLogs: [
      { id: 'UL-001-4', updatedAt: '2026-06-08 15:20:00', updatedBy: '李明', opType: '更新数据', changeSummary: '追加 3 条，+4.2 GB；移除 1 条，-856 MB', remark: '补充第2批客厅分拣质检通过数据' },
      { id: 'UL-001-3', updatedAt: '2026-05-22 09:40:00', updatedBy: '王芳', opType: '更新数据', changeSummary: '追加 5 条，+6.8 GB', remark: '纳入卧室归位任务新标注批次' },
      { id: 'UL-001-2', updatedAt: '2026-05-15 11:00:00', updatedBy: '王芳', opType: '编辑信息', changeSummary: '修改数据集名称：家庭整理操作数据集 → 家庭整理操作数据集 v2', remark: '按版本迭代规范统一命名' },
      { id: 'UL-001-1', updatedAt: '2026-04-10 10:00:00', updatedBy: '李明', opType: '创建', changeSummary: '创建数据集，纳入 28 条数据，38.4 GB', remark: '首期纳入客厅与卧室已完成任务数据' },
    ],
  }, {
    taskIds: ['T-2001', 'T-2002', 'T-2004'],
    formats: ['h5', 'LeRobot'],
  }),
  makeDataset({
    id: 'DS-002',
    name: '厨房精细操作数据集',
    projectId: 'P-1002',
    projectName: '厨房烹饪操作采集',
    createdBy: '王芳',
    createdAt: '2026-04-22 14:30:00',
    updatedBy: '王芳',
    updatedAt: '2026-06-05 09:45:00',
    updateLogs: [
      { id: 'UL-002-3', updatedAt: '2026-06-05 09:45:00', updatedBy: '王芳', opType: '更新数据', changeSummary: '追加 4 条，+5.1 GB', remark: '餐具清洗任务新增质检通过条目' },
      { id: 'UL-002-2', updatedAt: '2026-05-18 16:20:00', updatedBy: '何敏', opType: '编辑信息', changeSummary: '更新数据集描述信息', remark: '补充数据来源说明，便于后续复用' },
      { id: 'UL-002-1', updatedAt: '2026-04-22 14:30:00', updatedBy: '王芳', opType: '创建', changeSummary: '创建数据集，纳入 18 条数据，24.6 GB', remark: '初始纳入蔬菜切配与餐具清洗任务' },
    ],
  }, {
    taskIds: ['T-2005', 'T-2007'],
    formats: ['LeRobot'],
  }),
  makeDataset({
    id: 'DS-003',
    name: '工业装配力控数据集',
    projectId: 'P-1003',
    projectName: '工业零件装配采集',
    createdBy: '张华',
    createdAt: '2026-05-06 09:15:00',
    updatedBy: '张华',
    updatedAt: '2026-06-10 11:30:00',
    updateLogs: [
      { id: 'UL-003-4', updatedAt: '2026-06-10 11:30:00', updatedBy: '张华', opType: '更新数据', changeSummary: '追加 6 条，+8.3 GB；移除 2 条，-1.4 GB', remark: '线束插接任务复核后批量纳入' },
      { id: 'UL-003-3', updatedAt: '2026-05-28 14:05:00', updatedBy: '钱琳', opType: '更新数据', changeSummary: '追加 3 条，+2.9 GB', remark: 'M4工位新解析批次试运行纳入' },
      { id: 'UL-003-2', updatedAt: '2026-05-12 10:10:00', updatedBy: '张华', opType: '编辑信息', changeSummary: '修改数据集描述与标签备注', remark: '对齐工业装配项目文档口径' },
      { id: 'UL-003-1', updatedAt: '2026-05-06 09:15:00', updatedBy: '张华', opType: '创建', changeSummary: '创建数据集，纳入 22 条数据，31.2 GB', remark: '首期覆盖螺钉锁附与线束插接任务' },
    ],
  }, {
    taskIds: ['T-2008', 'T-2010'],
    formats: ['h5', 'LeRobot'],
  }),
  makeDataset({
    id: 'DS-004',
    name: '柔性物体操作数据集',
    projectId: 'P-1005',
    projectName: '衣物折叠采集',
    createdBy: '李明',
    createdAt: '2026-05-20 16:45:00',
    updatedBy: '李明',
    updatedAt: '2026-06-01 18:00:00',
    updateLogs: [
      { id: 'UL-004-2', updatedAt: '2026-06-01 18:00:00', updatedBy: '李明', opType: '更新数据', changeSummary: '追加 2 条，+1.8 GB', remark: 'T恤折叠标准采集新标注批次' },
      { id: 'UL-004-1', updatedAt: '2026-05-20 16:45:00', updatedBy: '李明', opType: '创建', changeSummary: '创建数据集，纳入 9 条数据，12.5 GB', remark: '柔性物体操作首期快照' },
    ],
  }, {
    taskIds: ['T-2013'],
    formats: ['h5'],
  }),
  makeDataset({
    id: 'DS-005',
    name: '灵巧手抓取数据集 beta',
    projectId: 'P-1008',
    projectName: '精细抓取操作采集',
    createdBy: '王芳',
    createdAt: '2026-06-02 11:20:00',
    updatedBy: '王芳',
    updatedAt: '2026-06-09 14:10:00',
    updateLogs: [
      { id: 'UL-005-3', updatedAt: '2026-06-09 14:10:00', updatedBy: '王芳', opType: '更新数据', changeSummary: '追加 3 条，+3.6 GB', remark: 'beta 版补充精细抓取质检数据' },
      { id: 'UL-005-2', updatedAt: '2026-06-06 09:30:00', updatedBy: '吴磊', opType: '编辑信息', changeSummary: '修改数据集名称，增加 beta 标识', remark: '区分试运行版本与正式版数据集' },
      { id: 'UL-005-1', updatedAt: '2026-06-02 11:20:00', updatedBy: '王芳', opType: '创建', changeSummary: '创建数据集，纳入 11 条数据，15.8 GB', remark: '小物件精细抓取首期数据' },
    ],
  }, {
    taskIds: ['T-2015'],
    formats: ['h5', 'LeRobot'],
  }),
]

let createdSelfDatasets = []
const runtimePatches = {}

const mergeDataset = (dataset) => ({ ...dataset, ...(runtimePatches[dataset.id] ?? {}) })

export const getAllSelfDatasets = () => [
  ...createdSelfDatasets.map(mergeDataset),
  ...selfDatasets.map(mergeDataset),
]

export const getDatasetById = (id) => getAllSelfDatasets().find((d) => d.id === id) ?? null

export const prependSelfDataset = (dataset) => {
  createdSelfDatasets = [dataset, ...createdSelfDatasets]
}

export const patchSelfDataset = (id, patch) => {
  runtimePatches[id] = { ...(runtimePatches[id] ?? {}), ...patch }
  const idx = createdSelfDatasets.findIndex((d) => d.id === id)
  if (idx >= 0) {
    createdSelfDatasets[idx] = { ...createdSelfDatasets[idx], ...patch }
  }
}

let importedOpenDatasets = []

export const getAllOpenDatasets = () => [...importedOpenDatasets, ...openDatasets]

export const getOpenDatasetById = (id) => getAllOpenDatasets().find((d) => d.id === id) ?? null

export const prependOpenDatasets = (datasets) => {
  importedOpenDatasets = [...datasets, ...importedOpenDatasets]
}

export const getNextOpenDatasetIds = (count) => {
  const all = getAllOpenDatasets()
  let max = all.reduce((m, d) => {
    const n = parseInt(String(d.id).replace(/^ODS-0*/, ''), 10)
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return Array.from({ length: count }, () => {
    max += 1
    return `ODS-${String(max).padStart(3, '0')}`
  })
}

// 开源数据集（10条）
export const openDatasets = [
  { id: 'ODS-001', name: 'Open X-Embodiment', publisher: 'Google DeepMind', level: 'L1', dataSize: '8.9 TB', trajCount: '100万+', size: '8.9 TB / 100万+ 轨迹', externalLink: 'https://robotics-transformer-x.github.io/', description: '由 Google DeepMind 联合 33 家机构构建，汇聚 22 种机器人本体、超 100 万条轨迹的跨本体操作数据集，是 RT-X 系列模型的训练基础。' },
  { id: 'ODS-002', name: 'DROID', publisher: 'Stanford', level: 'L1', dataSize: '1.7 TB', trajCount: '7.6万', size: '1.7 TB / 7.6万 轨迹', externalLink: 'https://droid-dataset.github.io/', description: '由斯坦福、伯克利等 13 所机构联合采集，包含 564 个真实场景、86 类任务的 Franka 机械臂操作数据，强调真实环境下的多样性。' },
  { id: 'ODS-003', name: 'BridgeData V2', publisher: 'UC Berkeley', level: 'L2', dataSize: '812 GB', trajCount: '6万', size: '812 GB / 6万 轨迹', externalLink: 'https://rail-berkeley.github.io/bridgedata/', description: 'UC Berkeley RAIL 实验室发布，基于低成本 WidowX 机械臂采集 6 万条轨迹，覆盖 24 个环境 13 类技能，支持语言与目标图像双重指令。' },
  { id: 'ODS-004', name: 'AgiBot World', publisher: '智元机器人', level: 'L1', dataSize: '4.2 TB', trajCount: '100万', size: '4.2 TB / 100万 轨迹', externalLink: 'https://www.agibot.com/', description: '智元机器人联合上海人工智能实验室等机构开源的百万级真机数据集，覆盖家居、餐饮、工业等五大场景的 80 余种日常技能。' },
  { id: 'ODS-005', name: 'RoboMIND', publisher: '国地共建具身智能中心', level: 'L2', dataSize: '1.1 TB', trajCount: '5.5万', size: '1.1 TB / 5.5万 轨迹', externalLink: 'https://x-humanoid.com/', description: '国地共建具身智能机器人创新中心联合北大计算机学院发布，包含 5.5 万条轨迹、279 项任务，覆盖单臂/双臂/人形等多种机器人构型。' },
  { id: 'ODS-006', name: 'RT-1 Robot Action', publisher: 'Google', level: 'L2', dataSize: '670 GB', trajCount: '13万', size: '670 GB / 13万 轨迹', externalLink: 'https://robotics-transformer1.github.io/', description: 'Google 机器人团队采集，13 台 Everyday Robots 机械臂历时 17 个月完成的 13 万条任务演示，是 RT-1 模型的训练数据基础。' },
  { id: 'ODS-007', name: 'RH20T', publisher: '上海交通大学', level: 'L2', dataSize: '2.3 TB', trajCount: '11万', size: '2.3 TB / 11万 轨迹', externalLink: 'https://rh20t.github.io/', description: '上海交通大学团队发布，包含约 11 万条机器人操作序列及同步人类示范视频，覆盖 147 项任务、7 种机器人构型的多模态数据。' },
  { id: 'ODS-008', name: 'CALVIN', publisher: 'Freiburg University', level: 'L3', dataSize: '498 GB', trajCount: '2.4万', size: '498 GB / 2.4万 轨迹', externalLink: 'https://calvin.cs.uni-freiburg.de/', description: '弗莱堡大学发布的长时序语言指令操作基准，基于 Franka 机械臂采集约 24 小时无脚本"自由操作"数据，并标注自然语言指令。' },
  { id: 'ODS-009', name: 'RoboSet', publisher: 'CMU', level: 'L4', dataSize: '365 GB', trajCount: '9.8万', size: '365 GB / 9.8万 轨迹', externalLink: 'https://robopen.github.io/', description: 'CMU RoboAgent 项目发布，针对厨房日常活动采集的 7500 条轨迹，覆盖 12 类操作技能、38 项任务。' },
  { id: 'ODS-010', name: 'BC-Z', publisher: 'Google / Stanford', level: 'L4', dataSize: '156 GB', trajCount: '2.6万', size: '156 GB / 2.6万 轨迹', externalLink: 'https://bc-z.github.io/', description: 'Google、UC Berkeley 与斯坦福联合发布，基于 VR 遥操作采集约 2.6 万条演示、覆盖 100 类任务，验证了零样本任务泛化能力。' },
]
