// ─────────────────────────────────────────────────
// 工具：可复现伪随机
// ─────────────────────────────────────────────────
const seeded = (seed) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// 生成 30 天每日采集数据（May 12 → Jun 10）
const genDaily30 = (base, seedN) => {
  const r = seeded(seedN)
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 4, 12 + i)
    const weekend = d.getDay() === 0 || d.getDay() === 6
    const mul = (0.6 + r() * 0.9) * (weekend ? 0.45 : 1)
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: Math.round(base.count * mul),
      hours: Math.round(base.hours * mul * 10) / 10,
    }
  })
}

// ─────────────────────────────────────────────────
// 全部数据 tab
// ─────────────────────────────────────────────────
export const allDashboard = {
  metrics: {
    totalCount: 1286450,
    totalHours: 18642,
    scenes: 24,
    tasks: 152,
    skills: 38,
    objects: 246,
    storage: '62.4 TB',
  },
  assetComposition: [
    { name: '真机自采', value: 542800, color: '#2563eb' },
    { name: '开源数据', value: 743650, color: '#10b981' },
  ],
  levelDistribution: [
    { name: 'L1 图文视频', value: 186400, color: '#8b5cf6' },
    { name: 'L2 仿真数据', value: 248600, color: '#0ea5e9' },
    { name: 'L3 第一视角', value: 421800, color: '#f59e0b' },
    { name: 'L4 真机采集', value: 429650, color: '#2563eb' },
  ],
  // 资产增长趋势（两条线：真机自采 / 开源数据，12 个月）
  trendCount: [
    { label: '7月', real: 18200, open: 23900 },
    { label: '8月', real: 24600, open: 33700 },
    { label: '9月', real: 31500, open: 39700 },
    { label: '10月', real: 38900, open: 47600 },
    { label: '11月', real: 42700, open: 53100 },
    { label: '12月', real: 51200, open: 61200 },
    { label: '1月', real: 56800, open: 67800 },
    { label: '2月', real: 48300, open: 61500 },
    { label: '3月', real: 62400, open: 75800 },
    { label: '4月', real: 70100, open: 82500 },
    { label: '5月', real: 76800, open: 91600 },
    { label: '6月', real: 21300, open: 23800 },
  ],
  trendHours: [
    { label: '7月', real: 280, open: 368 },
    { label: '8月', real: 378, open: 518 },
    { label: '9月', real: 485, open: 611 },
    { label: '10月', real: 598, open: 732 },
    { label: '11月', real: 657, open: 817 },
    { label: '12月', real: 787, open: 942 },
    { label: '1月', real: 874, open: 1043 },
    { label: '2月', real: 743, open: 946 },
    { label: '3月', real: 960, open: 1166 },
    { label: '4月', real: 1078, open: 1269 },
    { label: '5月', real: 1182, open: 1409 },
    { label: '6月', real: 328, open: 366 },
  ],
  // 数据时长分布（条形图）
  durationDistribution: [
    { label: '< 30s', value: 124000 },
    { label: '30s-1min', value: 285000 },
    { label: '1-2min', value: 342000 },
    { label: '2-5min', value: 186000 },
    { label: '5-10min', value: 78000 },
    { label: '> 10min', value: 32000 },
  ],
  // 场景与能力覆盖（环形图）
  sceneCapability: [
    { name: '家庭场景', value: 386200, color: '#2563eb' },
    { name: '厨房操作', value: 268400, color: '#0ea5e9' },
    { name: '工业装配', value: 314800, color: '#8b5cf6' },
    { name: '零售货架', value: 142300, color: '#10b981' },
    { name: '餐饮服务', value: 96500, color: '#f59e0b' },
    { name: '其他', value: 78250, color: '#94a3b8' },
  ],
  // 操作技能词云（英文，text + weight 0-100）
  wordCloud: [
    { text: 'grasping', weight: 100 },
    { text: 'placing', weight: 92 },
    { text: 'transporting', weight: 78 },
    { text: 'sorting', weight: 72 },
    { text: 'folding', weight: 65 },
    { text: 'wiping', weight: 58 },
    { text: 'inserting', weight: 54 },
    { text: 'fastening', weight: 48 },
    { text: 'pouring', weight: 45 },
    { text: 'cutting', weight: 42 },
    { text: 'stir-frying', weight: 38 },
    { text: 'washing', weight: 36 },
    { text: 'arranging', weight: 34 },
    { text: 'opening', weight: 32 },
    { text: 'handing', weight: 30 },
    { text: 'stacking', weight: 28 },
    { text: 'gripping', weight: 26 },
    { text: 'scanning', weight: 24 },
    { text: 'aligning', weight: 22 },
    { text: 'weighing', weight: 19 },
    { text: 'unpacking', weight: 17 },
    { text: 'pressing', weight: 15 },
    { text: 'pulling', weight: 13 },
  ],
}

