import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Tabs from '../../components/common/Tabs'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import { IconPlus } from '../../components/common/Icons'
import { PermButton } from '../../components/common/PermissionAction'
import Drawer from '../../components/common/Drawer'
import { DescriptionField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import {
  getAtomicSkillTags,
  setAtomicSkillTags,
  getBodyTypeTags,
  setBodyTypeTags,
  getEndTypeTags,
  setEndTypeTags,
  getCollectionMethodTags,
  setCollectionMethodTags,
  getTaskPurposeTags,
  setTaskPurposeTags,
} from '../../mock/tags'
import AuditTemplateListPanel from './AuditTemplateListPanel'
import SceneTypePanel from './SceneTypePanel'
import {
  isAtomicSkillTagBoundToTask,
  isBodyTypeTagBoundToTask,
  isCollectionMethodTagBoundToTask,
  isEndTypeTagBoundToTask,
  isTaskPurposeTagBoundToTask,
} from '../../mock/tasks'
import { useTagRowActions } from './TagTableActions'

const TAG_BOUND_CHECKERS = {
  taskPurpose: isTaskPurposeTagBoundToTask,
  collectionMethod: isCollectionMethodTagBoundToTask,
  atomicSkill: isAtomicSkillTagBoundToTask,
  bodyType: isBodyTypeTagBoundToTask,
  endType: isEndTypeTagBoundToTask,
}

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
      <PermButton permission="tag.create" variant="primary" icon={<IconPlus />} onClick={onNew}>新建</PermButton>
    </div>
  )
}

const baseColumns = [
  { title: '标签名称', dataIndex: 'name', render: (v) => <span className="font-bold text-gray-800">{v}</span> },
  { title: '标签值', dataIndex: 'value', render: (v, row) => <span className="text-gray-600">{v ?? row.name ?? '—'}</span> },
  { title: '描述', dataIndex: 'description', render: (v) => <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span> },
  { title: '创建人', dataIndex: 'creator', render: (v) => <span className="text-gray-600">{v || '—'}</span> },
  dtCol('创建时间', 'createdAt'),
  dtCol('更新时间', 'updatedAt'),
]

function FlatTagModal({ open, editing, onCancel, onOk, idPrefix = 'TAG' }) {
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
    if (!form.value.trim()) nextErrs.value = true
    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }

    const ts = now()
    const value = form.value.trim()
    const name = form.name.trim()
    if (isEdit) {
      onOk({ ...editing, name, value, description: form.description.trim(), updatedAt: ts })
    } else {
      onOk({
        id: `${idPrefix}-${Date.now()}`,
        name,
        value,
        description: form.description.trim(),
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  return (
    <Drawer open={open} title={isEdit ? '编辑标签' : '新建标签'} onCancel={onCancel} onOk={handleOk} okText="确定">
      <div className="space-y-4">
        <Field label="标签名称" required error={errs.name}>
          <input placeholder="请输入标签名称" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls(errs.name)} />
        </Field>
        <Field label="标签值" required error={errs.value}>
          <input placeholder="请输入标签值" value={form.value} onChange={(e) => set('value', e.target.value)} className={inputCls(errs.value)} />
        </Field>
        <DescriptionField
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
    </Drawer>
  )
}

function FlatTagPanel({ panelKey, getData, setData, idPrefix }) {
  const [data, setLocalData] = useState(() => [...getData()])
  const [nameQuery, setNameQuery] = useState('')
  const [valueQuery, setValueQuery] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [appliedValue, setAppliedValue] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  useEffect(() => {
    setLocalData([...getData()])
    setNameQuery('')
    setValueQuery('')
    setAppliedName('')
    setAppliedValue('')
    setModalOpen(false)
    setEditingRow(null)
  }, [panelKey, getData])

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

  const isTagBound = (row) => TAG_BOUND_CHECKERS[panelKey]?.(row) ?? false

  const handleSave = (tag) => {
    if (editingRow && isTagBound(editingRow)) return
    if (editingRow) {
      sync(data.map((r) => (r.id === tag.id ? tag : r)))
    } else {
      sync([tag, ...data])
    }
    closeModal()
  }

  const { actionColumn, deleteConfirmModal } = useTagRowActions({
    isBound: isTagBound,
    onEdit: (row) => { setEditingRow(row); setModalOpen(true) },
    onDelete: (row) => sync(data.filter((r) => r.id !== row.id)),
  })

  const cols = [...baseColumns, actionColumn]

  return (
    <ListPageCard>
      <ListPageFilter>
        <FilterBar
          nameQuery={nameQuery}
          valueQuery={valueQuery}
          onNameChange={setNameQuery}
          onValueChange={setValueQuery}
          onReset={() => { setNameQuery(''); setValueQuery(''); setAppliedName(''); setAppliedValue('') }}
          onSearch={() => { setAppliedName(nameQuery); setAppliedValue(valueQuery) }}
          onNew={() => { setEditingRow(null); setModalOpen(true) }}
        />
      </ListPageFilter>
      <Table embedded columns={cols} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      <FlatTagModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} idPrefix={idPrefix} />
      {deleteConfirmModal}
    </ListPageCard>
  )
}

