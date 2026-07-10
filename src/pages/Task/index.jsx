import { useMemo, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import TaskTable from './TaskTable'
import CreateTaskModal from './CreateTaskModal'
import ProjectMutateGate from '../../components/common/ProjectMutateGate'
import {
  tasks as taskStore,
  syncTasks,
  nextTaskId,
  nowDatetime,
  formatReviewer,
  enrichTask,
} from '../../mock/tasks'
import { getAllDeviceTypes } from '../../mock/devices'
import { IconSearch, IconChevronDown } from '../../components/common/Icons'
import { filterTasksByDataScope } from '../../mock/permissions'
import { useAuth } from '../../context/AuthContext'
import { PermButton } from '../../components/common/PermissionAction'

const STATUS_OPTIONS = ['全部', '草稿', '已发布', '已归档']

/* 筛选区 label 统一样式 */
const LBL = 'mb-1 block text-xs text-gray-500'
/* 筛选区 input / select 统一样式 */
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FILTER_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
const FILTER_FIELD = 'min-w-0'
const FILTER_ACTIONS = 'flex flex-wrap items-center justify-end gap-2'

/* ── 删除确认弹窗 ── */
function DeleteConfirmModal({ task, open, onCancel, onConfirm }) {
  const [input, setInput] = useState('')
  const match = input === task?.name
  const reset = () => setInput('')

  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-600">删除采集任务</h2>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-500">
            此操作不可逆。如果确定要删除，请在下方输入{' '}
            <strong className="text-gray-800">{task.name}</strong>{' '}以确认。
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入名称以确认"
            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => { reset(); onCancel() }}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            取消
          </button>
          <button
            disabled={!match}
            onClick={() => { reset(); onConfirm() }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              match ? 'cursor-pointer bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-200'
            }`}
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 主组件
   fixedProjectId: 传入时锁定项目、隐藏项目筛选下拉，用于项目详情页
── */
export default function TaskList({
  fixedProjectId = null,
  projectStatus = 'open',
  tasks: externalTasks,
  onTasksChange,
  initialMemberFilter = null,
  onMemberFilterApplied,
}) {
  const { user } = useAuth()
  const location = useLocation()
  const [internalTasks, setInternalTasks] = useState(() => [...taskStore])
  const tasks = externalTasks ?? internalTasks

  const setTasks = useCallback((updater) => {
    if (onTasksChange) {
      onTasksChange(updater)
    } else {
      setInternalTasks(syncTasks(updater))
    }
  }, [onTasksChange])

  useEffect(() => {
    if (!onTasksChange) {
      setInternalTasks([...taskStore])
    }
  }, [location.pathname, onTasksChange])

  const [createOpen, setCreateOpen] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  /* ── 筛选输入暂存（未提交） ── */
  const [qTaskId, setQTaskId] = useState('')
  const [qTaskName, setQTaskName] = useState('')
  const [qProjectName, setQProjectName] = useState('')
  const [qPlanId, setQPlanId] = useState('')
  const [qCollector, setQCollector] = useState('')
  const [qReviewer, setQReviewer] = useState('')
  const [qPurpose, setQPurpose] = useState('全部')
  const [qBodyType, setQBodyType] = useState('全部')
  const [qDeviceCode, setQDeviceCode] = useState('')
  const [qScene, setQScene] = useState('全部')
  const [qMethod, setQMethod] = useState('全部')
  const [qStatus, setQStatus] = useState('全部')

  /* ── 已提交的筛选条件（点查询后才生效） ── */
  const [filters, setFilters] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!initialMemberFilter) return
    const { name, role } = initialMemberFilter
    if (role === '采集员') {
      setQCollector(name)
      setQReviewer('')
      setFilters({ collector: name })
    } else {
      setQReviewer(name)
      setQCollector('')
      setFilters({ reviewer: name })
    }
    onMemberFilterApplied?.()
  }, [initialMemberFilter, onMemberFilterApplied])

  const scopedTasks = useMemo(
    () => filterTasksByDataScope(tasks, user.nickname, user.role),
    [tasks, user.nickname, user.role],
  )

  const poolTasks = useMemo(
    () => (fixedProjectId ? scopedTasks.filter((t) => t.projectId === fixedProjectId) : scopedTasks),
    [scopedTasks, fixedProjectId],
  )

  const deviceTypes = useMemo(() => getAllDeviceTypes(), [location.pathname])

  const filterOptions = useMemo(() => ({
    purposes: ['全部', ...new Set(poolTasks.map((t) => t.purpose).filter(Boolean))],
    scenes: ['全部', ...new Set(poolTasks.map((t) => t.scene).filter(Boolean))],
    methods: ['全部', ...new Set(poolTasks.map((t) => t.method).filter(Boolean))],
  }), [poolTasks])

  const filtered = useMemo(() => {
    const {
      taskId, taskName, projectName, planId, collector, reviewer,
      purpose, bodyType, deviceCode, scene, method, status,
    } = filters
    return poolTasks
      .filter((t) => {
        const enriched = enrichTask(t)
        if (taskId && !t.id.toLowerCase().includes(taskId.toLowerCase())) return false
        if (taskName && !t.name.toLowerCase().includes(taskName.toLowerCase())) return false
        if (projectName && !(t.projectName ?? '').toLowerCase().includes(projectName.toLowerCase())) return false
        if (planId && !String(t.planId ?? '').toLowerCase().includes(planId.toLowerCase())) return false
        if (collector && !formatReviewer(t.collector).toLowerCase().includes(collector.toLowerCase())) return false
        if (reviewer && !formatReviewer(t.reviewer).toLowerCase().includes(reviewer.toLowerCase())) return false
        if (purpose && purpose !== '全部' && t.purpose !== purpose) return false
        if (bodyType && bodyType !== '全部' && enriched.deviceTypeId !== bodyType) return false
        if (deviceCode && !(enriched.device ?? '').toLowerCase().includes(deviceCode.toLowerCase())) return false
        if (scene && scene !== '全部' && t.scene !== scene) return false
        if (method && method !== '全部' && t.method !== method) return false
        if (status && status !== '全部' && t.status !== status) return false
        return true
      })
      .map(enrichTask)
  }, [poolTasks, filters])

  const taskPageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const applyFilters = () => setFilters({
    taskId: qTaskId,
    taskName: qTaskName,
    projectName: fixedProjectId ? '' : qProjectName,
    planId: qPlanId,
    collector: qCollector,
    reviewer: qReviewer,
    purpose: qPurpose,
    bodyType: qBodyType,
    deviceCode: qDeviceCode.trim(),
    scene: qScene,
    method: qMethod,
    status: qStatus,
  })

  const resetFilters = () => {
    setQTaskId('')
    setQTaskName('')
    setQProjectName('')
    setQPlanId('')
    setQCollector('')
    setQReviewer('')
    setQPurpose('全部')
    setQBodyType('全部')
    setQDeviceCode('')
    setQScene('全部')
    setQMethod('全部')
    setQStatus('全部')
    setFilters({})
  }

  const confirmDelete = () => {
    setTasks(tasks.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const handleStatusChange = (taskId, newStatus) =>
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: nowDatetime() } : t,
    ))

  const handleEditSave = (taskId, changes) =>
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, ...changes, updatedAt: nowDatetime() } : t,
    ))

  const handleCopy = (task) => {
    const newId = nextTaskId(tasks)
    const now = nowDatetime()
    setTasks((prev) => [{
      ...task,
      id: newId,
      name: `${task.name}_副本${newId}`,
      collectDone: 0,
      reviewDone: 0,
      acceptDone: 0,
      dataTotal: 0,
      status: '草稿',
      createdAt: now,
      updatedAt: now,
    }, ...prev])
  }

  return (
    <div className="space-y-4">
      {/* 筛选区 */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className={FILTER_GRID}>
            <div className={FILTER_FIELD}>
              <label className={LBL}>任务ID</label>
              <input value={qTaskId} onChange={(e) => setQTaskId(e.target.value)} placeholder="请输入任务ID" className={INPUT_CLS} />
            </div>
            <div className={FILTER_FIELD}>
              <label className={LBL}>任务名称</label>
              <input value={qTaskName} onChange={(e) => setQTaskName(e.target.value)} placeholder="请输入任务名称" className={INPUT_CLS} />
            </div>
            {!fixedProjectId && (
              <div className={FILTER_FIELD}>
                <label className={LBL}>所属项目名称</label>
                <input value={qProjectName} onChange={(e) => setQProjectName(e.target.value)} placeholder="请输入项目名称" className={INPUT_CLS} />
              </div>
            )}
            <div className={FILTER_FIELD}>
              <label className={LBL}>采集方案ID</label>
              <input value={qPlanId} onChange={(e) => setQPlanId(e.target.value)} placeholder="请输入方案ID" className={INPUT_CLS} />
            </div>
            <div className={FILTER_FIELD}>
              <label className={LBL}>采集员</label>
              <input value={qCollector} onChange={(e) => setQCollector(e.target.value)} placeholder="请输入姓名" className={INPUT_CLS} />
            </div>
            {fixedProjectId && (
              <div className={FILTER_FIELD}>
                <label className={LBL}>标注员</label>
                <input value={qReviewer} onChange={(e) => setQReviewer(e.target.value)} placeholder="请输入姓名" className={INPUT_CLS} />
              </div>
            )}
          </div>

          {filtersExpanded && (
            <div className={FILTER_GRID}>
              {!fixedProjectId && (
                <div className={FILTER_FIELD}>
                  <label className={LBL}>标注员</label>
                  <input value={qReviewer} onChange={(e) => setQReviewer(e.target.value)} placeholder="请输入姓名" className={INPUT_CLS} />
                </div>
              )}
              <div className={FILTER_FIELD}>
                <label className={LBL}>任务用途</label>
                <select value={qPurpose} onChange={(e) => setQPurpose(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {filterOptions.purposes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>设备类型</label>
                <select value={qBodyType} onChange={(e) => setQBodyType(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  <option value="全部">全部</option>
                  {deviceTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>采集设备</label>
                <input
                  value={qDeviceCode}
                  onChange={(e) => setQDeviceCode(e.target.value)}
                  placeholder="请输入编号"
                  className={INPUT_CLS}
                />
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>所属场景</label>
                <select value={qScene} onChange={(e) => setQScene(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {filterOptions.scenes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>采集方式</label>
                <select value={qMethod} onChange={(e) => setQMethod(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {filterOptions.methods.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className={FILTER_FIELD}>
                <label className={LBL}>状态</label>
                <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
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

      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">任务列表</h2>
        {fixedProjectId && (
          <ProjectMutateGate projectStatus={projectStatus}>
            <PermButton permission="collection.task.create" variant="primary" onClick={() => setCreateOpen(true)}>
              + 新建任务
            </PermButton>
          </ProjectMutateGate>
        )}
      </div>

      <TaskTable
        data={filtered}
        showProjectColumn={!fixedProjectId}
        pageResetKey={taskPageResetKey}
        onDeleteClick={setDeleteTarget}
        onStatusChange={handleStatusChange}
        onEditSave={handleEditSave}
        onCopy={handleCopy}
      />

      {fixedProjectId && (
        <CreateTaskModal
          open={createOpen}
          projectId={fixedProjectId}
          onClose={(task) => {
            setCreateOpen(false)
            if (task) setTasks((prev) => [task, ...prev])
          }}
        />
      )}

      <DeleteConfirmModal
        task={deleteTarget}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
