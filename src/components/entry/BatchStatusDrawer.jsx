import { useMemo, useState, useEffect, useCallback } from 'react'
import Drawer from '../common/Drawer'
import Button from '../common/Button'
import Table from '../common/Table'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  deriveProcessStatuses,
  PROCESS_STATUS_LABEL,
  formatOperatorTooltip,
  getEntryDisplayFileName,
} from '../../utils/entryProcess'
import {
  BATCH_PROCESS_TABS,
  BATCH_SOURCE_STATUS_OPTIONS,
  BATCH_TARGET_STATUS_OPTIONS,
  filterEntriesByBatchScope,
  isBatchTargetDisabled,
  processTabLabel,
  statusKeyLabel,
} from '../../utils/entryBatchTransfer'
import { resolveReviewOperator, resolveAcceptOperator } from './entryTableHelpers'

const LBL = 'mb-1 block text-xs text-gray-500'

function StatusIcon({ status }) {
  if (status === 'passed') {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600">
        ✓
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-bold text-red-500">
        ✕
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
        ·
      </span>
    )
  }
  if (status === 'pending') {
    return <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gray-300" />
  }
  return <span className="text-gray-300">—</span>
}

function OperatorTooltipWrap({ operator, status, children }) {
  const showTip = (status === 'passed' || status === 'rejected' || status === 'processing') && operator
  const tip = formatOperatorTooltip(operator)
  if (!showTip || !tip) return children
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover/tip:block">
        {tip}
      </span>
    </span>
  )
}

