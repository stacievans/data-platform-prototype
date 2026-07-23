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
  getBodyTypeTags,
  setBodyTypeTags,
  getEndTypeTags,
  setEndTypeTags,
  getCollectionMethodTags,
  setCollectionMethodTags,
  getTaskPurposeTags,
  setTaskPurposeTags,
} from '../../mock/tags'
import { useSearchParams } from 'react-router-dom'
import AuditTemplateListPanel from './AuditTemplateListPanel'
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

function FilterBar({ nameQuery, onNameChange, onReset, onSearch, onNew }) {
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
        <Button onClick={onReset}>重置</Button>
        <Button variant="primary" onClick={onSearch}>查询</Button>
      </div>
      <PermButton permission="tag.create" variant="primary" onClick={onNew}>+ 新建标签</PermButton>
    </div>
  )
}

const baseColumns = [
  { title: '标签名称', dataIndex: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
  { title: '描述', dataIndex: 'description', render: (v) => <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span> },
  { title: '创建人', dataIndex: 'creator' },
  dtCol('创建时间', 'createdAt'),
  dtCol('最后更新', 'updatedAt'),
]

function FlatTagModal({ open, editing, onCancel, onOk, idPrefix = 'TAG' }) {
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
    const nextErrs = {}
    if (!form.name.trim()) nextErrs.name = true
    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }

    const ts = now()
    const name = form.name.trim()
    const value = name
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
    <Modal open={open} title={isEdit ? '编辑标签' : '新建标签'} onCancel={onCancel} onOk={handleOk} okText={isEdit ? '确定' : '创建'}>
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

function FlatTagPanel({ panelKey, getData, setData, idPrefix }) {
  const [data, setLocalData] = useState(() => [...getData()])
  const [nameQuery, setNameQuery] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  useEffect(() => {
    setLocalData([...getData()])
    setNameQuery('')
    setAppliedName('')
    setModalOpen(false)
    setEditingRow(null)
  }, [panelKey, getData])

  const sync = (next) => {
    setLocalData(next)
    setData(next)
  }

  const filtered = useMemo(() => data.filter((r) => {
    if (appliedName && !r.name.includes(appliedName)) return false
    return true
  }), [data, appliedName])

  const pageResetKey = `${appliedName}|${data.length}`

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
        onNameChange={setNameQuery}
        onReset={() => { setNameQuery(''); setAppliedName('') }}
        onSearch={() => { setAppliedName(nameQuery) }}
        onNew={() => { setEditingRow(null); setModalOpen(true) }}
      />
      <Table columns={cols} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      <FlatTagModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} idPrefix={idPrefix} />
      {deleteConfirmModal}
    </div>
  )
}

const PRIMARY_TABS = [
  { key: 'collect', label: '采集标签' },
  { key: 'device', label: '设备标签' },
  { key: 'audit', label: '审核模板' },
]

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

function SubTabBar({ items, activeKey, onChange }) {
  return (
    <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeKey === item.key
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
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

export default function TagManage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const initialPrimary = ['collect', 'device', 'audit'].includes(tabFromUrl) ? tabFromUrl : 'collect'
  const [primaryTab, setPrimaryTab] = useState(initialPrimary)
  const [collectSub, setCollectSub] = useState('taskPurpose')
  const [deviceSub, setDeviceSub] = useState('bodyType')

  useEffect(() => {
    if (tabFromUrl && ['collect', 'device', 'audit'].includes(tabFromUrl)) {
      setPrimaryTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handlePrimaryChange = (key) => {
    setPrimaryTab(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'collect') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  const contentKey = primaryTab === 'audit'
    ? 'audit'
    : primaryTab === 'collect'
      ? `collect-${collectSub}`
      : `device-${deviceSub}`

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">标签管理</h2>
        <Tabs items={PRIMARY_TABS} activeKey={primaryTab} onChange={handlePrimaryChange} />
      </div>

      <div key={contentKey} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        {primaryTab === 'audit' && (
          <>
            <h3 className="mb-4 text-base font-semibold text-gray-800">标注标签模板列表</h3>
            <AuditTemplateListPanel />
          </>
        )}
        {primaryTab === 'collect' && (
          <>
            <SubTabBar items={COLLECT_SUB_TABS} activeKey={collectSub} onChange={setCollectSub} />
            <CollectTagPanel subTab={collectSub} />
          </>
        )}
        {primaryTab === 'device' && (
          <>
            <SubTabBar items={DEVICE_SUB_TABS} activeKey={deviceSub} onChange={setDeviceSub} />
            <DeviceTagPanel subTab={deviceSub} />
          </>
        )}
      </div>
    </div>
  )
}
