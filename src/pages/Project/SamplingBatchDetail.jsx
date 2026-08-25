import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { calcPassRate, getBatchById } from '../../mock/samplingBatches'
import { projects } from '../../mock/projects'
import { useAuth } from '../../context/AuthContext'
import { canAccessProject } from '../../mock/permissions'
import NoPermission from '../System/NoPermission'
import SamplingBatchEntryListPanel from '../../components/task/SamplingBatchEntryListPanel'

function passRateTone(rate) {
  if (rate >= 90) return 'text-emerald-600'
  if (rate >= 70) return 'text-amber-600'
  return 'text-red-500'
}

export default function SamplingBatchDetail() {
  const { projectId, batchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [batchRefreshKey, setBatchRefreshKey] = useState(0)

  const project = projects.find((p) => p.id === projectId)
  const batch = useMemo(() => getBatchById(batchId), [batchId, batchRefreshKey])

  if (!project || !batch || batch.projectId !== projectId) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        抽检批次不存在
        <div className="mt-4">
          <Button onClick={() => navigate(`/collection/project/${projectId}?tab=sampling`)}>
            返回验收管理
          </Button>
        </div>
      </div>
    )
  }

  if (!canAccessProject(projectId, user.nickname, user.role)) {
    return <NoPermission />
  }

  const passRate = calcPassRate(batch)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">{batch.name}</h2>
              <Badge color={batch.status === 'completed' ? 'green' : 'blue'} dot>
                {batch.status === 'completed' ? '已完成' : '进行中'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-8 text-sm">
            <div>
              <div className="text-gray-400">抽检条目</div>
              <div className="mt-1 font-medium text-gray-700">{batch.sampledEntries}</div>
            </div>
            <div>
              <div className="text-gray-400">通过率</div>
              <div className={`mt-1 font-medium ${passRateTone(passRate)}`}>{passRate}%</div>
            </div>
            <div>
              <div className="text-gray-400">验收进度</div>
              <div className="mt-1 font-medium text-gray-700">{batch.acceptProgress ?? 0}%</div>
            </div>
            <div>
              <div className="text-gray-400">创建人</div>
              <div className="mt-1 font-medium text-gray-700">{batch.creator}</div>
            </div>
            <div>
              <div className="text-gray-400">创建时间</div>
              <div className="mt-1 font-medium text-gray-700">{batch.createdAt}</div>
            </div>
          </div>
        </div>
      </div>

      <SamplingBatchEntryListPanel
        batchId={batchId}
        projectId={projectId}
        onBatchUpdated={() => setBatchRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
