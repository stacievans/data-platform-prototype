import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
  CheckboxListShell,
} from '../../components/common/CheckboxList'
import { DEMO_ORG_ID, getUsersByOrgId } from '../../mock/organizations'
import { bulkCreateBatchTasksFromCollectionTasks } from '../../mock/batchTasks'

const SECTION_CLS = 'rounded-lg border border-gray-100 bg-gray-50/60 p-4'
const LBL = 'mb-1.5 block text-sm text-gray-700'
const SELECT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 cursor-pointer flex items-center justify-between text-left'

const ROLE_REVIEWER = '标注员'
const ROLE_ACCEPTOR = '验收员'
const ROLE_BOTH = '采集员&标注员'

function parseUserRoles(user) {
  if (!user?.role) return []
  if (user.role === ROLE_BOTH) return ['采集员', ROLE_REVIEWER]
  return user.role.split('&').filter(Boolean)
}

function userMatchesRole(user, role) {
  return parseUserRoles(user).includes(role)
}

function listOrgNicknamesByRole(role) {
  return getUsersByOrgId(DEMO_ORG_ID)
    .filter((u) => u.status === '启用' && userMatchesRole(u, role))
    .map((u) => u.nickname)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function RoleMultiDropdown({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const allSelected = options.length > 0 && value.length === options.length
  const noneSelected = value.length === 0
  const someSelected = value.length > 0 && !allSelected
  const display = noneSelected
    ? placeholder
    : allSelected
      ? '全部'
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
    <div ref={ref} className="relative min-w-[240px] flex-1">
      <label className={LBL}>{label}</label>
      <button type="button" onClick={() => setOpen((o) => !o)} className={SELECT_CLS}>
        <span className="truncate">{display}</span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">暂无可选人员</p>
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

function ClaimLimitInput({ label, value, onChange, error }) {
  return (
    <div className="flex-1 min-w-[200px]">
      <label className={LBL}>
        <span className="inline-flex items-center gap-1">
          {label}
          <span
            className="group relative inline-flex cursor-help text-gray-400"
            title="单个用户领题数量限制，达到限制后需完成进行中的题后才可领取新题"
          >
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 9.5v5" />
              <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </span>
      </label>
      <input
        type="number"
        min={1}
        max={9999}
        value={value ?? ''}
        placeholder="无限制"
        onChange={(e) => {
          const v = e.target.value
          if (v === '') {
            onChange(null)
            return
          }
          const n = parseInt(v, 10)
          if (Number.isNaN(n) || n < 1) onChange(null)
          else if (n > 9999) onChange(9999)
          else onChange(n)
        }}
        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
      />
    </div>
  )
}

export default function BulkCreateBatchTasksModal({
  open,
  projectId,
  projectTasks = [],
  creatorNickname,
  onClose,
  onCreated,
  showToast,
}) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [reviewers, setReviewers] = useState([])
  const [acceptors, setAcceptors] = useState([])
  const [reviewClaimLimit, setReviewClaimLimit] = useState(null)
  const [acceptClaimLimit, setAcceptClaimLimit] = useState(null)
  const [taskError, setTaskError] = useState(false)

  const reviewerOptions = useMemo(() => listOrgNicknamesByRole(ROLE_REVIEWER), [])
  const acceptorOptions = useMemo(() => listOrgNicknamesByRole(ROLE_ACCEPTOR), [])

  const taskRows = useMemo(
    () => projectTasks.map((t) => ({
      id: t.id,
      name: t.name,
      dataTotal: t.dataTotal,
      collectDone: t.collectDone,
    })),
    [projectTasks],
  )

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedIds(new Set())
    setReviewers([])
    setAcceptors([])
    setReviewClaimLimit(null)
    setAcceptClaimLimit(null)
    setTaskError(false)
  }, [open, projectId])

  const displayTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? taskRows.filter(
        (t) => t.name.toLowerCase().includes(q) || String(t.id).toLowerCase().includes(q),
      )
      : taskRows
    const selected = filtered.filter((t) => selectedIds.has(t.id))
    const rest = filtered.filter((t) => !selectedIds.has(t.id))
    return [...selected, ...rest]
  }, [taskRows, selectedIds, search])

  const visibleAllSelected = displayTasks.length > 0
    && displayTasks.every((t) => selectedIds.has(t.id))
  const visibleSomeSelected = displayTasks.some((t) => selectedIds.has(t.id))

  const toggleTask = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setTaskError(false)
  }

  const toggleVisibleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (visibleAllSelected) {
        displayTasks.forEach((t) => next.delete(t.id))
      } else {
        displayTasks.forEach((t) => next.add(t.id))
      }
      return next
    })
    setTaskError(false)
  }

  const handleClose = () => onClose?.()

  const handleOk = () => {
    if (!selectedIds.size) {
      setTaskError(true)
      showToast?.('请至少选择一个采集任务')
      return
    }
    const picked = taskRows.filter((t) => selectedIds.has(t.id))
    const created = bulkCreateBatchTasksFromCollectionTasks({
      projectId,
      collectionTasks: picked,
      reviewers,
      acceptors,
      reviewClaimLimit,
      acceptClaimLimit,
      creator: creatorNickname,
    })
    onCreated?.(created.length)
    handleClose()
  }

  return (
    <Modal
      open={open}
      title="批量创建批次任务"
      onCancel={handleClose}
      onOk={handleOk}
      okText="确定"
      width={720}
      fitViewport
      viewportMaxHeight="90vh"
      bodyClassName="space-y-4"
    >
      <div className={SECTION_CLS}>
        <label className={LBL}>
          选择任务 <span className="text-red-500">*</span>
        </label>
        <CheckboxListSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索任务名称或ID"
          className="mb-2"
        />
        <CheckboxListShell className={`max-h-52 overflow-y-auto bg-white ${taskError ? 'ring-1 ring-red-300' : ''}`}>
          {taskRows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">该项目下暂无采集任务</p>
          ) : displayTasks.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">暂无匹配任务</p>
          ) : (
            <>
              <CheckboxListSelectAllRow
                checked={visibleAllSelected}
                indeterminate={visibleSomeSelected && !visibleAllSelected}
                onToggle={toggleVisibleAll}
                selectedCount={selectedIds.size}
                totalCount={taskRows.length}
              />
              {displayTasks.map((task) => (
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
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{task.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">{task.id}</span>
                </label>
              ))}
            </>
          )}
        </CheckboxListShell>
        {taskError && <p className="mt-1.5 text-xs text-red-500">请至少选择一个采集任务</p>}
      </div>

      <div className={SECTION_CLS}>
        <p className="mb-3 text-sm font-medium text-gray-700">分配人员</p>
        <p className="mb-3 text-xs text-gray-400">统一为本次创建的所有批次任务分配人员，可不选</p>
        <div className="relative flex flex-wrap gap-4">
          <RoleMultiDropdown
            label="标注员"
            options={reviewerOptions}
            value={reviewers}
            onChange={setReviewers}
            placeholder="请选择标注员"
          />
          <ClaimLimitInput
            label="领题限制"
            value={reviewClaimLimit}
            onChange={setReviewClaimLimit}
          />
        </div>
        <div className="my-4 h-px bg-gray-200" />
        <div className="relative flex flex-wrap gap-4">
          <RoleMultiDropdown
            label="验收员"
            options={acceptorOptions}
            value={acceptors}
            onChange={setAcceptors}
            placeholder="请选择验收员"
          />
          <ClaimLimitInput
            label="领题限制"
            value={acceptClaimLimit}
            onChange={setAcceptClaimLimit}
          />
        </div>
      </div>
    </Modal>
  )
}
