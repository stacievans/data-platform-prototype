import { useParams } from 'react-router-dom'
import { getOrganizationById } from '../../mock/organizations'
import UserListPanel from './UserListPanel'

export default function OrgDetail() {
  const { id } = useParams()
  const org = getOrganizationById(id)

  if (!org) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-6 py-16 text-center text-sm text-gray-500">
        组织不存在或已被删除
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">{org.name}</h2>
      </div>

      <UserListPanel
        variant="org"
        orgId={org.id}
        orgName={org.name}
        listTitle="用户列表"
      />
    </div>
  )
}
