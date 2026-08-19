import { useMemo, useRef, useState } from 'react'
import Table from '../../components/common/Table'
import Tabs from '../../components/common/Tabs'
import Modal from '../../components/common/Modal'
import Drawer from '../../components/common/Drawer'
import { IconPlus } from '../../components/common/Icons'
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
  formatReviewer,
  getTaskCollectors,
  getTaskAnnotators,
} from '../../mock/tasks'
import { dtCol, nowDateTime, formatDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const ROLE_COLLECTOR = '采集员'
const ROLE_REVIEWER = '标注员'
const ROLE_BOTH = '采集员&标注员'
const ROLE_OPTIONS = [ROLE_COLLECTOR, ROLE_REVIEWER, ROLE_BOTH]
const ADD_ROLE_OPTIONS = [ROLE_COLLECTOR, ROLE_REVIEWER]
const MEMBER_TABS = [
  { key: ROLE_COLLECTOR, label: ROLE_COLLECTOR },
  { key: ROLE_REVIEWER, label: ROLE_REVIEWER },
]
const nowDatetime = () => nowDateTime()

function hasCollector(task) {
  return getTaskCollectors(task).length > 0
}

function hasReviewer(task) {
  return getTaskAnnotators(task).length > 0
}

function formatPeopleCell(task, role) {
  const names = role === ROLE_COLLECTOR ? getTaskCollectors(task) : getTaskAnnotators(task)
  if (!names.length) return null
  return names.join('、')
}

function getAssignmentStatus(task) {
  return hasCollector(task) && hasReviewer(task) ? '已完成' : '未完成'
}

function memberTaskCount(member) {
  return member.taskIds?.length ?? 0
}

function pruneEmptyMembers(list) {
  return list.filter((m) => memberTaskCount(m) > 0)
}

function userMatchesRole(user, role) {
  if (role === ROLE_BOTH) return user.role === ROLE_BOTH
  if (role === ROLE_COLLECTOR) return user.role === ROLE_COLLECTOR || user.role === ROLE_BOTH
  if (role === ROLE_REVIEWER) return user.role === ROLE_REVIEWER || user.role === ROLE_BOTH
  return false
}

function userHasAllRoles(user, roles) {
  return roles.every((role) => userMatchesRole(user, role))
}

function memberInRole(list, name, role) {
  return list.some((m) => m.name === name && m.role === role)
}

function appendTaskPerson(task, role, name) {
  if (role === ROLE_COLLECTOR) {
    const prev = getTaskCollectors(task)
    const next = prev.includes(name) ? prev : [...prev, name]
    return { ...task, collectors: next, collector: next }
  }
  if (role === ROLE_REVIEWER) {
    const prev = getTaskAnnotators(task)
    const next = prev.includes(name) ? prev : [...prev, name]
    return { ...task, annotators: next, reviewer: next }
  }
  return task
}

function tasksUnassignedForRole(role, projectTasks) {
  if (role === ROLE_COLLECTOR) return projectTasks.filter((t) => !hasCollector(t))
  if (role === ROLE_REVIEWER) return projectTasks.filter((t) => !hasReviewer(t))
  if (role === ROLE_BOTH) return projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t))
  return []
}

function tasksUnassignedForRoles(roles, projectTasks) {
  if (!roles.length) return []
  if (roles.includes(ROLE_COLLECTOR) && roles.includes(ROLE_REVIEWER)) {
    return projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t))
  }
  if (roles.includes(ROLE_COLLECTOR)) return projectTasks.filter((t) => !hasCollector(t))
  if (roles.includes(ROLE_REVIEWER)) return projectTasks.filter((t) => !hasReviewer(t))
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

