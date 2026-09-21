import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import { getBatchTaskById } from '../../mock/batchTasks'
import { projects } from '../../mock/projects'
import { useAuth } from '../../context/AuthContext'
import { canAccessProject } from '../../mock/permissions'
import NoPermission from '../System/NoPermission'
import BatchTaskEntryListPanel from '../../components/task/BatchTaskEntryListPanel'

function MiniProgress({ value }) {
  const p = Math.min(Math.max(value ?? 0, 0), 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${p}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700">{p}%</span>
    </div>
  )
}

export default function BatchTaskDetail() {
  const { projectId, batchTaskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const project = projects.find((p) => p.id === projectId)
  const batchTask = useMemo(
    () => getBatchTaskById(batchTaskId),
    [batchTaskId, refreshKey],
  )

  if (!project || !batchTask || batchTask.projectId !== projectId) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        批次任务不存在
        <div className="mt-4">
          <Button onClick={() => navigate(`/collection/project/${projectId}?tab=batchTasks`)}>
            返回任务管理
          </Button>
        </div>
      </div>
    )
  }

  if (!canAccessProject(projectId, user.nickname, user.role)) {
    return <NoPermission />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              <Link
                to={`/collection/project/${projectId}/batch-task/${batchTaskId}`}
                className="hover:text-blue-600"
              >
                {batchTask.name}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-gray-400">{batchTask.id}</p>
          </div>
          <div className="flex flex-wrap items-start gap-8 text-sm">
            <div>
              <div className="text-gray-400">条目数</div>
              <div className="mt-1 font-medium text-gray-700">{batchTask.entryCount ?? 0}</div>
            </div>
            <div>
              <div className="text-gray-400">验收通过率</div>
              <div className="mt-1 font-medium text-emerald-600">{batchTask.acceptPassRate ?? 0}%</div>
            </div>
            <div>
              <div className="text-gray-400">验收进度</div>
              <div className="mt-1">
                <MiniProgress value={batchTask.acceptProgress} />
              </div>
            </div>
            <div>
              <div className="text-gray-400">创建人</div>
              <div className="mt-1 font-medium text-gray-700">{batchTask.creator}</div>
            </div>
            <div>
              <div className="text-gray-400">创建时间</div>
              <div className="mt-1 font-medium text-gray-700">{batchTask.createdAt}</div>
            </div>
          </div>
        </div>
      </div>

      <BatchTaskEntryListPanel
        batchTask={batchTask}
        onBatchUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
