import { useEffect, useState } from 'react'
import Drawer from '../../components/common/Drawer'

const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err
      ? 'border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

const DESC_MAX = 500
const textareaCls =
  'w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function AuditTemplateModal({
  open,
  editing,
  nameConflict,
  onCancel,
  onOk,
}) {
  const isEdit = Boolean(editing)
  const [form, setForm] = useState({ name: '', description: '' })
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) return
    setForm({
      name: editing?.name ?? '',
      description: editing?.description ?? '',
    })
    setErrs({})
  }, [open, editing])

  const handleOk = () => {
    const nextErrs = {}
    if (!form.name.trim()) nextErrs.name = true
    if (nameConflict?.(form.name.trim())) nextErrs.nameConflict = true
    if (Object.keys(nextErrs).length) {
      setErrs(nextErrs)
      return
    }
    onOk({
      name: form.name.trim(),
      description: form.description.trim(),
    })
  }

  return (
    <Drawer
      open={open}
      title={isEdit ? '编辑模板' : '新建模板'}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            模板名称
            <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
              setErrs({})
            }}
            placeholder="请输入模板名称"
            className={inputCls(errs.name || errs.nameConflict)}
          />
          {errs.name && <p className="mt-1 text-xs text-red-500">模板名称不能为空</p>}
          {errs.nameConflict && (
            <p className="mt-1 text-xs text-red-500">模板名称在组织内已存在，请更换</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">描述</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, DESC_MAX) }))}
            maxLength={DESC_MAX}
            placeholder="请输入描述（选填）"
            className={textareaCls}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/{DESC_MAX}</p>
        </div>
      </div>
    </Drawer>
  )
}
