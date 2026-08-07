import { BACKFLOW_PROJECT_OPTIONS } from './backflowProjects'

export { BACKFLOW_PROJECT_OPTIONS }

export const BACKFLOW_PERIOD_OPTIONS = [
  { value: 'today', label: '今天' },
  { value: '7d', label: '近7天' },
  { value: '1m', label: '近1个月' },
  { value: 'all', label: '全部' },
]

const PROJECT_SHARE = [
  { key: 'zhimo', name: '智魔方', value: 15480, color: '#3b82f6' },
  { key: 'airport', name: '机场', value: 12500, color: '#f59e0b' },
]

const TREND_7D = [
  { date: '04-19', count: 120, duration: 30 },
  { date: '04-20', count: 155, duration: 39 },
  { date: '04-21', count: 185, duration: 46 },
  { date: '04-22', count: 165, duration: 41 },
  { date: '04-23', count: 215, duration: 54 },
  { date: '04-24', count: 230, duration: 58 },
  { date: '04-25', count: 198, duration: 50 },
]

const DEVICE_RANKING = [
  { name: '深圳人才公园调试机', sn: 'SN-C099', value: 2380 },
  { name: 'HKC 产线 A 区 01', sn: 'SN-A128', value: 2156 },
  { name: '智能方门店南山店', sn: 'SN-B045', value: 1988 },
  { name: '机场 T3 采集终端', sn: 'SN-D772', value: 1765 },
  { name: '数采厂实验室 3 号', sn: 'SN-E331', value: 1620 },
  { name: '广州展厅演示机', sn: 'SN-F902', value: 1488 },
  { name: '北京亦庄测试台', sn: 'SN-G118', value: 1320 },
  { name: '上海张江回流点', sn: 'SN-H556', value: 1195 },
]

const PERIOD_SCALE = {
  today: 0.28,
  '7d': 1,
  '1m': 3.8,
  all: 6.2,
}

function filterProjectShare(projectId) {
  if (projectId === 'all') return PROJECT_SHARE
  return PROJECT_SHARE.filter((p) => p.key === projectId)
}

function scaleTrend(period) {
  const scale = PERIOD_SCALE[period] ?? 1
  if (period === 'today' || period === '7d') {
    return TREND_7D.map((d) => ({
      ...d,
      count: Math.round(d.count * (period === 'today' ? 0.92 : scale)),
      duration: Math.round(d.duration * (period === 'today' ? 0.92 : scale)),
    }))
  }
  if (period === '1m') {
    return Array.from({ length: 30 }, (_, i) => {
      const base = TREND_7D[i % TREND_7D.length]
      return {
        date: `${String((i % 30) + 1).padStart(2, '0')}`,
        count: Math.round(base.count * (0.85 + (i % 5) * 0.05)),
        duration: Math.round(base.duration * (0.85 + (i % 5) * 0.05)),
      }
    })
  }
  if (period === 'all') {
    return [
      { date: '01月', count: 6200, duration: 1550 },
      { date: '02月', count: 7100, duration: 1775 },
      { date: '03月', count: 8400, duration: 2100 },
      { date: '04月', count: 9200, duration: 2300 },
    ]
  }
  return TREND_7D.map((d) => ({
    ...d,
    count: Math.round(d.count * scale),
    duration: Math.round(d.duration * scale),
  }))
}

function scaleDevices(projectId, period) {
  let list = [...DEVICE_RANKING]
  if (projectId !== 'all') {
    list = list.map((d, i) => ({
      ...d,
      value: Math.round(d.value * (0.35 + (i % 3) * 0.12)),
    }))
  }
  const scale = PERIOD_SCALE[period] ?? 1
  return list.map((d) => ({
    ...d,
    value: Math.round(d.value * Math.min(scale, 1.2)),
  }))
}

export function getBackflowDashboard(projectId = 'all', period = 'today') {
  const projectShare = filterProjectShare(projectId)
  const trend = scaleTrend(period)
  const deviceRanking = scaleDevices(projectId, period)
  const periodTotal = period === 'today'
    ? 1134
    : Math.round(1134 * (PERIOD_SCALE[period] ?? 1))

  return {
    summary: {
      todayCount: 1245,
      totalCount: 45280,
      deviceCount: 128,
      storageTb: 3.2,
      durationHours: 1250,
    },
    trend,
    projectShare,
    deviceRanking,
    reportSource: [
      { name: '自动上报', value: Math.round(periodTotal * 0.62), color: '#ef4444' },
      { name: '人工上报', value: Math.round(periodTotal * 0.38), color: '#8b5cf6' },
    ],
    problemTypes: [
      { name: '传感器异常', value: 312, color: '#3b82f6' },
      { name: '网络超时', value: 268, color: '#22c55e' },
      { name: '数据断断', value: 245, color: '#eab308' },
      { name: '标定偏移', value: 189, color: '#1e40af' },
    ],
    periodTotal,
  }
}