function ProcessStatusCell({ status, operator, onClick, clickable = false }) {
  const label = PROCESS_STATUS_LABEL[status] ?? '—'
  const colorCls = status === 'rejected'
    ? 'text-red-600'
    : status === 'passed'
      ? 'text-emerald-700'
      : status === 'processing'
        ? 'text-blue-600'
        : status === 'pending'
          ? 'text-gray-500'
          : 'text-gray-300'
  const canClick = clickable && (status === 'passed' || status === 'rejected')
  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        canClick ? 'cursor-pointer hover:text-blue-600' : ''
      } ${colorCls}`}
      onClick={canClick ? onClick : undefined}
      role={canClick ? 'button' : undefined}
      tabIndex={canClick ? 0 : undefined}
    >
      <StatusIcon status={status} />
      <span>{label}</span>
    </span>
  )
  if (operator && (status === 'passed' || status === 'rejected' || status === 'processing')) {
    return <OperatorTooltipWrap operator={operator} status={status}>{inner}</OperatorTooltipWrap>
  }
  return inner
}

function FlowRecordButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="查看流转记录"
      aria-label="查看流转记录"
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </button>
  )
}

function RoleRadioGroup({ label, required, options, value, onChange, disabledKeys = [] }) {
  return (
    <div>
      <label className={`${LBL}${required ? ' flex items-center gap-0.5' : ''}`}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const disabled = disabledKeys.includes(opt.key) || opt.disabled
          const active = value === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.key)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                disabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                  : active
                    ? 'cursor-pointer border-blue-600 bg-blue-600 text-white'
                    : 'cursor-pointer border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BatchStatusDrawer({
  open,
  entries,
  getTask,
  onClose,
  onConfirm,
  onQcDetail,
  onReviewDetail,
  onAcceptDetail,
  onFlowDetail,
}) {
  const [sourceProcess, setSourceProcess] = useState(null)
  const [sourceStatus, setSourceStatus] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [targetOpen, setTargetOpen] = useState(false)
  const [targetProcess, setTargetProcess] = useState(null)
  const [targetStatus, setTargetStatus] = useState(null)
  const [keepReviewTags, setKeepReviewTags] = useState(null)
  const [keepAcceptTags, setKeepAcceptTags] = useState(null)

  const scopedEntries = useMemo(
    () => filterEntriesByBatchScope(entries, sourceProcess, sourceStatus),
    [entries, sourceProcess, sourceStatus],
  )

  useEffect(() => {
    if (!open) return
    setSourceProcess(null)
    setSourceStatus(null)
    setSelectedIds(new Set())
    setTargetOpen(false)
    setTargetProcess(null)
    setTargetStatus(null)
    setKeepReviewTags(null)
    setKeepAcceptTags(null)
  }, [open])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [sourceProcess, sourceStatus])

  const selectedEntries = useMemo(
    () => scopedEntries.filter((e) => selectedIds.has(e.id)),
    [scopedEntries, selectedIds],
  )

  const allSelected = scopedEntries.length > 0 && scopedEntries.every((e) => selectedIds.has(e.id))

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(scopedEntries.map((e) => e.id)))
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openTargetDrawer = () => {
    if (!selectedIds.size) return
    setTargetProcess(null)
    setTargetStatus(null)
    setKeepReviewTags(null)
    setKeepAcceptTags(null)
    setTargetOpen(true)
  }

  const isTargetComboDisabled = useCallback((proc, status) => {
    if (!sourceProcess || !sourceStatus) return false
    return isBatchTargetDisabled(sourceProcess, sourceStatus, proc, status)
  }, [sourceProcess, sourceStatus])

  const canConfirm = Boolean(
    targetProcess
    && targetStatus
    && (targetProcess !== 'review' || keepReviewTags)
    && (targetProcess !== 'accept' || keepAcceptTags),
  )

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm?.({
      entryIds: [...selectedIds],
      sourceProcess,
      sourceStatus,
      targetProcess,
      targetStatus,
      keepReviewTags: keepReviewTags === 'yes',
      keepAcceptTags: keepAcceptTags === 'yes',
    })
    setTargetOpen(false)
    onClose()
  }

  const handleCloseAll = () => {
    setTargetOpen(false)
    onClose()
  }

  const renderStatusCell = useCallback((row, field, onDetail) => {
    const ps = deriveProcessStatuses(row)
    const status = ps[field]
    const task = getTask?.(row)
    let operator = null
    if (field === 'review') {
      operator = status === 'processing'
        ? row.reviewClaimedBy
        : (status === 'passed' || status === 'rejected') ? resolveReviewOperator(row, task) : null
    } else if (field === 'accept') {
      operator = status === 'processing'
        ? row.acceptClaimedBy
        : (status === 'passed' || status === 'rejected') ? resolveAcceptOperator(row) : null
    }
    return (
      <ProcessStatusCell
        status={status}
        operator={operator}
        clickable={status === 'passed' || status === 'rejected'}
        onClick={() => onDetail?.(row)}
      />
    )
  }, [getTask])

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          disabled={!scopedEntries.length}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
          aria-label="全选"
        />
      ),
      key: 'select',
      width: 48,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleRow(row.id)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    { title: '条目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    {
      title: '文件ID',
      dataIndex: 'fileId',
      render: (v, row) => <span className="font-mono text-xs text-gray-600">{v ?? row.id.replace('E-', 'F-')}</span>,
    },
    {
      title: '文件名称',
      key: 'displayName',
      render: (_, row) => <span className="font-mono text-xs">{getEntryDisplayFileName(row)}</span>,
    },
    {
      title: '质检状态',
      key: 'qc',
      render: (_, row) => renderStatusCell(row, 'qc', onQcDetail),
    },
    {
      title: '标注状态',
      key: 'review',
      render: (_, row) => renderStatusCell(row, 'review', onReviewDetail),
    },
    {
      title: '验收状态',
      key: 'accept',
      render: (_, row) => renderStatusCell(row, 'accept', onAcceptDetail),
    },
    {
      title: '流转记录',
      key: 'flow',
      render: (_, row) => <FlowRecordButton onClick={() => onFlowDetail?.(row)} />,
    },
  ]

  const drawerWidth = 'min(920px, calc(100vw - var(--layout-sidebar-width, 13rem)))'
  const targetWidth = 'min(520px, calc(100vw - var(--layout-sidebar-width, 13rem)))'

  return (
    <>
      <Drawer
        open={open}
        title="批量操作对象"
        width={drawerWidth}
        onCancel={handleCloseAll}
        footer={null}
        zIndex={55}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-800">数据范围</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <RoleRadioGroup
                label="工序"
                required
                options={BATCH_PROCESS_TABS}
                value={sourceProcess}
                onChange={setSourceProcess}
              />
              <RoleRadioGroup
                label="状态"
                required
                options={BATCH_SOURCE_STATUS_OPTIONS}
                value={sourceStatus}
                onChange={setSourceStatus}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">已勾选 {selectedIds.size} 条</span>
            <Button variant="primary" disabled={!selectedIds.size} onClick={openTargetDrawer}>
              批量操作
            </Button>
          </div>

          <Table
            embedded
            columns={columns}
            dataSource={scopedEntries}
            pageSize={LIST_PAGE_SIZE}
            pageResetKey={`${sourceProcess}-${sourceStatus}-${scopedEntries.length}`}
          />
        </div>
      </Drawer>

      <Drawer
        open={open && targetOpen}
        title="批量操作目标"
        width={targetWidth}
        onCancel={() => setTargetOpen(false)}
        onOk={handleConfirm}
        okText="确定"
        okDisabled={!canConfirm}
        zIndex={65}
        mask={false}
      >
        <div className="space-y-5">
          {sourceProcess && sourceStatus && (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              已选中：{processTabLabel(sourceProcess)}/{statusKeyLabel(sourceStatus)} {selectedEntries.length} 条
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-medium text-gray-800">操作目标</p>
            <div className="space-y-4">
              <div>
                <RoleRadioGroup
                  label="工序"
                  required
                  options={BATCH_PROCESS_TABS}
                  value={targetProcess}
                  onChange={(proc) => {
                    setTargetProcess(proc)
                    setKeepReviewTags(null)
                    setKeepAcceptTags(null)
                  }}
                  disabledKeys={BATCH_PROCESS_TABS.filter((p) =>
                    BATCH_TARGET_STATUS_OPTIONS.every((s) => isTargetComboDisabled(p.key, s.key)),
                  ).map((p) => p.key)}
                />
              </div>
              <div>
                <RoleRadioGroup
                  label="目标状态"
                  required
                  options={BATCH_TARGET_STATUS_OPTIONS.map((opt) => ({
                    ...opt,
                    disabled: targetProcess ? isTargetComboDisabled(targetProcess, opt.key) : false,
                  }))}
                  value={targetStatus}
                  onChange={setTargetStatus}
                />
              </div>
            </div>
          </div>

          {targetProcess === 'qc' && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              质检结果：保留上一轮质检结果，重新质检后自动更新
            </div>
          )}

          {targetProcess === 'review' && (
            <RoleRadioGroup
              label="是否保留历史标注标签"
              required
              options={[
                { key: 'yes', label: '是' },
                { key: 'no', label: '否' },
              ]}
              value={keepReviewTags}
              onChange={setKeepReviewTags}
            />
          )}

          {targetProcess === 'accept' && (
            <RoleRadioGroup
              label="是否保留历史验收标签"
              required
              options={[
                { key: 'yes', label: '是' },
                { key: 'no', label: '否' },
              ]}
              value={keepAcceptTags}
              onChange={setKeepAcceptTags}
            />
          )}
        </div>
      </Drawer>
    </>
  )
}
