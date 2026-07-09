import { buildTypeName } from '../utils/deviceTypeName'

const initialDeviceTypes = [
  {
    id: 'DTY-001',
    name: 'AlphaBotX · 夹爪+夹爪',
    body: 'AlphaBotX',
    leftEnd: '因时·EG2-4B 夹爪',
    rightEnd: '因时·EG2-4B 夹爪',
    urdf: 'alphabotx_gripper_dual.urdf',
    description: '单臂夹爪配置，适用于家庭与零售场景采集',
    creator: '张华',
    createdAt: '2026-03-08 10:30:00',
    updatedAt: '2026-03-10 14:20:00',
  },
  {
    id: 'DTY-002',
    name: 'AlphaBotX · 灵巧手+灵巧手',
    body: 'AlphaBotX',
    leftEnd: '因时·RH56DFX 灵巧手',
    rightEnd: '因时·RH56DFX 灵巧手',
    urdf: 'alphabotx_dexhand_dual.urdf',
    description: '灵巧手配置，支持精细操作与触觉采集',
    creator: '张华',
    createdAt: '2026-03-08 11:15:00',
    updatedAt: '2026-05-20 09:45:00',
  },
  {
    id: 'DTY-003',
    name: 'AlphaBot2 · 灵巧手+灵巧手',
    body: 'AlphaBot2',
    leftEnd: '因时·RH56BFX 灵巧手',
    rightEnd: '因时·RH56BFX 灵巧手',
    urdf: 'alphabot2_dexhand_dual.urdf',
    description: '双臂灵巧手协作配置，工业装配场景',
    creator: '张华',
    createdAt: '2026-03-10 08:00:00',
    updatedAt: '2026-05-10 16:30:00',
  },
  {
    id: 'DTY-004',
    name: 'AlphaBot2 · 夹爪+灵巧手',
    body: 'AlphaBot2',
    leftEnd: '因时·EG2-4C 夹爪',
    rightEnd: '因时·RH56DFX 灵巧手',
    urdf: 'alphabot2_gripper_dexhand.urdf',
    description: '双臂异构末端，左夹爪右灵巧手快换工位',
    creator: '李明',
    createdAt: '2026-04-01 13:20:00',
    updatedAt: '2026-04-02 10:05:00',
  },
  {
    id: 'DTY-005',
    name: 'AlphaBot2 · 灵巧手+夹爪',
    body: 'AlphaBot2',
    leftEnd: '因时·RH56BFX 灵巧手',
    rightEnd: '因时·EG2-4B 夹爪',
    urdf: 'alphabot2_dexhand_gripper.urdf',
    description: '双臂异构末端，左灵巧手右夹爪，厨房与餐饮场景',
    creator: '李明',
    createdAt: '2026-04-05 15:40:00',
    updatedAt: '2026-05-11 11:22:00',
  },
]

const initialDeviceInstances = [
  { id: 'INS-001', typeId: 'DTY-001', code: 'DEV-A01', sn: 'SN20260310A8842', status: '在线', battery: 85, description: '客厅分拣工位主设备', createdAt: '2026-03-10 09:00:00', registeredAt: '2026-03-10 09:00:00', updatedAt: '2026-06-10 09:00:00' },
  { id: 'INS-002', typeId: 'DTY-001', code: 'DEV-A02', sn: 'SN20260310B1276', status: '在线', battery: 72, description: '客厅分拣工位备用设备', createdAt: '2026-03-10 09:05:00', registeredAt: '2026-03-10 09:05:00', updatedAt: '2026-06-09 14:30:00' },
  { id: 'INS-003', typeId: 'DTY-001', code: 'DEV-B02', sn: 'SN20260404E7613', status: '离线', battery: 45, description: '', createdAt: '2026-04-04 11:00:00', registeredAt: '2026-04-04 11:00:00', updatedAt: '2026-06-08 08:15:00' },
  { id: 'INS-004', typeId: 'DTY-001', code: 'DEV-D01', sn: 'SN20260415H6107', status: '在线', battery: 15, description: '零售门店陈列区采集设备', createdAt: '2026-04-15 15:00:00', registeredAt: '2026-04-15 15:00:00', updatedAt: '2026-06-07 16:20:00' },
  { id: 'INS-005', typeId: 'DTY-002', code: 'DEV-A03', sn: 'SN20260320C3391', status: '在线', battery: 90, description: '精细操作实验室设备', createdAt: '2026-03-20 14:20:00', registeredAt: '2026-03-20 14:20:00', updatedAt: '2026-06-10 11:00:00' },
  { id: 'INS-006', typeId: 'DTY-002', code: 'DEV-F01', sn: 'SN20260526K4452', status: '离线', battery: 8, description: '', createdAt: '2026-05-26 09:00:00', registeredAt: '2026-05-26 09:00:00', updatedAt: '2026-06-10 16:30:00' },
  { id: 'INS-007', typeId: 'DTY-003', code: 'DEV-B01', sn: 'SN20260321D5520', status: '在线', battery: 62, description: '工业装配线 A 区设备', createdAt: '2026-03-21 10:30:00', registeredAt: '2026-03-21 10:30:00', updatedAt: '2026-06-09 09:45:00' },
  { id: 'INS-008', typeId: 'DTY-003', code: 'DEV-C02', sn: 'SN20260510G2248', status: '在线', battery: 18, description: '工业装配线 B 区设备', createdAt: '2026-05-10 09:45:00', registeredAt: '2026-05-10 09:45:00', updatedAt: '2026-06-09 11:05:00' },
  { id: 'INS-009', typeId: 'DTY-004', code: 'DEV-C01', sn: 'SN20260402F0095', status: '离线', battery: 55, description: '快换工位异构末端设备', createdAt: '2026-04-02 08:30:00', registeredAt: '2026-04-02 08:30:00', updatedAt: '2026-06-08 17:00:00' },
  { id: 'INS-010', typeId: 'DTY-005', code: 'DEV-E01', sn: 'SN20260510J8830', status: '在线', battery: 12, description: '厨房场景餐饮采集设备', createdAt: '2026-05-10 16:30:00', registeredAt: '2026-05-10 16:30:00', updatedAt: '2026-06-06 10:20:00' },
]

