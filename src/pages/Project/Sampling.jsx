import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { projects } from '../../mock/projects'
import { tasks } from '../../mock/tasks'
import {
  SAMPLING_BASIS_OPTIONS,
  appendSamplingBatch,
  addProjectProcessedCount,
  calcPassRate,
  getProjectProcessStats,
  getSamplingBatchesByProjectId,
  nextSamplingBatchId,
  updateSamplingBatch,
} from '../../mock/samplingBatches'
import {
  applyBatchOptionProcess,
  applyBulkBatchProcess,
  applyProjectAcceptProcess,
  buildDetailItems,
  findLatestPendingEntryInBatch,
  getPendingAcceptEntries,
  openAcceptWorkbench,
  pickSampleEntryIds,
  summarizeConfigItems,
} from '../../utils/samplingHelpers'
import { canAccessProject } from '../../mock/permissions'
import { useAuth, useCurrentNickname } from '../../context/AuthContext'
import NoPermission from '../System/NoPermission'
import CreateSamplingBatchModal from './CreateSamplingBatchModal'
import SamplingBatchDetailModal from './SamplingBatchDetailModal'
import BatchAcceptProcessModal from './BatchAcceptProcessModal'
import BulkAcceptProcessModal from './BulkAcceptProcessModal'

const STATUS_MAP = {
  not_started: { label: '未开始', color: 'gray' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  archived: { label: '已归档', color: 'gray' },
}

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'

function MiniProgress({ value, tone = 'blue' }) {
  const p = Math.min(Math.max(value, 0), 100)
  const bar = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="min-w-[88px]">
      <div className="mb-1 text-xs text-gray-500">{p}%</div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

function passRateTone(rate) {
  if (rate >= 90) return 'text-emerald-600'
  if (rate >= 70) return 'text-amber-600'
  return 'text-red-500'
}

export default function ProjectSampling() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const creatorName = useCurrentNickname()
  const { ToastNode, show: showToast } = useToast()

  const project = projects.find((p) => p.id === id)
  const taskCount = useMemo(() => tasks.filter((t) => t.projectId === id).length, [id])

  const [batchTick, setBatchTick] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [processTarget, setProcessTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [qName, setQName] = useState('')
  const [qBasis, setQBasis] = useState('全部')
  const [filters, setFilters] = useState({ name: '', basis: '全部' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const allBatches = useMemo(
    () => getSamplingBatchesByProjectId(id),
    [id, batchTick],
  )

  const filtered = useMemo(() => {
    return allBatches.filter((b) => {
      if (filters.name && !b.name.toLowerCase().includes(filters.name.toLowerCase())) return false
      if (filters.basis && filters.basis !== '全部' && b.basis !== filters.basis) return false
      return true
    })
  }, [allBatches, filters])

  const pendingCount = useMemo(
    () => getPendingAcceptEntries(id).length,
    [id, batchTick],
  )

  const projectProcessedCount = useMemo(
    () => getProjectProcessStats(id).processedCount,
    [id, batchTick],
  )

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filters, id])

  if (!project) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        项目不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/collection/project')}>返回项目列表</Button>
        </div>
      </div>
    )
  }

  if (!canAccessProject(id, user.nickname, user.role)) {
    return <NoPermission />
  }

  const status = STATUS_MAP[project.status] ?? { label: project.status, color: 'gray' }
  const allSelected = filtered.length > 0 && filtered.every((b) => selectedIds.has(b.id))
  const hasSelection = selectedIds.size > 0

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((b) => b.id)))
  }

  const toggleOne = (batchId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }

  const handleCreateBatch = ({ name, basis, configItems }) => {
    const summary = summarizeConfigItems(configItems)
    const detailItems = buildDetailItems(id, basis, configItems)
    const entryIds = pickSampleEntryIds(id, basis, configItems)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    appendSamplingBatch({
      id: nextSamplingBatchId(),
      projectId: id,
      name,
      basis,
      totalEntries: summary.totalEntries,
      sampledEntries: summary.sampledEntries,
      passedCount: 0,
      acceptProgress: 0,
      status: 'pending',
      creator: creatorName,
      createdAt: now,
      configItems,
      detailItems,
      entryIds,
    })

    setCreateOpen(false)
    setBatchTick((t) => t + 1)
    showToast('抽检批次已创建')
  }

  const handleAcceptBatch = (batch) => {
    const entry = findLatestPendingEntryInBatch(batch)
    if (!entry) {
      showToast('该批次暂无待验收条目')
      return
    }
    openAcceptWorkbench(entry.id)
  }

  const handleBatchProcessConfirm = ({ selectedKeys, action, remark }) => {
    if (!processTarget) return
    const { processed, patch } = applyBatchOptionProcess(processTarget, selectedKeys, action, remark)
    updateSamplingBatch(processTarget.id, patch)
    setProcessTarget(null)
    setBatchTick((t) => t + 1)
    showToast(
      action === 'pass'
        ? `批次验收处理完成，已通过 ${processed} 条`
        : `批次验收处理完成，已驳回 ${processed} 条`,
    )
  }

  const handleBulkProcessConfirm = ({ scope, action, remark }) => {
    if (scope === 'batches') {
      if (!selectedIds.size) {
        showToast('请先勾选验收批次，或切换为项目整体验收')
        return
      }
      const batches = allBatches.filter((b) => selectedIds.has(b.id))
      const { total, patches } = applyBulkBatchProcess(batches, action, remark)
      patches.forEach((patch, batchId) => updateSamplingBatch(batchId, patch))
      setBulkOpen(false)
      setBatchTick((t) => t + 1)
      showToast(`已处理 ${batches.length} 个批次，共 ${total} 条`)
      return
    }

    const count = applyProjectAcceptProcess(id, action, remark)
    addProjectProcessedCount(id, count)
    setBulkOpen(false)
    setBatchTick((t) => t + 1)
    showToast(
      action === 'pass'
        ? `项目整体验收已通过 ${count} 条`
        : `项目整体验收已驳回 ${count} 条`,
    )
  }

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
        />
      ),
      key: 'select',
      width: 48,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleOne(row.id)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
        />
      ),
    },
    { title: '批次ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '批次名称', dataIndex: 'name', render: (v) => <span className="text-gray-700">{v}</span> },
    { title: '抽样依据', dataIndex: 'basis' },
    { title: '总条目', dataIndex: 'totalEntries' },
    { title: '抽检条目', dataIndex: 'sampledEntries' },
    {
      title: '通过率',
      key: 'passRate',
      render: (_, row) => {
        const rate = calcPassRate(row)
        return <span className={`font-medium ${passRateTone(rate)}`}>{rate}%</span>
      },
    },
    {
      title: '验收进度',
      key: 'acceptProgress',
      render: (_, row) => (
        <MiniProgress
          value={row.acceptProgress}
          tone={row.acceptProgress >= 100 ? 'emerald' : 'blue'}
        />
      ),
    },
    { title: '创建人', dataIndex: 'creator' },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, row) => (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {row.status !== 'completed' && (
              <button
                type="button"
                className="cursor-pointer text-xs text-blue-600 hover:text-blue-500"
                onClick={() => handleAcceptBatch(row)}
              >
                验收
              </button>
            )}
            <button
              type="button"
              className="cursor-pointer text-xs text-blue-600 hover:text-blue-500"
              onClick={() => setDetailTarget(row)}
            >
              详情
            </button>
            <button
              type="button"
              className="cursor-pointer text-xs text-blue-600 hover:text-blue-500"
              onClick={() => setProcessTarget(row)}
            >
              处理
            </button>
          </div>
        )
    },
  ]

  return (
    <div className="space-y-4">
      {ToastNode}

      <div className="rounded-lg border border-gray-100 bg-white px-6 py-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-semibold text-white">
            {project.name.slice(0, 1)}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-6 lg:gap-10">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
                <Badge color={status.color} dot>{status.label}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{project.description}</p>
            </div>
            <div className="flex shrink-0 gap-6 text-sm lg:gap-10">
              <div>
                <div className="text-gray-400">项目ID</div>
                <div className="mt-1 font-medium text-gray-700">{project.id}</div>
              </div>
              <div>
                <div className="text-gray-400">任务数</div>
                <div className="mt-1 font-medium text-gray-700">{taskCount}</div>
              </div>
              <div>
                <div className="text-gray-400">创建人</div>
                <div className="mt-1 font-medium text-gray-700">{project.creator}</div>
              </div>
              <div>
                <div className="text-gray-400">创建时间</div>
                <div className="mt-1 font-medium whitespace-nowrap text-gray-700">{project.createdAt}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <label className={LBL}>批次名称</label>
            <input
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              placeholder="模糊查找"
              className={INPUT_CLS}
            />
          </div>
          <div className="min-w-0 flex-1 basis-40">
            <label className={LBL}>抽样依据</label>
            <select
              value={qBasis}
              onChange={(e) => setQBasis(e.target.value)}
              className={`${INPUT_CLS} cursor-pointer`}
            >
              {SAMPLING_BASIS_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => { setQName(''); setQBasis('全部'); setFilters({ name: '', basis: '全部' }) }}>
              重置
            </Button>
            <Button variant="primary" icon={<IconSearch />} onClick={() => setFilters({ name: qName, basis: qBasis })}>
              查询
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-800">抽检批次列表</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setBulkOpen(true)}>
              批量处理
            </Button>
            <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>
              新建抽检批次
            </Button>
          </div>
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" pageSize={10} />
      </div>

      <CreateSamplingBatchModal
        open={createOpen}
        projectId={id}
        onCancel={() => setCreateOpen(false)}
        onConfirm={handleCreateBatch}
      />

      <SamplingBatchDetailModal
        open={!!detailTarget}
        batch={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <BatchAcceptProcessModal
        open={!!processTarget}
        batch={processTarget}
        onCancel={() => setProcessTarget(null)}
        onConfirm={handleBatchProcessConfirm}
      />

      <BulkAcceptProcessModal
        open={bulkOpen}
        project={project}
        selectedBatchIds={selectedIds}
        pendingCount={pendingCount}
        projectProcessedCount={projectProcessedCount}
        onCancel={() => setBulkOpen(false)}
        onConfirm={handleBulkProcessConfirm}
      />
    </div>
  )
}
