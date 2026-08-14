import { useState } from 'react'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { PermAction } from '../../components/common/PermissionAction'
import { boundDeleteTip, boundEditTip } from '../../utils/taskBindingTips'

export default function TagTableActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <PermAction
          permission="tag.edit"
          className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
          onClick={onEdit}
        >
          编辑
        </PermAction>
      )}
      {onDelete && (
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

export function useTagRowActions({
  onDelete,
  onEdit,
  isBound,
  getEntityName = (row) => row?.name ?? '—',
  showToast,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null)

  const tryEdit = (row) => {
    if (isBound?.(row)) {
      showToast?.(boundEditTip(getEntityName(row)))
      return
    }
    onEdit?.(row)
  }

  const tryDelete = (row) => {
    if (isBound?.(row)) {
      showToast?.(boundDeleteTip(getEntityName(row)))
      return
    }
    setDeleteTarget(row)
  }

  const handleConfirm = () => {
    if (!deleteTarget) return
    if (isBound?.(deleteTarget)) return
    onDelete?.(deleteTarget)
    setDeleteTarget(null)
  }

  const actionColumn = {
    title: '操作',
    key: 'actions',
    render: (_, row) => (
      <TagTableActions
        onEdit={onEdit ? () => tryEdit(row) : undefined}
        onDelete={onDelete ? () => tryDelete(row) : undefined}
      />
    ),
  }

  const deleteConfirmModal = (
    <DeleteConfirmModal
      open={!!deleteTarget}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={handleConfirm}
    />
  )

  return { actionColumn, deleteConfirmModal, tryEdit, tryDelete }
}
