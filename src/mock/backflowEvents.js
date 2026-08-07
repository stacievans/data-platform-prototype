export { BACKFLOW_EVENT_PROJECT_OPTIONS } from './backflowProjects'

export const BACKFLOW_EVENT_SOURCE_OPTIONS = [
  { value: 'all', label: '全部来源' },
  { value: 'auto', label: '自动上报' },
  { value: 'manual', label: '人工上报' },
]

export const BACKFLOW_EVENT_STATUS_OPTIONS = [
  { value: 'all', label: '全部数据状态' },
  { value: 'pending', label: '待上传' },
  { value: 'uploading', label: '上传中' },
  { value: 'done', label: '已完成' },
  { value: 'failed', label: '上传失败' },
]

export const BACKFLOW_EVENT_TRIGGER_OPTIONS = [
  { value: 'all', label: '全部 Trigger' },
  { value: 'NETWORK_COMM_STATUS_ERROR', label: 'NETWORK_COMM_STATUS_ERROR' },
  { value: 'COFFEE_MACHINE_HT_ALARM', label: 'COFFEE_MACHINE_HT_ALARM' },
  { value: 'MQTT_ORDER_BRIDGE_DISPATCH_FAIL', label: 'MQTT_ORDER_BRIDGE_DISPATCH_FAIL' },
  { value: 'PERCEPTION_DATA_HEARTBEAT_LOSS', label: 'PERCEPTION_DATA_HEARTBEAT_LOSS' },
  { value: 'BATTERY_LOW_WARNING', label: 'BATTERY_LOW_WARNING' },
  { value: 'MOTOR_OVERHEAT', label: 'MOTOR_OVERHEAT' },
  { value: 'SENSOR_CALIBRATION_DRIFT', label: 'SENSOR_CALIBRATION_DRIFT' },
]