// ─────────────────────────────────────────────────
// 真机数据 tab
// ─────────────────────────────────────────────────

// 排行榜固定数据（全部）
// 采集员：completeHours=上传时长之和，reject*=审核驳回；标注员：completeHours=审核时长之和，reject*=验收驳回
export function enrichRankingList(list, type) {
  return (list || []).map((item, i) => {
    const base = { ...item, rank: item.rank ?? i + 1 }
    if (base.completeHours != null) return base
    const c = base.count ?? 0
    if (type === 'collectors') {
      const rejectCount = Math.max(0, Math.floor(c * 0.023))
      return {
        ...base,
        completeHours: Math.round(c * 0.018 * 10) / 10,
        rejectCount,
        rejectHours: Math.round(rejectCount * 0.022 * 10) / 10,
      }
    }
    const rejectCount = Math.max(0, Math.floor(c * 0.012))
    return {
      ...base,
      completeHours: Math.round(c * 0.016 * 10) / 10,
      rejectCount,
      rejectHours: Math.round(rejectCount * 0.019 * 10) / 10,
    }
  })
}

const allRanking = {
  collectors: [
    { rank: 1, name: '刘伟', count: 33487, target: 38000, completeHours: 602.8, rejectCount: 768, rejectHours: 16.4 },
    { rank: 2, name: '吴磊', count: 6574, target: 8200, completeHours: 118.3, rejectCount: 151, rejectHours: 3.2 },
    { rank: 3, name: '周杰', count: 5420, target: 6000, completeHours: 97.6, rejectCount: 125, rejectHours: 2.7 },
    { rank: 4, name: '郑浩', count: 4892, target: 5500, completeHours: 88.1, rejectCount: 112, rejectHours: 2.4 },
    { rank: 5, name: '张华', count: 3200, target: 4000, completeHours: 57.6, rejectCount: 74, rejectHours: 1.6 },
    { rank: 6, name: '李明', count: 2100, target: 3000, completeHours: 37.8, rejectCount: 48, rejectHours: 1.1 },
    { rank: 7, name: '王芳', count: 1850, target: 2500, completeHours: 33.3, rejectCount: 43, rejectHours: 0.9 },
    { rank: 8, name: '赵强', count: 1200, target: 2000, completeHours: 21.6, rejectCount: 28, rejectHours: 0.6 },
    { rank: 9, name: '陈静', count: 980, target: 1500, completeHours: 17.6, rejectCount: 23, rejectHours: 0.5 },
    { rank: 10, name: '刘洋', count: 650, target: 1000, completeHours: 11.7, rejectCount: 15, rejectHours: 0.3 },
    { rank: 11, name: '黄磊', count: 420, target: 800, completeHours: 7.6, rejectCount: 10, rejectHours: 0.2 },
    { rank: 12, name: '林峰', count: 280, target: 500, completeHours: 5.0, rejectCount: 6, rejectHours: 0.1 },
  ],
  reviewers: [
    { rank: 1, name: '孙丽', count: 4100, target: 4100, completeHours: 65.6, rejectCount: 49, rejectHours: 0.9 },
    { rank: 2, name: '钱琳', count: 17468, target: 18000, completeHours: 279.5, rejectCount: 210, rejectHours: 4.0 },
    { rank: 3, name: '何敏', count: 8920, target: 9500, completeHours: 142.7, rejectCount: 107, rejectHours: 2.0 },
    { rank: 4, name: '胡铭阳', count: 6200, target: 7000, completeHours: 99.2, rejectCount: 74, rejectHours: 1.4 },
    { rank: 5, name: '王小菲', count: 5100, target: 6000, completeHours: 81.6, rejectCount: 61, rejectHours: 1.2 },
    { rank: 6, name: '孔祥宇', count: 3800, target: 4500, completeHours: 60.8, rejectCount: 46, rejectHours: 0.9 },
    { rank: 7, name: '周星怡', count: 2900, target: 3500, completeHours: 46.4, rejectCount: 35, rejectHours: 0.7 },
    { rank: 8, name: '严婷', count: 2100, target: 2800, completeHours: 33.6, rejectCount: 25, rejectHours: 0.5 },
    { rank: 9, name: '余艺', count: 1500, target: 2000, completeHours: 24.0, rejectCount: 18, rejectHours: 0.3 },
    { rank: 10, name: '冯磊', count: 980, target: 1200, completeHours: 15.7, rejectCount: 12, rejectHours: 0.2 },
    { rank: 11, name: '韩雪', count: 560, target: 800, completeHours: 9.0, rejectCount: 7, rejectHours: 0.1 },
    { rank: 12, name: '唐杰', count: 320, target: 500, completeHours: 5.1, rejectCount: 4, rejectHours: 0.1 },
  ],
  devices: [
    { rank: 1, name: 'DEV-C01', count: 902, target: 1050 },
    { rank: 2, name: 'DEV-A01', count: 886, target: 1000 },
    { rank: 3, name: 'DEV-B02', count: 350, target: 350 },
    { rank: 4, name: 'DEV-D01', count: 600, target: 600 },
    { rank: 5, name: 'DEV-A02', count: 424, target: 600 },
    { rank: 6, name: 'DEV-F01', count: 215, target: 800 },
    { rank: 7, name: 'DEV-B01', count: 268, target: 400 },
    { rank: 8, name: 'DEV-C02', count: 90, target: 600 },
    { rank: 9, name: 'DEV-E01', count: 58, target: 200 },
    { rank: 10, name: 'DEV-A03', count: 100, target: 100 },
  ],
}

