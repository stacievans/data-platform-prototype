import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import Drawer from '../../components/common/Drawer'
import Table from '../../components/common/Table'
import DataScopeCascader from '../../components/common/DataScopeCascader'
import { IconSearch } from '../../components/common/Icons'
import Modal from '../../components/common/Modal'
import { formatDateTime } from '../../utils/formatDateTime'
import {
  deriveProcessStatuses,
  formatOperatorTooltip,
  getEntryDisplayFileName,
  PROCESS_STATUS_LABEL,
  resolveFlowHistory,
  stripFlowLabelRound,
} from '../../utils/entryProcess'
import { resolveReviewOperator, resolveAcceptOperator } from '../../components/entry/entryTableHelpers'
import { filterBatchTaskEntries } from '../../utils/batchTaskEntryOps'
import { bulkDataScopeLabel, entryHasAnnotationResult, matchBulkDataScope } from '../../utils/batchBulkOperation'
import {
  applyBatchFlowTransfer,
  BATCH_FLOW_TARGET_BY_PROCESS,
  BATCH_FLOW_TARGET_PROCESS_OPTIONS,
  FLOW_DATA_SCOPE_TREE,
  scopeLabelToStatusKey,
} from '../../utils/entryBatchTransfer'
import { formatEntryColorEncoding } from '../../utils/colorEncoding'
import { notifyEntriesChanged } from '../../utils/preAnnotationImport'
import { useAuth } from '../../context/AuthContext'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const COLOR_OPTIONS = ['全部', 'RGB', 'BGR', '-']

const SECONDARY_DRAWER_WIDTH = 'min(420px, 38vw)'
const PRIMARY_DRAWER_WIDTH = 'min(calc(100vw - var(--layout-sidebar-width, 13rem) - 2rem), 960px)'

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

function PreAnnotationImportFailMark() {
  return (
    <span className="group/importfail relative inline-flex shrink-0">
      <span className="cursor-help text-amber-500" aria-label="预标注导入失败">⚠</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover/importfail:block">
        预标注导入失败
      </span>
    </span>
  )
}

