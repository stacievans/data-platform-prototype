import { users as seedUsers } from './misc'
import { nowDateTime } from '../utils/formatDateTime'

/** 超级管理员演示账号所属组织（mock） */
export const DEMO_ORG_ID = 'ORG-002'

const initialOrganizations = [
  {
    id: 'ORG-001',
    name: '机器人公司',
    remark: '总部组织，负责家庭与工业采集项目运营',
    status: '启用',
    createdAt: '2026-03-01 09:00:00',
  },
  {
    id: 'ORG-002',
    name: '智平方',
    remark: '演示测试组织',
    status: '启用',
    createdAt: '2026-03-15 10:30:00',
  },
  {
    id: 'ORG-003',
    name: '华东采集中心',
    remark: '区域采集与标注团队',
    status: '启用',
    createdAt: '2026-04-01 14:00:00',
  },
  {
    id: 'ORG-004',
    name: '试点实验室',
    remark: '',
    status: '停用',
    createdAt: '2026-05-10 11:20:00',
  },
]

let runtimeOrgs = initialOrganizations.map((o) => ({ ...o }))
let runtimeUsers = seedUsers.map((u) => ({ ...u }))

function countMembers(orgId) {
  return runtimeUsers.filter((u) => u.orgId === orgId).length
}

function enrichOrg(org) {
  return { ...org, memberCount: countMembers(org.id) }
}

export function getOrganizations() {
  return runtimeOrgs.map(enrichOrg)
}

export function getOrganizationById(id) {
  const org = runtimeOrgs.find((o) => o.id === id)
  return org ? enrichOrg(org) : null
}

export function getRuntimeUsers() {
  return [...runtimeUsers]
}

export function getUsersByOrgId(orgId) {
  return runtimeUsers.filter((u) => u.orgId === orgId)
}

export function isOrganizationNameTaken(name, excludeId = null) {
  const n = name.trim()
  return runtimeOrgs.some((o) => o.name === n && o.id !== excludeId)
}

export function appendOrganization({ name, remark = '' }) {
  const nums = runtimeOrgs.map((o) => parseInt(o.id.replace('ORG-', ''), 10) || 0)
  const id = `ORG-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  const org = {
    id,
    name: name.trim(),
    remark: remark.trim(),
    status: '启用',
    createdAt: nowDateTime(),
  }
  runtimeOrgs = [org, ...runtimeOrgs]
  return enrichOrg(org)
}

export function updateOrganization(id, patch) {
  runtimeOrgs = runtimeOrgs.map((o) => (o.id === id ? { ...o, ...patch } : o))
  return getOrganizationById(id)
}

export function setOrganizationStatus(orgId, status) {
  runtimeOrgs = runtimeOrgs.map((o) => (o.id === orgId ? { ...o, status } : o))
  const userStatus = status === '启用' ? '启用' : '停用'
  runtimeUsers = runtimeUsers.map((u) =>
    u.orgId === orgId ? { ...u, status: userStatus } : u,
  )
  return getOrganizationById(orgId)
}

export function deleteOrganization(orgId) {
  runtimeOrgs = runtimeOrgs.filter((o) => o.id !== orgId)
  runtimeUsers = runtimeUsers.filter((u) => u.orgId !== orgId)
}

export function replaceRuntimeUsers(next) {
  runtimeUsers = [...next]
}

export function appendOrgUser(user) {
  runtimeUsers = [user, ...runtimeUsers]
  return user
}

export function updateRuntimeUser(id, patch) {
  runtimeUsers = runtimeUsers.map((u) => (u.id === id ? { ...u, ...patch } : u))
}

export function deleteRuntimeUser(id) {
  runtimeUsers = runtimeUsers.filter((u) => u.id !== id)
}
