import { useEffect, useState } from 'react'
import Modal from '../../components/common/Modal'
import { isRoleNameTaken } from '../../mock/rbac'
import { projects } from '../../mock/projects'
import MenuPermissionTree, { normalizeRolePermissions } from './MenuPermissionTree'
import ProjectDataTransfer from './ProjectDataTransfer'

const inputCls = (err, disabled = false) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
      : err
        ? 'border-red-400 focus:ring-red-100'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

export default function RolePermissionModal({ open, role, onCancel, onSave }) {
  const isBuiltin = role?.type === '内置'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [menuPermissions, setMenuPermissions] = useState([])
  const [projectIds, setProjectIds] = useState([])
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open || !role) return
    setName(role.name ?? '')
    setDescription(role.description ?? '')
    setMenuPermissions(role.permissions ?? [])
    setProjectIds(role.projectIds ?? [])
    setErrs({})
  }, [open, role])

  if (!role) return null

  const handleOk = () => {
    const nextErrs = {}
    const trimmedName = name.trim()
    if (!isBuiltin) {
      if (!trimmedName) nextErrs.name = true
      else if (isRoleNameTaken(trimmedName, role.id)) nextErrs.nameConflict = true
    }
    if (Object.keys(nextErrs).length) {
      setErrs(nextErrs)
      return
    }

    const payload = {
      name: isBuiltin ? role.name : trimmedName,
      description: description.trim(),
      permissions: normalizeRolePermissions(menuPermissions),
    }
    if (!isBuiltin) {
      payload.projectIds = [...projectIds]
    }
    onSave(payload)
  }

  return (
    <Modal
      open={open}
      title="编辑权限"
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存"
      width={920}
      fitViewport
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            角色名称
            {!isBuiltin && <span className="text-red-500">*</span>}
          </label>
          <input
            readOnly={isBuiltin}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrs({})
            }}
            placeholder="请输入角色名称"
            className={inputCls(errs.name || errs.nameConflict, isBuiltin)}
          />
          {errs.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
          {errs.nameConflict && (
            <p className="mt-1 text-xs text-red-500">角色名称在组织内已存在，请更换</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">描述</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入描述（选填）"
            className={inputCls(false)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">菜单权限</label>
          <MenuPermissionTree
            key={role.id}
            value={menuPermissions}
            onChange={setMenuPermissions}
          />
        </div>

        {!isBuiltin && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">数据权限</label>
            <ProjectDataTransfer
              projects={projects}
              value={projectIds}
              onChange={setProjectIds}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