const COLLECT_SUB_TABS = [
  { key: 'taskPurpose', label: '任务用途标签' },
  { key: 'collectionMethod', label: '采集方式标签' },
  { key: 'scene', label: '场景标签' },
  { key: 'atomicSkill', label: '原子技能标签' },
]

const DEVICE_SUB_TABS = [
  { key: 'bodyType', label: '本体机型标签' },
  { key: 'endType', label: '末端类型标签' },
]

const AUDIT_SUB_TABS = [
  { key: 'template', label: '标注标签模板' },
]

const SECTION_CONFIG = {
  collect: {
    subTabs: COLLECT_SUB_TABS,
    defaultSub: 'taskPurpose',
  },
  device: {
    subTabs: DEVICE_SUB_TABS,
    defaultSub: 'bodyType',
  },
  audit: {
    subTabs: AUDIT_SUB_TABS,
    defaultSub: 'template',
  },
}

function getSectionFromPath(pathname) {
  if (pathname.startsWith('/tag/audit')) return 'audit'
  if (pathname.startsWith('/tag/device')) return 'device'
  return 'collect'
}

function CollectTagPanel({ subTab }) {
  if (subTab === 'scene') return <SceneTypePanel key="scene" />
  if (subTab === 'atomicSkill') {
    return (
      <FlatTagPanel
        key="atomicSkill"
        panelKey="atomicSkill"
        getData={getAtomicSkillTags}
        setData={setAtomicSkillTags}
        idPrefix="SK"
      />
    )
  }
  if (subTab === 'collectionMethod') {
    return (
      <FlatTagPanel
        key="collectionMethod"
        panelKey="collectionMethod"
        getData={getCollectionMethodTags}
        setData={setCollectionMethodTags}
        idPrefix="CM"
      />
    )
  }
  return (
    <FlatTagPanel
      key="taskPurpose"
      panelKey="taskPurpose"
      getData={getTaskPurposeTags}
      setData={setTaskPurposeTags}
      idPrefix="TP"
    />
  )
}

function DeviceTagPanel({ subTab }) {
  if (subTab === 'endType') {
    return (
      <FlatTagPanel
        key="endType"
        panelKey="endType"
        getData={getEndTypeTags}
        setData={setEndTypeTags}
        idPrefix="ET"
      />
    )
  }
  return (
    <FlatTagPanel
      key="bodyType"
      panelKey="bodyType"
      getData={getBodyTypeTags}
      setData={setBodyTypeTags}
      idPrefix="BT"
    />
  )
}

function SectionContent({ section, subTab }) {
  if (section === 'audit') return <AuditTemplateListPanel key="audit-template" />
  if (section === 'collect') return <CollectTagPanel subTab={subTab} />
  return <DeviceTagPanel subTab={subTab} />
}

export default function TagManage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const section = getSectionFromPath(location.pathname)
  const config = SECTION_CONFIG[section]
  const validSubs = useMemo(() => config.subTabs.map((t) => t.key), [config.subTabs])
  const subFromUrl = searchParams.get('sub')
  const activeSub = validSubs.includes(subFromUrl) ? subFromUrl : config.defaultSub

  useEffect(() => {
    const legacyTab = searchParams.get('tab')
    if (!legacyTab) return
    const target = legacyTab === 'device'
      ? '/tag/device'
      : legacyTab === 'audit'
        ? '/tag/audit'
        : '/tag/collect'
    const next = new URLSearchParams(searchParams)
    next.delete('tab')
    const qs = next.toString()
    navigate(qs ? `${target}?${qs}` : target, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time legacy ?tab= migration
  }, [])

  useEffect(() => {
    if (subFromUrl && !validSubs.includes(subFromUrl)) {
      const next = new URLSearchParams(searchParams)
      next.delete('sub')
      setSearchParams(next, { replace: true })
    }
  }, [section, subFromUrl, validSubs, searchParams, setSearchParams])

  const handleSubChange = (key) => {
    const next = new URLSearchParams(searchParams)
    if (key === config.defaultSub) next.delete('sub')
    else next.set('sub', key)
    setSearchParams(next, { replace: true })
  }

  const contentKey = section === 'audit' ? 'audit' : `${section}-${activeSub}`

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-4 shadow-sm">
        <Tabs items={config.subTabs} activeKey={activeSub} onChange={handleSubChange} />
      </div>

      <div key={contentKey}>
        <SectionContent section={section} subTab={activeSub} />
      </div>
    </div>
  )
}