// 生成单个项目真机数据
const buildProjectRealData = (opts) => {
  const { seed, collectCount, collectHours, reviewCount, reviewHours,
    tasks, skills, devices, members, storage, sceneData, bodyData, methodData, endData } = opts
  const daily = genDaily30({ count: Math.round(collectCount / 60), hours: Math.round(collectHours / 60) }, seed)
  const daily7 = daily.slice(-7)
  return {
    metrics: { collectCount, collectHours, reviewCount, reviewHours, tasks, skills, devices, members, storage },
    daily30: daily,
    daily7,
    durationDistribution: [
      { label: '< 30s', value: Math.round(collectCount * 0.13) },
      { label: '30s-1min', value: Math.round(collectCount * 0.28) },
      { label: '1-2min', value: Math.round(collectCount * 0.31) },
      { label: '2-5min', value: Math.round(collectCount * 0.18) },
      { label: '5-10min', value: Math.round(collectCount * 0.07) },
      { label: '> 10min', value: Math.round(collectCount * 0.03) },
    ],
    sceneDistribution: sceneData,
    bodyDistribution: bodyData,
    methodDistribution: methodData,
    endTypeDistribution: endData,
  }
}

export const realDashboard = {
  all: {
    ...buildProjectRealData({
      seed: 11,
      collectCount: 542800, collectHours: 9815,
      reviewCount: 356400, reviewHours: 6520,
      tasks: 15, skills: 26, devices: 10, members: 8, storage: '38.7 TB',
      sceneData: [
        { name: '家庭场景', value: 186400, color: '#2563eb' },
        { name: '工业装配', value: 128600, color: '#8b5cf6' },
        { name: '厨房操作', value: 98000, color: '#0ea5e9' },
        { name: '零售货架', value: 68200, color: '#10b981' },
        { name: '餐饮服务', value: 34800, color: '#f59e0b' },
        { name: '办公整理', value: 26800, color: '#94a3b8' },
      ],
      bodyData: [
        { name: '单臂机器人', value: 282256, color: '#2563eb' },
        { name: '双臂机器人', value: 184552, color: '#8b5cf6' },
        { name: '移动操作机器人', value: 75992, color: '#10b981' },
      ],
      methodData: [
        { name: '遥操作', value: 260544, color: '#2563eb' },
        { name: 'VR遥操作', value: 151984, color: '#8b5cf6' },
        { name: '动捕', value: 130272, color: '#0ea5e9' },
      ],
      endData: [
        { name: '夹爪', value: 303968, color: '#2563eb' },
        { name: '灵巧手', value: 141128, color: '#8b5cf6' },
        { name: '吸盘', value: 65136, color: '#10b981' },
        { name: '其他末端', value: 32568, color: '#94a3b8' },
      ],
    }),
    ranking: allRanking,
  },
  'P-1001': {
    ...buildProjectRealData({
      seed: 101,
      collectCount: 128600, collectHours: 1862,
      reviewCount: 86200, reviewHours: 1240,
      tasks: 4, skills: 8, devices: 3, members: 4, storage: '6.2 TB',
      sceneData: [{ name: '家庭场景', value: 128600, color: '#2563eb' }],
      bodyData: [
        { name: '单臂机器人', value: 86400, color: '#2563eb' },
        { name: '双臂机器人', value: 42200, color: '#8b5cf6' },
      ],
      methodData: [
        { name: '遥操作', value: 62000, color: '#2563eb' },
        { name: 'VR遥操作', value: 42200, color: '#8b5cf6' },
        { name: '动捕', value: 24400, color: '#0ea5e9' },
      ],
      endData: [
        { name: '夹爪', value: 84800, color: '#2563eb' },
        { name: '灵巧手', value: 43800, color: '#8b5cf6' },
      ],
    }),
    ranking: {
      collectors: [
        { rank: 1, name: '刘伟', count: 886, target: 1000 },
        { rank: 2, name: '周杰', count: 400, target: 500 },
      ],
      reviewers: [
        { rank: 1, name: '孙丽', count: 652, target: 900 },
        { rank: 2, name: '何敏', count: 100, target: 150 },
      ],
    },
  },
  'P-1002': {
    ...buildProjectRealData({
      seed: 102,
      collectCount: 88600, collectHours: 1280,
      reviewCount: 64200, reviewHours: 920,
      tasks: 3, skills: 6, devices: 2, members: 3, storage: '4.8 TB',
      sceneData: [{ name: '厨房操作', value: 88600, color: '#0ea5e9' }],
      bodyData: [
        { name: '单臂机器人', value: 42000, color: '#2563eb' },
        { name: '双臂机器人', value: 46600, color: '#8b5cf6' },
      ],
      methodData: [
        { name: '动捕', value: 52400, color: '#0ea5e9' },
        { name: '遥操作', value: 36200, color: '#2563eb' },
      ],
      endData: [
        { name: '夹爪', value: 42000, color: '#2563eb' },
        { name: '灵巧手', value: 46600, color: '#8b5cf6' },
      ],
    }),
    ranking: {
      collectors: [
        { rank: 1, name: '吴磊', count: 268, target: 400 },
        { rank: 2, name: '刘伟', count: 350, target: 350 },
      ],
      reviewers: [
        { rank: 1, name: '何敏', count: 272, target: 400 },
        { rank: 2, name: '孙丽', count: 350, target: 350 },
      ],
    },
  },
  'P-1003': {
    ...buildProjectRealData({
      seed: 103,
      collectCount: 152400, collectHours: 2180,
      reviewCount: 104000, reviewHours: 1480,
      tasks: 3, skills: 5, devices: 2, members: 3, storage: '8.6 TB',
      sceneData: [{ name: '工业装配', value: 152400, color: '#8b5cf6' }],
      bodyData: [{ name: '双臂机器人', value: 152400, color: '#8b5cf6' }],
      methodData: [
        { name: 'VR遥操作', value: 76200, color: '#8b5cf6' },
        { name: '遥操作', value: 76200, color: '#2563eb' },
      ],
      endData: [
        { name: '夹爪', value: 76200, color: '#2563eb' },
        { name: '电动螺丝刀', value: 54200, color: '#f59e0b' },
        { name: '吸盘', value: 22000, color: '#10b981' },
      ],
    }),
    ranking: {
      collectors: [
        { rank: 1, name: '郑浩', count: 542, target: 700 },
        { rank: 2, name: '吴磊', count: 450, target: 500 },
      ],
      reviewers: [
        { rank: 1, name: '钱琳', count: 748, target: 950 },
      ],
    },
  },
  'P-1004': {
    ...buildProjectRealData({
      seed: 104,
      collectCount: 60000, collectHours: 860,
      reviewCount: 60000, reviewHours: 860,
      tasks: 2, skills: 4, devices: 1, members: 3, storage: '2.8 TB',
      sceneData: [{ name: '零售货架', value: 60000, color: '#10b981' }],
      bodyData: [{ name: '移动操作机器人', value: 60000, color: '#10b981' }],
      methodData: [{ name: '遥操作', value: 60000, color: '#2563eb' }],
      endData: [{ name: '吸盘', value: 60000, color: '#10b981' }],
    }),
    ranking: {
      collectors: [{ rank: 1, name: '周杰', count: 600, target: 600 }],
      reviewers: [
        { rank: 1, name: '何敏', count: 300, target: 300 },
        { rank: 2, name: '孙丽', count: 300, target: 300 },
      ],
    },
  },
  'P-1005': {
    ...buildProjectRealData({
      seed: 105,
      collectCount: 31000, collectHours: 450,
      reviewCount: 18600, reviewHours: 270,
      tasks: 1, skills: 3, devices: 1, members: 2, storage: '1.6 TB',
      sceneData: [{ name: '家庭场景', value: 31000, color: '#2563eb' }],
      bodyData: [{ name: '单臂机器人', value: 31000, color: '#2563eb' }],
      methodData: [{ name: 'VR遥操作', value: 31000, color: '#8b5cf6' }],
      endData: [{ name: '夹爪', value: 31000, color: '#2563eb' }],
    }),
    ranking: {
      collectors: [{ rank: 1, name: '刘伟', count: 124, target: 500 }],
      reviewers: [{ rank: 1, name: '何敏', count: 60, target: 500 }],
    },
  },
  'P-1006': {
    ...buildProjectRealData({
      seed: 106,
      collectCount: 14500, collectHours: 210,
      reviewCount: 5000, reviewHours: 72,
      tasks: 1, skills: 2, devices: 1, members: 2, storage: '0.8 TB',
      sceneData: [{ name: '餐饮服务', value: 14500, color: '#f59e0b' }],
      bodyData: [{ name: '移动操作机器人', value: 14500, color: '#10b981' }],
      methodData: [{ name: '遥操作', value: 14500, color: '#2563eb' }],
      endData: [{ name: '夹爪', value: 14500, color: '#2563eb' }],
    }),
    ranking: {
      collectors: [{ rank: 1, name: '郑浩', count: 58, target: 200 }],
      reviewers: [{ rank: 1, name: '孙丽', count: 20, target: 200 }],
    },
  },
  'P-1007': {
    ...buildProjectRealData({
      seed: 107,
      collectCount: 42000, collectHours: 610,
      reviewCount: 42000, reviewHours: 610,
      tasks: 1, skills: 3, devices: 1, members: 2, storage: '2.2 TB',
      sceneData: [{ name: '工业装配', value: 42000, color: '#8b5cf6' }],
      bodyData: [{ name: '双臂机器人', value: 42000, color: '#8b5cf6' }],
      methodData: [{ name: '遥操作', value: 42000, color: '#2563eb' }],
      endData: [{ name: '夹爪', value: 42000, color: '#2563eb' }],
    }),
    ranking: {
      collectors: [{ rank: 1, name: '周杰', count: 42000, target: 42000 }],
      reviewers: [{ rank: 1, name: '钱琳', count: 42000, target: 42000 }],
    },
  },
  'P-1008': {
    ...buildProjectRealData({
      seed: 108,
      collectCount: 53800, collectHours: 780,
      reviewCount: 24000, reviewHours: 346,
      tasks: 2, skills: 5, devices: 1, members: 2, storage: '2.8 TB',
      sceneData: [{ name: '办公整理', value: 53800, color: '#94a3b8' }],
      bodyData: [{ name: '单臂机器人', value: 53800, color: '#2563eb' }],
      methodData: [{ name: '动捕', value: 53800, color: '#0ea5e9' }],
      endData: [{ name: '灵巧手', value: 53800, color: '#8b5cf6' }],
    }),
    ranking: {
      collectors: [{ rank: 1, name: '吴磊', count: 215, target: 800 }],
      reviewers: [{ rank: 1, name: '钱琳', count: 96, target: 800 }],
    },
  },
}

