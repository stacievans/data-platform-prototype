import { useEffect, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import { IconPlus } from '../../components/common/Icons'

const DESC_MAX = 500

const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err
      ? 'border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

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

function MinusCircleButton({ disabled, onClick, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

const emptyChildTag = () => ({
  id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  value: '',
})

const emptySubTag = () => ({
  id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  value: '',
  children: [],
})

export const emptySceneForm = () => ({
  name: '',
  value: '',
  description: '',
  subTags: [],
})

export function sceneToForm(scene) {
  if (!scene) return emptySceneForm()

  const subTags = (scene.subScenes ?? []).map((sub) => ({
    id: sub.id,
    name: sub.name,
    value: sub.value ?? '',
    children: (sub.tags ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      value: tag.value ?? tag.name,
    })),
  }))

  return {
    name: scene.name,
    value: scene.value ?? '',
    description: scene.description ?? '',
    subTags,
  }
}

function emptySubErrors(sub) {
  return {
    name: false,
    value: false,
    children: sub.children.map(() => ({ name: false, value: false })),
  }
}

function validateForm(form) {
  const errors = {
    name: false,
    value: false,
    subTags: form.subTags.map(emptySubErrors),
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

  form.subTags.forEach((sub, si) => {
    if (!sub.name.trim()) {
      errors.subTags[si].name = true
      valid = false
    }
    if (!sub.value.trim()) {
      errors.subTags[si].value = true
      valid = false
    }
    sub.children.forEach((child, ci) => {
      if (!child.name.trim()) {
        errors.subTags[si].children[ci].name = true
        valid = false
      }
      if (!child.value.trim()) {
        errors.subTags[si].children[ci].value = true
        valid = false
      }
    })
  })

  return { valid, errors }
}

function SubTagRowInputs({ name, value, nameError, valueError, onNameChange, onValueChange, indent = false }) {
  return (
    <>
      <div className={indent ? 'pl-6' : ''}>
        <input
          value={name}
          onChange={onNameChange}
          placeholder="请输入名称"
          className={inputCls(nameError)}
        />
      </div>
      <div className={indent ? 'pl-6' : ''}>
        <input
          value={value}
          onChange={onValueChange}
          placeholder="请输入值"
          className={inputCls(valueError)}
        />
      </div>
    </>
  )
}

export default function SceneTypeModal({ open, scene, onCancel, onOk }) {
  const [form, setForm] = useState(emptySceneForm)
  const [errs, setErrs] = useState({ name: false, value: false, subTags: [] })
  const isEdit = Boolean(scene)

  useEffect(() => {
    if (!open) return
    setForm(sceneToForm(scene))
    setErrs({ name: false, value: false, subTags: [] })
  }, [open, scene])

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrs((e) => ({ ...e, [key]: false }))
  }

  const updateSubTag = (si, patch) => {
    setForm((f) => {
      const subTags = [...f.subTags]
      subTags[si] = { ...subTags[si], ...patch }
      return { ...f, subTags }
    })
    setErrs((e) => {
      const subTags = [...e.subTags]
      if (!subTags[si]) return e
      subTags[si] = { ...subTags[si], ...Object.fromEntries(Object.keys(patch).map((k) => [k, false])) }
      return { ...e, subTags }
    })
  }

  const updateChildTag = (si, ci, patch) => {
    setForm((f) => {
      const subTags = [...f.subTags]
      const children = [...subTags[si].children]
      children[ci] = { ...children[ci], ...patch }
      subTags[si] = { ...subTags[si], children }
      return { ...f, subTags }
    })
    setErrs((e) => {
      const subTags = [...e.subTags]
      if (!subTags[si]?.children[ci]) return e
      const children = [...subTags[si].children]
      children[ci] = { ...children[ci], ...Object.fromEntries(Object.keys(patch).map((k) => [k, false])) }
      subTags[si] = { ...subTags[si], children }
      return { ...e, subTags }
    })
  }

  const addSubTag = () => {
    setForm((f) => ({ ...f, subTags: [...f.subTags, emptySubTag()] }))
    setErrs((e) => ({ ...e, subTags: [...e.subTags, emptySubErrors(emptySubTag())] }))
  }

  const removeSubTag = (si) => {
    setForm((f) => ({ ...f, subTags: f.subTags.filter((_, i) => i !== si) }))
    setErrs((e) => ({ ...e, subTags: e.subTags.filter((_, i) => i !== si) }))
  }

  const addChildTag = (si) => {
    setForm((f) => {
      const subTags = [...f.subTags]
      subTags[si] = { ...subTags[si], children: [...subTags[si].children, emptyChildTag()] }
      return { ...f, subTags }
    })
    setErrs((e) => {
      const subTags = [...e.subTags]
      if (!subTags[si]) return e
      subTags[si] = {
        ...subTags[si],
        children: [...subTags[si].children, { name: false, value: false }],
      }
      return { ...e, subTags }
    })
  }

  const removeChildTag = (si, ci) => {
    setForm((f) => {
      const subTags = [...f.subTags]
      subTags[si] = {
        ...subTags[si],
        children: subTags[si].children.filter((_, i) => i !== ci),
      }
      return { ...f, subTags }
    })
    setErrs((e) => {
      const subTags = [...e.subTags]
      if (!subTags[si]) return e
      subTags[si] = {
        ...subTags[si],
        children: subTags[si].children.filter((_, i) => i !== ci),
      }
      return { ...e, subTags }
    })
  }

  const handleOk = () => {
    const { valid, errors } = validateForm(form)
    if (!valid) {
      setErrs(errors)
      return
    }
    onOk(form)
  }

  return (
    <Drawer
      open={open}
      title={isEdit ? '编辑标签' : '新建标签'}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
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

        <Field label="描述">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value.slice(0, DESC_MAX))}
            maxLength={DESC_MAX}
            placeholder="请输入描述（选填）"
            className={textareaCls}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.description.length}/{DESC_MAX}
          </p>
        </Field>

        <div>
          <div className="mb-3 text-sm font-medium text-gray-700">子标签</div>
          {form.subTags.length > 0 && (
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

              {form.subTags.map((sub, si) => (
                <div key={sub.id} className="space-y-2 rounded-lg bg-gray-50 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem] items-start gap-2">
                    <SubTagRowInputs
                      name={sub.name}
                      value={sub.value}
                      nameError={errs.subTags[si]?.name}
                      valueError={errs.subTags[si]?.value}
                      onNameChange={(e) => updateSubTag(si, { name: e.target.value })}
                      onValueChange={(e) => updateSubTag(si, { value: e.target.value })}
                    />
                    <div className="flex h-8 items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => addChildTag(si)}
                        title="添加三级标签"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <IconPlus className="h-4 w-4" />
                      </button>
                      <MinusCircleButton
                        onClick={() => removeSubTag(si)}
                        title="删除二级标签"
                      />
                    </div>
                  </div>

                  {sub.children.map((child, ci) => (
                    <div key={child.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem] items-start gap-2">
                      <SubTagRowInputs
                        name={child.name}
                        value={child.value}
                        nameError={errs.subTags[si]?.children[ci]?.name}
                        valueError={errs.subTags[si]?.children[ci]?.value}
                        indent
                        onNameChange={(e) => updateChildTag(si, ci, { name: e.target.value })}
                        onValueChange={(e) => updateChildTag(si, ci, { value: e.target.value })}
                      />
                      <div className="flex h-8 items-center justify-end">
                        <MinusCircleButton
                          onClick={() => removeChildTag(si, ci)}
                          title="删除三级标签"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addSubTag}
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white py-2.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600 ${form.subTags.length > 0 ? 'mt-3' : ''}`}
          >
            <IconPlus className="h-4 w-4" />
            添加子标签
          </button>
        </div>
      </div>
    </Drawer>
  )
}
