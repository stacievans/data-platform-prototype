import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import { ACTION_LABELS, permissionCatalog } from '../../mock/permissions'

function permKey(moduleId, action) {
  return `${moduleId}.${action}`
}

export default function RolePermissionModal({ open, role, onCancel, onSave }) {
  const [selectedKeys, setSelectedKeys] = useState([])

  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys])

  const actionColumns = useMemo(() => {
    const set = new Set()
    permissionCatalog.forEach((group) => {
      const leaves = group.children ?? (group.actions ? [group] : [])
      leaves.forEach((leaf) => leaf.actions.forEach((a) => set.add(a)))
    })
    return [...set]
  }, [])

  useEffect(() => {
    if (open && role) setSelectedKeys(role.permissions ?? [])
  }, [open, role])

  if (!role) return null

  const toggleAction = (key, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return [...next]
    })
  }

  const toggleAllForLeaf = (leaf, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      leaf.actions.forEach((a) => {
        const k = permKey(leaf.id, a)
        if (checked) next.add(k)
        else next.delete(k)
      })
      return [...next]
    })
  }

  const toggleGroup = (group, checked) => {
    const leaves = group.children ?? (group.actions ? [group] : [])
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      leaves.forEach((leaf) => {
        leaf.actions.forEach((a) => {
          const k = permKey(leaf.id, a)
          if (checked) next.add(k)
          else next.delete(k)
        })
      })
      return [...next]
    })
  }

  const handleOk = () => {
    let keys = [...selected]
    const modules = new Set(keys.map((k) => k.slice(0, k.lastIndexOf('.'))))
    modules.forEach((mod) => {
      const viewKey = `${mod}.view`
      const hasOther = keys.some((k) => k.startsWith(`${mod}.`) && !k.endsWith('.view'))
      if (hasOther && !keys.includes(viewKey)) keys.push(viewKey)
    })
    onSave(keys)
  }

  return (
    <Modal
      open={open}
      title={`编辑权限 — ${role.name}`}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存"
      width={720}
      fitViewport
    >
      <p className="mb-3 text-xs text-gray-500">
        勾选该角色可访问的功能模块与操作。保存后「权限模块数」将自动更新。
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="py-2 pl-3 text-center font-medium">模块</th>
              {actionColumns.map((a) => (
                <th key={a} className="px-2 py-2 text-center font-medium whitespace-nowrap">
                  {ACTION_LABELS[a] ?? a}
                </th>
              ))}
            </tr>
          </thead>
          {permissionCatalog.map((group) => {
            const leaves = group.children ?? (group.actions ? [{ id: group.id, name: group.name, actions: group.actions }] : [])
            const groupKeys = leaves.flatMap((leaf) => leaf.actions.map((a) => permKey(leaf.id, a)))
            const groupAll = groupKeys.length > 0 && groupKeys.every((k) => selected.has(k))
            const groupSome = groupKeys.some((k) => selected.has(k)) && !groupAll

            return (
              <tbody key={group.id}>
                <tr className="bg-gray-50/80">
                  <td colSpan={actionColumns.length + 1} className="py-1.5 pl-3 text-center">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 text-xs font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-blue-600"
                        checked={groupAll}
                        ref={(el) => { if (el) el.indeterminate = groupSome }}
                        onChange={() => toggleGroup(group, !groupAll)}
                      />
                      {group.name}
                    </label>
                  </td>
                </tr>
                {leaves.map((leaf) => {
                  const leafAll = leaf.actions.every((a) => selected.has(permKey(leaf.id, a)))
                  const leafSome = leaf.actions.some((a) => selected.has(permKey(leaf.id, a))) && !leafAll
                  return (
                    <tr key={leaf.id} className="border-t border-gray-100">
                      <td className="py-2 pl-8 pr-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded accent-blue-600"
                            checked={leafAll}
                            ref={(el) => { if (el) el.indeterminate = leafSome }}
                            onChange={() => toggleAllForLeaf(leaf, !leafAll)}
                          />
                          {leaf.name}
                        </label>
                      </td>
                      {actionColumns.map((action) => (
                        <td key={action} className="px-2 py-2 text-center">
                          {leaf.actions.includes(action) ? (
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 cursor-pointer rounded accent-blue-600"
                              checked={selected.has(permKey(leaf.id, action))}
                              onChange={() => toggleAction(permKey(leaf.id, action), !selected.has(permKey(leaf.id, action)))}
                            />
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            )
          })}
        </table>
      </div>
    </Modal>
  )
}