// ─────────────────────────────────────────────────
// 开源数据 tab
// ─────────────────────────────────────────────────
export const openDashboard = {
  metrics: {
    count: 743650,
    hours: 8827,
    scenes: 18,
    tasks: 'N/A',
    skills: 31,
    storage: '23.7 TB',
  },
  levelDistribution: [
    { name: 'L1 图文视频', value: 186400, color: '#8b5cf6' },
    { name: 'L2 仿真数据', value: 156800, color: '#0ea5e9' },
    { name: 'L3 第一视角', value: 248200, color: '#f59e0b' },
    { name: 'L4 真机采集', value: 152250, color: '#2563eb' },
  ],
  recentIngestion: [
    { name: 'Open X-Embodiment', publisher: 'Google DeepMind', level: 'L4', status: '已入库', count: '100万+ 轨迹', date: '2026-04-08 00:00:00' },
    { name: 'AgiBot World', publisher: '智元机器人', level: 'L4', status: '入库中', count: '100万 轨迹', date: '2026-06-02 00:00:00' },
    { name: 'RH20T', publisher: '上海交通大学', level: 'L3', status: '入库中', count: '11万 轨迹', date: '2026-05-28 00:00:00' },
    { name: 'RoboMIND', publisher: '国地共建具身智能中心', level: 'L3', status: '已入库', count: '5.5万 轨迹', date: '2026-04-22 00:00:00' },
    { name: 'DROID', publisher: 'Stanford', level: 'L4', status: '已入库', count: '7.6万 轨迹', date: '2026-03-15 00:00:00' },
    { name: 'BridgeData V2', publisher: 'UC Berkeley', level: 'L2', status: '已入库', count: '6万 轨迹', date: '2026-03-08 00:00:00' },
    { name: 'RT-1 Robot Action', publisher: 'Google', level: 'L2', status: '已入库', count: '13万 轨迹', date: '2026-02-20 00:00:00' },
    { name: 'CALVIN', publisher: 'Freiburg University', level: 'L3', status: '已入库', count: '2.4万 轨迹', date: '2026-01-14 00:00:00' },
    { name: 'RoboSet', publisher: 'CMU', level: 'L4', status: '未入库', count: '9.8万 轨迹', date: '2025-12-30 00:00:00' },
    { name: 'BC-Z', publisher: 'Google / Stanford', level: 'L4', status: '未入库', count: '2.6万 轨迹', date: '2025-11-18 00:00:00' },
  ],
}

