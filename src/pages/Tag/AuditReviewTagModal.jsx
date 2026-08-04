import { useEffect, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import Button from '../../components/common/Button'
import { IconPlus } from '../../components/common/Icons'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'
import { APPLICATION_SCOPE_OPTIONS } from '../../mock/tags'

const EDIT_HINT = '该操作会影响相关采集条目的标注标签'

const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err
      ? 'border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

const DESC_MAX = 500
const textareaCls =
  'w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
    </div>
  )
}

function MinusCircleButton({ onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

const emptyChild = () => ({
  id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  value: '',
})

const emptyForm = () => ({
  name: '',
  value: '',
  description: '',
  applicationScope: '全局',
  children: [],
})

function groupToForm(group) {
  if (!group) return emptyForm()
  return {
    name: group.name,
    value: group.value ?? group.name ?? '',
    description: group.description ?? '',
    applicationScope: group.applicationScope ?? '全局',
    children: (group.children ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      value: c.value ?? c.name,
    })),
  }
}

function emptyChildErrors() {
  return { name: false, value: false }
}

function validateForm(form) {
  const errors = {
    name: false,
    value: false,
    applicationScope: false,
    children: form.children.map(() => emptyChildErrors()),
  }
  let valid = true
  if (!form.name.trim()) {
    errors.name = true
    valid = false
  }
  if (!form.value.trim()) {
    errors.value = true
    valid = false
  }
  if (!form.applicationScope?.trim()) {
    errors.applicationScope = true
    valid = false
  }
  form.children.forEach((child, ci) => {
    if (!child.name.trim()) {
      errors.children[ci].name = true
      valid = false
    }
    if (!child.value.trim()) {
      errors.children[ci].value = true
      valid = false
    }
  })
  return { valid, errors }
}

export default function AuditReviewTagModal({ open, group, onCancel, onOk }) {
  const [form, setForm] = useState(emptyForm)
  const [errs, setErrs] = useState({ name: false, value: false, applicationScope: false, children: [] })
  const isEdit = Boolean(group)

  useEffect(() => {
    if (!open) return
    setForm(groupToForm(group))
    setErrs({ name: false, value: false, applicationScope: false, children: [] })
  }, [open, group])

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrs((e) => ({ ...e, [key]: false }))
  }

  const updateChild = (ci, patch) => {
    setForm((f) => {
      const children = [...f.children]
      children[ci] = { ...children[ci], ...patch }
      return { ...f, children }
    })
    setErrs((e) => {
      const children = [...e.children]
      if (!children[ci]) return e
      children[ci] = { ...children[ci], ...Object.fromEntries(Object.keys(patch).map((k) => [k, false])) }
      return { ...e, children }
    })
  }

  const addChild = () => {
    setForm((f) => ({ ...f, children: [...f.children, emptyChild()] }))
    setErrs((e) => ({ ...e, children: [...e.children, emptyChildErrors()] }))
  }

  const removeChild = (ci) => {
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

  const selectCls = `h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
    errs.applicationScope ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 bg-white'
  } ${nativeSelectChevronCls}`

  return (
    <Drawer
      open={open}
      title={isEdit ? '编辑标签' : '新建标签'}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      footer={(
        <div className={`flex w-full items-center gap-4 ${isEdit ? 'justify-between' : 'justify-end'}`}>
          {isEdit && (
            <p className="min-w-0 text-xs text-amber-600">{EDIT_HINT}</p>
          )}
          <div className="flex shrink-0 gap-2">
            <Button onClick={onCancel}>取消</Button>
            <Button variant="primary" onClick={handleOk}>确定</Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <Field label="标签名称" required error={errs.name}>
          <input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="请输入标签名称"
            className={inputCls(errs.name)}
          />
        </Field>

        <Field label="标签值" required error={errs.value}>
          <input
            value={form.value}
            onChange={(e) => setField('value', e.target.value)}
            placeholder="请输入标签值"
            className={inputCls(errs.value)}
          />
        </Field>

        <Field label="应用范围" required error={errs.applicationScope}>
          <select
            value={form.applicationScope}
            onChange={(e) => setField('applicationScope', e.target.value)}
            className={selectCls}
          >
            {APPLICATION_SCOPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Field>

        <Field label="描述">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value.slice(0, DESC_MAX))}
            maxLength={DESC_MAX}
            placeholder="请输入描述（选填）"
            className={textareaCls}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/{DESC_MAX}</p>
        </Field>

        <div>
          <div className="mb-3 text-sm font-medium text-gray-700">子标签</div>
          {form.children.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem] gap-2 px-0.5">
                <span className="text-xs text-gray-600">
                  <span className="text-red-500">*</span> 名称
                </span>
                <span className="text-xs text-gray-600">
                  <span className="text-red-500">*</span> 值
                </span>
                <span />
              </div>

              {form.children.map((child, ci) => (
                <div
                  key={child.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem] items-start gap-2 rounded-lg bg-gray-50 p-3"
                >
                  <input
                    value={child.name}
                    onChange={(e) => updateChild(ci, { name: e.target.value })}
                    placeholder="请输入名称"
                    className={inputCls(errs.children[ci]?.name)}
                  />
                  <input
                    value={child.value}
                    onChange={(e) => updateChild(ci, { value: e.target.value })}
                    placeholder="请输入值"
                    className={inputCls(errs.children[ci]?.value)}
                  />
                  <div className="flex h-8 items-center justify-end">
                    <MinusCircleButton onClick={() => removeChild(ci)} title="删除子标签" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addChild}
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white py-2.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600 ${form.children.length > 0 ? 'mt-3' : ''}`}
          >
            <IconPlus className="h-4 w-4" />
            添加子标签
          </button>
        </div>
      </div>
    </Drawer>
  )
}
