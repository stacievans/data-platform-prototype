import { useEffect, useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { annotationTemplates as initialTemplates } from '../../mock/misc'
import { useTagRowActions } from '../Tag/TagTableActions'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'

const now = () => nowDateTime()

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

const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err
      ? 'border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

function FilterBar({ query, onQueryChange, onReset, onSearch, newLabel, onNew }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-1 items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">名称</label>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="输入名称搜索"
            className="h-8 w-44 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <Button onClick={onReset}>重置</Button>
        <Button variant="primary" onClick={onSearch}>查询</Button>
      </div>
      <PermButton permission="tag.create" variant="primary" onClick={onNew}>+ {newLabel}</PermButton>
    </div>
  )
}

function TagModal({ open, editing, onCancel, onOk, idPrefix = 'TAG' }) {
  const isEdit = Boolean(editing)
  const creatorName = useCurrentNickname()
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

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrs((e) => ({ ...e, [k]: false })) }

  const handleOk = () => {
    if (!form.name.trim()) { setErrs({ name: true }); return }
    const ts = now()
    if (isEdit) {
      onOk({
        ...editing,
        name: form.name.trim(),
        description: form.description.trim(),
        updatedAt: ts,
      })
    } else {
      onOk({
        id: `${idPrefix}-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  const handleCancel = () => {
    setErrs({})
    onCancel()
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑标签' : '新建标签'}
      onCancel={handleCancel}
      onOk={handleOk}
      okText={isEdit ? '确定' : '创建'}
    >
      <div className="space-y-4">
        {!isEdit && <CreatorReadonlyField />}
        <Field label="标签名称" required error={errs.name}>
          <input placeholder="请输入标签名称" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls(errs.name)} />
        </Field>
        <Field label="描述">
          <textarea
            rows={2}
            placeholder="请输入描述（选填）"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </Field>
      </div>
    </Modal>
  )
}

export default function AnnotationTemplateTab() {
  const [data, setData] = useState(initialTemplates)
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const filtered = useMemo(
    () => (applied ? data.filter((r) => r.name.includes(applied)) : data),
    [data, applied],
  )

  const closeModal = () => {
    setModalOpen(false)
    setEditingRow(null)
  }

  const handleSave = (tag) => {
    if (editingRow) {
      setData((prev) => prev.map((r) => (r.id === tag.id ? tag : r)))
    } else {
      setData((prev) => [tag, ...prev])
    }
    closeModal()
  }

  const { actionColumn, deleteConfirmModal } = useTagRowActions({
    onEdit: (row) => { setEditingRow(row); setModalOpen(true) },
    onDelete: (row) => setData((prev) => prev.filter((r) => r.id !== row.id)),
  })

  const cols = [
    {
      title: '模板名称', dataIndex: 'name',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('最后更新', 'updatedAt'),
    actionColumn,
  ]

  return (
    <div className="space-y-3">
      <FilterBar
        query={query} onQueryChange={setQuery}
        onReset={() => { setQuery(''); setApplied('') }}
        onSearch={() => setApplied(query)}
        newLabel="新增配置" onNew={() => { setEditingRow(null); setModalOpen(true) }}
      />
      <Table columns={cols} dataSource={filtered} />
      <TagModal
        open={modalOpen}
        editing={editingRow}
        onCancel={closeModal}
        onOk={handleSave}
        idPrefix="AT"
      />
      {deleteConfirmModal}
    </div>
  )
}
