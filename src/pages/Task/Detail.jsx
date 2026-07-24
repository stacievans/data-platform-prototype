import { useParams, useNavigate } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Progress from '../../components/common/Progress'
import { getTaskById, taskStatusColor, pct, formatCollectors, formatReviewer } from '../../mock/tasks'
import { useAuth } from '../../context/AuthContext'
import { canAccessTask } from '../../mock/permissions'
import EntryListPanel from '../../components/task/EntryListPanel'
import NoPermission from '../System/NoPermission'

/* ---------- 详情页 ---------- */
export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const task = getTaskById(id)
  if (!task) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        任务不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/collection/task')}>返回任务列表</Button>
        </div>
      </div>
    )
  }

  if (!canAccessTask(task, user.nickname, user.role)) {
    return <NoPermission />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">{task.name}</h2>
              <Badge color={taskStatusColor[task.status]} dot>{task.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {task.id} · {task.projectName} · 方案 {task.planId}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              设备类型 {task.robotBody}
            </p>
          </div>
          <div className="flex items-center gap-10 text-sm">
            <div>
              <div className="mb-1 text-gray-400">采集进度</div>
              <Progress percent={pct(task.collectDone, task.collectTotal)} />
              <span className="text-xs text-gray-400">{task.collectDone}/{task.collectTotal}</span>
            </div>
            <div>
              <div className="mb-1 text-gray-400">标注进度</div>
              <Progress percent={pct(task.reviewDone, task.collectTotal)} color="bg-purple-500" />
              <span className="text-xs text-gray-400">{task.reviewDone}/{task.collectTotal}</span>
            </div>
            <div>
              <div className="mb-1 text-gray-400">验收进度</div>
              <Progress percent={pct(task.acceptDone ?? 0, task.collectTotal)} color="bg-emerald-500" />
              <span className="text-xs text-gray-400">{task.acceptDone ?? 0}/{task.collectTotal}</span>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="min-w-[120px]">
                <div className="text-gray-400">采集员</div>
                <div className="mt-1 font-medium text-gray-700">{formatCollectors(task.collector)}</div>
              </div>
              <div className="min-w-[120px]">
                <div className="text-gray-400">标注员</div>
                <div className="mt-1 font-medium text-gray-700">{formatReviewer(task.reviewer)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EntryListPanel taskId={id} projectId={task.projectId} />
    </div>
  )
}
