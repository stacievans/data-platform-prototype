import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
  CheckboxListShell,
  IndeterminateCheckbox,
} from '../../components/common/CheckboxList'
import { isSamplingBatchNameTaken } from '../../mock/samplingBatches'
import {
  REVIEW_RESULT_FILTER_OPTIONS,
  buildProjectTaskRows,
  calcSampledCount,
  countTaskCandidates,
  defaultSamplingFilters,
  formatReviewResultLabel,
  listProjectCollectors,
  listProjectReviewers,
} from '../../utils/samplingHelpers'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const SECTION_CLS = 'rounded-lg border border-gray-100 bg-gray-50/60 p-4'
const LBL = 'mb-1.5 block text-sm text-gray-700'
const HINT = 'text-xs text-gray-400'
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`

/** 未选 / 全选 → 不筛选，统一存空数组 */
function normalizePeopleFilter(selected, options) {
  if (!selected?.length || (options.length > 0 && selected.length === options.length)) return []
  return [...selected]
}

function MultiCheckDropdown({ label, options, value, onChange, allLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const allSelected = options.length > 0 && value.length === options.length
  const noneSelected = value.length === 0
  const someSelected = value.length > 0 && !allSelected
  const display = noneSelected || allSelected
    ? allLabel
    : value.length <= 2
      ? value.join('、')
      : `${value[0]}等 ${value.length} 人`

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (name) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name))
    else onChange([...value, name])
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options])
  }

  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <label className={LBL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${SELECT_CLS} flex items-center justify-between text-left`}
      >
        <span className="truncate">{display}</span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">暂无可选项</p>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              <CheckboxListSelectAllRow
                checked={allSelected}
                indeterminate={someSelected}
                onToggle={toggleAll}
                selectedCount={value.length}
                totalCount={options.length}
              />
              {options.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(name)}
                    onChange={() => toggle(name)}
                    className={CHECKBOX_LIST_CLS}
                  />
                  <span className="truncate text-sm text-gray-700">{name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CreateSamplingBatchModal({
  open,
  projectId,
  initialTaskIds = [],
  onCancel,
  onConfirm,
}) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [ratios, setRatios] = useState({})
  const [filters, setFilters] = useState(defaultSamplingFilters)
  const [unifyRatio, setUnifyRatio] = useState(20)

  const taskRows = useMemo(() => buildProjectTaskRows(projectId), [projectId])
  const collectors = useMemo(() => listProjectCollectors(projectId), [projectId])
  const reviewers = useMemo(() => listProjectReviewers(projectId), [projectId])

  useEffect(() => {
    if (!open) return
    const init = new Set(initialTaskIds ?? [])
    const nextRatios = {}
    init.forEach((id) => { nextRatios[id] = 20 })
    setName('')
    setNameError('')
    setSearch('')
    setSelectedIds(init)
    setRatios(nextRatios)
    setFilters(defaultSamplingFilters())
    setUnifyRatio(20)
  }, [open, projectId, initialTaskIds])

  const displayTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? taskRows.filter((t) => (
        t.name.toLowerCase().includes(q) || String(t.id).toLowerCase().includes(q)
      ))
      : taskRows
    const selected = filtered.filter((t) => selectedIds.has(t.id))
    const rest = filtered.filter((t) => !selectedIds.has(t.id))
    return [...selected, ...rest]
  }, [taskRows, selectedIds, search])

  const selectedTasks = useMemo(
    () => taskRows.filter((t) => selectedIds.has(t.id)),
    [taskRows, selectedIds],
  )

  const configRows = useMemo(
    () => selectedTasks.map((t) => {
      const candidateCount = countTaskCandidates(projectId, t.id, filters)
      const ratio = ratios[t.id] ?? 20
      return {
        key: t.id,
        label: t.name,
        totalEntries: candidateCount,
        ratio,
        sampled: calcSampledCount(candidateCount, ratio),
      }
    }),
    [selectedTasks, projectId, filters, ratios],
  )

  const summary = useMemo(() => ({
    optionCount: configRows.length,
    totalEntries: configRows.reduce((s, r) => s + r.totalEntries, 0),
    sampledEntries: configRows.reduce((s, r) => s + r.sampled, 0),
  }), [configRows])

  const visibleAllSelected = displayTasks.length > 0
    && displayTasks.every((t) => selectedIds.has(t.id))
  const visibleSomeSelected = displayTasks.some((t) => selectedIds.has(t.id))

  const toggleTask = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setRatios((r) => {
          const copy = { ...r }
          delete copy[id]
          return copy
        })
      } else {
        next.add(id)
        setRatios((r) => ({ ...r, [id]: r[id] ?? 20 }))
      }
      return next
    })
  }

  const toggleVisibleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (visibleAllSelected) {
        displayTasks.forEach((t) => next.delete(t.id))
        setRatios((r) => {
          const copy = { ...r }
          displayTasks.forEach((t) => { delete copy[t.id] })
          return copy
        })
      } else {
        displayTasks.forEach((t) => {
          next.add(t.id)
          setRatios((r) => ({ ...r, [t.id]: r[t.id] ?? 20 }))
        })
      }
      return next
    })
  }

  const setRatio = (taskId, value) => {
    const n = Math.max(0, Math.min(100, Number(value) || 0))
    setRatios((r) => ({ ...r, [taskId]: n }))
  }

  const applyUnify = () => {
    const n = Math.max(0, Math.min(100, Number(unifyRatio) || 0))
    setUnifyRatio(n)
    setRatios((r) => {
      const next = { ...r }
      selectedTasks.forEach((t) => { next[t.id] = n })
      return next
    })
  }

  const handleOk = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('required')
      return
    }
    if (isSamplingBatchNameTaken(trimmed)) {
      setNameError('duplicate')
      return
    }
    if (selectedTasks.length === 0) {
      window.alert('请至少选择一个任务')
      return
    }
    if (summary.sampledEntries <= 0) {
      window.alert('当前筛选与比例下无抽检条目，请调整后重试')
      return
    }
    onConfirm?.({
      name: trimmed,
      taskIds: selectedTasks.map((t) => t.id),
      filters: {
        reviewResult: filters.reviewResult,
        collectors: normalizePeopleFilter(filters.collectors, collectors),
        reviewers: normalizePeopleFilter(filters.reviewers, reviewers),
      },
      configItems: configRows.map((row) => ({
        key: row.key,
        label: row.label,
        totalEntries: row.totalEntries,
        ratio: Number(row.ratio) || 0,
      })),
    })
  }

  return (
    <Modal
      open={open}
      title="新建抽检批次"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      width={820}
      fitViewport
      viewportMaxHeight="90vh"
      bodyClassName="space-y-4"
    >
      {/* 批次名称（无卡片框，单独置顶） */}
      <div>
        <label className={LBL}>
          批次名称 <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError('') }}
          placeholder="请输入批次名称，例如：卧室整理第一轮抽检"
          className={`${INPUT_CLS} ${nameError ? 'border-red-400 ring-1 ring-red-100' : ''}`}
        />
        {nameError === 'required' && <p className="mt-1 text-xs text-red-500">请填写批次名称</p>}
        {nameError === 'duplicate' && <p className="mt-1 text-xs text-red-500">批次名称已存在，请换一个</p>}
      </div>

      {/* 选择任务 */}
      <div className={SECTION_CLS}>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-700">
            选择任务 <span className="text-red-500">*</span>
          </span>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600">
            <IndeterminateCheckbox
              checked={visibleAllSelected}
              indeterminate={visibleSomeSelected && !visibleAllSelected}
              onChange={toggleVisibleAll}
            />
            全选
          </label>
          <CheckboxListSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="模糊查找任务名称或 ID"
            className="ml-auto w-56"
          />
          <span className="text-xs text-gray-400">
            已选 {selectedIds.size} / {taskRows.length}
          </span>
        </div>
        <CheckboxListShell className="max-h-52 overflow-y-auto bg-white">
          {displayTasks.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">暂无匹配任务</p>
          ) : (
            displayTasks.map((task) => (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(task.id)}
                  onChange={() => toggleTask(task.id)}
                  className={CHECKBOX_LIST_CLS}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                  {task.name}
                  <span className="text-gray-400"> · {task.id}</span>
                </span>
                <span className="shrink-0 text-xs text-gray-400">{task.entryCount} 条</span>
              </label>
            ))
          )}
        </CheckboxListShell>
      </div>

      {/* 筛选条件 */}
      <div className={SECTION_CLS}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
          <p className={HINT}>筛选将缩小候选条目池；未选采集员/标注员视为全部</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="min-w-0">
            <label className={LBL}>
              标注结果 <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.reviewResult}
              onChange={(e) => setFilters((f) => ({ ...f, reviewResult: e.target.value }))}
              className={SELECT_CLS}
            >
              {REVIEW_RESULT_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <MultiCheckDropdown
            label="选择采集员"
            options={collectors}
            value={filters.collectors}
            onChange={(v) => setFilters((f) => ({ ...f, collectors: v }))}
            allLabel="全部采集员"
          />
          <MultiCheckDropdown
            label="选择标注员"
            options={reviewers}
            value={filters.reviewers}
            onChange={(v) => setFilters((f) => ({ ...f, reviewers: v }))}
            allLabel="全部标注员"
          />
        </div>
      </div>

      {/* 抽检比例配置 */}
      {selectedTasks.length > 0 && (
        <div className={SECTION_CLS}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">抽检比例配置</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">统一比例</span>
              <input
                type="number"
                min={0}
                max={100}
                value={unifyRatio}
                onChange={(e) => setUnifyRatio(e.target.value)}
                className="h-8 w-16 rounded border border-gray-200 bg-white px-2 text-center text-sm outline-none focus:border-blue-400"
              />
              <span className="text-xs text-gray-400">%</span>
              <Button size="sm" variant="secondary" onClick={applyUnify}>应用</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full plain-table text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-3 py-2.5 font-medium">任务名称</th>
                  <th className="w-28 px-3 py-2.5 text-center font-medium">候选条目</th>
                  <th className="w-32 px-3 py-2.5 text-center font-medium">比例</th>
                  <th className="w-28 px-3 py-2.5 text-center font-medium">抽检条目</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {configRows.map((row) => (
                  <tr key={row.key}>
                    <td className="px-3 py-2.5 text-gray-700">{row.label}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600">{row.totalEntries}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={row.ratio}
                          onChange={(e) => setRatio(row.key, e.target.value)}
                          className="h-8 w-16 rounded border border-gray-200 px-2 text-center text-sm outline-none focus:border-blue-400"
                        />
                        <span className="text-gray-400">%</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-gray-700">{row.sampled}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50/80">
                  <td colSpan={4} className="px-3 py-2.5 text-sm text-gray-600">
                    合计：{summary.optionCount} 个任务 · {summary.totalEntries} 条候选条目 · {summary.sampledEntries} 条抽检条目
                    {' '}标注结果：{formatReviewResultLabel(filters.reviewResult)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
