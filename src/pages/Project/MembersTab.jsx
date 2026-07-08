import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import { PermButton } from '../../components/common/PermissionAction'
import { useToast } from '../../components/common/Toast'
import { users, projectMembers as allProjectMembers } from '../../mock/misc'
import { projects } from '../../mock/projects'
import {
  collectors,
  reviewers,
  toPeopleArray,
  formatReviewer,
  formatCollectors,
} from '../../mock/tasks'

const ROLE_COLLECTOR = '采集员'
const ROLE_REVIEWER = '标注员'
const ROLE_BOTH = '采集员&标注员'
const ROLE_OPTIONS = [ROLE_COLLECTOR, ROLE_REVIEWER, ROLE_BOTH]
const ROLE_COLORS = {
  [ROLE_COLLECTOR]: 'cyan',
  [ROLE_REVIEWER]: 'orange',
  [ROLE_BOTH]: 'purple',
  平台运营: 'blue',
}
const nowDatetime = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

function hasCollector(task) {
  return toPeopleArray(task.collector).filter(Boolean).length > 0
}

function hasReviewer(task) {
  const r = formatReviewer(task.reviewer)
  return Boolean(r && r !== '—')
}

function getAssignmentStatus(task) {
  return hasCollector(task) && hasReviewer(task) ? '已完成' : '未完成'
}

function memberHasDualRole(member) {
  return member.roles.includes(ROLE_COLLECTOR) && member.roles.includes(ROLE_REVIEWER)
}

function displayMemberRoles(roles) {
  if (roles.includes(ROLE_COLLECTOR) && roles.includes(ROLE_REVIEWER)) return [ROLE_BOTH]
  return roles.filter((r) => r === ROLE_COLLECTOR || r === ROLE_REVIEWER)
}

function rolesToStore(role) {
  if (role === ROLE_BOTH) return [ROLE_COLLECTOR, ROLE_REVIEWER]
  return [role]
}

function memberTaskCount(member) {
  return member.taskIds?.length ?? 0
}

function userMatchesRole(user, role) {
  if (role === ROLE_BOTH) return user.role === ROLE_BOTH
  if (role === ROLE_COLLECTOR) return user.role === ROLE_COLLECTOR || user.role === ROLE_BOTH
  if (role === ROLE_REVIEWER) return user.role === ROLE_REVIEWER || user.role === ROLE_BOTH
  return false
}

function tasksUnassignedForRole(role, projectTasks) {
  if (role === ROLE_COLLECTOR) return projectTasks.filter((t) => !hasCollector(t))
  if (role === ROLE_REVIEWER) return projectTasks.filter((t) => !hasReviewer(t))
  if (role === ROLE_BOTH) return projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t))
  return []
}

