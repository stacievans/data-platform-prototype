import { useState } from 'react'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { PermAction } from '../../components/common/PermissionAction'

export const TAG_BOUND_TIP = '该标签已绑定任务，无法编辑或删除'

const disabledCls = 'cursor-not-allowed text-sm text-gray-300 select-none'

export default function TagTableActions({
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
  disabledTip = TAG_BOUND_TIP,
}) {
  return (
    <div className="flex items-center gap-2">
      {editDisabled ? (
        <span className={disabledCls} title={disabledTip}>编辑</span>
      ) : (
        <PermAction
          permission="tag.edit"
          className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
          onClick={onEdit}
        >
          编辑
        </PermAction>
      )}
      {deleteDisabled ? (
        <span className={disabledCls} title={disabledTip}>删除</span>
      ) : (
        <PermAction
          permission="tag.delete"
          className="cursor-pointer text-sm text-red-500 hover:text-red-400"
          onClick={onDelete}
        >
          删除
        </PermAction>
      )}
    </div>
  )
}

export function tagActionColumn({ onEdit, onDelete, isBound } = {}) {
  return {
    title: '操作',
    key: 'actions',
    render: (_, row) => {
      const bound = isBound?.(row) ?? false
      return (
        <TagTableActions
          onEdit={onEdit && !bound ? () => onEdit(row) : undefined}
          onDelete={onDelete && !bound ? () => onDelete(row) : undefined}
          editDisabled={bound}
          deleteDisabled={bound}
        />
      )
    },
  }
}

export function useTagRowActions({ onDelete, onEdit, isBound }) {
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleConfirm = () => {
    if (!deleteTarget) return
    if (isBound?.(deleteTarget)) return
    onDelete(deleteTarget)
    setDeleteTarget(null)
  }

  const actionColumn = tagActionColumn({
    onEdit,
    onDelete: (row) => setDeleteTarget(row),
    isBound,
  })

  const deleteConfirmModal = (
    <DeleteConfirmModal
      open={!!deleteTarget}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={handleConfirm}
    />
  )

  return { actionColumn, deleteConfirmModal }
}

/** @deprecated use useTagRowActions */
export function useTagDeleteAction(onDelete) {
  return useTagRowActions({ onDelete })
}
