import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'

const LBL = 'mb-1.5 block text-sm text-gray-700'
const HINT = 'text-xs text-gray-400'
const TEXTAREA_CLS =
  'w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const REMARK_MAX = 500

function ScopeRadio({ value, active, onChange, label }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
      }`}
    >
      <input type="radio" checked={active} onChange={() => onChange(value)} className="text-blue-600" />
      {label}
    </label>
  )
}

function ActionRadio({ value, active, onChange, label }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
      }`}
    >
      <input type="radio" checked={active} onChange={() => onChange(value)} className="text-blue-600" />
      {label}
    </label>
  )
}

export default function BulkAcceptProcessModal({
  open,
  project,
  selectedBatchIds,
  pendingCount,
  projectProcessedCount,
  onCancel,
  onConfirm,
}) {
  const hasBatchSelection = selectedBatchIds.size > 0
  const [scope, setScope] = useState(hasBatchSelection ? 'batches' : 'project')
  const [action, setAction] = useState('pass')
  const [remark, setRemark] = useState('')
  const [remarkError, setRemarkError] = useState(false)

  useEffect(() => {
    if (open) {
      setScope(hasBatchSelection ? 'batches' : 'project')
      setAction('pass')
      setRemark('')
      setRemarkError(false)
    }
  }, [open, hasBatchSelection])

  const canConfirm = useMemo(() => {
    if (scope === 'batches') return hasBatchSelection
    return true
  }, [scope, hasBatchSelection])

  const handleOk = () => {
    if (!canConfirm) return
    if (action === 'reject' && !remark.trim()) {
      setRemarkError(true)
      return
    }
    onConfirm({ scope, action, remark: remark.trim() })
  }

  if (!project) return null

  return (
    <Modal
      open={open}
      title="批量处理"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      width={640}
      fitViewport
      bodyClassName="space-y-4"
    >
      <div>
        <label className={LBL}>处理范围</label>
        <div className="flex flex-wrap gap-2">
          <ScopeRadio
            value="batches"
            active={scope === 'batches'}
            onChange={setScope}
            label="已勾选验收批次"
          />
          <ScopeRadio
            value="project"
            active={scope === 'project'}
            onChange={setScope}
            label="当前项目整体验收"
          />
        </div>
        <p className={`mt-2 ${HINT}`}>
          项目级处理不依赖列表勾选，将覆盖当前项目下所有待验收条目。
        </p>
      </div>

      {scope === 'batches' && !hasBatchSelection && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-600">
          当前未勾选验收批次。可切换为「当前项目整体验收」，覆盖项目下全部待验收条目。
        </div>
      )}

      {scope === 'project' && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">当前项目整体验收</div>
          <p className="mt-1 text-sm text-gray-600">
            项目：{project.name}（{project.id}）
          </p>
          <p className="mt-1 text-sm text-gray-600">
            待验收条目合计：{pendingCount} 条（已记录项目级处理 {projectProcessedCount} 条）
          </p>
        </div>
      )}

      <div>
        <label className={LBL}>处理操作</label>
        <div className="flex flex-wrap gap-2">
          <ActionRadio value="pass" active={action === 'pass'} onChange={setAction} label="批量通过" />
          <ActionRadio value="reject" active={action === 'reject'} onChange={setAction} label="批量驳回" />
        </div>
      </div>

      <div>
        <label className={LBL}>备注</label>
        <textarea
          rows={3}
          maxLength={REMARK_MAX}
          value={remark}
          onChange={(e) => { setRemark(e.target.value); setRemarkError(false) }}
          placeholder="请输入批量处理备注"
          className={`${TEXTAREA_CLS} ${remarkError ? 'border-red-400 ring-1 ring-red-100' : ''}`}
        />
        <p className="mt-0.5 text-right text-xs text-gray-400">{remark.length}/{REMARK_MAX}</p>
        {remarkError && <p className="mt-1 text-xs text-red-500">批量驳回时请填写备注</p>}
      </div>
    </Modal>
  )
}
