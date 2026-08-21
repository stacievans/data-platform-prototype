import { useMemo, useRef, useState } from 'react'
import Table from '../../components/common/Table'
import Tabs from '../../components/common/Tabs'
import Modal from '../../components/common/Modal'
import Drawer from '../../components/common/Drawer'
import Button from '../../components/common/Button'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
  CheckboxListShell,
} from '../../components/common/CheckboxList'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import { PermButton } from '../../components/common/PermissionAction'
import { useToast } from '../../components/common/Toast'
import TreeTransfer from '../../components/common/TreeTransfer'
import { users, projectMembers as allProjectMembers } from '../../mock/misc'
import { DEMO_ORG_ID, getUsersByOrgId } from '../../mock/organizations'
import { projects } from '../../mock/projects'
import {
  collectors,
  reviewers,
  acceptors,
  formatReviewer,
  getTaskCollectors,
  getTaskAnnotators,
  getTaskAcceptors,
} from '../../mock/tasks'
import { dtCol, nowDateTime, formatDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const ROLE_COLLECTOR = '采集员'
const ROLE_REVIEWER = '标注员'
const ROLE_ACCEPTOR = '验收员'
const ROLE_BOTH = '采集员&标注员'
const MEMBER_ROLE_OPTIONS = [ROLE_COLLECTOR, ROLE_REVIEWER, ROLE_ACCEPTOR]
const MEMBER_TABS = [
  { key: ROLE_COLLECTOR, label: ROLE_COLLECTOR },
  { key: ROLE_REVIEWER, label: ROLE_REVIEWER },
  { key: ROLE_ACCEPTOR, label: ROLE_ACCEPTOR },
]
const MEMBER_FILTER_LBL = 'mb-1 block text-xs text-gray-500'
const MEMBER_FILTER_INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const nowDatetime = () => nowDateTime()

function findUserByUsername(username) {
  return users.find((u) => u.username === username)
}

function projectCreatorUsername(project) {
  if (!project?.creator) return null
  return users.find((u) => u.nickname === project.creator)?.username ?? null
}

function hasAcceptor(task) {
  return getTaskAcceptors(task).length > 0
}

function hasCollector(task) {
  return getTaskCollectors(task).length > 0
}

function hasReviewer(task) {
  return getTaskAnnotators(task).length > 0
}

function formatPeopleCell(task, role) {
  const names =
    role === ROLE_COLLECTOR ? getTaskCollectors(task)
      : role === ROLE_REVIEWER ? getTaskAnnotators(task)
        : getTaskAcceptors(task)
  if (!names.length) return null
  return names.join('、')
}

function getAssignmentStatus(task) {
  return hasCollector(task) && hasReviewer(task) && hasAcceptor(task) ? '已完成' : '未完成'
}

function memberTaskCount(member) {
  return member.taskIds?.length ?? 0
}

function pruneEmptyMembers(list) {
  return list.filter((m) => memberTaskCount(m) > 0)
}

function parseUserRoles(user) {
  if (!user?.role) return []
  if (user.role === ROLE_BOTH) return [ROLE_COLLECTOR, ROLE_REVIEWER]
  return user.role.split('&').filter(Boolean)
}

function userMatchesRole(user, role) {
  return parseUserRoles(user).includes(role)
}

function memberInRole(list, username, role) {
  return list.some((m) => m.username === username && m.role === role)
}

function appendTaskPerson(task, role, username) {
  if (role === ROLE_COLLECTOR) {
    const prev = getTaskCollectors(task)
    const next = prev.includes(username) ? prev : [...prev, username]
    return { ...task, collectors: next, collector: next }
  }
  if (role === ROLE_REVIEWER) {
    const prev = getTaskAnnotators(task)
    const next = prev.includes(username) ? prev : [...prev, username]
    return { ...task, annotators: next, reviewer: next }
  }
  if (role === ROLE_ACCEPTOR) {
    const prev = getTaskAcceptors(task)
    const next = prev.includes(username) ? prev : [...prev, username]
    return { ...task, acceptors: next, acceptor: next }
  }
  return task
}

function tasksUnassignedForRole(role, projectTasks) {
  if (role === ROLE_COLLECTOR) return projectTasks.filter((t) => !hasCollector(t))
  if (role === ROLE_REVIEWER) return projectTasks.filter((t) => !hasReviewer(t))
  if (role === ROLE_ACCEPTOR) return projectTasks.filter((t) => !hasAcceptor(t))
  return []
}

function RoleFieldLabel({ required = true }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
      角色
      {required && <span className="text-red-500">*</span>}
      <span className="text-xs font-normal text-gray-400">（单选）</span>
    </label>
  )
}

