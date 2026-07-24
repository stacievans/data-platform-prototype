import { useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import { CheckboxListSelectAllRow, IndeterminateCheckbox } from '../../components/common/CheckboxList'
import { IconSearch } from '../../components/common/Icons'

const PANEL_CLS = 'flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white'
const HEADER_CLS = 'shrink-0 border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700'
const CHECKBOX_CLS = 'h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600'
const LIST_MAX_HEIGHT = 320
const ROW_HEIGHT = 32

export default function ProjectDataTransfer({ projects, value = [], onChange, error = false }) {
  const [search, setSearch] = useState('')
  const [leftChecked, setLeftChecked] = useState(() => new Set())
  const [rightChecked, setRightChecked] = useState(() => new Set())

  const selectedSet = useMemo(() => new Set(value), [value])
  const searchLower = search.trim().toLowerCase()

  const filteredProjects = useMemo(() => projects.filter((p) => {
    if (!searchLower) return true
    return p.name.toLowerCase().includes(searchLower) || p.id.toLowerCase().includes(searchLower)
  }), [projects, searchLower])

  const leftSelectable = useMemo(
    () => filteredProjects.filter((p) => !selectedSet.has(p.id)),
    [filteredProjects, selectedSet],
  )

  const rightProjects = useMemo(
    () => projects.filter((p) => selectedSet.has(p.id)),
    [projects, selectedSet],
  )

  const leftSelectableIds = useMemo(
    () => leftSelectable.map((p) => p.id),
    [leftSelectable],
  )

  const leftCheckedCount = useMemo(
    () => leftSelectableIds.filter((id) => leftChecked.has(id)).length,
    [leftSelectableIds, leftChecked],
  )

  const leftAllChecked = leftSelectable.length > 0 && leftCheckedCount === leftSelectable.length
  const leftSomeChecked = leftCheckedCount > 0 && !leftAllChecked

  const rightCheckedCount = useMemo(
    () => value.filter((id) => rightChecked.has(id)).length,
    [value, rightChecked],
  )

  const rightAllChecked = value.length > 0 && rightCheckedCount === value.length
  const rightSomeChecked = rightCheckedCount > 0 && !rightAllChecked

  const toggleLeftSelectAll = () => {
    if (leftAllChecked) {
      setLeftChecked((prev) => {
        const next = new Set(prev)
        leftSelectableIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setLeftChecked(new Set(leftSelectableIds))
    }
  }

  const toggleRightSelectAll = () => {
    if (rightAllChecked) setRightChecked(new Set())
    else setRightChecked(new Set(value))
  }

  const toggleLeftProject = (projectId) => {
    if (selectedSet.has(projectId)) return
    setLeftChecked((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  const toggleRightProject = (projectId) => {
    setRightChecked((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  const handleAdd = () => {
    const toAdd = leftSelectableIds.filter((id) => leftChecked.has(id))
    if (!toAdd.length) return
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
        <div className={HEADER_CLS}>候选项目</div>
        <div className="shrink-0 border-b border-gray-100 p-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目名称"
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="overflow-y-auto" style={listScrollStyle}>
          {filteredProjects.length === 0 ? (
            <div className="flex h-full items-center justify-center p-2 text-sm text-gray-400">暂无匹配项目</div>
          ) : (
            <>
              {leftSelectable.length > 0 && (
                <CheckboxListSelectAllRow
                  checked={leftAllChecked}
                  indeterminate={leftSomeChecked}
                  onToggle={toggleLeftSelectAll}
                  selectedCount={leftCheckedCount}
                  totalCount={leftSelectable.length}
                />
              )}
              <div className="space-y-0.5 p-2">
                {filteredProjects.map((project) => {
                  const locked = selectedSet.has(project.id)
                  const checked = locked || leftChecked.has(project.id)
                  const rowCls = `flex items-center gap-2 rounded px-2 ${
                    locked ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:bg-gray-50'
                  }`

                  if (locked) {
                    return (
                      <div key={project.id} className={rowCls} style={{ minHeight: ROW_HEIGHT }}>
                        <IndeterminateCheckbox checked={checked} disabled className={CHECKBOX_CLS} />
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-400">{project.name}</span>
                        <span className="shrink-0 text-xs text-gray-400">{project.id}</span>
                      </div>
                    )
                  }

                  return (
                    <label key={project.id} className={rowCls} style={{ minHeight: ROW_HEIGHT }}>
                      <IndeterminateCheckbox
                        checked={checked}
                        onChange={() => toggleLeftProject(project.id)}
                        className={CHECKBOX_CLS}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{project.name}</span>
                      <span className="shrink-0 text-xs text-gray-400">{project.id}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-center">
        <Button size="sm" disabled={leftChecked.size === 0} onClick={handleAdd} className="min-w-[108px]">
          &gt;&gt; 添加选中
        </Button>
        <Button size="sm" disabled={rightChecked.size === 0} onClick={handleRemove} className="min-w-[108px]">
          &lt;&lt; 移除选中
        </Button>
      </div>

      <div className={PANEL_CLS}>
        <div className={HEADER_CLS}>已选项目（总计 {value.length} 个）</div>
        <div className="overflow-y-auto" style={listScrollStyle}>
          {rightProjects.length === 0 ? (
            <div className="flex h-full items-center justify-center p-2 text-sm text-gray-400">请从左侧添加项目</div>
          ) : (
            <>
              <CheckboxListSelectAllRow
                checked={rightAllChecked}
                indeterminate={rightSomeChecked}
                onToggle={toggleRightSelectAll}
                selectedCount={rightCheckedCount}
                totalCount={value.length}
              />
              <div className="space-y-0.5 p-2">
                {rightProjects.map((project) => (
                  <label
                    key={project.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 hover:bg-gray-50"
                    style={{ minHeight: ROW_HEIGHT }}
                  >
                    <IndeterminateCheckbox
                      checked={rightChecked.has(project.id)}
                      onChange={() => toggleRightProject(project.id)}
                      className={CHECKBOX_CLS}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{project.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">{project.id}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
