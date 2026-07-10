import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { IconSearch, IconChevronDown } from '../common/Icons'
import { useToast } from '../common/Toast'
import { getQcItemsByProjectId } from '../../mock/plans'
import { resolveQcRowResult } from '../../utils/qcResults'
import { formatReviewer } from '../../mock/tasks'
import EntryActions from '../common/EntryActions'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  deriveProcessStatuses,
  PROCESS_STATUS_LABEL,
  PROCESS_TABS,
  PROCESS_SUB_STATUS_OPTIONS,
  FORM_PROCESS_STATUS_OPTIONS,
  formatOperatorTooltip,
  getEntryDisplayFileName,
  getEntryCollectTime,
  resolveFlowHistory,
  matchProcessSubFilter,
  countProcessSubStatuses,
  filterEntriesByForm,
} from '../../utils/entryProcess'
import { CollectDeviceCell } from '../../utils/deviceDisplay'
import { formatDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FORMAT_OPTIONS = ['全部', 'h5', 'LeRobot']
const ROW_LABEL_CLS = 'shrink-0 w-10 text-sm text-gray-500'
const FILTER_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
const FILTER_FIELD = 'min-w-0'
const FILTER_ACTIONS = 'flex flex-wrap items-center justify-end gap-2'

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

function ColumnTitleHint({ label, hint }) {
  const triggerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 })
  }, [])

  const show = () => { updatePos(); setVisible(true) }
  const hide = () => setVisible(false)

  useEffect(() => {
    if (!visible) return undefined
    const onReposition = () => updatePos()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [visible, updatePos])

  const tooltip = visible ? createPortal(
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)', zIndex: 9999 }}
      className="pointer-events-none whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-normal text-white shadow"
      role="tooltip"
    >
      {hint}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <span className="inline-flex items-center justify-center gap-1">
        <span>{label}</span>
        <span
          ref={triggerRef}
          className="inline-flex cursor-help text-xs font-normal leading-none text-gray-400"
          aria-label={hint}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
        >
          ⓘ
        </span>
      </span>
      {tooltip}
    </>
  )
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
      onKeyDown={canClick ? (e) => e.key === 'Enter' && onClick?.() : undefined}
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