function RolePicker({ value, onChange, options = MEMBER_ROLE_OPTIONS, error }) {
  return (
    <div>
      <RoleFieldLabel />
      <div className="flex flex-wrap gap-2">
        {options.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              value === role
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">请选择角色</p>}
    </div>
  )
}

function PersonMultiDropdownSelect({
  value = [],
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  readonly = false,
  disabledPlaceholder,
  error = false,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return options
    return options.filter((name) => name.toLowerCase().includes(kw))
  }, [options, q])

  const closeDropdown = () => {
    setOpen(false)
    setQ('')
  }

  const openDropdown = () => {
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const toggle = (name) => {
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name])
  }

  const removeTag = (name, e) => {
    e.stopPropagation()
    onChange(value.filter((n) => n !== name))
  }

  const boxCls = `min-h-8 w-full rounded-md border bg-white py-1 pl-2 pr-8 text-sm text-gray-700 outline-none focus-within:ring-2 ${
    error
      ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
      : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-100'
  }`

  if (disabled) {
    return (
      <SelectChevronWrap className="w-full" disabled>
        <div className="flex min-h-8 w-full cursor-not-allowed items-center rounded-md border border-gray-200 bg-gray-100 px-2.5 text-sm text-gray-400">
          {disabledPlaceholder || placeholder}
        </div>
      </SelectChevronWrap>
    )
  }

  if (readonly) {
    return (
      <SelectChevronWrap className="w-full" disabled>
        <div className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-sm">
          {value.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            value.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-600"
              >
                {name}
              </span>
            ))
          )}
        </div>
      </SelectChevronWrap>
    )
  }

  return (
    <SelectChevronWrap className="w-full">
      <div className="relative">
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={-1}
          onClick={openDropdown}
          className={`${boxCls} flex cursor-text flex-wrap items-center gap-1`}
        >
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600"
            >
              {name}
              <button
                type="button"
                tabIndex={-1}
                aria-label={`移除 ${name}`}
                onClick={(e) => removeTag(name, e)}
                className="cursor-pointer leading-none text-blue-400 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onClick={(e) => e.stopPropagation()}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[4rem] flex-1 border-0 bg-transparent py-0.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label="展开选项"
          onClick={(e) => {
            e.stopPropagation()
            open ? closeDropdown() : openDropdown()
          }}
          className="absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
        >
          ▾
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={closeDropdown} />
            <div className="absolute z-[71] mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">无匹配用户</p>
              ) : (
                filtered.map((name) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(name)}
                      onChange={() => toggle(name)}
                      className={CHECKBOX_LIST_CLS}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </SelectChevronWrap>
  )
}

