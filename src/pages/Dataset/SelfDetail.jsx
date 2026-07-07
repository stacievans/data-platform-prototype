import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import { getDatasetById, patchSelfDataset } from '../../mock/datasets'
import { dataStatusColor } from '../../mock/entries'
import { tasks } from '../../mock/tasks'
import { getDatasetEntries, getInclusionOverview } from '../../utils/datasetMetrics'
import { IconSearch } from '../../components/common/Icons'
import { PermButton } from '../../components/common/PermissionAction'
import UpdateDatasetModal from './UpdateDatasetModal'

const TABS = [
  { key: 'overview', label: '数据概览' },
  { key: 'entries', label: '数据条目' },
  { key: 'logs', label: '更新记录' },
]

// TODO: 真机数据集「纳入数据状态」筛选项与条目新状态枚举联动（下一版）
const DATA_STATUSES = ['已上传', '已解析', '已审核']
const DATA_FORMATS = ['h5', 'LeRobot']

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const opTypeColor = {
  创建: 'text-blue-600 bg-blue-50',
  更新数据: 'text-green-600 bg-green-50',
  编辑信息: 'text-amber-600 bg-amber-50',
}

const STATUS_BAR_COLORS = {
  已上传: { bar: 'bg-slate-400', dot: 'bg-slate-400' },
  已解析: { bar: 'bg-blue-400', dot: 'bg-blue-400' },
  已审核: { bar: 'bg-violet-400', dot: 'bg-violet-400' },
  审核不通过: { bar: 'bg-red-400', dot: 'bg-red-400' },
  验收不通过: { bar: 'bg-amber-400', dot: 'bg-amber-400' },
  已验收: { bar: 'bg-cyan-400', dot: 'bg-cyan-400' },
}

