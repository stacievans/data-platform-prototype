import { useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import TaskTable from './TaskTable'
import CreateTaskModal from './CreateTaskModal'
import { tasks as initialTasks, collectors, reviewers, nextTaskId, nowDatetime, toPeopleArray, formatReviewer } from '../../mock/tasks'
import { projects } from '../../mock/projects'
import { IconSearch } from '../../components/common/Icons'
import { filterTasksByDataScope } from '../../mock/permissions'
import { useAuth } from '../../context/AuthContext'
import { PermButton } from '../../components/common/PermissionAction'

const STATUS_OPTIONS = ['全部', '草稿', '已发布', '已归档']

/* 筛选区 label 统一样式 */
const LBL = 'mb-1 block text-xs text-gray-500'
/* 筛选区 input / select 统一样式 */
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

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
export default function TaskList({ fixedProjectId = null }) {
  const { user } = useAuth()
  const [tasks, setTasks]         = useState(initialTasks)
  const [createOpen, setCreateOpen] = useState(false)
  /* ── 筛选输入暂存（未提交） ── */
  const [qTaskId,   setQTaskId]   = useState('')
  const [qTaskName, setQTaskName] = useState('')
  const [qStatus,   setQStatus]   = useState('全部')
  const [qCollector,setQCollector]= useState('全部')
  const [qReviewer, setQReviewer] = useState('全部')
  const [qProject,  setQProject]  = useState('全部')   // 全局任务页专用

  /* ── 已提交的筛选条件（点查询后才生效） ── */
  const [filters, setFilters] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)

  const scopedTasks = useMemo(
    () => filterTasksByDataScope(tasks, user.nickname, user.role),
    [tasks, user.nickname, user.role],
  )

  const filtered = useMemo(() => {
    const { taskId, taskName, status, collector, reviewer, project } = filters
    return scopedTasks.filter((t) => {
      if (fixedProjectId) {
        if (t.projectId !== fixedProjectId) return false
      } else {
        if (project && project !== '全部' && t.projectName !== project) return false
      }
      if (taskId   && !t.id.toLowerCase().includes(taskId.toLowerCase()))   return false
      if (taskName && !t.name.toLowerCase().includes(taskName.toLowerCase())) return false
      if (status   && status !== '全部' && t.status    !== status)    return false
      if (collector && collector !== '全部' && !toPeopleArray(t.collector).includes(collector)) return false
      if (reviewer  && reviewer  !== '全部' && formatReviewer(t.reviewer) !== reviewer)  return false
      return true
    })
  }, [scopedTasks, fixedProjectId, filters])

  const applyFilters = () => setFilters({
    taskId: qTaskId, taskName: qTaskName,
    status: qStatus, collector: qCollector, reviewer: qReviewer,
    project: qProject,
  })

  const resetFilters = () => {
    setQTaskId(''); setQTaskName('')
    setQStatus('全部'); setQCollector('全部'); setQReviewer('全部')
    if (!fixedProjectId) setQProject('全部')
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            {!fixedProjectId && (
              <div className="min-w-0 flex-1 basis-0">
                <label className={LBL}>所属项目</label>
                <select value={qProject} onChange={(e) => setQProject(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                  {['全部', ...projects.map((p) => p.name)].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>任务ID</label>
              <input value={qTaskId} onChange={(e) => setQTaskId(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>任务名称</label>
              <input value={qTaskName} onChange={(e) => setQTaskName(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>任务状态</label>
              <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>采集员</label>
              <select value={qCollector} onChange={(e) => setQCollector(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {['全部', ...collectors].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>标注员</label>
              <select value={qReviewer} onChange={(e) => setQReviewer(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {['全部', ...reviewers].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">任务列表</h2>
        {fixedProjectId && (
          <PermButton permission="collection.task.create" variant="primary" onClick={() => setCreateOpen(true)}>
            + 新建任务
          </PermButton>
        )}
      </div>

      <TaskTable
        data={filtered}
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
