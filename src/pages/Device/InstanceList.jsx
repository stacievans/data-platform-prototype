import { useEffect, useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { IconPlus } from '../../components/common/Icons'
import {
  getAllDeviceTypes,
  getAllDeviceInstances,
  getNextInstanceCode,
  isDeviceSnTaken,
  setDeviceInstances,
} from '../../mock/devices'
import { dtCol, formatDateTime, nowDateTime } from '../../utils/formatDateTime'

const inputCls = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const readOnlyCls = 'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'
const selectCls = `${inputCls} cursor-pointer bg-white`
const FILTER_CLS = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const now = () => nowDateTime()

const SEGMENT_COLORS = ['#60a5fa', '#a78bfa', '#2dd4bf', '#f472b6', '#fbbf24', '#fb923c']

function computeTypeSegments(instances, types) {
  const total = instances.length
  if (total === 0) return []

  const counts = types
    .map((t) => ({
      id: t.id,
      name: t.name,
      count: instances.filter((i) => i.typeId === t.id).length,
    }))
    .filter((x) => x.count > 0)

  if (counts.length === 0) return []

  const withPct = counts.map((c) => ({
    ...c,
    exact: (c.count / total) * 100,
    pct: Math.round((c.count / total) * 100),
  }))

  let diff = 100 - withPct.reduce((s, c) => s + c.pct, 0)
  if (diff !== 0) {
    const sorted = [...withPct].sort((a, b) =>
      diff > 0
        ? (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact))
        : (Math.ceil(a.exact) - a.exact) - (Math.ceil(b.exact) - b.exact),
    )
    for (let i = 0; i < Math.abs(diff); i++) {
      sorted[i % sorted.length].pct += diff > 0 ? 1 : -1
    }
  }

  return withPct.map(({ id, name, count, pct }) => ({ id, name, count, pct }))
}

