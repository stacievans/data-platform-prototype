import { useEffect, useMemo, useState } from 'react'
import Tabs from '../../components/common/Tabs'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import {
  getAtomicSkillTags,
  setAtomicSkillTags,
  getCollectionMethodTags,
  setCollectionMethodTags,
  getTaskPurposeTags,
  setTaskPurposeTags,
} from '../../mock/tags'
import AuditReviewTagPanel from './AuditReviewTagPanel'
import SceneTypePanel from './SceneTypePanel'
import { useTagRowActions } from './TagTableActions'

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

function FilterBar({ nameQuery, valueQuery, onNameChange, onValueChange, onReset, onSearch, onNew }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">标签名称</label>
          <input
            value={nameQuery}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="输入标签名称"
            className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">标签值</label>
          <input
            value={valueQuery}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="输入标签值"
            className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <Button onClick={onReset}>重置</Button>
        <Button variant="primary" onClick={onSearch}>查询</Button>
      </div>
      <PermButton permission="tag.create" variant="primary" onClick={onNew}>+ 新建标签</PermButton>
    </div>
  )
}

const baseColumns = [
  { title: '标签名称', dataIndex: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { title: '标签值', dataIndex: 'value', render: (v, row) => <span className="text-gray-600">{v ?? row.name ?? '—'}</span> },
  { title: '描述', dataIndex: 'description', render: (v) => <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span> },
  { title: '创建人', dataIndex: 'creator' },
  dtCol('创建时间', 'createdAt'),
  dtCol('最后更新', 'updatedAt'),
]

function FlatTagModal({ open, editing, onCancel, onOk, idPrefix = 'TAG', showValue = true }) {
  const isEdit = Boolean(editing)
  const creatorName = useCurrentNickname()
  const [form, setForm] = useState({ name: '', value: '', description: '' })
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) return
    setForm({
      name: editing?.name ?? '',
      value: editing?.value ?? editing?.name ?? '',
      description: editing?.description ?? '',
    })
    setErrs({})
  }, [open, editing])

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrs((e) => ({ ...e, [k]: false })) }

  const handleOk = () => {
    const nextErrs = {}
    if (!form.name.trim()) nextErrs.name = true
    if (showValue && !form.value.trim()) nextErrs.value = true
    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }

    const ts = now()
    const value = showValue ? form.value.trim() : form.name.trim()
    if (isEdit) {
      onOk({ ...editing, name: form.name.trim(), value, description: form.description.trim(), updatedAt: ts })
    } else {
      onOk({
        id: `${idPrefix}-${Date.now()}`,
        name: form.name.trim(),
        value,
        description: form.description.trim(),
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  return (
    <Modal open={open} title={isEdit ? '编辑标签' : '新建标签'} onCancel={onCancel} onOk={handleOk} okText={isEdit ? '确定' : '创建'}>
      <div className="space-y-4">
        {!isEdit && <CreatorReadonlyField />}
        <Field label="标签名称" required error={errs.name}>
          <input placeholder="请输入标签名称" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls(errs.name)} />
        </Field>
        {showValue && (
          <Field label="标签值" required error={errs.value}>
            <input placeholder="请输入标签值" value={form.value} onChange={(e) => set('value', e.target.value)} className={inputCls(errs.value)} />
          </Field>
        )}
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

function FlatTagPanel({ getData, setData, idPrefix, showValue = true }) {
  const [data, setLocalData] = useState(() => [...getData()])
  const [nameQuery, setNameQuery] = useState('')
  const [valueQuery, setValueQuery] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [appliedValue, setAppliedValue] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const sync = (next) => {
    setLocalData(next)
    setData(next)
  }

  const filtered = useMemo(() => data.filter((r) => {
    if (appliedName && !r.name.includes(appliedName)) return false
    const val = String(r.value ?? r.name ?? '')
    if (appliedValue && !val.includes(appliedValue)) return false
    return true
  }), [data, appliedName, appliedValue])

  const pageResetKey = `${appliedName}|${appliedValue}|${data.length}`

  const closeModal = () => {
    setModalOpen(false)
    setEditingRow(null)
  }

  const handleSave = (tag) => {
    if (editingRow) {
      sync(data.map((r) => (r.id === tag.id ? tag : r)))
    } else {
      sync([tag, ...data])
    }
    closeModal()
  }

  const { actionColumn, deleteConfirmModal } = useTagRowActions({
    onEdit: (row) => { setEditingRow(row); setModalOpen(true) },
    onDelete: (row) => sync(data.filter((r) => r.id !== row.id)),
  })

  const cols = [...baseColumns, actionColumn]

  return (
    <div className="space-y-3">
      <FilterBar
        nameQuery={nameQuery}
        valueQuery={valueQuery}
        onNameChange={setNameQuery}
        onValueChange={setValueQuery}
        onReset={() => { setNameQuery(''); setValueQuery(''); setAppliedName(''); setAppliedValue('') }}
        onSearch={() => { setAppliedName(nameQuery); setAppliedValue(valueQuery) }}
        onNew={() => { setEditingRow(null); setModalOpen(true) }}
      />
      <Table columns={cols} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      <FlatTagModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} idPrefix={idPrefix} showValue={showValue} />
      {deleteConfirmModal}
    </div>
  )
}

const outerTabs = [
  { key: 'audit', label: '审核标签' },
  { key: 'scene', label: '场景标签' },
  { key: 'atomicSkill', label: '原子技能标签' },
  { key: 'collectionMethod', label: '采集方式标签' },
  { key: 'taskPurpose', label: '任务用途标签' },
]

export default function TagManage() {
  const [outerTab, setOuterTab] = useState('audit')

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">标签管理</h2>
        <Tabs items={outerTabs} activeKey={outerTab} onChange={setOuterTab} />
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        {outerTab === 'audit' && <AuditReviewTagPanel />}
        {outerTab === 'scene' && <SceneTypePanel />}
        {outerTab === 'atomicSkill' && (
          <FlatTagPanel getData={getAtomicSkillTags} setData={setAtomicSkillTags} idPrefix="SK" showValue />
        )}
        {outerTab === 'collectionMethod' && (
          <FlatTagPanel getData={getCollectionMethodTags} setData={setCollectionMethodTags} idPrefix="CM" showValue />
        )}
        {outerTab === 'taskPurpose' && (
          <FlatTagPanel getData={getTaskPurposeTags} setData={setTaskPurposeTags} idPrefix="TP" showValue />
        )}
      </div>
    </div>
  )
}
