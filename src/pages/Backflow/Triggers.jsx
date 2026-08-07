import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import ListPageCard from '../../components/common/ListPageCard'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { useToast } from '../../components/common/Toast'
import {
  IconBackflowTrigger,
  IconCode,
  IconExternalLink,
  IconLink,
  IconPause,
  IconPencil,
  IconPlay,
  IconPlus,
  IconSearch,
  IconSend,
  IconTrash,
} from '../../components/common/Icons'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  DEFAULT_RULE_CODE,
  addBackflowTrigger,
  deleteBackflowTrigger,
  filterBackflowTriggers,
  getAvailableDevicesForTrigger,
  getBackflowTriggers,
  toggleBackflowTriggerStatus,
  updateBackflowTrigger,
  updateBackflowTriggerDevices,
} from '../../mock/backflowTriggers'

const LBL = 'mb-1.5 block text-sm font-medium text-gray-700'
const REQ = <span className="ml-0.5 text-red-500">*</span>
const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const CODE_AREA_CLS =
  'min-h-[120px] w-full resize-y rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'

function TriggerStatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
        生效中
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      已停用
    </span>
  )
}

function SyncStatusCell({ status }) {
  const map = {
    synced: { dot: 'bg-emerald-500', text: '已同步', color: 'text-gray-700' },
    partial: { dot: 'bg-orange-400', text: '部分同步', color: 'text-gray-700' },
    unsynced: { dot: 'bg-red-500', text: '未同步', color: 'text-gray-700' },
  }
  const cfg = map[status] || map.unsynced
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.text}
    </span>
  )
}

function PushStatusBadge({ status }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        推送成功
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
        推送失败
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-500">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v4l2.5 1.5" strokeLinecap="round" />
      </svg>
      待推送
    </span>
  )
}

function RuleCodeModal({ open, code, onClose }) {
  return (
    <Modal
      open={open}
      title={(
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <IconCode className="h-4 w-4" />
          </span>
          <span>触发规则代码详情</span>
        </span>
      )}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <pre className="overflow-x-auto rounded-lg bg-slate-900 px-5 py-4 font-mono text-sm leading-relaxed text-white">
        {code}
      </pre>
    </Modal>
  )
}

function TriggerFormModal({ open, mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  const reset = () => {
    setForm(initial)
    setErrors({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: false }))
  }

  const handleSave = () => {
    const nextErrors = {}
    if (!form.triggerKey.trim()) nextErrors.triggerKey = true
    if (!form.eventName.trim()) nextErrors.eventName = true
    if (!form.ruleDescription.trim()) nextErrors.ruleDescription = true
    if (!form.ruleCode.trim()) nextErrors.ruleCode = true
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    onSave(form)
    handleClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      title={(
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <IconBackflowTrigger className="h-4 w-4" />
          </span>
          <span>{mode === 'edit' ? '编辑触发器' : '新建触发器'}</span>
        </span>
      )}
      onCancel={handleClose}
      onOk={handleSave}
      okText="保存并应用"
      cancelText="取消"
      width={720}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LBL}>
            Trigger 标识 (英文字符)
            {REQ}
          </label>
          <input
            value={form.triggerKey}
            onChange={(e) => setField('triggerKey', e.target.value)}
            placeholder="例如：ERROR_CODE_01"
            disabled={mode === 'edit'}
            className={`${INPUT_CLS} ${mode === 'edit' ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''} ${errors.triggerKey ? 'border-red-400' : ''}`}
          />
        </div>
        <div>
          <label className={LBL}>
            事件名称
            {REQ}
          </label>
          <input
            value={form.eventName}
            onChange={(e) => setField('eventName', e.target.value)}
            placeholder="触发器的中文业务语义"
            className={`${INPUT_CLS} ${errors.eventName ? 'border-red-400' : ''}`}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={LBL}>
          规则说明
          {REQ}
        </label>
        <input
          value={form.ruleDescription}
          onChange={(e) => setField('ruleDescription', e.target.value)}
          placeholder="例如：网络延迟 > 500ms 持续 10s"
          className={`${INPUT_CLS} ${errors.ruleDescription ? 'border-red-400' : ''}`}
        />
      </div>

      <div className="mt-4">
        <label className={LBL}>
          触发规则定义 (代码)
          {REQ}
        </label>
        <textarea
          value={form.ruleCode}
          onChange={(e) => setField('ruleCode', e.target.value)}
          rows={6}
          className={`${CODE_AREA_CLS} ${errors.ruleCode ? 'border-red-400' : ''}`}
        />
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-400">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" className="mt-0.5 shrink-0" aria-hidden>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7v4M8 5h.01" strokeLinecap="round" />
        </svg>
        此规则将下发至设备端进行边缘计算拦截。
      </p>
    </Modal>
  )
}