function Field({ label, required, error, errorMsg, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error === 'required' && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      {error === 'duplicate' && (
        <p className="mt-1 text-xs text-red-500">{errorMsg ?? '该 SN 已存在'}</p>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white px-3 py-4 text-center shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${accent ?? 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

function TypeProportionBar({ instances, types }) {
  const segments = useMemo(() => computeTypeSegments(instances, types), [instances, types])

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs text-gray-500">设备类型占比</p>
      {segments.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">暂无数据</p>
      ) : (
        <>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
            {segments.map((seg, i) => (
              <div
                key={seg.id}
                className="h-full shrink-0"
                style={{ width: `${seg.pct}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                title={`${seg.name} ${seg.pct}%`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {segments.map((seg, i) => (
              <span key={seg.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                />
                {seg.name} · {seg.pct}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const online = status === '在线'
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span className={`h-2 w-2 shrink-0 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {status}
    </span>
  )
}

function BatteryCell({ battery }) {
  const low = battery < 20
  const fillPct = Math.max(0, Math.min(100, battery))
  return (
    <div className={`flex min-w-[72px] items-center gap-2 text-sm ${low ? 'text-red-500' : 'text-gray-700'}`}>
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <rect x="2" y="7" width="18" height="10" rx="2" />
        <path d="M22 11v2" strokeLinecap="round" />
        <rect x="4" y="9" width={14 * (fillPct / 100)} height="6" rx="1" fill="currentColor" stroke="none" opacity="0.35" />
      </svg>
      <span className="font-medium tabular-nums">{battery}%</span>
    </div>
  )
}

function InstanceModal({ open, editing, types, formTypeId, onTypeIdChange, nextCode, onCancel, onOk }) {
  const isEdit = Boolean(editing)
  const [sn, setSn] = useState('')
  const [description, setDescription] = useState('')
  const [snError, setSnError] = useState(false)
  const [typeError, setTypeError] = useState(false)

  useEffect(() => {
    if (!open) return
    setSn(editing?.sn ?? '')
    setDescription(editing?.description ?? '')
    setSnError(false)
    setTypeError(false)
  }, [open, editing])

  const handleOk = () => {
    const trimmedSn = sn.trim()
    if (!isEdit) {
      if (!trimmedSn) { setSnError('required'); return }
      if (isDeviceSnTaken(trimmedSn)) { setSnError('duplicate'); return }
      if (!formTypeId) { setTypeError(true); return }
      const ts = now()
      onOk({
        id: `INS-${Date.now()}`,
        typeId: formTypeId,
        code: nextCode,
        sn: trimmedSn,
        description: description.trim(),
        status: '离线',
        battery: 100,
        createdAt: ts,
        registeredAt: ts,
        updatedAt: ts,
      })
      return
    }

    if (!formTypeId) { setTypeError(true); return }
    onOk({
      ...editing,
      typeId: formTypeId,
      description: description.trim(),
      updatedAt: now(),
    })
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑设备实例' : '新建设备实例'}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? '确定' : '创建'}
      width={520}
    >
      <div className="space-y-4">
        <Field label="SN" required={!isEdit} error={snError}>
          {isEdit ? (
            <input readOnly value={sn} className={readOnlyCls} />
          ) : (
            <input
              placeholder="请输入 SN 号"
              value={sn}
              onChange={(e) => { setSn(e.target.value); setSnError(false) }}
              className={inputCls + (snError ? ' border-red-400 focus:ring-red-100' : '')}
            />
          )}
        </Field>

        <Field label="设备类型" required error={typeError ? 'required' : false}>
          <select
            value={formTypeId}
            onChange={(e) => { onTypeIdChange(e.target.value); setTypeError(false) }}
            className={selectCls + (typeError ? ' border-red-400' : '')}
          >
            <option value="" disabled hidden>请选择设备类型</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {isEdit && (
            <p className="mt-1.5 text-xs text-gray-400">
              变更类型不影响历史任务和条目中已记录的本体类型
            </p>
          )}
        </Field>

        <Field label="描述">
          <textarea
            placeholder="选填，简要说明设备用途或部署位置"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </Field>
      </div>
    </Modal>
  )
}

export default function InstanceList() {
  const [types] = useState(() => getAllDeviceTypes())
  const [instances, setInstances] = useState(() => getAllDeviceInstances())
  const [typeFilter, setTypeFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [codeQuery, setCodeQuery] = useState('')
  const [snQuery, setSnQuery] = useState('')
  const [applied, setApplied] = useState({ typeId: '全部', status: '全部', code: '', sn: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [formTypeId, setFormTypeId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [nextCode, setNextCode] = useState('')

  const refresh = () => setInstances(getAllDeviceInstances())

  const stats = useMemo(() => {
    const total = instances.length
    const online = instances.filter((i) => i.status === '在线').length
    return { total, online, offline: total - online }
  }, [instances])

  const filtered = useMemo(() => {
    return instances.filter((i) => {
      if (applied.typeId !== '全部' && i.typeId !== applied.typeId) return false
      if (applied.status !== '全部' && i.status !== applied.status) return false
      if (applied.code && !i.code.toLowerCase().includes(applied.code.toLowerCase())) return false
      if (applied.sn && !i.sn.toLowerCase().includes(applied.sn.toLowerCase())) return false
      return true
    })
  }, [instances, applied])

  const resetFilters = () => {
    setTypeFilter('全部')
    setStatusFilter('全部')
    setCodeQuery('')
    setSnQuery('')
    setApplied({ typeId: '全部', status: '全部', code: '', sn: '' })
  }

  const applyFilters = () => {
    setApplied({
      typeId: typeFilter,
      status: statusFilter,
      code: codeQuery.trim(),
      sn: snQuery.trim(),
    })
  }

  const openCreateModal = () => {
    setEditingRow(null)
    setFormTypeId('')
    setNextCode(getNextInstanceCode())
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingRow(null)
  }

  const handleSave = (instance) => {
    const { typeName, ...raw } = instance
    if (editingRow) {
      setDeviceInstances((prev) => prev.map((i) => (i.id === raw.id ? raw : i)))
    } else {
      setDeviceInstances((prev) => [raw, ...prev])
    }
    refresh()
    closeModal()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setDeviceInstances((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    refresh()
    setDeleteTarget(null)
  }

  const columns = [
    { title: 'SN', dataIndex: 'sn', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      title: '设备类型',
      dataIndex: 'typeName',
      render: (v) => <span className="text-sm text-gray-700">{v}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v) => (
        <span className="block max-w-xs truncate text-sm text-gray-600" title={v?.trim() || undefined}>
          {v?.trim() ? v : '—'}
        </span>
      ),
    },
    {
      title: '在线状态',
      dataIndex: 'status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: '电量',
      dataIndex: 'battery',
      render: (v) => <BatteryCell battery={v} />,
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <PermAction permission="device.edit" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500" onClick={() => { setEditingRow(row); setFormTypeId(row.typeId); setModalOpen(true) }}>编辑</PermAction>
          <PermAction permission="device.delete" className="cursor-pointer text-sm text-red-500 hover:text-red-400" onClick={() => setDeleteTarget(row)}>删除</PermAction>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3">
        <div className="flex w-1/4 min-w-0 shrink-0 items-stretch gap-2">
          <StatCard label="设备总数" value={stats.total} />
          <StatCard label="在线" value={stats.online} accent="text-emerald-600" />
          <StatCard label="离线" value={stats.offline} accent="text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <TypeProportionBar instances={instances} types={types} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>所属类型</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                <option value="在线">在线</option>
                <option value="离线">离线</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>实例编号</label>
              <input
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                placeholder="输入实例编号"
                className={FILTER_CLS}
              />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>SN</label>
              <input
                value={snQuery}
                onChange={(e) => setSnQuery(e.target.value)}
                placeholder="输入 SN"
                className={FILTER_CLS}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">设备实例</h2>
        <PermButton permission="device.create" variant="primary" icon={<IconPlus />} onClick={openCreateModal}>
          新建实例
        </PermButton>
      </div>

      <Table columns={columns} dataSource={filtered} />

      <InstanceModal
        open={modalOpen}
        editing={editingRow}
        types={types}
        formTypeId={editingRow?.typeId ?? formTypeId}
        onTypeIdChange={setFormTypeId}
        nextCode={nextCode}
        onCancel={closeModal}
        onOk={handleSave}
      />

      <Modal
        open={!!deleteTarget}
        title="删除设备实例"
        onCancel={() => setDeleteTarget(null)}
        onOk={confirmDelete}
        okText="确定"
        cancelText="取消"
        width={480}
      >
        <p className="text-sm leading-relaxed text-gray-600">
          确定删除实例「<strong className="text-gray-800">{deleteTarget?.code}</strong>」？删除后不可恢复。
        </p>
      </Modal>
    </div>
  )
}
