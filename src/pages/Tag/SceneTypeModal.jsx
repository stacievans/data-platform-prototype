import { useEffect, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { CreatorReadonlyField } from '../../components/common/FormField'

const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err
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

const emptySubScene = () => ({
  id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  tags: [emptyTag()],
})

const emptyTag = () => ({
  id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
})

const emptyForm = () => ({
  name: '',
  description: '',
  subScenes: [emptySubScene()],
})

function sceneToForm(scene) {
  if (!scene) return emptyForm()
  return {
    name: scene.name,
    description: scene.description ?? '',
    subScenes: scene.subScenes.map((sub) => ({
      id: sub.id,
      name: sub.name,
      tags: sub.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    })),
  }
}

function validateForm(form) {
  const errors = { name: false, subScenes: form.subScenes.map((sub) => ({
    name: false,
    tags: sub.tags.map(() => false),
  })) }

  let valid = true
  if (!form.name.trim()) {
    errors.name = true
    valid = false
  }

  form.subScenes.forEach((sub, si) => {
    if (!sub.name.trim()) {
      errors.subScenes[si].name = true
      valid = false
    }
    sub.tags.forEach((tag, ti) => {
      if (!tag.name.trim()) {
        errors.subScenes[si].tags[ti] = true
        valid = false
      }
    })
  })

  return { valid, errors }
}

export default function SceneTypeModal({ open, scene, onCancel, onOk }) {
  const [form, setForm] = useState(emptyForm)
  const [errs, setErrs] = useState({ name: false, subScenes: [] })
  const isEdit = Boolean(scene)

  useEffect(() => {
    if (!open) return
    setForm(sceneToForm(scene))
    setErrs({ name: false, subScenes: [] })
  }, [open, scene])

  const setName = (v) => {
    setForm((f) => ({ ...f, name: v }))
    setErrs((e) => ({ ...e, name: false }))
  }

  const setDescription = (v) => setForm((f) => ({ ...f, description: v }))

  const updateSubScene = (si, patch) => {
    setForm((f) => {
      const subScenes = [...f.subScenes]
      subScenes[si] = { ...subScenes[si], ...patch }
      return { ...f, subScenes }
    })
    if (patch.name !== undefined) {
      setErrs((e) => {
        const subScenes = [...e.subScenes]
        if (subScenes[si]) subScenes[si] = { ...subScenes[si], name: false }
        return { ...e, subScenes }
      })
    }
  }

  const updateTag = (si, ti, name) => {
    setForm((f) => {
      const subScenes = [...f.subScenes]
      const tags = [...subScenes[si].tags]
      tags[ti] = { ...tags[ti], name }
      subScenes[si] = { ...subScenes[si], tags }
      return { ...f, subScenes }
    })
    setErrs((e) => {
      const subScenes = [...e.subScenes]
      if (subScenes[si]?.tags[ti] !== undefined) {
        const tags = [...subScenes[si].tags]
        tags[ti] = false
        subScenes[si] = { ...subScenes[si], tags }
      }
      return { ...e, subScenes }
    })
  }

  const addSubScene = () => {
    setForm((f) => ({ ...f, subScenes: [...f.subScenes, emptySubScene()] }))
    setErrs((e) => ({ ...e, subScenes: [...e.subScenes, { name: false, tags: [false] }] }))
  }

  const removeSubScene = (si) => {
    if (form.subScenes.length <= 1) return
    setForm((f) => ({ ...f, subScenes: f.subScenes.filter((_, i) => i !== si) }))
    setErrs((e) => ({ ...e, subScenes: e.subScenes.filter((_, i) => i !== si) }))
  }

  const addTag = (si) => {
    setForm((f) => {
      const subScenes = [...f.subScenes]
      subScenes[si] = { ...subScenes[si], tags: [...subScenes[si].tags, emptyTag()] }
      return { ...f, subScenes }
    })
    setErrs((e) => {
      const subScenes = [...e.subScenes]
      if (subScenes[si]) {
        subScenes[si] = { ...subScenes[si], tags: [...subScenes[si].tags, false] }
      }
      return { ...e, subScenes }
    })
  }

  const removeTag = (si, ti) => {
    if (form.subScenes[si].tags.length <= 1) return
    setForm((f) => {
      const subScenes = [...f.subScenes]
      subScenes[si] = { ...subScenes[si], tags: subScenes[si].tags.filter((_, i) => i !== ti) }
      return { ...f, subScenes }
    })
    setErrs((e) => {
      const subScenes = [...e.subScenes]
      if (subScenes[si]) {
        subScenes[si] = { ...subScenes[si], tags: subScenes[si].tags.filter((_, i) => i !== ti) }
      }
      return { ...e, subScenes }
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
    <Modal
      open={open}
      title={isEdit ? '编辑场景' : '新建场景'}
      width={640}
      fitViewport
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
    >
      <div className="space-y-5">
        {!isEdit && <CreatorReadonlyField />}
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            场景名称<span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入一级场景名称"
            className={inputCls(errs.name)}
          />
          {errs.name && <p className="mt-1 text-xs text-red-500">场景名称不能为空</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">描述</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入场景描述（选填）"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-4 border-t border-gray-100 pt-4">
          <div className="text-sm font-medium text-gray-700">子场景与标签</div>
          {form.subScenes.map((sub, si) => (
            <div key={sub.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-gray-500">
                    子场景名称<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={sub.name}
                    onChange={(e) => updateSubScene(si, { name: e.target.value })}
                    placeholder="请输入子场景名称"
                    className={inputCls(errs.subScenes[si]?.name)}
                  />
                  {errs.subScenes[si]?.name && (
                    <p className="mt-1 text-xs text-red-500">子场景名称不能为空</p>
                  )}
                </div>
                <TrashButton
                  className="mt-5"
                  disabled={form.subScenes.length <= 1}
                  onClick={() => removeSubScene(si)}
                  title="删除子场景"
                />
              </div>

              <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-200">
                <div className="text-xs text-gray-400">三级标签</div>
                {sub.tags.map((tag, ti) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <input
                        value={tag.name}
                        onChange={(e) => updateTag(si, ti, e.target.value)}
                        placeholder="请输入标签名称"
                        className={inputCls(errs.subScenes[si]?.tags[ti])}
                      />
                      {errs.subScenes[si]?.tags[ti] && (
                        <p className="mt-1 text-xs text-red-500">标签名称不能为空</p>
                      )}
                    </div>
                    <TrashButton
                      disabled={sub.tags.length <= 1}
                      onClick={() => removeTag(si, ti)}
                      title="删除标签"
                    />
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addTag(si)}>
                  + 添加标签
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={addSubScene}>+ 添加子场景</Button>
        </div>
      </div>
    </Modal>
  )
}
