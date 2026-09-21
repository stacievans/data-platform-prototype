import { DEMO_ORG_ID, getUsersByOrgId } from '../mock/organizations'

const ROLE_BOTH = '采集员&标注员'

function parseUserRoles(user) {
  if (!user?.role) return []
  if (user.role === ROLE_BOTH) return ['采集员', '标注员']
  return user.role.split('&').filter(Boolean)
}

export function userMatchesOrgRole(user, role) {
  return parseUserRoles(user).includes(role)
}

/** @returns {{ uid, username, nickname }[]} */
export function listOrgUsersByRole(role) {
  return getUsersByOrgId(DEMO_ORG_ID)
    .filter((u) => u.status === '启用' && userMatchesOrgRole(u, role))
    .map((u) => ({ uid: u.uid, username: u.username, nickname: u.nickname }))
    .sort((a, b) => a.username.localeCompare(b.username))
}
