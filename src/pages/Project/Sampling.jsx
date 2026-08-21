import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'
import { useToast } from '../../components/common/Toast'
import { projects } from '../../mock/projects'
import {
  appendSamplingBatch,
  addProjectProcessedCount,
  calcPassRate,
  deleteSamplingBatch,
  getProjectProcessStats,
  getSamplingBatchesByProjectId,
  nextSamplingBatchId,
  updateSamplingBatch,
} from '../../mock/samplingBatches'
import {
  applyBatchOptionProcess,
  applyBulkBatchProcess,
  applyProjectAcceptProcess,
  buildTaskDetailItems,
  defaultSamplingFilters,
  findLatestPendingEntryInBatch,
  getPendingAcceptEntries,
  openAcceptWorkbench,
  pickSampleEntryIdsByTasks,
  summarizeConfigItems,
} from '../../utils/samplingHelpers'
import { useCurrentNickname } from '../../context/AuthContext'
import CreateSamplingBatchModal from './CreateSamplingBatchModal'
import SamplingBatchDetailModal from './SamplingBatchDetailModal'
import BatchAcceptProcessModal from './BatchAcceptProcessModal'
import BulkAcceptProcessModal from './BulkAcceptProcessModal'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const SELECT_CLS = `${INPUT_CLS} cursor-pointer ${nativeSelectChevronCls}`
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

function PassRateColumnTitle() {
  const triggerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const hint = '点击查看批次通过率详情'

  const updatePos = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 })
  }, [])

  const show = () => { updatePos(); setVisible(true) }
  const hide = () => setVisible(false)

  useEffect(() => {
    if (!visible) return undefined
    const onReposition = () => updatePos()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [visible, updatePos])

  const tooltip = visible ? createPortal(
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)', zIndex: 9999 }}
      className="pointer-events-none whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-normal text-white shadow"
      role="tooltip"
    >
      {hint}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <span className="inline-flex items-center justify-center gap-1">
        <span>通过率</span>
        <span
          ref={triggerRef}
          className="inline-flex cursor-help text-xs font-normal leading-none text-gray-400"
          aria-label={hint}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
        >
          ⓘ
        </span>
      </span>
      {tooltip}
    </>
  )
}

/** 创建抽检批次并写入 store，返回新批次 id */
export function createSamplingBatchRecord({ projectId, name, configItems, filters, creator }) {
  const resolvedFilters = filters ?? defaultSamplingFilters()
  const summary = summarizeConfigItems(configItems)
  const detailItems = buildTaskDetailItems(projectId, configItems, resolvedFilters)
  const entryIds = pickSampleEntryIdsByTasks(projectId, configItems, resolvedFilters)
  const id = nextSamplingBatchId()
  appendSamplingBatch({
    id,
    projectId,
    name,
    basis: '任务名称',
    filters: resolvedFilters,
    totalEntries: summary.totalEntries,
    sampledEntries: summary.sampledEntries,
    passedCount: 0,
    rejectedCount: 0,
    acceptProgress: 0,
    status: 'pending',
    creator,
    createdAt: nowDateTime(),
    configItems,
    detailItems,
    entryIds,
  })
  return id
}

/**
 * 项目详情「抽样验收」Tab 内容：筛选 + 批次列表 + 批量处理
 * @param showCreateButton 为 true 时显示「+ 新建」（独立页遗留；Tab 内为 false）
 */
