import { useMemo, useState, useEffect, useCallback } from 'react'
import Drawer from '../common/Drawer'
import Button from '../common/Button'
import Table from '../common/Table'
import ProcessStatusCascader from '../common/ProcessStatusCascader'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  deriveProcessStatuses,
  PROCESS_STATUS_LABEL,
  formatOperatorTooltip,
  getEntryDisplayFileName,
} from '../../utils/entryProcess'
import {
  ACCEPT_RESET_SOURCE_OPTIONS,
  filterEntriesForAcceptReset,
} from '../../utils/entryBatchTransfer'
import { resolveReviewOperator, resolveAcceptOperator } from './entryTableHelpers'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'

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

function ProcessStatusCell({ status, operator }) {
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
  const inner = (
    <span className={`inline-flex items-center gap-1.5 text-sm ${colorCls}`}>
      <StatusIcon status={status} />
      <span>{label}</span>
    </span>
  )
  if (operator && (status === 'passed' || status === 'rejected' || status === 'processing')) {
    return <OperatorTooltipWrap operator={operator} status={status}>{inner}</OperatorTooltipWrap>
  }
  return inner
}

const TARGET_STATUS_OPTIONS = [{ key: 'pending', label: '待处理' }]

export default function AcceptResetDrawer({
  open,
  entries,
  getTask,
  onClose,
  onConfirm,
}) {
  const [sourceStatus, setSourceStatus] = useState(null)
  const [qEntryId, setQEntryId] = useState('')
  const [qFileId, setQFileId] = useState('')
  const [qFileName, setQFileName] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ entryId: '', fileId: '', fileName: '' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const targetStatus = 'pending'

  useEffect(() => {
    if (!open) return
    setSourceStatus(null)
    setQEntryId('')
    setQFileId('')
    setQFileName('')
    setAppliedFilters({ entryId: '', fileId: '', fileName: '' })
    setSelectedIds(new Set())
  }, [open])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [sourceStatus, appliedFilters])

  const scopedEntries = useMemo(
    () => filterEntriesForAcceptReset(entries, sourceStatus, appliedFilters),
    [entries, sourceStatus, appliedFilters],
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

  const handleSearch = () => {
    setAppliedFilters({ entryId: qEntryId, fileId: qFileId, fileName: qFileName })
  }

  const handleResetSearch = () => {
    setQEntryId('')
    setQFileId('')
    setQFileName('')
    setAppliedFilters({ entryId: '', fileId: '', fileName: '' })
  }

  const canConfirm = Boolean(selectedIds.size && sourceStatus)

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm?.({
      entryIds: [...selectedIds],
      sourceProcess: 'accept',
      sourceStatus,
      targetProcess: 'accept',
      targetStatus,
      keepAcceptTags: false,
      flowLabelPrefix: '验收重置',
    })
    onClose()
  }

  const renderStatusCell = useCallback((row, field) => {
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
    return <ProcessStatusCell status={status} operator={operator} />
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
      render: (_, row) => renderStatusCell(row, 'qc'),
    },
    {
      title: '标注状态',
      key: 'review',
      render: (_, row) => renderStatusCell(row, 'review'),
    },
    {
      title: '验收状态',
      key: 'accept',
      render: (_, row) => renderStatusCell(row, 'accept'),
    },
  ]

  const drawerWidth = 'min(920px, calc(100vw - var(--layout-sidebar-width, 13rem)))'

  return (
    <Drawer
      open={open}
      title="验收重置"
      width={drawerWidth}
      onCancel={onClose}
      footer={null}
      zIndex={55}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-800">操作对象</p>
          <div className="space-y-4">
            <div>
              <label className={`${LBL} flex items-center gap-0.5`}>
                数据范围
                <span className="text-red-500">*</span>
              </label>
              <ProcessStatusCascader
                statusOptions={ACCEPT_RESET_SOURCE_OPTIONS}
                value={sourceStatus}
                onChange={setSourceStatus}
                placeholder="请选择"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 basis-0">
                <label className={LBL}>条目ID</label>
                <input
                  value={qEntryId}
                  onChange={(e) => setQEntryId(e.target.value)}
                  placeholder="请输入条目ID"
                  className={INPUT_CLS}
                />
              </div>
              <div className="min-w-0 flex-1 basis-0">
                <label className={LBL}>文件ID</label>
                <input
                  value={qFileId}
                  onChange={(e) => setQFileId(e.target.value)}
                  placeholder="请输入文件ID"
                  className={INPUT_CLS}
                />
              </div>
              <div className="min-w-0 flex-1 basis-0">
                <label className={LBL}>文件名称</label>
                <input
                  value={qFileName}
                  onChange={(e) => setQFileName(e.target.value)}
                  placeholder="请输入文件名称"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={handleResetSearch}>重置</Button>
                <Button variant="primary" onClick={handleSearch} disabled={!sourceStatus}>
                  查询
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-800">操作目标</p>
          <div>
            <label className={`${LBL} flex items-center gap-0.5`}>
              目标状态
              <span className="text-red-500">*</span>
            </label>
            <ProcessStatusCascader
              statusOptions={TARGET_STATUS_OPTIONS}
              value={targetStatus}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">已勾选 {selectedIds.size} 条</span>
          <Button variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
            批量操作
          </Button>
        </div>

        <Table
          embedded
          columns={columns}
          dataSource={sourceStatus ? scopedEntries : []}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={`${sourceStatus}-${appliedFilters.entryId}-${appliedFilters.fileId}-${appliedFilters.fileName}-${scopedEntries.length}`}
        />
      </div>
    </Drawer>
  )
}
