import { useEffect, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'
import { APPLICATION_SCOPE_OPTIONS } from '../../mock/tags'

const inputCls = (err, disabled = false) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
      : err
        ? 'border-red-400 focus:ring-red-100'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

function TrashButton({ disabled, onClick, title, className = '' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </button>
  )
}

const emptyChild = () => ({
  id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  value: '',
  description: '',
})

const emptyForm = () => ({
  name: '',
  description: '',
  applicationScope: '全局',
  children: [emptyChild()],
})

function groupToForm(group) {
  if (!group) return emptyForm()
  return {
    name: group.name,
    description: group.description ?? '',
    applicationScope: group.applicationScope ?? '全局',
    children: (group.children ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      value: c.value ?? c.name,
      description: c.description ?? '',
    })),
  }
}

function validateForm(form) {
  const errors = {
    name: false,
    children: form.children.map(() => ({ name: false })),
  }
  let valid = true
  if (!form.name.trim()) {
    errors.name = true
    valid = false
  }
  form.children.forEach((child, ci) => {
    if (!child.name.trim()) {
      errors.children[ci].name = true
      valid = false
    }
  })
  return { valid, errors }
}

export default function AuditReviewTagModal({ open, group, onCancel, onOk }) {
  const [form, setForm] = useState(emptyForm)
  const [errs, setErrs] = useState({ name: false, children: [] })
  const isEdit = Boolean(group)

  useEffect(() => {
    if (!open) return
    setForm(groupToForm(group))
    setErrs({ name: false, children: [] })
  }, [open, group])

  const setName = (v) => {
    setForm((f) => ({ ...f, name: v }))
    setErrs((e) => ({ ...e, name: false }))
  }

  const setDescription = (v) => setForm((f) => ({ ...f, description: v }))
  const setScope = (v) => setForm((f) => ({ ...f, applicationScope: v }))

  const updateChild = (ci, patch) => {
    setForm((f) => {
      const children = [...f.children]
      children[ci] = { ...children[ci], ...patch }
      return { ...f, children }
    })
    if (patch.name !== undefined) {
      setErrs((e) => {
        const children = [...e.children]
        if (children[ci]) children[ci] = { ...children[ci], name: false }
        return { ...e, children }
      })
    }
  }

  const addChild = () => {
    setForm((f) => ({ ...f, children: [...f.children, emptyChild()] }))
    setErrs((e) => ({ ...e, children: [...e.children, { name: false }] }))
  }

  const removeChild = (ci) => {
    if (form.children.length <= 1) return
    setForm((f) => ({ ...f, children: f.children.filter((_, i) => i !== ci) }))
    setErrs((e) => ({ ...e, children: e.children.filter((_, i) => i !== ci) }))
  }

  const handleOk = () => {
    const { valid, errors } = validateForm(form)
    if (!valid) {
      setErrs(errors)
      return
    }
    onOk(form)
  }

  const selectCls = `h-8 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${nativeSelectChevronCls}`

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑标签' : '新建标签'}
      width={640}
      fitViewport
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            一级标签名称
            <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入一级标签名称"
            className={inputCls(errs.name)}
          />
          {errs.name && <p className="mt-1 text-xs text-red-500">一级标签名称不能为空</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">描述</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入描述（选填）"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">应用范围</label>
          <select
            value={form.applicationScope}
            onChange={(e) => setScope(e.target.value)}
            className={selectCls}
          >
            {APPLICATION_SCOPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="text-sm font-medium text-gray-700">二级标签</div>
          {form.children.map((child, ci) => (
              <div key={child.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        标签名称
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={child.name}
                        onChange={(e) => updateChild(ci, { name: e.target.value })}
                        placeholder="请输入标签名称"
                        className={inputCls(errs.children[ci]?.name)}
                      />
                      {errs.children[ci]?.name && (
                        <p className="mt-1 text-xs text-red-500">标签名称不能为空</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">标签值</label>
                      <input
                        value={child.value}
                        onChange={(e) => updateChild(ci, { value: e.target.value })}
                        placeholder="默认同标签名称"
                        className={inputCls(false)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">描述</label>
                      <input
                        value={child.description}
                        onChange={(e) => updateChild(ci, { description: e.target.value })}
                        placeholder="请输入描述（选填）"
                        className={inputCls(false)}
                      />
                    </div>
                  </div>
                  <TrashButton
                    className="mt-5"
                    disabled={form.children.length <= 1}
                    onClick={() => removeChild(ci)}
                    title="删除标签"
                  />
                </div>
              </div>
            ))}
          <Button onClick={addChild}>+ 添加标签</Button>
        </div>
      </div>
    </Modal>
  )
}