function tasksForMemberRole(member, role, projectTasks) {
  return projectTasks.filter((t) => {
    if (!member.taskIds.includes(t.id)) return false
    if (role === ROLE_BOTH) {
      return (
        toPeopleArray(t.collector).includes(member.name)
        || formatReviewer(t.reviewer) === member.name
      )
    }
    if (role === ROLE_COLLECTOR) return toPeopleArray(t.collector).includes(member.name)
    if (role === ROLE_REVIEWER) return formatReviewer(t.reviewer) === member.name
    return false
  })
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

function PersonDropdownSelect({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  disabledPlaceholder,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const filtered = useMemo(
    () => options.filter((name) => name.toLowerCase().includes(q.trim().toLowerCase())),
    [options, q],
  )

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

  return (
    <SelectChevronWrap className="w-full">
      <div className="relative">
        <input
          value={open ? q : (value || '')}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-8 w-full rounded-md border border-gray-300 bg-white py-0 pl-2.5 pr-8 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 w-8 cursor-pointer"
          aria-label="展开选项"
        />
        {open && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
            <div className="absolute z-[71] mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">无匹配人员</p>
              ) : (
                filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { onChange(name); setQ(''); setOpen(false) }}
                    className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
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
  searchPlaceholder = '搜索任务名称或 ID',
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return tasks
    return tasks.filter(
      (t) => t.name.toLowerCase().includes(kw) || t.id.toLowerCase().includes(kw),
    )
  }, [tasks, q])

  const allChecked = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id))

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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={filtered.length === 0}
          className="shrink-0 cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {allChecked ? '取消全选' : '全选'}
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">暂无任务</p>
      ) : (
        <div className="max-h-36 overflow-y-auto rounded-md border border-gray-300 bg-white p-2">
          {filtered.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400">无匹配任务</p>
          ) : (
            filtered.map((task) => (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => toggleOne(task.id)}
                  className="h-4 w-4 cursor-pointer accent-blue-600"
                />
                <span className="flex-1 text-sm text-gray-700">{task.name}</span>
                <span className="text-xs text-gray-400">{task.id}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function MembersTab({ projectId, projectTasks, onTasksChange, onViewMemberTasks }) {
  const project = projects.find((p) => p.id === projectId)
  const { ToastNode, show: showToast } = useToast()

  const [members, setMembers] = useState(
    () => (allProjectMembers[projectId] ?? []).filter((m) => !m.roles.includes('平台运营')),
  )

  const [addOpen, setAddOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(null)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [assignTask, setAssignTask] = useState(null)
  const [replaceConfirm, setReplaceConfirm] = useState(null)

  const [form, setForm] = useState({ name: '', role: '', taskIds: [] })
  const [removeForm, setRemoveForm] = useState({ role: '', taskIds: [] })
  const [assignForm, setAssignForm] = useState({ collector: '', reviewer: '' })
  const [errors, setErrors] = useState({})

  const incompleteTasks = useMemo(
    () => projectTasks.filter((t) => !hasCollector(t) || !hasReviewer(t)),
    [projectTasks],
  )

  const formTaskList = useMemo(
    () => (form.role ? tasksUnassignedForRole(form.role, projectTasks) : []),
    [form.role, projectTasks],
  )

  const batchTaskList = useMemo(
    () => (form.role ? tasksUnassignedForRole(form.role, incompleteTasks) : incompleteTasks),
    [form.role, incompleteTasks],
  )

  const formUsers = useMemo(() => {
    if (!form.role) return []
    return users.filter(
      (u) =>
        u.status === '启用' &&
        u.nickname !== project?.creator &&
        userMatchesRole(u, form.role) &&
        !members.some((m) => m.name === u.nickname),
    )
  }, [form.role, members, project?.creator])

  const collectorOptions = useMemo(
    () => [...new Set([...collectors, ...members.filter((m) => m.roles.includes(ROLE_COLLECTOR)).map((m) => m.name)])],
    [members],
  )

  const reviewerOptions = useMemo(
    () => [...new Set([...reviewers, ...members.filter((m) => m.roles.includes(ROLE_REVIEWER)).map((m) => m.name)])],
    [members],
  )

  const resetForm = () => {
    setForm({ name: '', role: '', taskIds: [] })
    setErrors({})
  }

  const openAdd = () => {
    resetForm()
    setAddOpen(true)
  }

  const openBatch = () => {
    resetForm()
    setBatchOpen(true)
  }

  const getDefaultRemoveRole = (row) => {
    if (memberHasDualRole(row)) return ROLE_BOTH
    return displayMemberRoles(row.roles)[0] ?? ROLE_COLLECTOR
  }

  const openRemove = (row) => {
    const role = getDefaultRemoveRole(row)
    const roleTasks = tasksForMemberRole(row, role, projectTasks)
    setRemoveForm({ role, taskIds: roleTasks.map((t) => t.id) })
    setRemoveOpen(row)
  }

  const openAssign = (task) => {
    setAssignTask(task)
    setAssignForm({ collector: '', reviewer: '' })
  }

  const stripAnnotatorForTask = (list, taskId, excludeName = null) =>
    list.map((m) => {
      if (m.name === excludeName) return m
      if (m.roles.includes(ROLE_REVIEWER) && m.taskIds.includes(taskId)) {
        return { ...m, taskIds: m.taskIds.filter((t) => t !== taskId) }
      }
      return m
    })

  const upsertMemberAssignment = (list, { name, roles, taskIds }) => {
    let next = [...list]
    let member = next.find((m) => m.name === name)
    if (!member) {
      member = {
        id: `PM-${projectId}-${Date.now()}`,
        name,
        roles: [...roles],
        taskIds: [],
        joinedAt: nowDatetime(),
      }
      next.push(member)
    } else {
      const mergedRoles = [...new Set([...member.roles, ...roles])]
      next = next.map((m) => (m.id === member.id ? { ...m, roles: mergedRoles } : m))
      member = next.find((m) => m.id === member.id)
    }
    const merged = [...new Set([...(member.taskIds ?? []), ...taskIds])]
    return next.map((m) => (m.id === member.id ? { ...m, taskIds: merged } : m))
  }

  const confirmReplaceReviewer = () => {
    const { taskId, reviewerName } = replaceConfirm
    let nextMembers = stripAnnotatorForTask(members, taskId, reviewerName)
    nextMembers = upsertMemberAssignment(nextMembers, {
      name: reviewerName,
      roles: [ROLE_REVIEWER],
      taskIds: [taskId],
    })
    onTasksChange((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reviewer: reviewerName } : t)),
    )
    setMembers(nextMembers)
    setReplaceConfirm(null)

    if (replaceConfirm.resumeAdd) {
      setAddOpen(false)
      setBatchOpen(false)
      setMatrixOpen(false)
    }
    setAssignTask(null)
  }

  const applyFormToTasksAndMembers = (nextMembers) => {
    let membersDraft = [...nextMembers]

    for (const taskId of form.taskIds) {
      const needsReviewer = form.role === ROLE_REVIEWER || form.role === ROLE_BOTH
      if (needsReviewer) {
        const owner = membersDraft.find(
          (m) =>
            m.name !== form.name &&
            m.roles.includes(ROLE_REVIEWER) &&
            m.taskIds.includes(taskId),
        )
        if (owner) {
          setReplaceConfirm({
            taskId,
            existingName: owner.name,
            reviewerName: form.name,
            resumeAdd: true,
          })
          return null
        }
      }
    }

    const nextTasks = projectTasks.map((t) => {
      if (!form.taskIds.includes(t.id)) return t
      let updated = { ...t }
      const assignCollector = form.role === ROLE_COLLECTOR || form.role === ROLE_BOTH
      const assignReviewer = form.role === ROLE_REVIEWER || form.role === ROLE_BOTH

      if (assignCollector) {
        const list = toPeopleArray(t.collector)
        if (!list.includes(form.name)) {
          updated = { ...updated, collector: [...list, form.name] }
        }
      }
      if (assignReviewer) {
        membersDraft = stripAnnotatorForTask(membersDraft, t.id, form.name)
        updated = { ...updated, reviewer: form.name }
      }
      return updated
    })

    const storedRoles = rolesToStore(form.role)
    const existing = membersDraft.find((m) => m.name === form.name)
    if (existing) {
      membersDraft = membersDraft.map((m) =>
        m.id === existing.id
          ? {
              ...m,
              roles: [...new Set([...m.roles, ...storedRoles])],
              taskIds: [...new Set([...m.taskIds, ...form.taskIds])],
            }
          : m,
      )
    } else {
      membersDraft = [
        ...membersDraft,
        {
          id: `PM-${projectId}-${Date.now()}`,
          name: form.name,
          roles: storedRoles,
          taskIds: form.taskIds,
          joinedAt: nowDatetime(),
        },
      ]
    }

    return { nextTasks, nextMembers: membersDraft }
  }

  const handleAddSave = () => {
    const errs = {}
    if (!form.name) errs.name = true
    if (!form.role) errs.role = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const result = applyFormToTasksAndMembers(members)
    if (!result) return

    onTasksChange((prev) =>
      prev.map((t) => result.nextTasks.find((n) => n.id === t.id) ?? t),
    )
    setMembers(result.nextMembers)
    setAddOpen(false)
    setBatchOpen(false)
    setMatrixOpen(false)
  }

  const handleRemoveSave = () => {
    if (!removeOpen) return
    const { role, taskIds: remaining } = removeForm
    const roleTasks = tasksForMemberRole(removeOpen, role, projectTasks)
    const removedIds = roleTasks.map((t) => t.id).filter((id) => !remaining.includes(id))

    let nextTasks = [...projectTasks]
    for (const taskId of removedIds) {
      nextTasks = nextTasks.map((t) => {
        if (t.id !== taskId) return t
        let updated = { ...t }
        if (role === ROLE_COLLECTOR || role === ROLE_BOTH) {
          updated = {
            ...updated,
            collector: toPeopleArray(t.collector).filter((p) => p !== removeOpen.name),
          }
        }
        if (role === ROLE_REVIEWER || role === ROLE_BOTH) {
          if (formatReviewer(t.reviewer) === removeOpen.name) {
            updated = { ...updated, reviewer: '' }
          }
        }
        return updated
      })
    }

    const otherIds = removeOpen.taskIds.filter(
      (id) => !roleTasks.some((t) => t.id === id),
    )
    const newTaskIds = [...otherIds, ...remaining]

    onTasksChange((prev) =>
      prev.map((t) => nextTasks.find((n) => n.id === t.id) ?? t),
    )
    setMembers((list) =>
      list.map((m) =>
        m.id === removeOpen.id ? { ...m, taskIds: newTaskIds } : m,
      ),
    )
    setRemoveOpen(null)
  }

  const handleSingleAssignSave = () => {
    if (!assignTask) return

    let nextMembers = [...members]
    let updated = { ...assignTask }

    if (!hasCollector(assignTask) && assignForm.collector) {
      updated = {
        ...updated,
        collector: [...toPeopleArray(assignTask.collector), assignForm.collector],
      }
      nextMembers = upsertMemberAssignment(nextMembers, {
        name: assignForm.collector,
        roles: [ROLE_COLLECTOR],
        taskIds: [assignTask.id],
      })
    }

    if (!hasReviewer(assignTask) && assignForm.reviewer) {
      const owner = nextMembers.find(
        (m) =>
          m.name !== assignForm.reviewer &&
          m.roles.includes(ROLE_REVIEWER) &&
          m.taskIds.includes(assignTask.id),
      )
      if (owner) {
        setReplaceConfirm({
          taskId: assignTask.id,
          existingName: owner.name,
          reviewerName: assignForm.reviewer,
        })
        return
      }
      nextMembers = stripAnnotatorForTask(nextMembers, assignTask.id, assignForm.reviewer)
      updated = { ...updated, reviewer: assignForm.reviewer }
      nextMembers = upsertMemberAssignment(nextMembers, {
        name: assignForm.reviewer,
        roles: [ROLE_REVIEWER],
        taskIds: [assignTask.id],
      })
    }

    if (updated === assignTask) {
      setAssignTask(null)
      return
    }

    onTasksChange((prev) =>
      prev.map((t) => (t.id === assignTask.id ? updated : t)),
    )
    setMembers(nextMembers)
    setAssignTask(null)
  }

  const runAssignmentCheck = () => {
    if (incompleteTasks.length === 0) {
      showToast('任务已全部完成分配！')
    } else {
      setMatrixOpen(true)
    }
  }

  const handleRoleChange = (role) => {
    setForm((f) => ({ ...f, role, name: '', taskIds: [] }))
    setErrors((e) => ({ ...e, role: false, name: false }))
  }

  const memberFormContent = (taskList) => (
    <div className="space-y-4">
      <RolePicker
        value={form.role}
        onChange={handleRoleChange}
        error={errors.role}
      />

      <div>
        <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          选择用户<span className="text-red-500">*</span>
        </label>
        <SelectChevronWrap className="w-full" disabled={!form.role}>
          <select
            value={form.name}
            disabled={!form.role}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
              setErrors((er) => ({ ...er, name: false }))
            }}
            className={`h-8 w-full rounded-md border px-2.5 text-sm outline-none transition-colors focus:ring-2 ${
              !form.role
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                : errors.name
                  ? 'cursor-pointer border-red-400 focus:ring-red-100'
                  : 'cursor-pointer border-gray-300 text-gray-700 focus:border-blue-500 focus:ring-blue-100'
            }`}
          >
            <option value="" disabled hidden>
              {!form.role ? '请先选择角色' : '请选择用户'}
            </option>
            {formUsers.map((u) => (
              <option key={u.uid} value={u.nickname}>{u.nickname}</option>
            ))}
          </select>
        </SelectChevronWrap>
        {errors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
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
      title: '姓名',
      dataIndex: 'name',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {displayMemberRoles(roles).map((r) => (
            <Badge key={r} color={ROLE_COLORS[r] || 'gray'}>{r}</Badge>
          ))}
        </div>
      ),
    },
    {
      title: '负责任务数',
      dataIndex: 'taskIds',
      render: (ids) => (
        <span className="tabular-nums text-gray-800">{memberTaskCount({ taskIds: ids })}</span>
      ),
    },
    { title: '加入时间', dataIndex: 'joinedAt' },
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
            onClick={() => {
              const role = memberHasDualRole(row) ? ROLE_BOTH : displayMemberRoles(row.roles)[0] ?? ROLE_COLLECTOR
              onViewMemberTasks?.(row.name, role === ROLE_BOTH ? ROLE_COLLECTOR : role)
            }}
          >
            查看任务
          </PermButton>
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="link"
            size="sm"
            onClick={() => openRemove(row)}
          >
            移除任务
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
      render: (_, row) => (
        hasCollector(row)
          ? <span className="text-gray-700">{formatCollectors(row.collector)}</span>
          : <span className="text-red-500">未分配</span>
      ),
    },
    {
      title: '标注员',
      key: 'reviewer',
      render: (_, row) => (
        hasReviewer(row)
          ? <span className="text-gray-700">{formatReviewer(row.reviewer)}</span>
          : <span className="text-red-500">未分配</span>
      ),
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

      <Table columns={columns} dataSource={members} />

      <Modal open={addOpen} title="添加成员" onCancel={() => setAddOpen(false)} onOk={handleAddSave} okText="添加">
        {memberFormContent(formTaskList)}
      </Modal>

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

      <Modal
        open={!!removeOpen}
        title="移除任务"
        onCancel={() => setRemoveOpen(null)}
        onOk={handleRemoveSave}
        okText="保存"
      >
        {removeOpen && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">成员</label>
              <input
                readOnly
                value={removeOpen.name}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>
            <RolePicker
              value={removeForm.role}
              onChange={(role) => {
                const roleTasks = tasksForMemberRole(removeOpen, role, projectTasks)
                setRemoveForm({
                  role,
                  taskIds: roleTasks.map((t) => t.id),
                })
              }}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">任务列表</label>
              <p className="mb-2 text-xs text-gray-400">取消勾选以移除任务，保存后生效</p>
              <TaskCheckboxList
                tasks={tasksForMemberRole(removeOpen, removeForm.role, projectTasks)}
                selectedIds={removeForm.taskIds}
                onChange={(ids) => setRemoveForm((f) => ({ ...f, taskIds: ids }))}
              />
            </div>
          </div>
        )}
      </Modal>

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
        <Table columns={matrixColumns} dataSource={matrixRows} pageSize={10} />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            当前仍有 {matrixRows.length} 个任务未完成完整分配
          </p>
          <button
            type="button"
            onClick={() => setMatrixOpen(false)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </Modal>

      <Modal
        open={!!assignTask}
        title="任务分配"
        zIndex={matrixOpen ? 60 : 50}
        onCancel={() => setAssignTask(null)}
        onOk={handleSingleAssignSave}
        okText="保存"
      >
        {assignTask && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">任务名称</label>
              <input
                readOnly
                value={assignTask.name}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">采集员</label>
              <PersonDropdownSelect
                value={hasCollector(assignTask) ? formatCollectors(assignTask.collector) : assignForm.collector}
                onChange={(v) => setAssignForm((f) => ({ ...f, collector: v }))}
                options={collectorOptions}
                placeholder="请选择采集员"
                disabled={hasCollector(assignTask)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">标注员</label>
              <PersonDropdownSelect
                value={hasReviewer(assignTask) ? formatReviewer(assignTask.reviewer) : assignForm.reviewer}
                onChange={(v) => setAssignForm((f) => ({ ...f, reviewer: v }))}
                options={reviewerOptions}
                placeholder="请选择标注员"
                disabled={hasReviewer(assignTask)}
              />
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