// ─────────────────────────────────────────────────
// 项目维度看板（供 Project/Detail.jsx 使用）
// ─────────────────────────────────────────────────
export const projectDashboard = {
  'P-1001': {
    metrics: { total: 128600, duration: '1,862 小时', scenes: 3, tasks: 4, skills: 8, storage: '6.2 TB' },
    trend: [
      { label: '3月', value: 12400 }, { label: '4月', value: 28600 },
      { label: '5月', value: 46800 }, { label: '6月', value: 40800 },
    ],
    distribution: [
      { name: '抓取', value: 48200, color: '#2563eb' },
      { name: '放置', value: 42600, color: '#0ea5e9' },
      { name: '分类', value: 24800, color: '#8b5cf6' },
      { name: '其他', value: 13000, color: '#94a3b8' },
    ],
  },
}

export const fallbackProjectDashboard = (project) => ({
  metrics: {
    total: 24600 + project.taskCount * 8200,
    duration: `${(286 + project.taskCount * 120).toLocaleString()} 小时`,
    scenes: 1,
    tasks: project.taskCount,
    skills: 4 + project.taskCount,
    storage: `${(1.2 + project.taskCount * 0.8).toFixed(1)} TB`,
  },
  trend: [
    { label: '3月', value: 4200 }, { label: '4月', value: 8600 },
    { label: '5月', value: 12400 }, { label: '6月', value: 9800 },
  ],
  distribution: [
    { name: '抓取', value: 12400, color: '#2563eb' },
    { name: '放置', value: 9800, color: '#0ea5e9' },
    { name: '搬运', value: 6200, color: '#8b5cf6' },
    { name: '其他', value: 3100, color: '#94a3b8' },
  ],
})
