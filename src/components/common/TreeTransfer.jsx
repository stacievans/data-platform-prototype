import { useMemo, useState } from 'react'
import Button from './Button'
import {
  CheckboxListSelectAllRow,
  IndeterminateCheckbox,
} from './CheckboxList'
import { IconChevronDown, IconSearch } from './Icons'

/** 约 10 行任务行高度（每行 ~32px） */
const LIST_MAX_HEIGHT = 320
const ROW_HEIGHT = 32

const PANEL_CLS = 'flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white'
const HEADER_CLS = 'shrink-0 border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700'
const TREE_CHECKBOX_CLS = 'h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600'

function nodeKey(type, id) {
  return `${type}:${id}`
}

function parseNodeKey(key) {
  const [type, id] = key.split(':')
  return { type, id }
}

function TreeCheckbox({ checked, indeterminate, disabled = false, onChange, className = '' }) {
  return (
    <IndeterminateCheckbox
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      onChange={onChange}
      className={`${TREE_CHECKBOX_CLS}${className ? ` ${className}` : ''}${
        disabled ? ' cursor-not-allowed opacity-50' : ''
      }`}
    />
  )
}

export default function TreeTransfer({
  projects,
  tasks,
  value = [],
  onChange,
  error = false,
}) {
  const [search, setSearch] = useState('')
  const [leftChecked, setLeftChecked] = useState(() => new Set())
  const [rightChecked, setRightChecked] = useState(() => new Set())
  const [expanded, setExpanded] = useState(() => new Set(projects.map((p) => p.id)))

  const selectedSet = useMemo(() => new Set(value), [value])
  const searchLower = search.trim().toLowerCase()

  const leftGroups = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id)
      let visibleTasks = projectTasks
      if (searchLower) {
        const projectMatch = project.name.toLowerCase().includes(searchLower)
          || project.id.toLowerCase().includes(searchLower)
        visibleTasks = projectTasks.filter(
          (t) => projectMatch
            || t.name.toLowerCase().includes(searchLower)
            || t.id.toLowerCase().includes(searchLower),
        )
        if (!projectMatch && visibleTasks.length === 0) return null
      }
      if (visibleTasks.length === 0) return null
      return { project, tasks: visibleTasks }
    }).filter(Boolean)
  }, [projects, tasks, searchLower])

  const rightGroups = useMemo(() => {
    return projects.map((project) => {
      const selected = tasks.filter(
        (t) => t.projectId === project.id && selectedSet.has(t.id),
      )
      if (!selected.length) return null
      return { project, tasks: selected }
    }).filter(Boolean)
  }, [projects, tasks, selectedSet])

  const leftSelectableTasks = useMemo(
    () => leftGroups.flatMap((g) => g.tasks.filter((t) => !selectedSet.has(t.id))),
    [leftGroups, selectedSet],
  )

  const leftSelectableKeys = useMemo(
    () => leftSelectableTasks.map((t) => nodeKey('task', t.id)),
    [leftSelectableTasks],
  )

  const leftSelectableCheckedCount = useMemo(
    () => leftSelectableKeys.filter((k) => leftChecked.has(k)).length,
    [leftSelectableKeys, leftChecked],
  )

  const leftAllSelectableChecked = leftSelectableTasks.length > 0
    && leftSelectableCheckedCount === leftSelectableTasks.length
  const leftSomeSelectableChecked = leftSelectableCheckedCount > 0 && !leftAllSelectableChecked

  const rightCheckedCount = useMemo(
    () => value.filter((id) => rightChecked.has(id)).length,
    [value, rightChecked],
  )

  const rightAllChecked = value.length > 0 && rightCheckedCount === value.length
  const rightSomeChecked = rightCheckedCount > 0 && !rightAllChecked

  const toggleExpand = (projectId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  const toggleLeftSelectAll = () => {
    if (leftAllSelectableChecked) {
      setLeftChecked((prev) => {
        const next = new Set(prev)
        leftSelectableKeys.forEach((k) => next.delete(k))
        return next
      })
    } else {
      setLeftChecked((prev) => {
        const next = new Set(prev)
        leftSelectableKeys.forEach((k) => next.add(k))
        return next
      })
    }
  }

  const toggleRightSelectAll = () => {
    if (rightAllChecked) setRightChecked(new Set())
    else setRightChecked(new Set(value))
  }

  const toggleLeftTask = (taskId) => {
    if (selectedSet.has(taskId)) return
    const key = nodeKey('task', taskId)
    setLeftChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleLeftProject = (visibleTasks) => {
    const selectable = visibleTasks.filter((t) => !selectedSet.has(t.id))
    if (!selectable.length) return
    const keys = selectable.map((t) => nodeKey('task', t.id))
    const allChecked = keys.every((k) => leftChecked.has(k))
    setLeftChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) keys.forEach((k) => next.delete(k))
      else keys.forEach((k) => next.add(k))
      return next
    })
  }

  const toggleRightTask = (taskId) => {
    setRightChecked((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleRightProject = (group) => {
    const ids = group.tasks.map((t) => t.id)
    const allChecked = ids.every((id) => rightChecked.has(id))
    setRightChecked((prev) => {
      const next = new Set(prev)
      if (allChecked) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const handleAdd = () => {
    const toAdd = new Set()
    leftChecked.forEach((key) => {
      const { type, id } = parseNodeKey(key)
      if (type === 'task' && !selectedSet.has(id)) toAdd.add(id)
    })
    if (!toAdd.size) return
    onChange([...new Set([...value, ...toAdd])])
    setLeftChecked(new Set())
  }

  const handleRemove = () => {
    if (!rightChecked.size) return
    onChange(value.filter((id) => !rightChecked.has(id)))
    setRightChecked(new Set())
  }

  const listScrollStyle = { maxHeight: LIST_MAX_HEIGHT, minHeight: LIST_MAX_HEIGHT }

  return (
    <div className={`flex gap-3 ${error ? 'rounded-md ring-1 ring-red-400' : ''}`}>
      <div className={PANEL_CLS}>
        <div className={HEADER_CLS}>候选项目 / 任务</div>
        <div className="shrink-0 border-b border-gray-100 p-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目 / 任务名称"
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="overflow-y-auto" style={listScrollStyle}>
          {leftGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center p-2 text-sm text-gray-400">暂无匹配任务</div>
          ) : (
            <>
              {leftSelectableTasks.length > 0 && (
                <CheckboxListSelectAllRow
                  checked={leftAllSelectableChecked}
                  indeterminate={leftSomeSelectableChecked}
                  onToggle={toggleLeftSelectAll}
                  selectedCount={leftSelectableCheckedCount}
                  totalCount={leftSelectableTasks.length}
                />
              )}
              <div className="p-2">
                {leftGroups.map(({ project, tasks: visibleTasks }) => {
                  const selectable = visibleTasks.filter((t) => !selectedSet.has(t.id))
                  const transferred = visibleTasks.filter((t) => selectedSet.has(t.id))
                  const selectableKeys = selectable.map((t) => nodeKey('task', t.id))
                  const selectableCheckedCount = selectableKeys.filter((k) => leftChecked.has(k)).length
                  const allTransferred = selectable.length === 0 && transferred.length > 0
                  const allSelectableChecked = selectable.length > 0 && selectableCheckedCount === selectable.length
                  const projectChecked = allTransferred || allSelectableChecked
                  const projectIndeterminate = !allTransferred && selectableCheckedCount > 0 && !allSelectableChecked
                  const projectDisabled = selectable.length === 0
                  const isExpanded = expanded.has(project.id)

                  return (
                    <div key={project.id} className="mb-1">
                      <div
                        className="flex items-center gap-1.5 rounded px-1 hover:bg-gray-50"
                        style={{ minHeight: ROW_HEIGHT }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpand(project.id)}
                          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center text-gray-400"
                        >
                          <IconChevronDown className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        <TreeCheckbox
                          checked={projectChecked}
                          indeterminate={projectIndeterminate}
                          disabled={projectDisabled}
                          onChange={() => toggleLeftProject(visibleTasks)}
                        />
                        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${projectDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                          {project.name}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">{project.id}</span>
                      </div>
                      {isExpanded && (
                        <div className="ml-7 space-y-0.5">
                          {visibleTasks.map((t) => {
                            const locked = selectedSet.has(t.id)
                            const checked = locked || leftChecked.has(nodeKey('task', t.id))
                            const rowCls = `flex items-center gap-2 rounded px-1 ${
                              locked ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:bg-gray-50'
                            }`

                            if (locked) {
                              return (
                                <div key={t.id} className={rowCls} style={{ minHeight: ROW_HEIGHT }}>
                                  <TreeCheckbox checked={checked} disabled />
                                  <span className="min-w-0 flex-1 truncate text-sm text-gray-400">{t.name}</span>
                                  <span className="shrink-0 text-xs text-gray-400">{t.id}</span>
                                </div>
                              )
                            }

                            return (
                              <label
                                key={t.id}
                                className={rowCls}
                                style={{ minHeight: ROW_HEIGHT }}
                              >
                                <TreeCheckbox
                                  checked={checked}
                                  onChange={() => toggleLeftTask(t.id)}
                                />
                                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{t.name}</span>
                                <span className="shrink-0 text-xs text-gray-400">{t.id}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-center">
        <Button
          size="sm"
          disabled={leftChecked.size === 0}
          onClick={handleAdd}
          className="min-w-[108px]"
        >
          &gt;&gt; 添加选中
        </Button>
        <Button
          size="sm"
          disabled={rightChecked.size === 0}
          onClick={handleRemove}
          className="min-w-[108px]"
        >
          &lt;&lt; 移除选中
        </Button>
      </div>

      <div className={PANEL_CLS}>
        <div className={HEADER_CLS}>
          已选任务（总计 {value.length} 条）
        </div>
        <div className="overflow-y-auto" style={listScrollStyle}>
          {rightGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center p-2 text-sm text-gray-400">请从左侧添加任务</div>
          ) : (
            <>
              <CheckboxListSelectAllRow
                checked={rightAllChecked}
                indeterminate={rightSomeChecked}
                onToggle={toggleRightSelectAll}
                selectedCount={rightCheckedCount}
                totalCount={value.length}
              />
              <div className="p-2">
                {rightGroups.map(({ project, tasks: selectedTasks }) => {
                  const ids = selectedTasks.map((t) => t.id)
                  const checkedCount = ids.filter((id) => rightChecked.has(id)).length
                  const allChecked = ids.length > 0 && checkedCount === ids.length
                  const indeterminate = checkedCount > 0 && !allChecked

                  return (
                    <div key={project.id} className="mb-3 last:mb-0">
                      <div
                        className="mb-1 flex items-center gap-2 rounded bg-gray-50 px-2"
                        style={{ minHeight: ROW_HEIGHT }}
                      >
                        <TreeCheckbox
                          checked={allChecked}
                          indeterminate={indeterminate}
                          onChange={() => toggleRightProject({ project, tasks: selectedTasks })}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{project.name}</span>
                        <span className="shrink-0 text-xs text-gray-500">{selectedTasks.length} 条</span>
                      </div>
                      <div className="ml-2 space-y-0.5">
                        {selectedTasks.map((t) => (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 hover:bg-gray-50"
                            style={{ minHeight: ROW_HEIGHT }}
                          >
                            <TreeCheckbox
                              checked={rightChecked.has(t.id)}
                              onChange={() => toggleRightTask(t.id)}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{t.name}</span>
                            <span className="shrink-0 text-xs text-gray-400">{t.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