let runtimeTypes = initialDeviceTypes.map((t) => ({ ...t }))
let runtimeInstances = initialDeviceInstances.map((i) => ({ ...i }))

export function enrichDeviceType(type) {
  if (!type) return null
  return {
    ...type,
    name: type.name ?? buildTypeName(type.body, type.leftEnd, type.rightEnd),
    instanceCount: runtimeInstances.filter((i) => i.typeId === type.id).length,
  }
}

export function isDeviceTypeNameTaken(name, excludeId = null) {
  const trimmed = name.trim()
  return runtimeTypes.some(
    (t) => t.name?.trim() === trimmed && t.id !== excludeId,
  )
}

export function getAllDeviceTypes() {
  return runtimeTypes.map(enrichDeviceType)
}

export function getDeviceTypeById(id) {
  return enrichDeviceType(runtimeTypes.find((t) => t.id === id))
}

export function setDeviceTypes(updater) {
  runtimeTypes = typeof updater === 'function' ? updater(runtimeTypes) : updater
  return getAllDeviceTypes()
}

export function enrichDeviceInstance(instance) {
  if (!instance) return null
  const type = runtimeTypes.find((t) => t.id === instance.typeId)
  return {
    ...instance,
    typeName: type?.name ?? '—',
    createdAt: instance.createdAt ?? instance.registeredAt ?? '—',
  }
}

export function getAllDeviceInstances() {
  return runtimeInstances.map(enrichDeviceInstance)
}

export function getInstancesByTypeId(typeId) {
  return runtimeInstances.filter((i) => i.typeId === typeId).map(enrichDeviceInstance)
}

/** 某本体类型下在库（已注册）的设备实例 */
export function getInStockInstancesByTypeId(typeId) {
  return getInstancesByTypeId(typeId)
}

export function setDeviceInstances(updater) {
  runtimeInstances = typeof updater === 'function' ? updater(runtimeInstances) : updater
  return getAllDeviceInstances()
}

export function countInstancesByTypeId(typeId) {
  return runtimeInstances.filter((i) => i.typeId === typeId).length
}

export function isDeviceSnTaken(sn, excludeId = null) {
  const normalized = sn.trim().toLowerCase()
  if (!normalized) return false
  return runtimeInstances.some(
    (i) => i.sn?.trim().toLowerCase() === normalized && i.id !== excludeId,
  )
}

/** 新实例编号：DEV- + 全局三位递增（仅统计 DEV-NNN 格式，历史字母编号不参与） */
export function getNextInstanceCode() {
  const nums = runtimeInstances
    .map((i) => i.code.match(/^DEV-(\d{3})$/)?.[1])
    .filter(Boolean)
    .map((n) => parseInt(n, 10))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `DEV-${String(next).padStart(3, '0')}`
}

/** @deprecated 旧扁平设备列表，保留兼容 */
export const devices = initialDeviceInstances.map((i) => ({
  id: i.code,
  sn: i.sn,
  description: i.description ?? '',
  createdAt: i.createdAt ?? i.registeredAt,
}))