function ProcessStatusCell({
  status,
  operator,
  preAnnotationImportFailed = false,
}) {
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
  const showImportFail = preAnnotationImportFailed && (status === 'pending' || status === 'processing')
  const statusMain = (
    <span className={`inline-flex items-center gap-1.5 text-sm ${colorCls}`}>
      <StatusIcon status={status} />
      <span>{label}</span>
    </span>
  )
  const statusWithOperator = operator && (status === 'passed' || status === 'rejected' || status === 'processing')
    ? (
      <OperatorTooltipWrap operator={operator} status={status}>
        {statusMain}
      </OperatorTooltipWrap>
    )
    : statusMain

  return (
    <span className="inline-flex items-center gap-1.5">
      {statusWithOperator}
      {showImportFail && <PreAnnotationImportFailMark />}
    </span>
  )
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

function FlowTimelineModal({ open, entry, task, onClose }) {
  const nodes = useMemo(
    () => (entry ? resolveFlowHistory(entry, task) : []),
    [entry, task, open],
  )
  if (!open || !entry) return null
  return (
    <Modal open={open} title="流转记录" onCancel={onClose} footer={null} width={520}>
      {nodes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">暂无流转记录</p>
      ) : (
        <div className="relative space-y-0 pl-4">
          {nodes.map((node, i) => (
            <div key={`${node.label}-${node.time}-${i}`} className="relative flex gap-3 pb-6 last:pb-0">
              {i < nodes.length - 1 && (
                <span className="absolute left-[7px] top-3 h-[calc(100%-4px)] w-px bg-gray-200" />
              )}
              <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500 bg-white" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800">{stripFlowLabelRound(node.label)}</div>
                <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                  <div>轮次：第 {node.round ?? 1} 轮</div>
                  <div>操作人：{node.operator ?? '—'}</div>
                  <div className="text-gray-400">时间：{formatDateTime(node.time)}</div>
                  {node.batchDetail && <div className="text-gray-400">详情：{node.batchDetail}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

const EMPTY_SCOPE = { process: null, status: null }

export default function BatchFlowTransferDrawer({
  open,
  onClose,
  entries,
  getTask,
  showToast,
  onApplied,
}) {
  const { user } = useAuth()
  const [dataScope, setDataScope] = useState(EMPTY_SCOPE)
  const [qEntryId, setQEntryId] = useState('')
  const [qFileName, setQFileName] = useState('')
  const [colorEncoding, setColorEncoding] = useState('')
  const [queried, setQueried] = useState(false)
  const [appliedScope, setAppliedScope] = useState(EMPTY_SCOPE)
  const [queryResults, setQueryResults] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [targetProcess, setTargetProcess] = useState(null)
  const [targetStatus, setTargetStatus] = useState(null)
  const [flowEntry, setFlowEntry] = useState(null)

  const resetForm = useCallback(() => {
    setDataScope(EMPTY_SCOPE)
    setQEntryId('')
    setQFileName('')
    setColorEncoding('')
    setQueried(false)
    setAppliedScope(EMPTY_SCOPE)
    setQueryResults([])
    setSelectedIds(new Set())
    setSecondaryOpen(false)
    setTargetProcess(null)
    setTargetStatus(null)
  }, [])

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, resetForm])

  const handleReset = () => {
    resetForm()
  }

  const handleQuery = useCallback(() => {
    if (!dataScope.process || !dataScope.status) {
      showToast?.('请选择数据范围')
      return
    }
    let list = entries.filter((e) => matchBulkDataScope(e, dataScope.process, dataScope.status))
    list = filterBatchTaskEntries(
      list,
      {
        entryId: qEntryId,
        fileName: qFileName,
        format: '全部',
        colorEncoding: colorEncoding || '全部',
        collectors: [],
        processTab: dataScope.process,
        subStatus: 'all',
      },
      getTask,
    )
    setAppliedScope({ process: dataScope.process, status: dataScope.status })
    setQueryResults(list)
    setQueried(true)
    setSelectedIds(new Set())
  }, [colorEncoding, dataScope, entries, getTask, qEntryId, qFileName, showToast])

  const allSelected = queryResults.length > 0 && queryResults.every((e) => selectedIds.has(e.id))

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(queryResults.map((e) => e.id)))
  }

  const selectedEntries = useMemo(
    () => queryResults.filter((e) => selectedIds.has(e.id)),
    [queryResults, selectedIds],
  )

  const resultCount = useMemo(
    () => selectedEntries.filter(entryHasAnnotationResult).length,
    [selectedEntries],
  )

  const scopeSummary = useMemo(() => {
    if (!appliedScope.process || !appliedScope.status) return '—'
    return bulkDataScopeLabel(appliedScope.process, appliedScope.status)
  }, [appliedScope])

  const statusOptions = targetProcess ? (BATCH_FLOW_TARGET_BY_PROCESS[targetProcess] ?? []) : []

  const handleOpenSecondary = () => {
    setTargetProcess(null)
    setTargetStatus(null)
    setSecondaryOpen(true)
  }

  const handleCloseAll = () => {
    setSecondaryOpen(false)
    onClose?.()
  }

  const handleConfirm = () => {
    if (!targetProcess || !targetStatus) {
      showToast?.('请选择工序及状态')
      return
    }
    const ids = selectedEntries.map((e) => e.id)
    const operator = { nickname: user.nickname ?? user.username, id: user.uid ?? user.id ?? '' }
    const sourceStatus = scopeLabelToStatusKey(appliedScope.status)
    const count = applyBatchFlowTransfer(ids, {
      targetProcess,
      targetStatus,
      sourceProcess: appliedScope.process,
      sourceStatus,
      operator,
      getTask,
    })
    notifyEntriesChanged()
    onApplied?.()
    handleCloseAll()
    showToast?.(`批量流转成功 ${count} 条`)
  }

  const columns = useMemo(() => [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="全选"
        />
      ),
      width: 48,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleRow(row.id)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`选择 ${row.id}`}
        />
      ),
    },
    {
      title: '条目ID',
      key: 'id',
      dataIndex: 'id',
      render: (v) => <span className="font-medium text-gray-700">{v}</span>,
    },
    {
      title: '文件名称',
      key: 'fileName',
      render: (_, row) => (
        <span className="font-mono text-xs text-gray-700">{getEntryDisplayFileName(row)}</span>
      ),
    },
    {
      title: '所属任务',
      key: 'taskName',
      render: (_, row) => {
        const task = getTask?.(row)
        return <span className="text-gray-700">{row.taskName ?? task?.name ?? '—'}</span>
      },
    },
    {
      title: '色彩编码',
      key: 'colorEncoding',
      render: (_, row) => (
        <span className="font-mono text-xs text-gray-700">{formatEntryColorEncoding(row)}</span>
      ),
    },
    {
      title: '质检状态',
      key: 'qcStatus',
      render: (_, row) => <ProcessStatusCell status={deriveProcessStatuses(row).qc} />,
    },
    {
      title: '标注状态',
      key: 'reviewStatus',
      render: (_, row) => {
        const ps = deriveProcessStatuses(row)
        const task = getTask?.(row)
        const operator = ps.review === 'processing'
          ? row.reviewClaimedBy
          : (ps.review === 'passed' || ps.review === 'rejected') ? resolveReviewOperator(row, task) : null
        return (
          <ProcessStatusCell
            status={ps.review}
            operator={operator}
            preAnnotationImportFailed={Boolean(row.preAnnotationImportFailed)}
          />
        )
      },
    },
    {
      title: '验收状态',
      key: 'acceptStatus',
      render: (_, row) => {
        const ps = deriveProcessStatuses(row)
        const operator = ps.accept === 'processing'
          ? row.acceptClaimedBy
          : (ps.accept === 'passed' || ps.accept === 'rejected') ? resolveAcceptOperator(row) : null
        return <ProcessStatusCell status={ps.accept} operator={operator} />
      },
    },
    {
      title: '流转记录',
      key: 'flow',
      render: (_, row) => <FlowRecordButton onClick={() => setFlowEntry(row)} />,
    },
  ], [allSelected, getTask, selectedIds])

  return (
    <>
      <Drawer
        open={open}
        title="批量流转"
        width={PRIMARY_DRAWER_WIDTH}
        zIndex={50}
        onCancel={handleCloseAll}
        footer={null}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className={LBL}>
                数据范围 <span className="text-red-500">*</span>
              </label>
              <DataScopeCascader
                tree={FLOW_DATA_SCOPE_TREE}
                value={dataScope}
                onChange={setDataScope}
              />
            </div>
            <div>
              <label className={LBL}>条目ID</label>
              <input
                value={qEntryId}
                onChange={(e) => setQEntryId(e.target.value)}
                placeholder="请输入条目ID"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LBL}>文件名称</label>
              <input
                value={qFileName}
                onChange={(e) => setQFileName(e.target.value)}
                placeholder="请输入文件名称"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LBL}>色彩编码</label>
              <select
                value={colorEncoding}
                onChange={(e) => setColorEncoding(e.target.value)}
                className={`${INPUT_CLS} cursor-pointer ${!colorEncoding ? 'text-gray-400' : ''}`}
              >
                <option value="">请选择</option>
                {COLOR_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-1">
              <Button onClick={handleReset}>重置</Button>
              <Button variant="primary" icon={<IconSearch />} onClick={handleQuery}>
                查询
              </Button>
            </div>
          </div>

          {queried ? (
            <>
              <Table embedded columns={columns} dataSource={queryResults} pageSize={10} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">
                  共 {queryResults.length} 条
                  {selectedIds.size > 0 ? `，已选 ${selectedIds.size} 条` : '，已选 0 条'}
                </span>
                <Button
                  variant="primary"
                  disabled={selectedIds.size === 0}
                  onClick={handleOpenSecondary}
                >
                  批量流转
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              请先选择数据范围并点击「查询」，将在此展示符合条件的条目
            </p>
          )}
        </div>
      </Drawer>

      <Drawer
        open={open && secondaryOpen}
        title="批量流转"
        width={SECONDARY_DRAWER_WIDTH}
        zIndex={56}
        onCancel={() => setSecondaryOpen(false)}
        footer={(
          <>
            <Button onClick={() => setSecondaryOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!selectedEntries.length || !targetProcess || !targetStatus}
            >
              确认
            </Button>
          </>
        )}
      >
        <div className="space-y-6 text-sm">
          <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="text-gray-500">已选择</div>
            <div className="mt-1 text-base font-medium text-gray-800">
              {scopeSummary} {selectedEntries.length} 条
            </div>
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="text-gray-500">有结果数</div>
            <div className="mt-1 text-base font-medium text-gray-800">{resultCount} 条</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="shrink-0 font-medium text-gray-700">
              工序 <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {BATCH_FLOW_TARGET_PROCESS_OPTIONS.map((opt) => (
                <label key={opt.key} className="inline-flex cursor-pointer items-center gap-2 text-gray-800">
                  <input
                    type="radio"
                    name="batch-flow-target-process"
                    checked={targetProcess === opt.key}
                    onChange={() => {
                      setTargetProcess(opt.key)
                      setTargetStatus(null)
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="shrink-0 font-medium text-gray-700">
              状态 <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {statusOptions.length === 0 ? (
                <span className="text-sm text-gray-400">请先选择工序</span>
              ) : (
                statusOptions.map((opt) => (
                  <label
                    key={opt.targetStatus}
                    className="inline-flex cursor-pointer items-center gap-2 text-gray-800"
                  >
                    <input
                      type="radio"
                      name="batch-flow-target-status"
                      checked={targetStatus === opt.targetStatus}
                      onChange={() => setTargetStatus(opt.targetStatus)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>{opt.statusLabel}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Drawer>

      <FlowTimelineModal
        open={!!flowEntry}
        entry={flowEntry}
        task={flowEntry ? getTask?.(flowEntry) : null}
        onClose={() => setFlowEntry(null)}
      />
    </>
  )
}
