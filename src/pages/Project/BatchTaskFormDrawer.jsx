import { useEffect, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import { isBatchTaskNameTaken } from '../../mock/batchTasks'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function BatchTaskFormDrawer({
  open,
  editTarget,
  projectId,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('')
  const [remark, setRemark] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(editTarget?.name ?? '')
    setRemark(editTarget?.remark ?? '')
    setNameError('')
  }, [open, editTarget])

  const handleOk = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('请输入批次任务名称')
      return
    }
    if (isBatchTaskNameTaken(projectId, trimmed, editTarget?.id ?? null)) {
      setNameError('该项目下已存在同名批次任务')
      return
    }
    onSave?.({ name: trimmed, remark: remark.trim() })
  }

  return (
    <Drawer
      open={open}
      title={editTarget ? '编辑批次任务' : '新建批次任务'}
      onCancel={onClose}
      onOk={handleOk}
      okText="确定"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-gray-600">
            批次任务名称<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) setNameError('')
            }}
            placeholder="请输入批次任务名称"
            className={`${INPUT_CLS}${nameError ? ' border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
          {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-gray-600">备注</label>
          <textarea
            rows={4}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </Drawer>
  )
}