function RolePicker({ value, onChange, options = ROLE_OPTIONS, error }) {
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

function RoleMultiPicker({ value = [], onChange, error }) {
  const toggle = (role) => {
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role])
  }

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        角色
        <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {ADD_ROLE_OPTIONS.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              value.includes(role)
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

  const [form, setForm] = useState({ name: '', roles: [], taskIds: [] })
  const [addForm, setAddForm] = useState({
    roles: [],
    name: '',
    collectorTaskIds: [],
    reviewerTaskIds: [],
  })
  const [configTaskForm, setConfigTaskForm] = useState({ taskIds: [] })
  const [assignForm, setAssignForm] = useState({ collectors: [], reviewers: [] })
  const [assignSnapshot, setAssignSnapshot] = useState({ collectors: [], reviewers: [] })
  const [assignRoleLock, setAssignRoleLock] = useState({ collectors: false, reviewers: false })
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

  const incompleteTasks = useMemo(
    () => projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t)),
    [projectTasks],
  )

  const batchTaskList = useMemo(
    () => (form.roles.length ? tasksUnassignedForRoles(form.roles, incompleteTasks) : []),
    [form.roles, incompleteTasks],
  )

  const formUsers = useMemo(() => {
    if (!form.roles.length) return []
    return users.filter(
      (u) =>
        u.status === '启用' &&
        u.nickname !== project?.creator &&
        userHasAllRoles(u, form.roles) &&
        !form.roles.some((role) => memberInRole(members, u.nickname, role)),
    )
  }, [form.roles, members, project?.creator])

  const addFormUsers = useMemo(() => {
    if (!addForm.roles.length) return []
    return getUsersByOrgId(DEMO_ORG_ID).filter(
      (u) =>
        u.status === '启用' &&
        u.nickname !== project?.creator &&
        userHasAllRoles(u, addForm.roles) &&
        !addForm.roles.some((role) => memberInRole(members, u.nickname, role)),
    )
  }, [addForm.roles, members, project?.creator])

  const collectorOptions = useMemo(
    () => [...new Set([...collectors, ...members.filter((m) => m.role === ROLE_COLLECTOR).map((m) => m.name)])],
    [members],
  )

  const reviewerOptions = useMemo(
    () => [...new Set([...reviewers, ...members.filter((m) => m.role === ROLE_REVIEWER).map((m) => m.name)])],
    [members],
  )

  const resetForm = () => {
    setForm({ name: '', roles: [], taskIds: [] })
    setErrors({})
  }

  const resetAddForm = () => {
    setAddForm({ roles: [], name: '', collectorTaskIds: [], reviewerTaskIds: [] })
    setAddErrors({})
  }

  const openAdd = () => {
    resetAddForm()
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
    const collectors = getTaskCollectors(task)
    const reviewers = getTaskAnnotators(task)
    setAssignTask(task)
    setAssignSnapshot({ collectors, reviewers })
    setAssignRoleLock({
      collectors: collectors.length > 0,
      reviewers: reviewers.length > 0,
    })
    setAssignForm({ collectors: [], reviewers: [] })
    setAssignErrors({})
  }

  const stripAnnotatorForTask = (list, taskId, excludeName = null) =>
    list.map((m) => {
      if (m.name === excludeName) return m
      if (m.role === ROLE_REVIEWER && m.taskIds.includes(taskId)) {
        return { ...m, taskIds: m.taskIds.filter((t) => t !== taskId) }
      }
      return m
    })

  const upsertMemberAssignment = (list, { name, role, taskIds }) => {
    const existing = list.find((m) => m.name === name && m.role === role)
    if (existing) {
      const merged = [...new Set([...(existing.taskIds ?? []), ...taskIds])]
      return list.map((m) => (m.id === existing.id ? { ...m, taskIds: merged } : m))
    }
    return [
      ...list,
      {
        id: `PM-${projectId}-${Date.now()}-${role}`,
        name,
        role,
        taskIds: [...taskIds],
        joinedAt: nowDatetime(),
      },
    ]
  }

  const syncMembersForTaskAssignment = (list, taskId, collectorNames, reviewerNames) => {
    let next = [...list]
    for (const name of collectorNames) {
      next = upsertMemberAssignment(next, { name, role: ROLE_COLLECTOR, taskIds: [taskId] })
    }
    for (const name of reviewerNames) {
      next = upsertMemberAssignment(next, { name, role: ROLE_REVIEWER, taskIds: [taskId] })
    }
    return pruneEmptyMembers(
      next.map((m) => {
        if (!m.taskIds.includes(taskId)) return m
        const keep =
          (m.role === ROLE_COLLECTOR && collectorNames.includes(m.name)) ||
          (m.role === ROLE_REVIEWER && reviewerNames.includes(m.name))
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

      for (const role of pendingAdd.roles) {
        const taskIds =
          role === ROLE_COLLECTOR ? pendingAdd.collectorTaskIds : pendingAdd.reviewerTaskIds
        const result = applySingleMemberAdd(membersDraft, tasksDraft, {
          name: pendingAdd.name,
          role,
          taskIds,
        })
        if (!result) return
        membersDraft = result.nextMembers
        tasksDraft = result.nextTasks
      }

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
      name: reviewerName,
      role: ROLE_REVIEWER,
      taskIds: [taskId],
    })
    onTasksChange((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reviewer: reviewerName } : t)),
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
    const { roles, name, taskIds } = form

    for (const taskId of taskIds) {
      if (roles.includes(ROLE_REVIEWER)) {
        const owner = membersDraft.find(
          (m) =>
            m.name !== name &&
            m.role === ROLE_REVIEWER &&
            m.taskIds.includes(taskId),
        )
        if (owner) {
          setReplaceConfirm({
            taskId,
            existingName: owner.name,
            reviewerName: name,
            resumeAdd: true,
            pendingAdd: { name, roles, collectorTaskIds: roles.includes(ROLE_COLLECTOR) ? taskIds : [], reviewerTaskIds: roles.includes(ROLE_REVIEWER) ? taskIds : [] },
          })
          return null
        }
      }
    }

    const nextTasks = projectTasks.map((t) => {
      if (!taskIds.includes(t.id)) return t
      let updated = { ...t }
      if (roles.includes(ROLE_COLLECTOR)) {
        updated = appendTaskPerson(updated, ROLE_COLLECTOR, name)
      }
      if (roles.includes(ROLE_REVIEWER)) {
        membersDraft = stripAnnotatorForTask(membersDraft, t.id, name)
        updated = appendTaskPerson(updated, ROLE_REVIEWER, name)
      }
      return updated
    })

    for (const role of roles) {
      membersDraft = upsertMemberAssignment(membersDraft, { name, role, taskIds })
    }

    return { nextTasks, nextMembers: membersDraft }
  }

  const applySingleMemberAdd = (membersDraft, tasksDraft, { name, role, taskIds }, resumeContext = null) => {
    if (role === ROLE_REVIEWER) {
      for (const taskId of taskIds) {
        const owner = membersDraft.find(
          (m) => m.name !== name && m.role === ROLE_REVIEWER && m.taskIds.includes(taskId),
        )
        if (owner) {
          setReplaceConfirm({
            taskId,
            existingName: owner.name,
            reviewerName: name,
            resumeAdd: true,
            pendingAdd: resumeContext?.pendingAdd ?? {
              name,
              roles: [role],
              collectorTaskIds: [],
              reviewerTaskIds: taskIds,
            },
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
        updated = appendTaskPerson(updated, ROLE_COLLECTOR, name)
      }
      if (role === ROLE_REVIEWER) {
        nextMembers = stripAnnotatorForTask(nextMembers, t.id, name)
        updated = appendTaskPerson(updated, ROLE_REVIEWER, name)
      }
      return updated
    })

    nextMembers = upsertMemberAssignment(nextMembers, { name, role, taskIds })
    return { nextTasks, nextMembers }
  }

  const handleAddMemberSave = () => {
    const errs = {}
    if (!addForm.roles.length) errs.roles = true
    if (!addForm.name) errs.name = true
    if (addForm.roles.includes(ROLE_COLLECTOR) && !addForm.collectorTaskIds.length) {
      errs.collectorTaskIds = true
    }
    if (addForm.roles.includes(ROLE_REVIEWER) && !addForm.reviewerTaskIds.length) {
      errs.reviewerTaskIds = true
    }
    if (Object.keys(errs).length) {
      setAddErrors(errs)
      return
    }

    let membersDraft = [...members]
    let tasksDraft = [...projectTasks]

    for (const role of addForm.roles) {
      const taskIds =
        role === ROLE_COLLECTOR ? addForm.collectorTaskIds : addForm.reviewerTaskIds
      const result = applySingleMemberAdd(
        membersDraft,
        tasksDraft,
        { name: addForm.name, role, taskIds },
        { pendingAdd: addForm, membersDraft, tasksDraft },
      )
      if (!result) return
      membersDraft = result.nextMembers
      tasksDraft = result.nextTasks
    }

    onTasksChange((prev) =>
      prev.map((t) => tasksDraft.find((n) => n.id === t.id) ?? t),
    )
    commitMembers(membersDraft)
    setAddOpen(false)
  }

  const handleAddSave = () => {
    const errs = {}
    if (!form.roles.length) errs.roles = true
    if (!form.name) errs.name = true
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
    const name = configTaskMember.name
    const affectedIds = new Set([...(configTaskMember.taskIds ?? []), ...taskIds])

    const nextTasks = projectTasks.map((t) => {
      if (!affectedIds.has(t.id)) return t

      const selected = taskIds.includes(t.id)
      let collectors = getTaskCollectors(t)
      let reviewers = getTaskAnnotators(t)

      if (role === ROLE_COLLECTOR) {
        if (selected && !collectors.includes(name)) collectors = [...collectors, name]
        if (!selected) collectors = collectors.filter((n) => n !== name)
      }
      if (role === ROLE_REVIEWER) {
        if (selected && !reviewers.includes(name)) reviewers = [...reviewers, name]
        if (!selected) reviewers = reviewers.filter((n) => n !== name)
      }

      return {
        ...t,
        collectors,
        collector: collectors,
        annotators: reviewers,
        reviewer: reviewers,
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

    const updated = {
      ...assignTask,
      collectors: collectorNames,
      collector: collectorNames,
      annotators: reviewerNames,
      reviewer: reviewerNames,
    }

    const nextMembers = syncMembersForTaskAssignment(
      members,
      assignTask.id,
      collectorNames,
      reviewerNames,
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

  const handleBatchRolesChange = (roles) => {
    setForm((f) => ({ ...f, roles, name: '', taskIds: [] }))
    setErrors((e) => ({ ...e, roles: false, name: false }))
  }

  const handleAddRolesChange = (roles) => {
    setAddForm((f) => ({ ...f, roles, name: '', collectorTaskIds: [], reviewerTaskIds: [] }))
    setAddErrors((e) => ({ ...e, roles: false, name: false, collectorTaskIds: false, reviewerTaskIds: false }))
  }

  const addMemberFormContent = (
    <div className="space-y-4">
      <RoleMultiPicker
        value={addForm.roles}
        onChange={handleAddRolesChange}
        error={addErrors.roles}
      />

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          选择用户
          <span className="text-red-500">*</span>
        </label>
        <PersonDropdownSelect
          value={addForm.name}
          onChange={(name) => {
            setAddForm((f) => ({ ...f, name }))
            setAddErrors((er) => ({ ...er, name: false }))
          }}
          options={addFormUsers.map((u) => u.nickname)}
          placeholder={!addForm.roles.length ? '请先选择角色' : '请选择用户'}
          disabled={!addForm.roles.length}
          disabledPlaceholder="请先选择角色"
          error={addErrors.name}
        />
        {addErrors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      </div>

      {addForm.roles.includes(ROLE_COLLECTOR) && (
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            配置任务（采集员）
            <span className="text-red-500">*</span>
          </label>
          <TaskCheckboxList
            tasks={projectTasks}
            selectedIds={addForm.collectorTaskIds}
            onChange={(ids) => {
              setAddForm((f) => ({ ...f, collectorTaskIds: ids }))
              setAddErrors((er) => ({ ...er, collectorTaskIds: false }))
            }}
          />
          {addErrors.collectorTaskIds && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
        </div>
      )}

      {addForm.roles.includes(ROLE_REVIEWER) && (
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            配置任务（标注员）
            <span className="text-red-500">*</span>
          </label>
          <TaskCheckboxList
            tasks={projectTasks}
            selectedIds={addForm.reviewerTaskIds}
            onChange={(ids) => {
              setAddForm((f) => ({ ...f, reviewerTaskIds: ids }))
              setAddErrors((er) => ({ ...er, reviewerTaskIds: false }))
            }}
          />
          {addErrors.reviewerTaskIds && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
        </div>
      )}
    </div>
  )

  const memberFormContent = (taskList) => (
    <div className="space-y-4">
      <RoleMultiPicker
        value={form.roles}
        onChange={handleBatchRolesChange}
        error={errors.roles}
      />

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          选择用户
          <span className="text-red-500">*</span>
        </label>
        <PersonDropdownSelect
          value={form.name}
          onChange={(name) => {
            setForm((f) => ({ ...f, name }))
            setErrors((er) => ({ ...er, name: false }))
          }}
          options={formUsers.map((u) => u.nickname)}
          placeholder={!form.roles.length ? '请先选择角色' : '请输入用户姓名查找'}
          disabled={!form.roles.length}
          disabledPlaceholder="请先选择角色"
          error={errors.name}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">分配任务</label>
        {!form.roles.length ? (
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
      title: '姓名',
      dataIndex: 'name',
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
            onClick={() => onViewMemberTasks?.(row.name, row.role)}
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

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">项目成员</h2>
        <div className="flex items-center gap-2">
          <ButtonLike onClick={runAssignmentCheck}>分配校验</ButtonLike>
          <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openAdd}>
            添加成员
          </PermButton>
        </div>
      </div>

      <Tabs
        items={MEMBER_TABS}
        activeKey={memberTab}
        onChange={setMemberTab}
        className="mb-1"
      />

      <Table
        columns={columns}
        dataSource={tabMembers}
        pageSize={LIST_PAGE_SIZE}
        pageResetKey={`${memberTab}-${tabMembers.length}`}
      />

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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">成员</label>
              <input
                readOnly
                value={configTaskMember.name}
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
        width={920}
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
