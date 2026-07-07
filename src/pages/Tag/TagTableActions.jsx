import { useState } from 'react'
import Modal from '../../components/common/Modal'
import { PermAction } from '../../components/common/PermissionAction'

export default function TagTableActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <PermAction
        permission="tag.edit"
        className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
        onClick={onEdit}
      >
        编辑
      </PermAction>
      <PermAction
        permission="tag.delete"
        className="cursor-pointer text-sm text-red-500 hover:text-red-400"
        onClick={onDelete}
      >
        删除
      </PermAction>
    </div>
  )
}

export function tagActionColumn({ onEdit, onDelete } = {}) {
  return {
    title: '操作',
    key: 'actions',
    render: (_, row) => (
      <TagTableActions
        onEdit={onEdit ? () => onEdit(row) : undefined}
        onDelete={onDelete ? () => onDelete(row) : undefined}
      />
    ),
  }
}

export function useTagRowActions({ onDelete, onEdit }) {
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleConfirm = () => {
    if (!deleteTarget) return
    onDelete(deleteTarget)
    setDeleteTarget(null)
  }

  const actionColumn = tagActionColumn({
    onEdit,
    onDelete: (row) => setDeleteTarget(row),
  })

  const deleteConfirmModal = (
    <Modal
      open={!!deleteTarget}
      title="删除标签"
      onCancel={() => setDeleteTarget(null)}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={480}
    >
      <p className="text-sm leading-relaxed text-gray-600">
        确定删除该标签吗？删除后不可恢复
      </p>
    </Modal>
  )

  return { actionColumn, deleteConfirmModal }
}

/** @deprecated use useTagRowActions */
export function useTagDeleteAction(onDelete) {
  return useTagRowActions({ onDelete })
}
