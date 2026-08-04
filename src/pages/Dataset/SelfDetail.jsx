import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import Badge from '../../components/common/Badge'
import Progress from '../../components/common/Progress'
import { PermButton } from '../../components/common/PermissionAction'
import { useToast } from '../../components/common/Toast'
import { getDatasetById, patchSelfDataset } from '../../mock/datasets'
import { entries } from '../../mock/entries'
import {
  getDatasetEntries,
  getProjectTaskInclusionStats,
  getProjectDistributionStats,
  getDatasetListStats,
  computeEntryMetrics,
} from '../../utils/datasetMetrics'
import {
  getConversionJobsByDatasetId,
  getConvertedDatasetsByDatasetId,
  createConversionJob,
  completeConversionJob,
  CONVERSION_TASK_TYPES,
  CONVERSION_STATUSES,
  CONVERTED_DATASET_TYPES,
} from '../../mock/datasetConversions'
import ConversionRangeModal from './ConversionRangeModal'
import ConvertDatasetDrawer from './ConvertDatasetDrawer'
import CliBatchDownloadModal from './CliBatchDownloadModal'
import { IconSearch } from '../../components/common/Icons'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { useCurrentNickname } from '../../context/AuthContext'
import { CollectDeviceCell } from '../../utils/deviceDisplay'
import { dtCol, formatDateTime } from '../../utils/formatDateTime'

const TABS = [
  { key: 'overview', label: '数据概览' },
  { key: 'entries', label: '数据条目' },
  { key: 'conversions', label: '转换记录' },
  { key: 'converted', label: '转换数据集' },
]

const DATA_FORMATS = ['h5', 'LeRobot']
const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FILTER_ROW = 'flex flex-wrap items-end gap-3'
const FILTER_FIELDS = 'flex min-w-0 flex-1 flex-wrap items-end gap-3'
const FILTER_FIELD = 'min-w-0 flex-1 basis-36'

const FORMAT_BAR_COLORS = {
  h5: { bar: 'bg-sky-500', dot: 'bg-sky-500' },
  LeRobot: { bar: 'bg-teal-500', dot: 'bg-teal-500' },
}

