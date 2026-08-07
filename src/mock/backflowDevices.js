import { BACKFLOW_PROJECT_OPTIONS } from './backflowProjects'

export { BACKFLOW_PROJECT_OPTIONS as BACKFLOW_DEVICE_PROJECT_OPTIONS }

export const BACKFLOW_DEVICE_SEARCH_FIELDS = [
  { value: 'code', label: '设备编号' },
  { value: 'alias', label: '设备名称' },
  { value: 'task', label: '关联任务' },
]

const INITIAL_DEVICES = [
  {
    id: 'bf-dev-1',
    code: 'Alphabot2-0173',
    alias: '北京展厅演示机',
    sn: 'SN-0173',
    ruleCount: 2,
    rules: [
      {
        id: 'R1',
        trigger: 'NETWORK_COMM_STATUS_ERROR',
        effectiveAt: '2026-06-01 10:23:00',
        status: 'active',
      },
      {
        id: 'R2',
        trigger: 'COFFEE_MACHINE_HT_ALARM',
        effectiveAt: '2026-06-02 14:08:00',
        status: 'active',
      },
    ],
    systemVersion: 'v1.7.0',
    project: '智魔方',
    projectKey: 'zhimo',
    relatedTask: '展厅演示采集任务',
  },
  {
    id: 'bf-dev-2',
    code: 'Alphabot2-0098',
    alias: '上海长宁备用机',
    sn: 'SN-0098',
    ruleCount: 1,
    rules: [
      {
        id: 'R3',
        trigger: 'BATTERY_LOW_WARNING',
        effectiveAt: '2026-05-28 09:15:00',
        status: 'active',
      },
    ],
    systemVersion: 'v1.6.2',
    project: '机场',
    projectKey: 'airport',
    relatedTask: 'T3 航站楼采集',
  },
  {
    id: 'bf-dev-3',
    code: 'Alphabot2-0241',
    alias: '机场 T3 采集终端',
    sn: 'SN-0241',
    ruleCount: 3,
    rules: [
      {
        id: 'R4',
        trigger: 'MOTOR_OVERHEAT',
        effectiveAt: '2026-05-20 16:42:00',
        status: 'active',
      },
      {
        id: 'R5',
        trigger: 'SENSOR_CALIBRATION_DRIFT',
        effectiveAt: '2026-05-21 11:30:00',
        status: 'active',
      },
      {
        id: 'R6',
        trigger: 'DATA_UPLOAD_TIMEOUT',
        effectiveAt: '2026-05-22 08:05:00',
        status: 'inactive',
      },
    ],
    systemVersion: 'v1.7.0',
    project: '机场',
    projectKey: 'airport',
    relatedTask: '产线回流巡检',
  },
  {
    id: 'bf-dev-4',
    code: 'Alphabot2-0312',
    alias: '',
    sn: 'SN-0312',
    ruleCount: 0,
    rules: [],
    systemVersion: '',
    project: '智魔方',
    projectKey: 'zhimo',
    relatedTask: '南山门店调试',
  },
]

let devices = INITIAL_DEVICES.map((d) => ({ ...d, rules: d.rules.map((r) => ({ ...r })) }))

export function getBackflowDevices() {
  return devices.map((d) => ({ ...d, rules: d.rules.map((r) => ({ ...r })) }))
}

export function updateBackflowDeviceAlias(id, alias) {
  devices = devices.map((d) => (d.id === id ? { ...d, alias: alias.trim() } : d))
}

export function filterBackflowDevices(list, { searchField, keyword, projectKey }) {
  const q = keyword.trim().toLowerCase()
  return list.filter((d) => {
    if (projectKey && projectKey !== 'all' && d.projectKey !== projectKey) return false
    if (!q) return true
    if (searchField === 'code') return d.code.toLowerCase().includes(q)
    if (searchField === 'alias') return (d.alias || '').toLowerCase().includes(q)
    if (searchField === 'task') return (d.relatedTask || '').toLowerCase().includes(q)
    return true
  })
}