export default function SamplingPanel({
  projectId,
  showCreateButton = false,
  highlightBatchId = null,
  onHighlightConsumed,
  onGoToTaskTab,
}) {
  const navigate = useNavigate()
  const project = projects.find((p) => p.id === projectId)
  const creatorName = useCurrentNickname()
  const { ToastNode, show: showToast } = useToast()

  const [batchTick, setBatchTick] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [processTarget, setProcessTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [qId, setQId] = useState('')
  const [qName, setQName] = useState('')
  const [qCreator, setQCreator] = useState('')
  const [filters, setFilters] = useState({ id: '', name: '', creator: '' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [activeHighlight, setActiveHighlight] = useState(highlightBatchId)

  useEffect(() => {
    setActiveHighlight(highlightBatchId)
  }, [highlightBatchId])

  useEffect(() => {
    if (!activeHighlight) return undefined
    const timer = setTimeout(() => {
      setActiveHighlight(null)
      onHighlightConsumed?.()
    }, 4000)
    return () => clearTimeout(timer)
  }, [activeHighlight, onHighlightConsumed])

  const allBatches = useMemo(
    () => getSamplingBatchesByProjectId(projectId),
    [projectId, batchTick],
  )

  const creatorOptions = useMemo(() => {
    const names = [...new Set(allBatches.map((b) => b.creator).filter(Boolean))]
    return names.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [allBatches])

  const filtered = useMemo(() => {
    const idQ = filters.id.trim().toLowerCase()
    const nameQ = filters.name.trim().toLowerCase()
    const list = allBatches.filter((b) => {
      if (idQ && !String(b.id).toLowerCase().includes(idQ)) return false
      if (nameQ && !String(b.name ?? '').toLowerCase().includes(nameQ)) return false
      if (filters.creator && b.creator !== filters.creator) return false
      return true
    })
    if (!activeHighlight) return list
    const idx = list.findIndex((b) => b.id === activeHighlight)
    if (idx <= 0) return list
    const next = [...list]
    const [hit] = next.splice(idx, 1)
    return [hit, ...next]
  }, [allBatches, filters, activeHighlight])

  const pageResetKey = useMemo(
    () => `${JSON.stringify(filters)}:${filtered.length}:${batchTick}`,
    [filters, filtered.length, batchTick],
  )

  const pendingCount = useMemo(
    () => getPendingAcceptEntries(projectId).length,
    [projectId, batchTick],
  )

  const projectProcessedCount = useMemo(
    () => getProjectProcessStats(projectId).processedCount,
    [projectId, batchTick],
  )

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filters, projectId])

  if (!project) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">
        项目不存在
      </div>
    )
  }

  const allSelected = filtered.length > 0 && filtered.every((b) => selectedIds.has(b.id))

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

  const handleCreateBatch = ({ name, configItems, filters: batchFilters }) => {
    createSamplingBatchRecord({
      projectId,
      name,
      configItems,
      filters: batchFilters,
      creator: creatorName,
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

  const handleDeleteBatch = () => {
    if (!deleteTarget) return
    const { id, name } = deleteTarget
    deleteSamplingBatch(id)
    setDeleteTarget(null)
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (detailTarget?.id === id) setDetailTarget(null)
    if (processTarget?.id === id) setProcessTarget(null)
    setBatchTick((t) => t + 1)
    showToast(`已删除抽检批次「${name}」`)
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

    const count = applyProjectAcceptProcess(projectId, action, remark)
    addProjectProcessedCount(projectId, count)
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
    {
      title: '批次ID',
      dataIndex: 'id',
      render: (v, row) => (
        <span className={`font-medium ${row.id === activeHighlight ? 'text-blue-700' : 'text-gray-700'}`}>
          {v}
          {row.id === activeHighlight && (
            <span className="ml-2 align-middle"><Badge color="blue">新建</Badge></span>
          )}
        </span>
      ),
    },
    { title: '批次名称', dataIndex: 'name', render: (v, row) => (
      <button
        type="button"
        onClick={() => navigate(`/collection/project/${projectId}/sampling/${row.id}`)}
        className="cursor-pointer text-blue-600 hover:text-blue-500"
      >
        {v}
      </button>
    ) },
    {
      title: '任务数',
      key: 'taskCount',
      render: (_, row) => row.configItems?.length ?? 0,
    },
    { title: '总条目', dataIndex: 'totalEntries' },
    { title: '抽检条目', dataIndex: 'sampledEntries' },
    {
      title: <PassRateColumnTitle />,
      key: 'passRate',
      render: (_, row) => {
        const rate = calcPassRate(row)
        return (
          <button
            type="button"
            onClick={() => setDetailTarget(row)}
            className={`cursor-pointer font-medium ${passRateTone(rate)}`}
          >
            {rate}%
          </button>
        )
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
    dtCol('创建时间', 'createdAt'),
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {row.status !== 'completed' && (
            <button
              type="button"
              className="cursor-pointer text-blue-600 hover:text-blue-500"
              onClick={() => handleAcceptBatch(row)}
            >
              验收
            </button>
          )}
          <button
            type="button"
            className="cursor-pointer text-blue-600 hover:text-blue-500"
            onClick={() => navigate(`/collection/project/${projectId}/sampling/${row.id}`)}
          >
            详情
          </button>
          <button
            type="button"
            className="cursor-pointer text-blue-600 hover:text-blue-500"
            onClick={() => setProcessTarget(row)}
          >
            处理
          </button>
          <button
            type="button"
            className="cursor-pointer text-red-500 hover:text-red-400"
            onClick={() => setDeleteTarget(row)}
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {ToastNode}

      <ListPageCard>
        <ListPageFilter>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-0">
            <label className={LBL}>批次ID</label>
            <input
              value={qId}
              onChange={(e) => setQId(e.target.value)}
              placeholder="请输入批次ID"
              className={INPUT_CLS}
            />
          </div>
          <div className="min-w-0 flex-1 basis-0">
            <label className={LBL}>批次名称</label>
            <input
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              placeholder="请输入批次名称"
              className={INPUT_CLS}
            />
          </div>
          <div className="min-w-0 flex-1 basis-0">
            <label className={LBL}>创建人</label>
            <select
              value={qCreator}
              onChange={(e) => setQCreator(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">请选择</option>
              {creatorOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              onClick={() => {
                setQId('')
                setQName('')
                setQCreator('')
                setFilters({ id: '', name: '', creator: '' })
              }}
            >
              重置
            </Button>
            <Button
              variant="primary"
              icon={<IconSearch />}
              onClick={() => setFilters({ id: qId, name: qName, creator: qCreator })}
            >
              查询
            </Button>
          </div>
        </div>
        </ListPageFilter>

        <ListPageToolbar>
        <h2 className="text-base font-semibold text-gray-800">抽检批次列表</h2>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {onGoToTaskTab && (
              <p className="text-xs text-gray-400">
                新建抽检批次请前往
                <button
                  type="button"
                  onClick={onGoToTaskTab}
                  className="mx-0.5 cursor-pointer text-blue-600 hover:text-blue-500 hover:underline"
                >
                  采集任务 Tab
                </button>
                勾选任务后发起
              </p>
            )}
            <Button onClick={() => setBulkOpen(true)}>
              批量处理
            </Button>
            {showCreateButton && (
              <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>
                新建
              </Button>
            )}
          </div>
        </ListPageToolbar>
        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
          getRowClassName={(row) => (
            row.id === activeHighlight
              ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
              : ''
          )}
        />
      </ListPageCard>

      {showCreateButton && (
        <CreateSamplingBatchModal
          open={createOpen}
          projectId={projectId}
          onCancel={() => setCreateOpen(false)}
          onConfirm={handleCreateBatch}
        />
      )}

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

      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBatch}
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