const PROJECT_BAR_PALETTE = [
  { bar: 'bg-blue-500', dot: 'bg-blue-500' },
  { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { bar: 'bg-rose-500', dot: 'bg-rose-500' },
]

const conversionStatusColor = {
  进行中: 'blue',
  已完成: 'green',
  失败: 'red',
}

function StackedRatioBar({ title, keys, stats, colorMap }) {
  const total = keys.reduce((sum, k) => sum + (stats[k] ?? 0), 0)

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-gray-700">{title}</h4>
      {total === 0 ? (
        <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-400">暂无数据</div>
      ) : (
        <>
          <div className="flex h-7 overflow-hidden rounded-md bg-gray-100">
            {keys.map((k) => {
              const count = stats[k] ?? 0
              if (count <= 0) return null
              return (
                <div
                  key={k}
                  className={`${colorMap[k]?.bar ?? 'bg-gray-300'} transition-all`}
                  style={{ width: `${(count / total) * 100}%` }}
                  title={`${k}: ${count}`}
                />
              )
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
            {keys.map((k) => {
              const count = stats[k] ?? 0
              if (count <= 0) return null
              const pct = total ? ((count / total) * 100).toFixed(1) : '0.0'
              return (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${colorMap[k]?.dot ?? 'bg-gray-300'}`} />
                  <span>{k}</span>
                  <span className="font-medium text-gray-800">{count.toLocaleString()}</span>
                  <span className="text-gray-400">({pct}%)</span>
                </span>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function FilterBar({ children, onReset, onSearch }) {
  return (
    <div className={FILTER_ROW}>
      <div className={FILTER_FIELDS}>{children}</div>
      <div className="flex shrink-0 gap-2">
        <Button onClick={onReset}>重置</Button>
        <Button variant="primary" icon={<IconSearch />} onClick={onSearch}>查询</Button>
      </div>
    </div>
  )
}

function OverviewTab({ dataset }) {
  const taskStats = useMemo(() => getProjectTaskInclusionStats(dataset), [dataset])
  const projectStats = useMemo(() => getProjectDistributionStats(dataset), [dataset])
  const formatStats = useMemo(() => {
    const entries = getDatasetEntries(dataset)
    return entries.reduce((acc, e) => {
      acc[e.format] = (acc[e.format] ?? 0) + 1
      return acc
    }, {})
  }, [dataset])

  const projectKeys = Object.keys(projectStats)
  const projectColorMap = Object.fromEntries(
    projectKeys.map((k, i) => [k, PROJECT_BAR_PALETTE[i % PROJECT_BAR_PALETTE.length]]),
  )

  const taskColumns = [
    { title: '项目ID', dataIndex: 'projectId', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '项目名称', dataIndex: 'projectName' },
    { title: '任务ID', dataIndex: 'taskId', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '任务名称', dataIndex: 'taskName' },
    { title: '纳入条目数', dataIndex: 'count', render: (v) => v.toLocaleString() },
  ]

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">各项目纳入条目</h3>
        <Table
          columns={taskColumns}
          dataSource={taskStats}
          rowKey="taskId"
          pageSize={LIST_PAGE_SIZE}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StackedRatioBar
          title="来源项目分布"
          keys={projectKeys}
          stats={projectStats}
          colorMap={projectColorMap}
        />
        <StackedRatioBar
          title="数据格式分布"
          keys={DATA_FORMATS}
          stats={formatStats}
          colorMap={FORMAT_BAR_COLORS}
        />
      </div>
    </div>
  )
}

function EntriesTab({ dataset, onConversionStart, onRemoveEntry }) {
  const { show, ToastNode } = useToast()
  const operator = useCurrentNickname()
  const allEntries = useMemo(() => getDatasetEntries(dataset), [dataset])
  const [deleteTarget, setDeleteTarget] = useState(null)

  const projectOptions = useMemo(() => {
    const names = [...new Set(allEntries.map((e) => e.projectName).filter(Boolean))]
    return ['全部', ...names]
  }, [allEntries])

  const taskOptions = useMemo(() => {
    const names = [...new Set(allEntries.map((e) => e.taskName).filter(Boolean))]
    return ['全部', ...names]
  }, [allEntries])

  const [qProject, setQProject] = useState('全部')
  const [qTask, setQTask] = useState('全部')
  const [qFormat, setQFormat] = useState('全部')
  const [filters, setFilters] = useState({})
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [convertRangeType, setConvertRangeType] = useState(null)
  const [convertFlow, setConvertFlow] = useState(null)
  const [batchDownloadOpen, setBatchDownloadOpen] = useState(false)

  const selectedEntries = useMemo(
    () => allEntries.filter((e) => selectedIds.has(e.id)),
    [allEntries, selectedIds],
  )

  const selectedCount = useMemo(
    () => allEntries.filter((e) => selectedIds.has(e.id)).length,
    [allEntries, selectedIds],
  )

  const filtered = useMemo(() => {
    const { project, task, format } = filters
    return allEntries.filter((e) => {
      if (project && project !== '全部' && e.projectName !== project) return false
      if (task && task !== '全部' && e.taskName !== task) return false
      if (format && format !== '全部' && e.format !== format) return false
      return true
    })
  }, [allEntries, filters])

  const pageResetKey = useMemo(() => `${JSON.stringify(filters)}:${filtered.length}`, [filters, filtered.length])

  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id))
  const hasSelection = filtered.some((e) => selectedIds.has(e.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)))
    }
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyFilters = () => setFilters({ project: qProject, task: qTask, format: qFormat })
  const resetFilters = () => {
    setQProject('全部')
    setQTask('全部')
    setQFormat('全部')
    setFilters({})
  }

  const openConvertRange = (taskType) => {
    setConvertRangeType(taskType)
  }

  const handleRangeSelect = (scope) => {
    const entryCount = scope === 'selected' ? selectedCount : allEntries.length
    setConvertFlow({
      taskType: convertRangeType,
      scope,
      entryCount,
    })
    setConvertRangeType(null)
  }

  const handleConvertConfirm = () => {
    if (!convertFlow) return
    onConversionStart({
      taskType: convertFlow.taskType,
      operator,
      entryCount: convertFlow.entryCount,
    })
    if (convertFlow.scope === 'selected') {
      setSelectedIds(new Set())
    }
    setConvertFlow(null)
  }

  const confirmRemoveEntry = () => {
    if (!deleteTarget) return
    onRemoveEntry?.(deleteTarget.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    setDeleteTarget(null)
    show('已从数据集中移除该条目')
  }

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
          aria-label="全选"
        />
      ),
      key: 'select',
      width: 48,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleRow(row.id)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
        />
      ),
    },
    { title: '条目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '所属项目', dataIndex: 'projectName' },
    { title: '所属任务', dataIndex: 'taskName' },
    { title: '文件ID', dataIndex: 'fileId', render: (v, row) => <span className="font-mono text-xs">{v ?? row.id.replace('E-', 'F-')}</span> },
    { title: '文件名称', dataIndex: 'displayName', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长', dataIndex: 'duration' },
    { title: '数据格式', dataIndex: 'format', render: (v) => <Badge color="cyan">{v}</Badge> },
    {
      title: '设备类型',
      dataIndex: 'deviceTypeName',
      render: (v) => <span className="text-gray-700">{v || '—'}</span>,
    },
    {
      title: '采集设备',
      dataIndex: 'collectDevice',
      render: (v, row) => <CollectDeviceCell code={v} sn={row.collectDeviceSn} />,
    },
    { title: '采集员', dataIndex: 'uploader' },
    dtCol('采集时间', 'collectTime'),
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="link"
            size="sm"
            onClick={() => window.open(`/review/${row.id}?mode=play`, '_blank')}
          >
            播放
          </Button>
          <Button variant="link" size="sm">下载</Button>
          <Button variant="link" size="sm">导出</Button>
          <PermButton
            permission="dataset.self.update"
            mode="disable"
            variant="linkDanger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
          >
            删除
          </PermButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {ToastNode}
      <ConversionRangeModal
        open={!!convertRangeType}
        selectedCount={selectedCount}
        totalCount={allEntries.length}
        onCancel={() => setConvertRangeType(null)}
        onSelect={handleRangeSelect}
      />
      <ConvertDatasetDrawer
        open={!!convertFlow}
        taskType={convertFlow?.taskType}
        datasetId={dataset.id}
        onCancel={() => setConvertFlow(null)}
        onConfirm={handleConvertConfirm}
      />
      <CliBatchDownloadModal
        open={batchDownloadOpen}
        selectedEntries={selectedEntries}
        onClose={() => setBatchDownloadOpen(false)}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmRemoveEntry}
      />
      <ListPageCard>
      <ListPageFilter>
      <FilterBar onReset={resetFilters} onSearch={applyFilters}>
        <div className={FILTER_FIELD}>
          <label className={LBL}>所属项目</label>
          <select value={qProject} onChange={(e) => setQProject(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {projectOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>所属任务</label>
          <select value={qTask} onChange={(e) => setQTask(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {taskOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>数据格式</label>
          <select value={qFormat} onChange={(e) => setQFormat(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {['全部', ...DATA_FORMATS].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </FilterBar>
      </ListPageFilter>

      <ListPageToolbar>
        <h3 className="text-sm font-semibold text-gray-800">条目列表</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openConvertRange('转图片')}>转图片</Button>
          <Button onClick={() => openConvertRange('转视频')}>转视频</Button>
          <Button disabled={!hasSelection} onClick={() => setBatchDownloadOpen(true)}>批量下载</Button>
        </div>
      </ListPageToolbar>

      <Table embedded columns={columns} dataSource={filtered} rowKey="id" pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      </ListPageCard>
    </div>
  )
}

function ConversionsTab({ jobs, convertedDatasets, onGoToConvertedDataset }) {
  const [qId, setQId] = useState('')
  const [qType, setQType] = useState('全部')
  const [qStatus, setQStatus] = useState('全部')
  const [filters, setFilters] = useState({})

  const filtered = useMemo(() => {
    const { id, type, status } = filters
    return jobs.filter((j) => {
      if (id && !j.id.toLowerCase().includes(id.toLowerCase())) return false
      if (type && type !== '全部' && j.taskType !== type) return false
      if (status && status !== '全部' && j.status !== status) return false
      return true
    })
  }, [jobs, filters])

  const pageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const findConvertedDataset = (job) =>
    convertedDatasets.find((d) => d.conversionJobId === job.id || d.name === job.targetDatasetName)

  const columns = [
    { title: '转换任务ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    {
      title: '目标数据集',
      dataIndex: 'targetDatasetName',
      wrap: true,
      render: (v, row) => {
        const converted = findConvertedDataset(row)
        if (!converted) {
          return <span className="text-gray-700">{v}</span>
        }
        return (
          <button
            type="button"
            onClick={() => onGoToConvertedDataset?.(converted.id)}
            className="cursor-pointer text-left text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {v}
          </button>
        )
      },
    },
    { title: '任务类型', dataIndex: 'taskType' },
    {
      title: '任务进度',
      key: 'progress',
      render: (_, row) => (
        row.status === '已完成'
          ? <Progress percent={100} />
          : <Progress percent={row.progress ?? 0} />
      ),
    },
    { title: '操作人', dataIndex: 'operator' },
    {
      title: '任务状态',
      dataIndex: 'status',
      render: (v) => <Badge color={conversionStatusColor[v] ?? 'gray'} dot>{v}</Badge>,
    },
    dtCol('操作时间', 'operatedAt'),
  ]

  return (
    <ListPageCard>
      <ListPageFilter>
      <FilterBar
        onReset={() => { setQId(''); setQType('全部'); setQStatus('全部'); setFilters({}) }}
        onSearch={() => setFilters({ id: qId.trim(), type: qType, status: qStatus })}
      >
        <div className={FILTER_FIELD}>
          <label className={LBL}>任务ID</label>
          <input value={qId} onChange={(e) => setQId(e.target.value)} placeholder="请输入任务ID" className={INPUT_CLS} />
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>任务类型</label>
          <select value={qType} onChange={(e) => setQType(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {CONVERSION_TASK_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>任务状态</label>
          <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {CONVERSION_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </FilterBar>
      </ListPageFilter>

      <ListPageToolbar first>
        <h3 className="text-sm font-semibold text-gray-800">转换任务列表</h3>
        <span />
      </ListPageToolbar>

      <Table embedded columns={columns} dataSource={filtered} rowKey="id" pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
    </ListPageCard>
  )
}

function ConvertedDatasetsTab({ records, focusId, onFocusConsumed }) {
  const [qId, setQId] = useState('')
  const [qName, setQName] = useState('')
  const [qType, setQType] = useState('全部')
  const [filters, setFilters] = useState({})

  useEffect(() => {
    if (!focusId) return
    const record = records.find((r) => r.id === focusId)
    if (record) {
      setQName(record.name)
      setFilters({ name: record.name.trim() })
    }
    onFocusConsumed?.()
  }, [focusId, records, onFocusConsumed])

  const filtered = useMemo(() => {
    const { id, name, type } = filters
    return records.filter((r) => {
      if (id && !r.id.toLowerCase().includes(id.toLowerCase())) return false
      if (name && !r.name.toLowerCase().includes(name.toLowerCase())) return false
      if (type && type !== '全部' && r.type !== type) return false
      return true
    })
  }, [records, filters])

  const pageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const columns = [
    { title: '转换数据集ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '数据集名称', dataIndex: 'name', wrap: true },
    { title: '数据集类型', dataIndex: 'type' },
    { title: '文件数量', dataIndex: 'fileCount', render: (v) => v.toLocaleString() },
    { title: '创建人', dataIndex: 'createdBy' },
    dtCol('创建时间', 'createdAt'),
  ]

  return (
    <ListPageCard>
      <ListPageFilter>
      <FilterBar
        onReset={() => { setQId(''); setQName(''); setQType('全部'); setFilters({}) }}
        onSearch={() => setFilters({ id: qId.trim(), name: qName.trim(), type: qType })}
      >
        <div className={FILTER_FIELD}>
          <label className={LBL}>转换数据集ID</label>
          <input value={qId} onChange={(e) => setQId(e.target.value)} placeholder="请输入数据集ID" className={INPUT_CLS} />
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>数据集名称</label>
          <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="请输入数据集名称" className={INPUT_CLS} />
        </div>
        <div className={FILTER_FIELD}>
          <label className={LBL}>数据集类型</label>
          <select value={qType} onChange={(e) => setQType(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
            {CONVERTED_DATASET_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </FilterBar>
      </ListPageFilter>

      <ListPageToolbar first>
        <h3 className="text-sm font-semibold text-gray-800">数据集列表</h3>
        <span />
      </ListPageToolbar>

      <Table embedded columns={columns} dataSource={filtered} rowKey="id" pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
    </ListPageCard>
  )
}

export default function SelfDatasetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState(() => getDatasetById(id))
  const [tab, setTab] = useState('overview')
  const [convTick, setConvTick] = useState(0)
  const [convertedFocusId, setConvertedFocusId] = useState(null)

  const refreshConversions = useCallback(() => setConvTick((t) => t + 1), [])

  const handleRemoveEntry = useCallback((entryId) => {
    setDataset((prev) => {
      if (!prev) return prev
      const remainingIds = (prev.entryIds ?? []).filter((eid) => eid !== entryId)
      const remainingEntries = entries.filter((e) => remainingIds.includes(e.id))
      const metrics = computeEntryMetrics(remainingEntries)
      const patch = {
        entryIds: remainingIds,
        trajCount: metrics.count,
        totalSize: metrics.totalSize,
        totalDuration: metrics.totalDuration,
      }
      patchSelfDataset(prev.id, patch)
      return { ...prev, ...patch }
    })
  }, [])

  const conversionJobs = useMemo(
    () => getConversionJobsByDatasetId(id),
    [id, convTick],
  )

  const convertedDatasets = useMemo(
    () => getConvertedDatasetsByDatasetId(id),
    [id, convTick],
  )

  const stats = useMemo(
    () => (dataset ? getDatasetListStats(dataset) : null),
    [dataset],
  )

  const handleGoToConvertedDataset = useCallback((convertedId) => {
    setConvertedFocusId(convertedId)
    setTab('converted')
  }, [])

  const handleConversionStart = useCallback(({ taskType, operator, entryCount }) => {
    if (!dataset) return
    const job = createConversionJob({
      datasetId: dataset.id,
      datasetName: dataset.name,
      taskType,
      operator,
      entryCount,
    })
    refreshConversions()
    window.setTimeout(() => {
      completeConversionJob(job)
      refreshConversions()
    }, 2500)
  }, [dataset, refreshConversions])

  if (!dataset || !stats) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        数据集不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/dataset/self')}>返回列表</Button>
        </div>
      </div>
    )
  }

  const metaItems = [
    ['真机数据集ID', dataset.id],
    ['关联项目数', stats.projectCount],
    ['关联任务数', stats.taskCount],
    ['条目数量', stats.entryCount.toLocaleString()],
    ['总数据量', stats.totalSize],
    ['总时长', stats.totalDuration],
    ['创建人', dataset.createdBy ?? '—'],
    ['创建时间', formatDateTime(dataset.createdAt)],
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">{dataset.name}</h2>
        {dataset.description ? (
          <p className="mt-1 text-sm text-gray-500">{dataset.description}</p>
        ) : (
          <p className="mt-1 text-sm text-gray-400">暂无描述</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {metaItems.map(([label, value]) => (
            <div key={label}>
              <div className="text-gray-400">{label}</div>
              <div className="mt-0.5 font-medium text-gray-700">{value}</div>
            </div>
          ))}
        </div>
        <Tabs items={TABS} activeKey={tab} onChange={setTab} className="mt-4" />
      </div>

      {tab === 'overview' && (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <OverviewTab dataset={dataset} />
        </div>
      )}
      {tab === 'entries' && (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <EntriesTab
            dataset={dataset}
            onConversionStart={handleConversionStart}
            onRemoveEntry={handleRemoveEntry}
          />
        </div>
      )}
      {tab === 'conversions' && (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <ConversionsTab
            jobs={conversionJobs}
            convertedDatasets={convertedDatasets}
            onGoToConvertedDataset={handleGoToConvertedDataset}
          />
        </div>
      )}
      {tab === 'converted' && (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <ConvertedDatasetsTab
            records={convertedDatasets}
            focusId={convertedFocusId}
            onFocusConsumed={() => setConvertedFocusId(null)}
          />
        </div>
      )}
    </div>
  )
}