const FORMAT_BAR_COLORS = {
  h5: { bar: 'bg-sky-500', dot: 'bg-sky-500' },
  LeRobot: { bar: 'bg-teal-500', dot: 'bg-teal-500' },
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

function OverviewTab({ dataset }) {
  const overview = useMemo(() => getInclusionOverview(dataset), [dataset])

  const taskColumns = [
    { title: '任务 ID', dataIndex: 'taskId', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '任务名称', dataIndex: 'taskName' },
    { title: '纳入条目数', dataIndex: 'count', render: (v) => v.toLocaleString() },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="text-xs text-gray-400">来源项目</div>
          <div className="mt-1 text-sm font-semibold text-gray-800">{overview.projectName ?? '—'}</div>
          <div className="text-xs text-gray-400">{overview.projectId}</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="text-xs text-gray-400">已绑定任务</div>
          <div className="mt-1 text-sm font-semibold text-gray-800">{overview.taskStats.length} 个</div>
          <div className="text-xs text-gray-400">共 {overview.totalCount.toLocaleString()} 条纳入</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-700">各任务纳入条目</h4>
        <Table columns={taskColumns} dataSource={overview.taskStats} rowKey="taskId" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StackedRatioBar
          title="数据状态分布"
          keys={DATA_STATUSES}
          stats={overview.statusStats}
          colorMap={STATUS_BAR_COLORS}
        />
        <StackedRatioBar
          title="数据格式分布"
          keys={DATA_FORMATS}
          stats={overview.formatStats}
          colorMap={FORMAT_BAR_COLORS}
        />
      </div>
    </div>
  )
}

function EntriesTab({ dataset }) {
  const allEntries = useMemo(() => getDatasetEntries(dataset), [dataset])

  const taskOptions = useMemo(() => {
    const ids = new Set(allEntries.map((e) => e.taskId))
    return ['全部', ...tasks.filter((t) => ids.has(t.id)).map((t) => t.name)]
  }, [allEntries])

  const [qTask, setQTask] = useState('全部')
  const [qDataStatus, setQDataStatus] = useState('全部')
  const [qFormat, setQFormat] = useState('全部')
  const [filters, setFilters] = useState({})

  const filtered = useMemo(() => {
    const { task, dataStatus, format } = filters
    return allEntries.filter((e) => {
      if (task && task !== '全部' && e.taskName !== task) return false
      if (dataStatus && dataStatus !== '全部' && e.dataStatus !== dataStatus) return false
      if (format && format !== '全部' && e.format !== format) return false
      return true
    })
  }, [allEntries, filters])

  const applyFilters = () => setFilters({ task: qTask, dataStatus: qDataStatus, format: qFormat })

  const resetFilters = () => {
    setQTask('全部')
    setQDataStatus('全部')
    setQFormat('全部')
    setFilters({})
  }

  const columns = [
    { title: '条目 ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '文件名', dataIndex: 'fileName', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '所属任务', dataIndex: 'taskName' },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长', dataIndex: 'duration' },
    { title: '上传人', dataIndex: 'uploader' },
    {
      title: '数据状态',
      dataIndex: 'dataStatus',
      render: (v) => <Badge color={dataStatusColor[v] ?? 'gray'} dot>{v}</Badge>,
    },
    {
      title: '数据格式',
      dataIndex: 'format',
      render: (v) => <div className="flex justify-center"><Badge color="cyan">{v}</Badge></div>,
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="link" size="sm">播放</Button>
          <Button variant="link" size="sm">下载</Button>
          <Button variant="link" size="sm">导出</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-36">
            <label className={LBL}>所属任务</label>
            <select value={qTask} onChange={(e) => setQTask(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {taskOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>数据状态</label>
            <select value={qDataStatus} onChange={(e) => setQDataStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {['全部', ...DATA_STATUSES].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>数据格式</label>
            <select value={qFormat} onChange={(e) => setQFormat(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {['全部', 'h5', 'LeRobot'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={resetFilters}>重置</Button>
          <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
        </div>
      </div>
      <Table columns={columns} dataSource={filtered} rowKey="id" pageSize={10} />
    </div>
  )
}

function LogsTab({ updateLogs, logColumns, onUpdateClick }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <PermButton permission="dataset.self.update" variant="primary" onClick={onUpdateClick}>更新数据集</PermButton>
      </div>
      <Table columns={logColumns} dataSource={updateLogs} rowKey="id" />
    </div>
  )
}

export default function SelfDatasetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState(() => getDatasetById(id))
  const [tab, setTab] = useState('overview')
  const [updateOpen, setUpdateOpen] = useState(false)

  const updateLogs = useMemo(
    () => [...(dataset?.updateLogs ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [dataset?.updateLogs],
  )

  if (!dataset) {
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
    ['数据集ID', dataset.id],
    ['轨迹数量', dataset.trajCount.toLocaleString()],
    ['总数据量', dataset.totalSize],
    ['轨迹总时长', dataset.totalDuration],
    ['创建人', dataset.createdBy ?? '—'],
    ['创建时间', dataset.createdAt],
    ['最后更新人', dataset.updatedBy],
    ['最后更新时间', dataset.updatedAt],
  ]

  const logColumns = [
    { title: '更新时间', dataIndex: 'updatedAt', width: 150 },
    { title: '更新人', dataIndex: 'updatedBy', width: 90 },
    {
      title: '操作类型',
      dataIndex: 'opType',
      width: 100,
      render: (v) => (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${opTypeColor[v] ?? 'bg-gray-100 text-gray-600'}`}>
          {v}
        </span>
      ),
    },
    {
      title: '客观变更',
      dataIndex: 'changeSummary',
      wrap: true,
      render: (v) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: '更新说明',
      dataIndex: 'remark',
      wrap: true,
      render: (v) => <span className="text-gray-600">{v || '—'}</span>,
    },
  ]

  const handleUpdate = (patch) => {
    setUpdateOpen(false)
    if (!patch) return

    const nextLogs = [patch.updateLog, ...(dataset.updateLogs ?? [])]
    const nextDataset = {
      ...dataset,
      entryIds: patch.entryIds,
      taskIds: patch.taskIds,
      statuses: patch.statuses,
      formats: patch.formats,
      trajCount: patch.trajCount,
      totalSize: patch.totalSize,
      totalDuration: patch.totalDuration,
      updatedBy: patch.updatedBy,
      updatedAt: patch.updatedAt,
      updateLogs: nextLogs,
    }

    patchSelfDataset(dataset.id, {
      entryIds: patch.entryIds,
      taskIds: patch.taskIds,
      statuses: patch.statuses,
      formats: patch.formats,
      trajCount: patch.trajCount,
      totalSize: patch.totalSize,
      totalDuration: patch.totalDuration,
      updatedBy: patch.updatedBy,
      updatedAt: patch.updatedAt,
      updateLogs: nextLogs,
    })
    setDataset(nextDataset)
  }

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
      {tab === 'entries' && <EntriesTab dataset={dataset} />}
      {tab === 'logs' && (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <LogsTab
            updateLogs={updateLogs}
            logColumns={logColumns}
            onUpdateClick={() => setUpdateOpen(true)}
          />
        </div>
      )}

      <UpdateDatasetModal
        open={updateOpen}
        dataset={dataset}
        onClose={handleUpdate}
      />
    </div>
  )
}
