const DEFAULT_RULE_CODE = `function check(data) {
  ...
}`

export const BACKFLOW_TRIGGER_DEVICE_POOL = [
  { sn: 'SN-0173', alias: '北京展厅演示机' },
  { sn: 'SN-0174', alias: '上海虹桥备用机' },
  { sn: 'SN-0175', alias: '产线巡检一号机' },
  { sn: 'SN-0176', alias: '广州天河演示机' },
  { sn: 'SN-0177', alias: '测试车A' },
  { sn: 'SN-0179', alias: '深圳研发中心机' },
  { sn: 'SN-0180', alias: '杭州交付中心机' },
  { sn: 'SN-0181', alias: '成都测试场一号' },
  { sn: 'SN-0182', alias: '北京亦庄路测车' },
]

const INITIAL_TRIGGERS = [
  {
    id: 'TRG-001',
    triggerKey: 'NETWORK_COMM_STATUS_ERROR',
    eventName: '网络通信状态异常',
    ruleDescription: '网络延迟 > 500ms 持续 10s',
    ruleCode: `function check(data) {
  return data.networkLatency > 500 && data.duration > 10;
}`,
    deviceMode: 'count',
    eventCount: 15,
    status: 'active',
    syncStatus: 'synced',
    devices: [
      { sn: 'SN-0173', alias: '北京展厅演示机', pushStatus: 'success' },
      { sn: 'SN-0174', alias: '上海虹桥备用机', pushStatus: 'success' },
      { sn: 'SN-0175', alias: '产线巡检一号机', pushStatus: 'failed' },
      { sn: 'SN-0176', alias: '广州天河演示机', pushStatus: 'pending' },
      { sn: 'SN-0177', alias: '测试车A', pushStatus: 'pending' },
    ],
  },
  {
    id: 'TRG-002',
    triggerKey: 'COFFEE_MACHINE_HT_ALARM',
    eventName: '咖啡机高温报警',
    ruleDescription: '温度传感器 > 95°C',
    ruleCode: `function check(data) {
  return data.temperature > 95;
}`,
    deviceMode: 'count',
    eventCount: 8,
    status: 'active',
    syncStatus: 'partial',
    devices: [
      { sn: 'SN-0173', alias: '北京展厅演示机', pushStatus: 'success' },
      { sn: 'SN-0175', alias: '产线巡检一号机', pushStatus: 'pending' },
    ],
  },
  {
    id: 'TRG-003',
    triggerKey: 'MQTT_ORDER_BRIDGE_DISPATCH_FAIL',
    eventName: '订单流转失败',
    ruleDescription: 'MQTT 连接断开且有未完成订单',
    ruleCode: `function check(data) {
  return !data.mqttConnected && data.pendingOrders > 0;
}`,
    deviceMode: 'count',
    eventCount: 0,
    status: 'inactive',
    syncStatus: 'unsynced',
    devices: [
      { sn: 'SN-0177', alias: '测试车A', pushStatus: 'failed' },
    ],
  },
  {
    id: 'TRG-004',
    triggerKey: 'PERCEPTION_DATA_HEARTBEAT_LOSS',
    eventName: '感知数据心跳丢失',
    ruleDescription: '雷达或相机节点心跳超时 > 3s',
    ruleCode: `function check(data) {
  return data.heartbeatGap > 3;
}`,
    deviceMode: 'all',
    eventCount: 42,
    status: 'active',
    syncStatus: 'synced',
    devices: [],
  },
]

let triggers = INITIAL_TRIGGERS.map(cloneTrigger)

function cloneTrigger(t) {
  return { ...t, devices: t.devices.map((d) => ({ ...d })) }
}

let nextTriggerNum = 5

export function getBackflowTriggers() {
  return triggers.map(cloneTrigger)
}

export function filterBackflowTriggers(list, { keyword = '' } = {}) {
  const q = keyword.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (t) =>
      t.triggerKey.toLowerCase().includes(q) ||
      t.eventName.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q),
  )
}

export function addBackflowTrigger(payload) {
  const id = `TRG-${String(nextTriggerNum++).padStart(3, '0')}`
  const row = {
    id,
    triggerKey: payload.triggerKey.trim(),
    eventName: payload.eventName.trim(),
    ruleDescription: payload.ruleDescription.trim(),
    ruleCode: payload.ruleCode.trim() || DEFAULT_RULE_CODE,
    deviceMode: 'count',
    eventCount: 0,
    status: 'active',
    syncStatus: 'unsynced',
    devices: [],
  }
  triggers = [row, ...triggers.map(cloneTrigger)]
  return cloneTrigger(row)
}

export function updateBackflowTrigger(id, payload) {
  triggers = triggers.map((t) =>
    t.id === id
      ? cloneTrigger({
          ...t,
          triggerKey: payload.triggerKey.trim(),
          eventName: payload.eventName.trim(),
          ruleDescription: payload.ruleDescription.trim(),
          ruleCode: payload.ruleCode.trim() || t.ruleCode,
        })
      : t,
  )
}

export function toggleBackflowTriggerStatus(id) {
  triggers = triggers.map((t) =>
    t.id === id
      ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' }
      : t,
  )
}

export function deleteBackflowTrigger(id) {
  triggers = triggers.filter((t) => t.id !== id)
}

export function updateBackflowTriggerDevices(id, devices) {
  triggers = triggers.map((t) =>
    t.id === id
      ? {
          ...t,
          devices: devices.map((d) => ({ ...d })),
          deviceMode: 'count',
        }
      : t,
  )
}

export function getAvailableDevicesForTrigger(trigger) {
  if (!trigger) return []
  const linked = new Set(trigger.devices.map((d) => d.sn))
  return BACKFLOW_TRIGGER_DEVICE_POOL.filter((d) => !linked.has(d.sn))
}

export { DEFAULT_RULE_CODE }