function AddDevicesModal({ open, devices, onClose, onConfirm }) {
  const [selected, setSelected] = useState([])

  const toggle = (sn) => {
    setSelected((prev) => (prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]))
  }

  const handleClose = () => {
    setSelected([])
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(selected)
    setSelected([])
  }

  return (
    <Modal
      open={open}
      title="选择设备添加"
      onCancel={handleClose}
      width={520}
      align="nested"
      zIndex={60}
      footer={(
        <>
          <span className="mr-auto text-sm text-gray-500">已选择 {selected.length} 台</span>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="primary" disabled={selected.length === 0} onClick={handleConfirm}>
            确认添加
          </Button>
        </>
      )}
    >
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {devices.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">暂无可添加的设备</p>
        ) : (
          devices.map((d) => {
            const checked = selected.includes(d.sn)
            return (
              <label
                key={d.sn}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  checked ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(d.sn)}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800">{d.sn}</div>
                  <div className="text-xs text-gray-500">{d.alias}</div>
                </div>
              </label>
            )
          })
        )}
      </div>
    </Modal>
  )
}

function DevicesModal({ open, trigger, onClose, onSave }) {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState([])
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (open && trigger) {
      setRows(trigger.devices.map((d) => ({ ...d })))
      setSelected([])
      setAddOpen(false)
    }
    if (!open) {
      setRows([])
      setSelected([])
      setAddOpen(false)
    }
  }, [open, trigger])

  const available = useMemo(() => getAvailableDevicesForTrigger({ devices: rows }), [rows])

  const toggleRow = (sn) => {
    setSelected((prev) => (prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]))
  }

  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([])
    else setSelected(rows.map((r) => r.sn))
  }

  const removeRow = (sn) => {
    setRows((prev) => prev.filter((r) => r.sn !== sn))
    setSelected((prev) => prev.filter((s) => s !== sn))
  }

  const handleAdd = (sns) => {
    const pool = getAvailableDevicesForTrigger({ devices: rows })
    const added = pool
      .filter((d) => sns.includes(d.sn))
      .map((d) => ({ ...d, pushStatus: 'pending' }))
    setRows((prev) => [...prev, ...added])
    setAddOpen(false)
  }

  const handleClose = () => {
    setRows([])
    setSelected([])
    setAddOpen(false)
    onClose()
  }

  const handleSave = () => {
    onSave(rows)
    handleClose()
  }

  if (!open || !trigger) return null

  return (
    <>
      <Modal
        open={open}
        title={(
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <IconLink className="h-4 w-4" />
            </span>
            <span>关联回流设备 - {trigger.eventName}</span>
          </span>
        )}
        onCancel={handleClose}
        width={800}
        footer={(
          <>
            <span className="mr-auto text-sm text-gray-500">已选择 {selected.length} 台设备</span>
            <Button onClick={handleClose}>取消</Button>
            <Button variant="primary" onClick={handleSave}>保存</Button>
          </>
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-sm text-gray-600">
            Trigger 标识：
            <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
              {trigger.triggerKey}
            </code>
          </p>
          <Button
            variant="default"
            icon={<IconPlus />}
            className="shrink-0 border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700"
            onClick={() => setAddOpen(true)}
          >
            批量添加设备
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="bg-gray-50 text-center text-gray-600">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">设备 SN</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">设备别名</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">推送状态</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    暂无关联设备
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.sn}
                    className={`border-t border-gray-100 ${index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.sn)}
                        onChange={() => toggleRow(row.sn)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.sn}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.alias}</td>
                    <td className="px-4 py-3 text-center">
                      <PushStatusBadge status={row.pushStatus} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.sn)}
                        className="cursor-pointer text-sm text-red-500 hover:text-red-400"
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <AddDevicesModal
        open={addOpen}
        devices={available}
        onClose={() => setAddOpen(false)}
        onConfirm={handleAdd}
      />
    </>
  )
}

const EMPTY_FORM = {
  triggerKey: '',
  eventName: '',
  ruleDescription: '',
  ruleCode: DEFAULT_RULE_CODE,
}

export default function BackflowTriggersPage() {
  const navigate = useNavigate()
  const { ToastNode, show: showToast } = useToast()
  const [triggers, setTriggers] = useState(() => getBackflowTriggers())
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  const [codeModal, setCodeModal] = useState(null)
  const [devicesModal, setDevicesModal] = useState(null)
  const [formModal, setFormModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(
    () => filterBackflowTriggers(triggers, { keyword: appliedKeyword }),
    [triggers, appliedKeyword],
  )

  const pageResetKey = useMemo(
    () => `${appliedKeyword}:${filtered.length}`,
    [appliedKeyword, filtered.length],
  )

  const refresh = () => setTriggers(getBackflowTriggers())

  const applySearch = () => setAppliedKeyword(keyword.trim())

  const columns = [
    { title: '触发器 ID', dataIndex: 'id', width: 96 },
    {
      title: 'Trigger 标识',
      dataIndex: 'triggerKey',
      render: (v) => (
        <span className="block max-w-[160px] truncate font-mono text-xs text-gray-600" title={v}>
          {v}
        </span>
      ),
    },
    {
      title: '事件名称',
      dataIndex: 'eventName',
      render: (v) => <span className="text-gray-900">{v}</span>,
    },
    {
      title: '触发规则',
      dataIndex: 'ruleDescription',
      render: (v, row) => (
        <button
          type="button"
          onClick={() => setCodeModal(row)}
          className="group inline-flex max-w-[220px] cursor-pointer items-center gap-1.5 text-left text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500">
            <IconCode className="h-3 w-3" />
          </span>
          <span className="truncate" title={v}>{v}</span>
        </button>
      ),
    },
    {
      title: '关联回流设备',
      key: 'devices',
      render: (_, row) => {
        if (row.deviceMode === 'all') {
          return (
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
              全部 台
            </span>
          )
        }
        const count = row.devices.length
        return (
          <button
            type="button"
            onClick={() => setDevicesModal(row)}
            className="cursor-pointer rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
          >
            {count} 台
          </button>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => <TriggerStatusBadge status={v} />,
    },
    {
      title: '同步情况',
      dataIndex: 'syncStatus',
      render: (v) => <SyncStatusCell status={v} />,
    },
    {
      title: '关联事件',
      key: 'events',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => navigate(`/backflow/events?trigger=${encodeURIComponent(row.triggerKey)}`)}
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-500"
        >
          {row.eventCount} 条记录
          <IconExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="link"
            size="sm"
            className="gap-1 text-emerald-600 hover:text-emerald-500"
            onClick={() => showToast(`已向 ${row.deviceMode === 'all' ? '全部' : row.devices.length} 台设备下发推送：${row.eventName}`)}
          >
            <IconSend className="h-3.5 w-3.5" />
            推送
          </Button>
          {row.status === 'active' ? (
            <Button
              variant="link"
              size="sm"
              className="gap-1 text-orange-500 hover:text-orange-400"
              onClick={() => {
                toggleBackflowTriggerStatus(row.id)
                refresh()
                showToast(`已停用：${row.eventName}`)
              }}
            >
              <IconPause className="h-3.5 w-3.5" />
              停用
            </Button>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="gap-1 text-emerald-600 hover:text-emerald-500"
              onClick={() => {
                toggleBackflowTriggerStatus(row.id)
                refresh()
                showToast(`已启用：${row.eventName}`)
              }}
            >
              <IconPlay className="h-3.5 w-3.5" />
              启用
            </Button>
          )}
          <Button
            variant="link"
            size="sm"
            className="gap-1"
            onClick={() =>
              setFormModal({
                mode: 'edit',
                row,
                initial: {
                  triggerKey: row.triggerKey,
                  eventName: row.eventName,
                  ruleDescription: row.ruleDescription,
                  ruleCode: row.ruleCode,
                },
              })
            }
          >
            <IconPencil className="h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            variant="linkDanger"
            size="sm"
            className="gap-1"
            onClick={() => setDeleteTarget(row)}
          >
            <IconTrash className="h-3.5 w-3.5" />
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <ListPageCard>
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <IconBackflowTrigger className="h-4 w-4" />
              </span>
              <h1 className="text-base font-semibold text-gray-800">触发器配置</h1>
            </div>

            <div className="flex w-[280px] shrink-0">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="搜索Trigger标识或名称"
                className={`${INPUT_CLS} rounded-r-none`}
              />
              <button
                type="button"
                onClick={applySearch}
                aria-label="搜索"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-gray-200 bg-white text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
              >
                <IconSearch />
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<IconPlus />}
            className="shrink-0"
            onClick={() => setFormModal({ mode: 'create', initial: { ...EMPTY_FORM } })}
          >
            新建触发器
          </Button>
        </div>

        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
        />
      </ListPageCard>

      <RuleCodeModal
        open={Boolean(codeModal)}
        code={codeModal?.ruleCode ?? ''}
        onClose={() => setCodeModal(null)}
      />

      <DevicesModal
        open={Boolean(devicesModal)}
        trigger={devicesModal}
        onClose={() => setDevicesModal(null)}
        onSave={(devices) => {
          if (devicesModal) {
            updateBackflowTriggerDevices(devicesModal.id, devices)
            refresh()
            showToast('关联设备已保存')
          }
        }}
      />

      <TriggerFormModal
        key={formModal ? `${formModal.mode}-${formModal.row?.id ?? 'new'}` : 'closed'}
        open={Boolean(formModal)}
        mode={formModal?.mode ?? 'create'}
        initial={formModal?.initial ?? EMPTY_FORM}
        onClose={() => setFormModal(null)}
        onSave={(form) => {
          if (formModal?.mode === 'edit' && formModal.row) {
            updateBackflowTrigger(formModal.row.id, form)
            refresh()
            showToast('触发器已更新')
          } else {
            addBackflowTrigger(form)
            refresh()
            showToast('触发器已创建并应用')
          }
        }}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        message={deleteTarget ? `确定删除触发器「${deleteTarget.eventName}」吗？` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteBackflowTrigger(deleteTarget.id)
            refresh()
            showToast('触发器已删除')
          }
          setDeleteTarget(null)
        }}
      />

      {ToastNode}
    </div>
  )
}
