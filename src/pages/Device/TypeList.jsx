import { useEffect, useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { IconPlus } from '../../components/common/Icons'
import {
  getAllDeviceTypes,
  isDeviceTypeNameTaken,
  setDeviceTypes,
  setDeviceInstances,
  countInstancesByTypeId,
} from '../../mock/devices'
import { bodyTypeTags, endTypeTags } from '../../mock/tags'
import { buildTypeNameReference } from '../../utils/deviceTypeName'

const BODY_OPTIONS = bodyTypeTags.map((t) => t.name)
const END_OPTIONS = endTypeTags.map((t) => t.name)

const inputCls = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const readOnlyCls = 'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'
const selectCls = `${inputCls} bg-white`
const FILTER_CLS = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const nowDatetime = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

const emptyTypeForm = () => ({
  name: '',
  body: BODY_OPTIONS[0] ?? '',
  leftEnd: END_OPTIONS[0] ?? '',
  rightEnd: END_OPTIONS[0] ?? '',
  urdf: '',
  description: '',
})

function Field({ label, required, error, errorMsg, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error === 'required' && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      {error === 'duplicate' && <p className="mt-1 text-xs text-red-500">{errorMsg ?? '类型名称已存在，请使用其他名称'}</p>}
    </div>
  )
}

function TypeModal({ open, editing, onCancel, onOk }) {
  const isEdit = Boolean(editing)
  const creatorName = useCurrentNickname()
  const [form, setForm] = useState(emptyTypeForm())
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name ?? '',
        body: editing.body,
        leftEnd: editing.leftEnd,
        rightEnd: editing.rightEnd,
        urdf: editing.urdf ?? '',
        description: editing.description ?? '',
      })
    } else {
      setForm(emptyTypeForm())
    }
    setErrs({})
  }, [open, editing])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrs((e) => ({ ...e, [k]: false }))
  }

  const handleOk = () => {
    const trimmedName = form.name.trim()
    const nextErrs = {}

    if (!trimmedName) nextErrs.name = 'required'
    else if (isDeviceTypeNameTaken(trimmedName, editing?.id)) nextErrs.name = 'duplicate'

    if (!isEdit) {
      if (!form.body) nextErrs.body = 'required'
      if (!form.leftEnd) nextErrs.leftEnd = 'required'
      if (!form.rightEnd) nextErrs.rightEnd = 'required'
    }

    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }

    const ts = nowDatetime()

    if (isEdit) {
      onOk({
        ...editing,
        name: trimmedName,
        description: form.description.trim(),
        updatedAt: ts,
      })
    } else {
      onOk({
        id: `DTY-${Date.now()}`,
        name: trimmedName,
        body: form.body,
        leftEnd: form.leftEnd,
        rightEnd: form.rightEnd,
        urdf: form.urdf.trim(),
        description: form.description.trim(),
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  const referencePreview = buildTypeNameReference(form.body, form.leftEnd, form.rightEnd)

  const renderBodyField = () => {
    if (isEdit) {
      return <input readOnly value={form.body} className={readOnlyCls} />
    }
    return (
      <select value={form.body} onChange={(e) => set('body', e.target.value)} className={selectCls}>
        {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    )
  }

  const renderEndField = (side, value, key) => {
    if (isEdit) {
      return <input readOnly value={value} className={readOnlyCls} />
    }
    return (
      <select value={value} onChange={(e) => set(key, e.target.value)} className={selectCls}>
        {END_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    )
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑设备类型' : '新建设备类型'}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? '确定' : '创建'}
      width={520}
    >
      <div className="space-y-4">
        {!isEdit && <CreatorReadonlyField />}
        <Field label="类型名称" required error={errs.name}>
          <input
            placeholder="请输入类型名称"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls + (errs.name ? ' border-red-400 focus:ring-red-100' : '')}
          />
          <p className="mt-1 text-xs text-gray-400">参考：{referencePreview}</p>
        </Field>
        <Field label="本体" required={!isEdit} error={errs.body}>
          {renderBodyField()}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="左末端类型" required={!isEdit} error={errs.leftEnd}>
            {renderEndField('左', form.leftEnd, 'leftEnd')}
          </Field>
          <Field label="右末端类型" required={!isEdit} error={errs.rightEnd}>
            {renderEndField('右', form.rightEnd, 'rightEnd')}
          </Field>
        </div>
        <Field label="URDF">
          {isEdit ? (
            <input readOnly value={form.urdf} className={readOnlyCls} />
          ) : (
            <input placeholder="请输入 URDF 文件路径（选填）" value={form.urdf} onChange={(e) => set('urdf', e.target.value)} className={inputCls} />
          )}
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

export default function TypeList() {
  const [types, setTypes] = useState(() => getAllDeviceTypes())
  const [bodyFilter, setBodyFilter] = useState('全部')
  const [nameQuery, setNameQuery] = useState('')
  const [leftEndFilter, setLeftEndFilter] = useState('全部')
  const [rightEndFilter, setRightEndFilter] = useState('全部')
  const [applied, setApplied] = useState({
    body: '全部', name: '', leftEnd: '全部', rightEnd: '全部',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const refresh = () => setTypes(getAllDeviceTypes())

  const filtered = useMemo(() => {
    return types.filter((t) => {
      if (applied.body !== '全部' && t.body !== applied.body) return false
      if (applied.name && !t.name.includes(applied.name)) return false
      if (applied.leftEnd !== '全部' && t.leftEnd !== applied.leftEnd) return false
      if (applied.rightEnd !== '全部' && t.rightEnd !== applied.rightEnd) return false
      return true
    })
  }, [types, applied])

  const resetFilters = () => {
    setBodyFilter('全部')
    setNameQuery('')
    setLeftEndFilter('全部')
    setRightEndFilter('全部')
    setApplied({ body: '全部', name: '', leftEnd: '全部', rightEnd: '全部' })
  }

  const applyFilters = () => {
    setApplied({
      body: bodyFilter,
      name: nameQuery.trim(),
      leftEnd: leftEndFilter,
      rightEnd: rightEndFilter,
    })
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingRow(null)
  }

  const handleSave = (type) => {
    const { instanceCount, ...raw } = type
    if (editingRow) {
      setDeviceTypes((prev) => prev.map((t) => (t.id === raw.id ? raw : t)))
    } else {
      setDeviceTypes((prev) => [raw, ...prev])
    }
    refresh()
    closeModal()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const typeId = deleteTarget.id
    setDeviceTypes((prev) => prev.filter((t) => t.id !== typeId))
    setDeviceInstances((prev) => prev.filter((i) => i.typeId !== typeId))
    setDeleteTarget(null)
    refresh()
  }

  const instanceCount = deleteTarget ? countInstancesByTypeId(deleteTarget.id) : 0

  const columns = [
    {
      title: '类型名称',
      dataIndex: 'name',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    { title: '本体', dataIndex: 'body' },
    { title: '左末端类型', dataIndex: 'leftEnd' },
    { title: '右末端类型', dataIndex: 'rightEnd' },
    {
      title: 'URDF',
      dataIndex: 'urdf',
      render: (v) => <span className="font-mono text-xs text-gray-600">{v || '—'}</span>,
    },
    { title: '实例数量', dataIndex: 'instanceCount' },
    {
      title: '类型描述',
      dataIndex: 'description',
      render: (v) => <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span>,
    },
    { title: '创建人', dataIndex: 'creator' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '更新时间', dataIndex: 'updatedAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <PermAction
            permission="device.edit"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
            onClick={() => { setEditingRow(row); setModalOpen(true) }}
          >
            编辑
          </PermAction>
          <PermAction
            permission="device.delete"
            className="cursor-pointer text-sm text-red-500 hover:text-red-400"
            onClick={() => setDeleteTarget(row)}
          >
            删除
          </PermAction>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>本体</label>
              <select
                value={bodyFilter}
                onChange={(e) => setBodyFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>类型名称</label>
              <input
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="输入类型名称搜索"
                className={FILTER_CLS}
              />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>左末端类型</label>
              <select
                value={leftEndFilter}
                onChange={(e) => setLeftEndFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {END_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>右末端类型</label>
              <select
                value={rightEndFilter}
                onChange={(e) => setRightEndFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {END_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">设备类型</h2>
        <PermButton permission="device.create" variant="primary" icon={<IconPlus />} onClick={() => { setEditingRow(null); setModalOpen(true) }}>
          新建类型
        </PermButton>
      </div>

      <Table columns={columns} dataSource={filtered} />

      <TypeModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} />

      <Modal
        open={!!deleteTarget}
        title="删除设备类型"
        onCancel={() => setDeleteTarget(null)}
        onOk={confirmDelete}
        okText="确定"
        cancelText="取消"
        width={480}
      >
        <p className="text-sm leading-relaxed text-gray-600">
          确定删除类型「<strong className="text-gray-800">{deleteTarget?.name}</strong>」？
          {instanceCount > 0 && (
            <>
              {' '}将同时级联删除 <strong className="text-red-600">{instanceCount}</strong> 台设备实例，此操作不可恢复。
            </>
          )}
          {instanceCount === 0 && ' 删除后不可恢复。'}
        </p>
      </Modal>
    </div>
  )
}
