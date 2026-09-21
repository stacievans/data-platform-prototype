import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Table from '../../components/common/Table'
import { IconSearch } from '../../components/common/Icons'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
  IndeterminateCheckbox,
} from '../../components/common/CheckboxList'
import { getAllEntries } from '../../mock/entries'
import { getEntryIdsInBatchTasks, addEntriesToBatchTask } from '../../mock/batchTasks'
import {
  deriveProcessStatuses,
  PROCESS_STATUS_LABEL,
  getEntryDisplayFileName,
  getEntryCollectTime,
  resolveFlowHistory,
  stripFlowLabelRound,
} from '../../utils/entryProcess'
import { formatEntryColorEncoding } from '../../utils/colorEncoding'
import { formatDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const SELECT_BTN =
  'flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-2.5 text-left text-sm text-gray-700 outline-none transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FORMAT_OPTS = ['h5', 'LeRobot']
const COLOR_OPTS = ['RGB', 'BGR', '-']

const EMPTY_FILTERS = {
  taskIds: [],
  formats: [],
  colorEncodings: [],
  devices: [],
  collectors: [],
}

export function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
  searchable = false,
  getOptionLabel = (o) => o,
  getOptionValue = (o) => o,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  const normalized = useMemo(
    () => options.map((o) => ({ value: getOptionValue(o), label: getOptionLabel(o) })),
    [options, getOptionLabel, getOptionValue],
  )

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return normalized
    return normalized.filter(
      (o) => o.label.toLowerCase().includes(kw) || String(o.value).toLowerCase().includes(kw),
    )
  }, [normalized, q])

  const allSelected = normalized.length > 0 && value.length === normalized.length
  const someSelected = value.length > 0 && !allSelected
  const display = value.length === 0
    ? placeholder
    : allSelected
      ? '全部'
      : value.length <= 2
        ? normalized.filter((o) => value.includes(o.value)).map((o) => o.label).join('、')
        : `已选 ${value.length} 项`

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val))
    else onChange([...value, val])
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : normalized.map((o) => o.value))
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <label className={LBL}>{label}</label>
      <button type="button" className={SELECT_BTN} onClick={() => setOpen((o) => !o)}>
        <span className="truncate">{display}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-[60] mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <CheckboxListSearchInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="模糊查找"
              />
            </div>
          )}
          <div className="max-h-44 overflow-y-auto">
            {normalized.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">暂无选项</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">无匹配结果</p>
            ) : (
              <>
                <CheckboxListSelectAllRow
                  checked={allSelected}
                  indeterminate={someSelected}
                  onToggle={toggleAll}
                  selectedCount={value.length}
                  totalCount={normalized.length}
                />
                {filtered.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(o.value)}
                      onChange={() => toggle(o.value)}
                      className={CHECKBOX_LIST_CLS}
                    />
                    <span className="truncate text-sm text-gray-700">{o.label}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusText({ status }) {
  const label = PROCESS_STATUS_LABEL[status] ?? '—'
  const cls = status === 'passed'
    ? 'text-emerald-600'
    : status === 'rejected'
      ? 'text-red-500'
      : status === 'processing'
        ? 'text-blue-600'
        : 'text-gray-500'
  return <span className={`text-sm ${cls}`}>{label}</span>
}

function FlowRecordButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="查看流转记录"
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function FlowTimelineModal({ open, entry, task, onClose }) {
  const nodes = useMemo(
    () => (entry && task ? resolveFlowHistory(entry, task) : []),
    [entry, task, open],
  )
  if (!open || !entry) return null
  return (
    <Modal open={open} title="流转记录" onCancel={onClose} footer={null} width={520} zIndex={70}>
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
                <div className="mt-0.5 text-xs text-gray-400">{formatDateTime(node.time)} · {node.operator}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function matchEntryFilters(entry, filters) {
  if (filters.taskIds.length > 0 && !filters.taskIds.includes(entry.taskId)) return false
  if (filters.formats.length > 0 && !filters.formats.includes(entry.format)) return false
  if (filters.colorEncodings.length > 0) {
    const enc = formatEntryColorEncoding(entry)
    if (!filters.colorEncodings.includes(enc)) return false
  }
  if (filters.devices.length > 0) {
    const dev = entry.collectDevice || '—'
    if (!filters.devices.includes(dev)) return false
  }
  if (filters.collectors.length > 0 && !filters.collectors.includes(entry.uploader)) return false
  return true
}

export default function AddBatchTaskDataModal({
  open,
  batchTask,
  projectId,
  projectTasks = [],
  onClose,
  onAdded,
  showToast,
}) {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [flowTarget, setFlowTarget] = useState(null)
  const [poolTick, setPoolTick] = useState(0)

  const taskMap = useMemo(
    () => Object.fromEntries(projectTasks.map((t) => [t.id, t])),
    [projectTasks],
  )

  const projectTaskIdSet = useMemo(
    () => new Set(projectTasks.map((t) => t.id)),
    [projectTasks],
  )

  const availableEntries = useMemo(() => {
    void poolTick
    const assigned = getEntryIdsInBatchTasks(projectId)
    return getAllEntries().filter(
      (e) => projectTaskIdSet.has(e.taskId) && !assigned.has(e.id),
    )
  }, [projectId, projectTaskIdSet, poolTick, open])

  const deviceOptions = useMemo(() => {
    const set = new Set()
    availableEntries.forEach((e) => {
      if (e.collectDevice) set.add(e.collectDevice)
    })
    return [...set].sort()
  }, [availableEntries])

  const collectorOptions = useMemo(() => {
    const set = new Set()
    availableEntries.forEach((e) => {
      if (e.uploader) set.add(e.uploader)
    })
    return [...set].sort()
  }, [availableEntries])

  useEffect(() => {
    if (!open) return
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setSelectedIds(new Set())
    setFlowTarget(null)
    setPoolTick((t) => t + 1)
  }, [open, batchTask?.id])

  const filteredEntries = useMemo(
    () => availableEntries.filter((e) => matchEntryFilters(e, appliedFilters)),
    [availableEntries, appliedFilters],
  )

  const visibleAllSelected = filteredEntries.length > 0
    && filteredEntries.every((e) => selectedIds.has(e.id))
  const visibleSomeSelected = filteredEntries.some((e) => selectedIds.has(e.id))

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleVisibleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (visibleAllSelected) {
        filteredEntries.forEach((e) => next.delete(e.id))
      } else {
        filteredEntries.forEach((e) => next.add(e.id))
      }
      return next
    })
  }

  const applyFilters = () => setAppliedFilters({ ...draftFilters })
  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  const handleOk = () => {
    if (!batchTask?.id) return
    if (!selectedIds.size) {
      showToast?.('请至少选择一条条目')
      return
    }
    const added = addEntriesToBatchTask(batchTask.id, [...selectedIds])
    onAdded?.(added)
    onClose?.()
  }

  const columns = [
    {
      title: '',
      key: 'sel',
      width: 44,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleRow(row.id)}
          className={CHECKBOX_LIST_CLS}
        />
      ),
    },
    { title: '条目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    {
      title: '文件名称',
      key: 'file',
      render: (_, row) => (
        <span className="font-mono text-xs">{getEntryDisplayFileName(row)}</span>
      ),
    },
    {
      title: '所属任务',
      key: 'task',
      render: (_, row) => taskMap[row.taskId]?.name ?? row.taskName ?? '—',
    },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长', dataIndex: 'duration' },
    { title: '数据格式', dataIndex: 'format', render: (v) => <Badge color="cyan">{v}</Badge> },
    {
      title: '色彩编码',
      key: 'color',
      render: (_, row) => (
        <span className="font-mono text-xs">{formatEntryColorEncoding(row)}</span>
      ),
    },
    {
      title: '质检状态',
      key: 'qc',
      render: (_, row) => <StatusText status={deriveProcessStatuses(row).qc} />,
    },
    {
      title: '标注状态',
      key: 'review',
      render: (_, row) => <StatusText status={deriveProcessStatuses(row).review} />,
    },
    {
      title: '验收状态',
      key: 'accept',
      render: (_, row) => <StatusText status={deriveProcessStatuses(row).accept} />,
    },
    {
      title: '流转记录',
      key: 'flow',
      render: (_, row) => (
        <FlowRecordButton onClick={() => setFlowTarget(row)} />
      ),
    },
    { title: '采集员', dataIndex: 'uploader' },
    {
      title: '采集时间',
      key: 'collectTime',
      render: (_, row) => getEntryCollectTime(row),
    },
  ]

  const setDraft = (patch) => setDraftFilters((f) => ({ ...f, ...patch }))

  return (
    <>
      <Modal
        open={open}
        title={`添加数据 · ${batchTask?.name ?? ''}`}
        onCancel={onClose}
        width={1180}
        fitViewport
        viewportMaxHeight="92vh"
        bodyClassName="flex min-h-0 flex-1 flex-col gap-3 !py-4"
        zIndex={55}
        footer={(
          <>
            <span className="mr-auto text-sm text-gray-500">已选 {selectedIds.size} 条</span>
            <Button onClick={onClose}>取消</Button>
            <Button variant="primary" onClick={handleOk}>确定</Button>
          </>
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid grid-cols-5 gap-3">
            <FilterMultiSelect
              label="采集任务"
              placeholder="请选择采集任务"
              searchable
              options={projectTasks}
              getOptionValue={(t) => t.id}
              getOptionLabel={(t) => t.name}
              value={draftFilters.taskIds}
              onChange={(taskIds) => setDraft({ taskIds })}
            />
            <FilterMultiSelect
              label="数据格式"
              placeholder="请选择数据格式"
              options={FORMAT_OPTS}
              value={draftFilters.formats}
              onChange={(formats) => setDraft({ formats })}
            />
            <FilterMultiSelect
              label="色彩编码"
              placeholder="请选择色彩编码"
              options={COLOR_OPTS}
              value={draftFilters.colorEncodings}
              onChange={(colorEncodings) => setDraft({ colorEncodings })}
            />
            <FilterMultiSelect
              label="采集设备"
              placeholder="请选择采集设备"
              searchable
              options={deviceOptions}
              value={draftFilters.devices}
              onChange={(devices) => setDraft({ devices })}
            />
            <FilterMultiSelect
              label="采集员"
              placeholder="请选择采集员"
              searchable
              options={collectorOptions}
              value={draftFilters.collectors}
              onChange={(collectors) => setDraft({ collectors })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>

          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <IndeterminateCheckbox
                checked={visibleAllSelected}
                indeterminate={visibleSomeSelected && !visibleAllSelected}
                onChange={toggleVisibleAll}
              />
              选择全部
            </label>
            <span className="text-xs text-gray-400">
              当前 {filteredEntries.length} 条可添加
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <Table
              embedded
              columns={columns}
              dataSource={filteredEntries}
              pageSize={10}
              emptyText="暂无未入批次的条目"
            />
          </div>
        </div>
      </Modal>

      <FlowTimelineModal
        open={!!flowTarget}
        entry={flowTarget}
        task={flowTarget ? taskMap[flowTarget.taskId] : null}
        onClose={() => setFlowTarget(null)}
      />
    </>
  )
}
