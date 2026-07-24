import { useEffect, useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { IconPlus } from '../../components/common/Icons'
import {
  getAllDeviceInstances,
  getNextInstanceCode,
  getNextInstanceId,
  isDeviceCodeTaken,
  isDeviceSnTaken,
  setDeviceInstances,
} from '../../mock/devices'
import { dtCol, formatDateTime, nowDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const inputCls = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const readOnlyCls = 'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'
const FILTER_CLS = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const now = () => nowDateTime()

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
      {error === 'duplicate_code' && (
        <p className="mt-1 text-xs text-red-500">该设备名称已存在，请使用其他设备名称</p>
      )}
    </div>
  )
}

function InstanceModal({ open, editing, defaultCode, onCancel, onOk }) {
  const isEdit = Boolean(editing)
  const [code, setCode] = useState('')
  const [sn, setSn] = useState('')
  const [description, setDescription] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [snError, setSnError] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode(editing?.code ?? defaultCode ?? '')
    setSn(editing?.sn ?? '')
    setDescription(editing?.description ?? '')
    setCodeError(false)
    setSnError(false)
  }, [open, editing, defaultCode])

  const handleOk = () => {
    const trimmedCode = code.trim()
    const trimmedSn = sn.trim()

    if (!isEdit) {
      if (!trimmedCode) { setCodeError('required'); return }
      if (isDeviceCodeTaken(trimmedCode)) { setCodeError('duplicate_code'); return }
      if (!trimmedSn) { setSnError('required'); return }
      if (isDeviceSnTaken(trimmedSn)) { setSnError('duplicate'); return }
      const ts = now()
      onOk({
        id: getNextInstanceId(),
        code: trimmedCode,
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

    if (!trimmedCode) { setCodeError('required'); return }
    if (isDeviceCodeTaken(trimmedCode, editing.id)) { setCodeError('duplicate_code'); return }

    onOk({
      ...editing,
      code: trimmedCode,
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
        <Field label="设备名称" required error={codeError}>
          <input
            placeholder="请输入设备名称"
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeError(false) }}
            className={inputCls + (codeError ? ' border-red-400 focus:ring-red-100' : '')}
          />
        </Field>

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
  const [instances, setInstances] = useState(() => getAllDeviceInstances())
  const [codeQuery, setCodeQuery] = useState('')
  const [snQuery, setSnQuery] = useState('')
  const [applied, setApplied] = useState({ code: '', sn: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [nextCode, setNextCode] = useState('')

  const refresh = () => setInstances(getAllDeviceInstances())

  const filtered = useMemo(() => {
    return instances.filter((i) => {
      if (applied.code && !i.code.toLowerCase().includes(applied.code.toLowerCase())) return false
      if (applied.sn && !i.sn.toLowerCase().includes(applied.sn.toLowerCase())) return false
      return true
    })
  }, [instances, applied])

  const pageResetKey = useMemo(() => `${JSON.stringify(applied)}:${filtered.length}`, [applied, filtered.length])

  const resetFilters = () => {
    setCodeQuery('')
    setSnQuery('')
    setApplied({ code: '', sn: '' })
  }

  const applyFilters = () => {
    setApplied({
      code: codeQuery.trim(),
      sn: snQuery.trim(),
    })
  }

  const openCreateModal = () => {
    setEditingRow(null)
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
    {
      title: '编号',
      dataIndex: 'id',
      render: (v) => <span className="font-mono text-xs text-gray-700">{v ?? '—'}</span>,
    },
    {
      title: '设备名称',
      dataIndex: 'code',
      render: (v) => <span className="font-mono text-xs font-medium text-gray-800">{v}</span>,
    },
    { title: 'SN', dataIndex: 'sn', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v) => (
        <span className="block max-w-xs truncate text-sm text-gray-600" title={v?.trim() || undefined}>
          {v?.trim() ? v : '—'}
        </span>
      ),
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <PermAction permission="device.edit" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500" onClick={() => { setEditingRow(row); setModalOpen(true) }}>编辑</PermAction>
          <PermAction permission="device.delete" className="cursor-pointer text-sm text-red-500 hover:text-red-400" onClick={() => setDeleteTarget(row)}>删除</PermAction>
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
              <label className={LBL}>设备名称</label>
              <input
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                placeholder="输入设备名称"
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

      <Table columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />

      <InstanceModal
        open={modalOpen}
        editing={editingRow}
        defaultCode={nextCode}
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