function ProcessTabBar({ activeKey, onChange }) {
  return (
    <div className="flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
      {PROCESS_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeKey === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function ProcessSubFilterBar({ counts, activeKey, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROCESS_SUB_STATUS_OPTIONS.map((opt) => {
        const count = counts[opt.key] ?? 0
        const active = activeKey === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
              active
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {opt.label} {count}
          </button>
        )
      })}
    </div>
  )
}

function QcDetailModal({ open, entry, projectId, onClose }) {
  const qcItems = useMemo(() => getQcItemsByProjectId(projectId), [projectId, open])
  if (!open || !entry) return null
  return (
    <Modal open={open} title="质检详情" onCancel={onClose} footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>关闭</Button></div>} width={720}>
      <div className="space-y-4">
        <div className="text-sm text-gray-500">
          质检时间：<span className="font-medium text-gray-800">{formatDateTime(entry.qcTime ?? entry.uploadTime)}</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">质检分类</th>
                <th className="px-3 py-2 font-medium">质检项</th>
                <th className="px-3 py-2 font-medium">检查结果</th>
                <th className="px-3 py-2 font-medium">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {qcItems.map((item) => {
                const row = resolveQcRowResult(entry, item)
                const passed = row.passed !== false
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2.5 text-gray-700">{item.type}</td>
                    <td className="px-3 py-2.5 text-gray-700">{item.name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                        <StatusIcon status={passed ? 'passed' : 'rejected'} />
                        {passed ? '已通过' : '不通过'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{row.detail ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

function FlowTimelineModal({ open, entry, task, onClose }) {
  const nodes = useMemo(() => (entry && task ? resolveFlowHistory(entry, task) : []), [entry, task, open])
  if (!open || !entry) return null
  return (
    <Modal open={open} title="流转记录" onCancel={onClose} footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>关闭</Button></div>} width={520}>
      {nodes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">暂无流转记录</p>
      ) : (
        <div className="relative space-y-0 pl-4">
          {nodes.map((node, i) => (
            <div key={`${node.label}-${node.time}-${i}`} className="relative flex gap-3 pb-6 last:pb-0">
              {i < nodes.length - 1 && <span className="absolute left-[7px] top-3 h-[calc(100%-4px)] w-px bg-gray-200" />}
              <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500 bg-white" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800">{node.label}</div>
                <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                  <div>轮次：第 {node.round ?? 1} 轮</div>
                  <div>操作人：{node.operator ?? '—'}</div>
                  <div className="text-gray-400">时间：{formatDateTime(node.time)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function DeleteEntryConfirmModal({ entry, open, onCancel, onConfirm, title = '删除采集条目' }) {
  const [input, setInput] = useState('')
  const match = input === entry?.fileName
  const reset = () => setInput('')
  if (!open || !entry) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-600">{title}</h2>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-500">
            此操作不可逆。如果确定要删除，请在下方输入{' '}
            <strong className="font-mono text-xs text-gray-800">{entry.fileName}</strong>{' '}以确认。
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入文件名以确认"
            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={() => { reset(); onCancel() }} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50">取消</button>
          <button type="button" disabled={!match} onClick={() => { reset(); onConfirm() }} className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${match ? 'cursor-pointer bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-200'}`}>确定删除</button>
        </div>
      </div>
    </div>
  )
}

function resolveReviewOperator(entry, task) {
  return entry.reviewOperator ?? {
    nickname: formatReviewer(task?.reviewer) === '—' ? '孙丽' : formatReviewer(task.reviewer),
    id: 'U-2001',
  }
}

function resolveAcceptOperator(entry) {
  return entry.acceptOperator ?? { nickname: '陈静', id: 'U-2002' }
}

export default function EntryDataTable({
  entries,
  getTask,
  getProjectId,
  onDelete,
  listTitle = '条目列表',
  deleteModalTitle = '删除采集条目',
  hideProcessTabs = false,
  showScopeColumns = false,
}) {
  const { ToastNode, show: showToast } = useToast()

  const [processTab, setProcessTab] = useState('qc')
  const [subStatus, setSubStatus] = useState('all')
  const [qEntryId, setQEntryId] = useState('')
  const [qProjectName, setQProjectName] = useState('')
  const [qTaskName, setQTaskName] = useState('')
  const [qFileName, setQFileName] = useState('')
  const [qQcStatus, setQQcStatus] = useState('全部')
  const [qReviewStatus, setQReviewStatus] = useState('全部')
  const [qAcceptStatus, setQAcceptStatus] = useState('全部')
  const [qFormat, setQFormat] = useState('全部')
  const [filters, setFilters] = useState({})
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [qcTarget, setQcTarget] = useState(null)
  const [flowTarget, setFlowTarget] = useState(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const resolveScope = useCallback((entry) => {
    const task = getTask?.(entry)
    return {
      projectName: entry.projectName ?? task?.projectName ?? '',
      taskName: entry.taskName ?? task?.name ?? '',
    }
  }, [getTask])

  const formFiltered = useMemo(
    () => entries.filter((e) => filterEntriesByForm(e, filters, resolveScope)),
    [entries, filters, resolveScope],
  )

  const subCounts = useMemo(
    () => (hideProcessTabs
      ? { all: formFiltered.length, pending: 0, processing: 0, passed: 0, rejected: 0 }
      : countProcessSubStatuses(formFiltered, processTab)),
    [formFiltered, processTab, hideProcessTabs],
  )

  const visibleEntries = useMemo(
    () => (hideProcessTabs
      ? formFiltered
      : formFiltered.filter((e) => matchProcessSubFilter(e, processTab, subStatus))),
    [formFiltered, processTab, subStatus, hideProcessTabs],
  )

  useEffect(() => {
    setSelectedIds(new Set())
  }, [processTab, subStatus, filters, entries])

  const handleProcessTabChange = (tab) => {
    setProcessTab(tab)
    setSubStatus('all')
  }

  const applyFilters = () => setFilters({
    entryId: qEntryId,
    projectName: showScopeColumns ? qProjectName : '',
    taskName: showScopeColumns ? qTaskName : '',
    fileName: qFileName,
    qcStatus: qQcStatus,
    reviewStatus: qReviewStatus,
    acceptStatus: qAcceptStatus,
    format: qFormat,
  })

  const resetFilters = () => {
    setQEntryId('')
    setQProjectName('')
    setQTaskName('')
    setQFileName('')
    setQQcStatus('全部')
    setQReviewStatus('全部')
    setQAcceptStatus('全部')
    setQFormat('全部')
    setFilters({})
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = visibleEntries.length > 0 && visibleEntries.every((e) => selectedIds.has(e.id))
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleEntries.map((e) => e.id)))
    }
  }

  const hasSelection = selectedIds.size > 0

  const confirmDelete = () => {
    onDelete?.(deleteTarget.id)
    setDeleteTarget(null)
  }

  const entryPageResetKey = useMemo(
    () => `${processTab}:${subStatus}:${JSON.stringify(filters)}:${entries.length}`,
    [processTab, subStatus, filters, entries.length],
  )

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
          aria-label={`选择 ${row.id}`}
        />
      ),
    },
    { title: '条目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    ...(showScopeColumns ? [
      {
        title: '所属项目名称',
        key: 'projectName',
        render: (_, row) => <span className="text-gray-700">{resolveScope(row).projectName || '—'}</span>,
      },
      {
        title: '所属任务名称',
        key: 'taskName',
        render: (_, row) => <span className="text-gray-700">{resolveScope(row).taskName || '—'}</span>,
      },
    ] : []),
    { title: '文件ID', dataIndex: 'fileId', render: (v, row) => <span className="font-mono text-xs text-gray-600">{v ?? row.id.replace('E-', 'F-')}</span> },
    { title: '文件名称', key: 'displayName', render: (_, row) => <span className="font-mono text-xs">{getEntryDisplayFileName(row)}</span> },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长', dataIndex: 'duration' },
    { title: '数据格式', dataIndex: 'format', render: (v) => <Badge color="cyan">{v}</Badge> },
    {
      title: '采集设备',
      dataIndex: 'collectDevice',
      render: (v, row) => <CollectDeviceCell code={v} sn={row.collectDeviceSn} />,
    },
    {
      title: <ColumnTitleHint label="质检状态" hint="点击查看质检详情" />,
      key: 'qcStatus',
      render: (_, row) => {
        const ps = deriveProcessStatuses(row)
        return (
          <ProcessStatusCell
            status={ps.qc}
            clickable={ps.qc === 'passed' || ps.qc === 'rejected'}
            onClick={() => setQcTarget(row)}
          />
        )
      },
    },
    {
      title: <ColumnTitleHint label="标注状态" hint="悬停查看操作人信息" />,
      key: 'reviewStatus',
      render: (_, row) => {
        const ps = deriveProcessStatuses(row)
        const task = getTask?.(row)
        const operator = ps.review === 'processing'
          ? row.reviewClaimedBy
          : (ps.review === 'passed' || ps.review === 'rejected') ? resolveReviewOperator(row, task) : null
        return <ProcessStatusCell status={ps.review} operator={operator} />
      },
    },
    {
      title: <ColumnTitleHint label="验收状态" hint="悬停查看操作人信息" />,
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
      title: <ColumnTitleHint label="流转记录" hint="点击查看完整作业流程" />,
      key: 'flow',
      render: (_, row) => <FlowRecordButton onClick={() => setFlowTarget(row)} />,
    },
    { title: '采集员', dataIndex: 'uploader' },
    { title: '采集时间', key: 'collectTime', render: (_, row) => getEntryCollectTime(row) },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, row) => <EntryActions entry={row} onDelete={() => setDeleteTarget(row)} />,
    },
  ]

  const qcProjectId = qcTarget ? (getProjectId?.(qcTarget) ?? getTask?.(qcTarget)?.projectId ?? 'P-1001') : 'P-1001'

  return (
    <div className="space-y-3">
      {!hideProcessTabs && (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={ROW_LABEL_CLS}>工序</span>
              <ProcessTabBar activeKey={processTab} onChange={handleProcessTabChange} />
            </div>
            <div className="flex items-center gap-3">
              <span className={ROW_LABEL_CLS}>状态</span>
              <ProcessSubFilterBar counts={subCounts} activeKey={subStatus} onChange={setSubStatus} />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className={FILTER_GRID}>
            <div className={FILTER_FIELD}>
              <label className={LBL}>条目ID</label>
              <input value={qEntryId} onChange={(e) => setQEntryId(e.target.value)} placeholder="请输入条目ID" className={INPUT_CLS} />
            </div>
            {showScopeColumns && (
              <>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>所属项目名称</label>
                  <input value={qProjectName} onChange={(e) => setQProjectName(e.target.value)} placeholder="请输入项目名称" className={INPUT_CLS} />
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>所属任务名称</label>
                  <input value={qTaskName} onChange={(e) => setQTaskName(e.target.value)} placeholder="请输入任务名称" className={INPUT_CLS} />
                </div>
              </>
            )}
            <div className={FILTER_FIELD}>
              <label className={LBL}>文件名称</label>
              <input value={qFileName} onChange={(e) => setQFileName(e.target.value)} placeholder="请输入文件名称" className={INPUT_CLS} />
            </div>
            <div className={FILTER_FIELD}>
              <label className={LBL}>数据格式</label>
              <select value={qFormat} onChange={(e) => setQFormat(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {FORMAT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {filtersExpanded && (
            <div className={FILTER_GRID}>
              <div className={FILTER_FIELD}>
                <label className={LBL}>质检状态</label>
                <select value={qQcStatus} onChange={(e) => setQQcStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {FORM_PROCESS_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>标注状态</label>
                <select value={qReviewStatus} onChange={(e) => setQReviewStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {FORM_PROCESS_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>验收状态</label>
                <select value={qAcceptStatus} onChange={(e) => setQAcceptStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {FORM_PROCESS_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className={FILTER_ACTIONS}>
            <button
              type="button"
              onClick={() => setFiltersExpanded((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            >
              {filtersExpanded ? '收起筛选' : '展开筛选'}
              <IconChevronDown className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
            </button>
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-800">{listTitle}</h2>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!hasSelection} onClick={() => showToast('已加入下载队列')}>批量下载</Button>
          <Button disabled={!hasSelection} onClick={() => showToast('已触发重新质检')}>重新质检</Button>
          <Button disabled={!hasSelection} onClick={() => showToast('已加入播放转码队列')}>播放转码</Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={visibleEntries}
        pageSize={LIST_PAGE_SIZE}
        pageResetKey={entryPageResetKey}
      />

      <DeleteEntryConfirmModal
        entry={deleteTarget}
        open={!!deleteTarget}
        title={deleteModalTitle}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <QcDetailModal open={!!qcTarget} entry={qcTarget} projectId={qcProjectId} onClose={() => setQcTarget(null)} />

      <FlowTimelineModal
        open={!!flowTarget}
        entry={flowTarget}
        task={flowTarget ? getTask?.(flowTarget) : null}
        onClose={() => setFlowTarget(null)}
      />

      {ToastNode}
    </div>
  )
}
