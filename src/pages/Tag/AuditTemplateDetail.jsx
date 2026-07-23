import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import { getAuditTemplateById } from '../../mock/tags'
import AuditReviewTagPanel from './AuditReviewTagPanel'

export default function AuditTemplateDetail() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const template = getAuditTemplateById(templateId)

  if (!template) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400 shadow-sm">
          模板不存在
          <div className="mt-4">
            <Button onClick={() => navigate('/tag?tab=audit')}>返回模板列表</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{template.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{template.description || '—'}</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-gray-400">模板ID</div>
              <div className="mt-0.5 font-medium text-gray-700">{template.id}</div>
            </div>
            <div>
              <div className="text-gray-400">关联任务数</div>
              <div className="mt-0.5 font-medium text-gray-700">{template.taskCount}</div>
            </div>
            <div>
              <div className="text-gray-400">创建人</div>
              <div className="mt-0.5 font-medium text-gray-700">{template.creator}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <AuditReviewTagPanel templateId={templateId} />
      </div>
    </div>
  )
}