const EVENTS = [
  {
    id: '3339',
    name: '网络通信状态异常',
    trigger: 'NETWORK_COMM_STATUS_ERROR',
    level: 'fatal',
    triggerTime: '2026-06-18 10:56:17',
    source: 'auto',
    deviceCode: 'AlphaBot2-0148',
    deviceSn: 'SN-0148',
    deviceAlias: '朝阳大悦城演示机',
    project: '机场',
    projectKey: 'airport',
    dataStatus: 'done',
    dataSizeMb: 85.0,
    dataDurationSec: 59,
    uploadTime: '2026-08-07 15:13:27',
    entryId: 'E-200101',
  },
  {
    id: '3338',
    name: '咖啡机高温报警',
    trigger: 'COFFEE_MACHINE_HT_ALARM',
    level: 'serious',
    triggerTime: '2026-06-18 10:52:03',
    source: 'manual',
    deviceCode: 'AlphaBot2-0173',
    deviceSn: 'SN-0173',
    deviceAlias: '北京展厅演示机',
    project: '智魔方',
    projectKey: 'zhimo',
    dataStatus: 'done',
    dataSizeMb: 120.5,
    dataDurationSec: 72,
    uploadTime: '2026-08-07 14:58:11',
    entryId: 'E-200102',
  },
  {
    id: '3337',
    name: '电池电量低预警',
    trigger: 'BATTERY_LOW_WARNING',
    level: 'serious',
    triggerTime: '2026-06-17 18:22:41',
    source: 'auto',
    deviceCode: 'AlphaBot2-0098',
    deviceSn: 'SN-0098',
    deviceAlias: '上海长宁备用机',
    project: '机场',
    projectKey: 'airport',
    dataStatus: 'uploading',
    dataSizeMb: null,
    dataDurationSec: null,
    uploadTime: null,
    entryId: 'E-200103',
  },
  {
    id: '3336',
    name: '电机过热保护',
    trigger: 'MOTOR_OVERHEAT',
    level: 'fatal',
    triggerTime: '2026-06-17 16:05:33',
    source: 'auto',
    deviceCode: 'AlphaBot2-0241',
    deviceSn: 'SN-0241',
    deviceAlias: '机场 T3 采集终端',
    project: '机场',
    projectKey: 'airport',
    dataStatus: 'done',
    dataSizeMb: 96.3,
    dataDurationSec: 48,
    uploadTime: '2026-08-06 11:20:05',
    entryId: 'E-200104',
  },
  {
    id: '3335',
    name: '传感器标定漂移',
    trigger: 'SENSOR_CALIBRATION_DRIFT',
    level: 'serious',
    triggerTime: '2026-06-16 09:18:52',
    source: 'manual',
    deviceCode: 'AlphaBot2-0312',
    deviceSn: 'SN-0312',
    deviceAlias: '南山门店调试机',
    project: '智魔方',
    projectKey: 'zhimo',
    dataStatus: 'pending',
    dataSizeMb: null,
    dataDurationSec: null,
    uploadTime: null,
    entryId: 'E-200105',
  },
  {
    id: '3334',
    name: '网络通信状态异常',
    trigger: 'NETWORK_COMM_STATUS_ERROR',
    level: 'fatal',
    triggerTime: '2026-06-15 14:33:09',
    source: 'auto',
    deviceCode: 'AlphaBot2-0148',
    deviceSn: 'SN-0148',
    deviceAlias: '朝阳大悦城演示机',
    project: '机场',
    projectKey: 'airport',
    dataStatus: 'failed',
    dataSizeMb: null,
    dataDurationSec: null,
    uploadTime: null,
    entryId: 'E-200106',
  },
  {
    id: '3333',
    name: '咖啡机高温报警',
    trigger: 'COFFEE_MACHINE_HT_ALARM',
    level: 'serious',
    triggerTime: '2026-06-14 11:07:28',
    source: 'auto',
    deviceCode: 'AlphaBot2-0173',
    deviceSn: 'SN-0173',
    deviceAlias: '北京展厅演示机',
    project: '智魔方',
    projectKey: 'zhimo',
    dataStatus: 'uploading',
    dataSizeMb: null,
    dataDurationSec: null,
    uploadTime: null,
    entryId: 'E-200103',
  },
  {
    id: '3332',
    name: '电机过热保护',
    trigger: 'MOTOR_OVERHEAT',
    level: 'fatal',
    triggerTime: '2026-06-13 08:45:16',
    source: 'manual',
    deviceCode: 'AlphaBot2-0241',
    deviceSn: 'SN-0241',
    deviceAlias: '机场 T3 采集终端',
    project: '机场',
    projectKey: 'airport',
    dataStatus: 'done',
    dataSizeMb: 78.6,
    dataDurationSec: 52,
    uploadTime: '2026-08-03 10:11:33',
    entryId: 'E-200104',
  },
]

export function getBackflowEvents() {
  return EVENTS.map((e) => ({ ...e }))
}

function includesKeyword(value, keyword) {
  if (!keyword) return true
  return String(value ?? '').toLowerCase().includes(keyword.toLowerCase())
}

function inDateRange(dateTime, from, to) {
  if (!from && !to) return true
  const day = dateTime?.slice(0, 10)
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

export function filterBackflowEvents(list, filters) {
  const {
    keywordName = '',
    trigger = 'all',
    projectKey = 'all',
    source = 'all',
    dataStatus = 'all',
    dateFrom = '',
    dateTo = '',
    deviceSn = '',
    deviceAlias = '',
  } = filters

  return list.filter((e) => {
    if (!includesKeyword(e.name, keywordName)) return false
    if (trigger !== 'all' && e.trigger !== trigger) return false
    if (projectKey !== 'all' && e.projectKey !== projectKey) return false
    if (source !== 'all' && e.source !== source) return false
    if (dataStatus !== 'all' && e.dataStatus !== dataStatus) return false
    if (!includesKeyword(e.deviceSn, deviceSn)) return false
    if (!includesKeyword(e.deviceAlias, deviceAlias)) return false
    if (!inDateRange(e.triggerTime, dateFrom, dateTo)) return false
    return true
  })
}

export function canPlayBackflowEvent(event) {
  return event?.dataStatus === 'done'
}