function PersonDropdownSelect({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  disabledPlaceholder,
  error = false,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const filtered = useMemo(
    () => options.filter((name) => name.toLowerCase().includes(q.trim().toLowerCase())),
    [options, q],
  )

  const closeDropdown = () => {
    setOpen(false)
    setQ('')
  }

  if (disabled) {
    return (
      <SelectChevronWrap className="w-full" disabled>
        <select
          disabled
          value=""
          className="h-8 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-2.5 text-sm text-gray-400 outline-none"
        >
          <option value="">{disabledPlaceholder || placeholder}</option>
        </select>
      </SelectChevronWrap>
    )
  }

  const inputCls = `h-8 w-full rounded-md border bg-white py-0 pl-2.5 pr-8 text-sm text-gray-700 outline-none focus:ring-2 ${
    error
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

  return (
    <SelectChevronWrap className="w-full">
      <div className="relative">
        <input
          value={open ? q : (value || '')}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => (open ? closeDropdown() : setOpen(true))}
          className="absolute inset-y-0 right-0 w-8 cursor-pointer"
          aria-label="展开选项"
        />
        {open && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={closeDropdown} />
            <div className="absolute z-[71] mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">无匹配用户</p>
              ) : (
                filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { onChange(name); closeDropdown() }}
                    className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      name === value ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </SelectChevronWrap>
  )
}

function TaskCheckboxList({
  tasks,
  selectedIds,
  onChange,
  searchPlaceholder = '搜索任务名称或ID',
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return tasks
    return tasks.filter(
      (t) => t.name.toLowerCase().includes(kw) || t.id.toLowerCase().includes(kw),
    )
  }, [tasks, q])

  const selectedInFiltered = filtered.filter((t) => selectedIds.includes(t.id)).length
  const allChecked = filtered.length > 0 && selectedInFiltered === filtered.length
  const someChecked = selectedInFiltered > 0 && !allChecked

  const toggleAll = () => {
    if (allChecked) {
      onChange(selectedIds.filter((id) => !filtered.some((t) => t.id === id)))
    } else {
      onChange([...new Set([...selectedIds, ...filtered.map((t) => t.id)])])
    }
  }

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((t) => t !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (tasks.length === 0) {
    return <p className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">暂无任务</p>
  }

  return (
    <div className="space-y-2">
      <CheckboxListSearchInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={searchPlaceholder}
      />
      <CheckboxListShell
        className="max-h-36"
        empty={
          filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-gray-400">无匹配任务</p>
          ) : undefined
        }
      >
        {filtered.length > 0 && (
          <>
            <CheckboxListSelectAllRow
              checked={allChecked}
              indeterminate={someChecked}
              onToggle={toggleAll}
              selectedCount={selectedInFiltered}
              totalCount={filtered.length}
            />
            {filtered.map((task) => (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-2 border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => toggleOne(task.id)}
                  className={CHECKBOX_LIST_CLS}
                />
                <span className="flex-1 text-sm text-gray-700">{task.name}</span>
                <span className="text-xs text-gray-400">{task.id}</span>
              </label>
            ))}
          </>
        )}
      </CheckboxListShell>
    </div>
  )
}

export default function MembersTab({ projectId, projectTasks, onTasksChange, onViewMemberTasks }) {
  const project = projects.find((p) => p.id === projectId)
  const { ToastNode, show: showToast } = useToast()

  const [memberTab, setMemberTab] = useState(ROLE_COLLECTOR)
  const [qUid, setQUid] = useState('')
  const [qUsername, setQUsername] = useState('')
  const [memberFilters, setMemberFilters] = useState({})
  const [members, setMembers] = useState(
    () => pruneEmptyMembers(
      (allProjectMembers[projectId] ?? []).filter((m) => m.role !== '平台运营'),
    ),
  )

  const [addOpen, setAddOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [configTaskMember, setConfigTaskMember] = useState(null)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [assignTask, setAssignTask] = useState(null)
  const [replaceConfirm, setReplaceConfirm] = useState(null)

  const [form, setForm] = useState({ uid: '', username: '', role: '', taskIds: [] })
  const [addForm, setAddForm] = useState({ role: '', uid: '', username: '', taskIds: [] })
  const [configTaskForm, setConfigTaskForm] = useState({ taskIds: [] })
  const [assignForm, setAssignForm] = useState({ collectors: [], reviewers: [], acceptors: [] })
  const [assignSnapshot, setAssignSnapshot] = useState({ collectors: [], reviewers: [], acceptors: [] })
  const [assignRoleLock, setAssignRoleLock] = useState({ collectors: false, reviewers: false, acceptors: false })
  const [assignErrors, setAssignErrors] = useState({})
  const [errors, setErrors] = useState({})
  const [addErrors, setAddErrors] = useState({})

  const commitMembers = (next) => {
    setMembers((list) => pruneEmptyMembers(typeof next === 'function' ? next(list) : next))
  }

  const configTaskProjects = useMemo(
    () => (project ? [project] : []),
    [project],
  )

  const tabMembers = useMemo(
    () => members.filter((m) => m.role === memberTab),
    [members, memberTab],
  )

  const filteredMembers = useMemo(() => {
    const { uid, username } = memberFilters
    return tabMembers.filter((m) => {
      if (uid && !String(m.uid ?? '').toLowerCase().includes(uid.toLowerCase())) return false
      if (username && !String(m.username ?? '').toLowerCase().includes(username.toLowerCase())) return false
      return true
    })
  }, [tabMembers, memberFilters])

  const memberPageResetKey = useMemo(
    () => `${memberTab}:${JSON.stringify(memberFilters)}:${filteredMembers.length}`,
    [memberTab, memberFilters, filteredMembers.length],
  )

  const applyMemberFilters = () => {
    setMemberFilters({ uid: qUid.trim(), username: qUsername.trim() })
  }

  const resetMemberFilters = () => {
    setQUid('')
    setQUsername('')
    setMemberFilters({})
  }

  const incompleteTasks = useMemo(
    () => projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t) || !hasAcceptor(t)),
    [projectTasks],
  )

  const batchTaskList = useMemo(
    () => (form.role ? tasksUnassignedForRole(form.role, incompleteTasks) : []),
    [form.role, incompleteTasks],
  )

  const formUsers = useMemo(() => {
    if (!form.role) return []
    const creator = projectCreatorUsername(project)
    return users.filter(
      (u) =>
        u.status === '启用' &&
        u.username !== creator &&
        userMatchesRole(u, form.role) &&
        !memberInRole(members, u.username, form.role),
    )
  }, [form.role, members, project])

  const addFormUsers = useMemo(() => {
    if (!addForm.role) return []
    const creator = projectCreatorUsername(project)
    return getUsersByOrgId(DEMO_ORG_ID).filter(
      (u) =>
        u.status === '启用' &&
        u.username !== creator &&
        userMatchesRole(u, addForm.role) &&
        !memberInRole(members, u.username, addForm.role),
    )
  }, [addForm.role, members, project])

  const collectorOptions = useMemo(
    () => [...new Set([...collectors, ...members.filter((m) => m.role === ROLE_COLLECTOR).map((m) => m.username)])],
    [members],
  )

  const reviewerOptions = useMemo(
    () => [...new Set([...reviewers, ...members.filter((m) => m.role === ROLE_REVIEWER).map((m) => m.username)])],
    [members],
  )

  const acceptorOptions = useMemo(
    () => [...new Set([...acceptors, ...members.filter((m) => m.role === ROLE_ACCEPTOR).map((m) => m.username)])],
    [members],
  )

  const resetForm = () => {
    setForm({ uid: '', username: '', role: '', taskIds: [] })
    setErrors({})
  }

  const resetAddForm = (role = '') => {
    setAddForm({ role, uid: '', username: '', taskIds: [] })
    setAddErrors({})
  }

  const openAdd = (role) => {
    resetAddForm(role)
    setAddOpen(true)
  }

  const openBatch = () => {
    resetForm()
    setBatchOpen(true)
  }

  const openConfigTask = (row) => {
    setConfigTaskMember(row)
    setConfigTaskForm({ taskIds: [...(row.taskIds ?? [])] })
  }

  const openAssign = (task) => {
    const taskCollectors = getTaskCollectors(task)
    const taskReviewers = getTaskAnnotators(task)
    const taskAcceptors = getTaskAcceptors(task)
    setAssignTask(task)
    setAssignSnapshot({ collectors: taskCollectors, reviewers: taskReviewers, acceptors: taskAcceptors })
    setAssignRoleLock({
      collectors: taskCollectors.length > 0,
      reviewers: taskReviewers.length > 0,
      acceptors: taskAcceptors.length > 0,
    })
    setAssignForm({ collectors: [], reviewers: [], acceptors: [] })
    setAssignErrors({})
  }

  const stripAnnotatorForTask = (list, taskId, excludeUsername = null) =>
    list.map((m) => {
      if (m.username === excludeUsername) return m
      if (m.role === ROLE_REVIEWER && m.taskIds.includes(taskId)) {
        return { ...m, taskIds: m.taskIds.filter((t) => t !== taskId) }
      }
      return m
    })

  const upsertMemberAssignment = (list, { uid, username, role, taskIds }) => {
    const existing = list.find((m) => m.username === username && m.role === role)
    if (existing) {
      const merged = [...new Set([...(existing.taskIds ?? []), ...taskIds])]
      return list.map((m) => (m.id === existing.id ? { ...m, taskIds: merged } : m))
    }
    const user = findUserByUsername(username)
    return [
      ...list,
      {
        id: `PM-${projectId}-${Date.now()}-${role}`,
        uid: uid ?? user?.uid ?? '',
        username,
        role,
        taskIds: [...taskIds],
        joinedAt: nowDatetime(),
      },
    ]
  }

  const syncMembersForTaskAssignment = (list, taskId, collectorUsernames, reviewerUsernames, acceptorUsernames) => {
    let next = [...list]
    for (const username of collectorUsernames) {
      next = upsertMemberAssignment(next, { username, role: ROLE_COLLECTOR, taskIds: [taskId] })
    }
    for (const username of reviewerUsernames) {
      next = upsertMemberAssignment(next, { username, role: ROLE_REVIEWER, taskIds: [taskId] })
    }
    for (const username of acceptorUsernames) {
      next = upsertMemberAssignment(next, { username, role: ROLE_ACCEPTOR, taskIds: [taskId] })
    }
    return pruneEmptyMembers(
      next.map((m) => {
        if (!m.taskIds.includes(taskId)) return m
        const keep =
          (m.role === ROLE_COLLECTOR && collectorUsernames.includes(m.username)) ||
          (m.role === ROLE_REVIEWER && reviewerUsernames.includes(m.username)) ||
          (m.role === ROLE_ACCEPTOR && acceptorUsernames.includes(m.username))
        if (keep) return m
        return { ...m, taskIds: m.taskIds.filter((id) => id !== taskId) }
      }),
    )
  }

  const confirmReplaceReviewer = () => {
    const {
      taskId,
      reviewerName,
      resumeAdd,
      pendingAdd,
      processedMembers,
      processedTasks,
    } = replaceConfirm

    if (resumeAdd && pendingAdd) {
      let membersDraft = processedMembers ? [...processedMembers] : [...members]
      let tasksDraft = processedTasks ? [...processedTasks] : [...projectTasks]

      const result = applySingleMemberAdd(membersDraft, tasksDraft, pendingAdd, {
        pendingAdd,
        membersDraft,
        tasksDraft,
      })
      if (!result) return
      membersDraft = result.nextMembers
      tasksDraft = result.nextTasks

      onTasksChange((prev) =>
        prev.map((t) => tasksDraft.find((n) => n.id === t.id) ?? t),
      )
      commitMembers(membersDraft)
      setAddOpen(false)
      setBatchOpen(false)
      setMatrixOpen(false)
      setReplaceConfirm(null)
      setAssignTask(null)
      return
    }

    let nextMembers = stripAnnotatorForTask(members, taskId, reviewerName)
    nextMembers = upsertMemberAssignment(nextMembers, {
      username: reviewerName,
      role: ROLE_REVIEWER,
      taskIds: [taskId],
    })
    onTasksChange((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const reviewers = [reviewerName]
        return { ...t, annotators: reviewers, reviewer: reviewers }
      }),
    )
    commitMembers(nextMembers)
    setReplaceConfirm(null)
    if (resumeAdd) {
      setAddOpen(false)
      setBatchOpen(false)
      setMatrixOpen(false)
    }
    setAssignTask(null)
  }

  const applyFormToTasksAndMembers = (nextMembers) => {
    let membersDraft = [...nextMembers]
    const { role, uid, username, taskIds } = form

    for (const taskId of taskIds) {
      if (role === ROLE_REVIEWER) {
        const owner = membersDraft.find(
          (m) =>
            m.username !== username &&
            m.role === ROLE_REVIEWER &&
            m.taskIds.includes(taskId),
        )
        if (owner) {
          setReplaceConfirm({
            taskId,
            existingName: owner.username,
            reviewerName: username,
            resumeAdd: true,
            pendingAdd: { uid, username, role, taskIds },
          })
          return null
        }
      }
    }

    const nextTasks = projectTasks.map((t) => {
      if (!taskIds.includes(t.id)) return t
      let updated = { ...t }
      if (role === ROLE_COLLECTOR) {
        updated = appendTaskPerson(updated, ROLE_COLLECTOR, username)
      }
      if (role === ROLE_REVIEWER) {
        membersDraft = stripAnnotatorForTask(membersDraft, t.id, username)
        updated = appendTaskPerson(updated, ROLE_REVIEWER, username)
      }
      if (role === ROLE_ACCEPTOR) {
        updated = appendTaskPerson(updated, ROLE_ACCEPTOR, username)
      }
      return updated
    })

    membersDraft = upsertMemberAssignment(membersDraft, { uid, username, role, taskIds })

    return { nextTasks, nextMembers: membersDraft }
  }

  const applySingleMemberAdd = (membersDraft, tasksDraft, { uid, username, role, taskIds }, resumeContext = null) => {
    if (role === ROLE_REVIEWER) {
      for (const taskId of taskIds) {
        const owner = membersDraft.find(
          (m) => m.username !== username && m.role === ROLE_REVIEWER && m.taskIds.includes(taskId),
        )
        if (owner) {
          setReplaceConfirm({
            taskId,
            existingName: owner.username,
            reviewerName: username,
            resumeAdd: true,
            pendingAdd: resumeContext?.pendingAdd ?? { uid, username, role, taskIds },
            processedMembers: resumeContext?.membersDraft ?? membersDraft,
            processedTasks: resumeContext?.tasksDraft ?? tasksDraft,
          })
          return null
        }
      }
    }

    let nextMembers = membersDraft
    const nextTasks = tasksDraft.map((t) => {
      if (!taskIds.includes(t.id)) return t
      let updated = { ...t }
      if (role === ROLE_COLLECTOR) {
        updated = appendTaskPerson(updated, ROLE_COLLECTOR, username)
      }
      if (role === ROLE_REVIEWER) {
        nextMembers = stripAnnotatorForTask(nextMembers, t.id, username)
        updated = appendTaskPerson(updated, ROLE_REVIEWER, username)
      }
      if (role === ROLE_ACCEPTOR) {
        updated = appendTaskPerson(updated, ROLE_ACCEPTOR, username)
      }
      return updated
    })

    nextMembers = upsertMemberAssignment(nextMembers, { uid, username, role, taskIds })
    return { nextTasks, nextMembers }
  }

  const handleAddMemberSave = () => {
    const errs = {}
    if (!addForm.role) errs.role = true
    if (!addForm.username) errs.username = true
    if (!addForm.taskIds.length) errs.taskIds = true
    if (Object.keys(errs).length) {
      setAddErrors(errs)
      return
    }

    const result = applySingleMemberAdd(members, projectTasks, {
      uid: addForm.uid,
      username: addForm.username,
      role: addForm.role,
      taskIds: addForm.taskIds,
    }, { pendingAdd: addForm, membersDraft: members, tasksDraft: projectTasks })
    if (!result) return

    onTasksChange((prev) =>
      prev.map((t) => result.nextTasks.find((n) => n.id === t.id) ?? t),
    )
    commitMembers(result.nextMembers)
    setAddOpen(false)
  }

  const handleAddSave = () => {
    const errs = {}
    if (!form.role) errs.role = true
    if (!form.username) errs.username = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const result = applyFormToTasksAndMembers(members)
    if (!result) return

    onTasksChange((prev) =>
      prev.map((t) => result.nextTasks.find((n) => n.id === t.id) ?? t),
    )
    commitMembers(result.nextMembers)
    setAddOpen(false)
    setBatchOpen(false)
    setMatrixOpen(false)
  }

  const handleConfigTaskSave = () => {
    if (!configTaskMember) return

    const role = configTaskMember.role
    const { taskIds } = configTaskForm
    const username = configTaskMember.username
    const affectedIds = new Set([...(configTaskMember.taskIds ?? []), ...taskIds])

    const nextTasks = projectTasks.map((t) => {
      if (!affectedIds.has(t.id)) return t

      const selected = taskIds.includes(t.id)
      let collectors = getTaskCollectors(t)
      let reviewers = getTaskAnnotators(t)
      let acceptors = getTaskAcceptors(t)

      if (role === ROLE_COLLECTOR) {
        if (selected && !collectors.includes(username)) collectors = [...collectors, username]
        if (!selected) collectors = collectors.filter((n) => n !== username)
      }
      if (role === ROLE_REVIEWER) {
        if (selected && !reviewers.includes(username)) reviewers = [...reviewers, username]
        if (!selected) reviewers = reviewers.filter((n) => n !== username)
      }
      if (role === ROLE_ACCEPTOR) {
        if (selected && !acceptors.includes(username)) acceptors = [...acceptors, username]
        if (!selected) acceptors = acceptors.filter((n) => n !== username)
      }

      return {
        ...t,
        collectors,
        collector: collectors,
        annotators: reviewers,
        reviewer: reviewers,
        acceptors,
        acceptor: acceptors,
      }
    })

    onTasksChange((prev) =>
      prev.map((t) => nextTasks.find((n) => n.id === t.id) ?? t),
    )
    commitMembers((list) =>
      pruneEmptyMembers(
        list.map((m) =>
          m.id === configTaskMember.id ? { ...m, taskIds: [...taskIds] } : m,
        ),
      ),
    )
    setConfigTaskMember(null)
  }

  const handleSingleAssignSave = () => {
    if (!assignTask) return

    const errs = {}
    if (!assignRoleLock.collectors && assignForm.collectors.length === 0) errs.collectors = true
    if (!assignRoleLock.reviewers && assignForm.reviewers.length === 0) errs.reviewers = true
    if (!assignRoleLock.acceptors && assignForm.acceptors.length === 0) errs.acceptors = true
    if (Object.keys(errs).length) {
      setAssignErrors(errs)
      return
    }

    const collectorNames = assignRoleLock.collectors
      ? assignSnapshot.collectors
      : [...new Set([...assignSnapshot.collectors, ...assignForm.collectors])]
    const reviewerNames = assignRoleLock.reviewers
      ? assignSnapshot.reviewers
      : [...new Set([...assignSnapshot.reviewers, ...assignForm.reviewers])]
    const acceptorNames = assignRoleLock.acceptors
      ? assignSnapshot.acceptors
      : [...new Set([...assignSnapshot.acceptors, ...assignForm.acceptors])]

    const updated = {
      ...assignTask,
      collectors: collectorNames,
      collector: collectorNames,
      annotators: reviewerNames,
      reviewer: reviewerNames,
      acceptors: acceptorNames,
      acceptor: acceptorNames,
    }

    const nextMembers = syncMembersForTaskAssignment(
      members,
      assignTask.id,
      collectorNames,
      reviewerNames,
      acceptorNames,
    )

    onTasksChange((prev) =>
      prev.map((t) => (t.id === assignTask.id ? updated : t)),
    )
    commitMembers(nextMembers)
    setAssignTask(null)
  }

  const runAssignmentCheck = () => {
    if (incompleteTasks.length === 0) {
      showToast('任务已全部完成分配！', { placement: 'top', variant: 'success' })
    } else {
      setMatrixOpen(true)
    }
  }

  const handleBatchRoleChange = (role) => {
    setForm((f) => ({ ...f, role, uid: '', username: '', taskIds: [] }))
    setErrors((e) => ({ ...e, role: false, username: false }))
  }

  const addMemberFormContent = (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">角色</label>
        <input
          readOnly
          value={addForm.role}
          className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          选择用户
          <span className="text-red-500">*</span>
        </label>
        <PersonDropdownSelect
          value={addForm.username}
          onChange={(username) => {
            const user = findUserByUsername(username)
            setAddForm((f) => ({ ...f, username, uid: user?.uid ?? '' }))
            setAddErrors((er) => ({ ...er, username: false }))
          }}
          options={addFormUsers.map((u) => u.username)}
          placeholder="请选择用户"
          error={addErrors.username}
        />
        {addErrors.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          配置任务
          <span className="text-red-500">*</span>
        </label>
        <TaskCheckboxList
          tasks={projectTasks}
          selectedIds={addForm.taskIds}
          onChange={(ids) => {
            setAddForm((f) => ({ ...f, taskIds: ids }))
            setAddErrors((er) => ({ ...er, taskIds: false }))
          }}
        />
        {addErrors.taskIds && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      </div>
    </div>
  )

  const memberFormContent = (taskList) => (
    <div className="space-y-4">
      <RolePicker
        value={form.role}
        onChange={handleBatchRoleChange}
        error={errors.role}
      />

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          选择用户
          <span className="text-red-500">*</span>
        </label>
        <PersonDropdownSelect
          value={form.username}
          onChange={(username) => {
            const user = findUserByUsername(username)
            setForm((f) => ({ ...f, username, uid: user?.uid ?? '' }))
            setErrors((er) => ({ ...er, username: false }))
          }}
          options={formUsers.map((u) => u.username)}
          placeholder={!form.role ? '请先选择角色' : '请输入用户名查找'}
          disabled={!form.role}
          disabledPlaceholder="请先选择角色"
          error={errors.username}
        />
        {errors.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">分配任务</label>
        {!form.role ? (
          <p className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">请先选择角色</p>
        ) : (
          <TaskCheckboxList
            tasks={taskList}
            selectedIds={form.taskIds}
            onChange={(ids) => setForm((f) => ({ ...f, taskIds: ids }))}
          />
        )}
      </div>
    </div>
  )

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'uid',
      render: (v) => <span className="font-mono text-sm text-gray-800">{v}</span>,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      title: '负责任务数',
      dataIndex: 'taskIds',
      render: (ids) => (
        <span className="tabular-nums text-gray-800">{memberTaskCount({ taskIds: ids })}</span>
      ),
    },
    dtCol('加入时间', 'joinedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="link"
            size="sm"
            onClick={() => onViewMemberTasks?.(row.username, row.role)}
          >
            查看任务
          </PermButton>
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="link"
            size="sm"
            onClick={() => openConfigTask(row)}
          >
            配置任务
          </PermButton>
        </div>
      ),
    },
  ]

  const matrixColumns = [
    {
      title: '任务名称',
      key: 'name',
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-400">{row.id}</p>
        </div>
      ),
    },
    {
      title: '采集员',
      key: 'collector',
      render: (_, row) => {
        const text = formatPeopleCell(row, ROLE_COLLECTOR)
        return text
          ? <span className="text-gray-700">{text}</span>
          : <span className="text-red-500">未分配</span>
      },
    },
    {
      title: '标注员',
      key: 'reviewer',
      render: (_, row) => {
        const text = formatPeopleCell(row, ROLE_REVIEWER)
        return text
          ? <span className="text-gray-700">{text}</span>
          : <span className="text-red-500">未分配</span>
      },
    },
    {
      title: '验收员',
      key: 'acceptor',
      render: (_, row) => {
        const text = formatPeopleCell(row, ROLE_ACCEPTOR)
        return text
          ? <span className="text-gray-700">{text}</span>
          : <span className="text-red-500">未分配</span>
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <PermButton
          permission="collection.project.edit"
          mode="disable"
          variant="link"
          size="sm"
          onClick={() => openAssign(row)}
        >
          分配
        </PermButton>
      ),
    },
  ]

  const matrixRows = incompleteTasks

  return (
    <div className="space-y-3">
      {ToastNode}

      <div className="flex items-end justify-between gap-4 border-b border-gray-200">
        <Tabs
          items={MEMBER_TABS}
          activeKey={memberTab}
          onChange={setMemberTab}
          className="min-w-0 flex-1 border-b-0"
        />
        <div className="shrink-0 pb-2">
          <ButtonLike onClick={runAssignmentCheck}>分配校验</ButtonLike>
        </div>
      </div>

      <ListPageCard>
        <ListPageFilter>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className={MEMBER_FILTER_LBL}>用户ID</label>
              <input
                value={qUid}
                onChange={(e) => setQUid(e.target.value)}
                placeholder="请输入用户ID"
                className={MEMBER_FILTER_INPUT_CLS}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className={MEMBER_FILTER_LBL}>用户名</label>
              <input
                value={qUsername}
                onChange={(e) => setQUsername(e.target.value)}
                placeholder="请输入用户名"
                className={MEMBER_FILTER_INPUT_CLS}
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={resetMemberFilters}>重置</Button>
              <Button variant="primary" icon={<IconSearch />} onClick={applyMemberFilters}>查询</Button>
            </div>
          </div>
        </ListPageFilter>

        <ListPageToolbar>
          <h2 className="text-base font-semibold text-gray-800">{memberTab}列表</h2>
          <PermButton
            permission="collection.project.create"
            variant="primary"
            icon={<IconPlus />}
            onClick={() => openAdd(memberTab)}
          >
            添加成员
          </PermButton>
        </ListPageToolbar>

        <Table
          embedded
          columns={columns}
          dataSource={filteredMembers}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={memberPageResetKey}
        />
      </ListPageCard>

      <Drawer open={addOpen} title="添加成员" onCancel={() => setAddOpen(false)} onOk={handleAddMemberSave}>
        {addMemberFormContent}
      </Drawer>

      <Modal
        open={batchOpen}
        title="批量分配"
        zIndex={60}
        onCancel={() => setBatchOpen(false)}
        onOk={handleAddSave}
        okText="确认分配"
      >
        {memberFormContent(batchTaskList)}
      </Modal>

      <Drawer
        open={!!configTaskMember}
        title="配置任务"
        width="min(960px, calc(100vw - var(--layout-sidebar-width, 13rem)))"
        onCancel={() => setConfigTaskMember(null)}
        onOk={handleConfigTaskSave}
      >
        {configTaskMember && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">用户名</label>
              <input
                readOnly
                value={configTaskMember.username}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">角色</label>
              <input
                readOnly
                value={configTaskMember.role}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                配置任务
              </label>
              <TreeTransfer
                key={configTaskMember.id}
                projects={configTaskProjects}
                tasks={projectTasks}
                value={configTaskForm.taskIds}
                onChange={(taskIds) => {
                  setConfigTaskForm((f) => ({ ...f, taskIds }))
                }}
              />
              <p className="mt-1.5 text-xs text-gray-400">无任务时，自动将该成员从项目成员列表中移除</p>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={matrixOpen}
        title="任务分配矩阵"
        width={1020}
        onCancel={() => setMatrixOpen(false)}
        footer={null}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-800">待分配任务</h4>
          <PermButton permission="collection.project.edit" mode="disable" variant="primary" onClick={openBatch}>
            批量分配
          </PermButton>
        </div>
        <Table columns={matrixColumns} dataSource={matrixRows} pageSize={LIST_PAGE_SIZE} />
      </Modal>

      <Modal
        open={!!assignTask}
        title="任务分配"
        zIndex={matrixOpen ? 60 : 50}
        onCancel={() => setAssignTask(null)}
        onOk={handleSingleAssignSave}
        okText="确定"
      >
        {assignTask && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                任务名称
                <span className="text-red-500">*</span>
              </label>
              <input
                readOnly
                value={assignTask.name}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                采集员
                <span className="text-red-500">*</span>
              </label>
              <PersonMultiDropdownSelect
                value={assignRoleLock.collectors ? assignSnapshot.collectors : assignForm.collectors}
                onChange={(collectors) => {
                  setAssignForm((f) => ({ ...f, collectors }))
                  setAssignErrors((e) => ({ ...e, collectors: false }))
                }}
                options={collectorOptions}
                placeholder="请选择采集员"
                readonly={assignRoleLock.collectors}
                error={assignErrors.collectors}
              />
              {assignErrors.collectors && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                标注员
                <span className="text-red-500">*</span>
              </label>
              <PersonMultiDropdownSelect
                value={assignRoleLock.reviewers ? assignSnapshot.reviewers : assignForm.reviewers}
                onChange={(reviewers) => {
                  setAssignForm((f) => ({ ...f, reviewers }))
                  setAssignErrors((e) => ({ ...e, reviewers: false }))
                }}
                options={reviewerOptions}
                placeholder="请选择标注员"
                readonly={assignRoleLock.reviewers}
                error={assignErrors.reviewers}
              />
              {assignErrors.reviewers && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                验收员
                <span className="text-red-500">*</span>
              </label>
              <PersonMultiDropdownSelect
                value={assignRoleLock.acceptors ? assignSnapshot.acceptors : assignForm.acceptors}
                onChange={(acceptors) => {
                  setAssignForm((f) => ({ ...f, acceptors }))
                  setAssignErrors((e) => ({ ...e, acceptors: false }))
                }}
                options={acceptorOptions}
                placeholder="请选择验收员"
                readonly={assignRoleLock.acceptors}
                error={assignErrors.acceptors}
              />
              {assignErrors.acceptors && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
            </div>
          </div>
        )}
      </Modal>

      {replaceConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setReplaceConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <h2 className="text-base font-semibold text-gray-800">替换标注员</h2>
              </div>
              <p className="text-sm text-gray-500">
                该任务已有标注员「<strong className="text-gray-800">{replaceConfirm.existingName}</strong>」，是否替换为「{replaceConfirm.reviewerName}」？
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setReplaceConfirm(null)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmReplaceReviewer}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ButtonLike({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition hover:border-blue-400 hover:text-blue-600"
    >
      {children}
    </button>
  )
}
