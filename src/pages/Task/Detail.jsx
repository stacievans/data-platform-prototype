import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Progress from '../../components/common/Progress'
import { tasks, taskStatusColor, pct, formatCollectors, formatReviewer } from '../../mock/tasks'
import { dataStatusColor, dataStatusOptions, getAllEntries } from '../../mock/entries'
import { IconSearch } from '../../components/common/Icons'
import { useAuth } from '../../context/AuthContext'
import { canAccessTask, filterEntriesByDataScope } from '../../mock/permissions'
import EntryActions from '../../components/common/EntryActions'
import NoPermission from '../System/NoPermission'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FORMAT_OPTIONS = ['全部', 'h5', 'LeRobot']

/* ── 删除条目确认弹窗 ── */
function DeleteEntryConfirmModal({ entry, open, onCancel, onConfirm }) {
  const [input, setInput] = useState('')
  const match = input === entry?.fileName
  const reset = () => setInput('')

  if (!open || !entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-600">删除采集条目</h2>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-gray-500">
            此操作不可逆。如果确定要删除，请在下方输入{' '}
            <strong className="font-mono text-xs text-gray-800">{entry.fileName}</strong>{' '}以确认。
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入文件名以确认"
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

/* ---------- 采集条目列表 ---------- */
function EntryList({ taskId }) {
  const { user } = useAuth()
  const location = useLocation()
  const [entryList, setEntryList] = useState([])

  useEffect(() => {
    const raw = getAllEntries().filter((e) => e.taskId === taskId)
    setEntryList(filterEntriesByDataScope(raw, user.nickname, user.role))
  }, [taskId, user.nickname, user.role, location.key])
  const [qEntryId, setQEntryId]       = useState('')
  const [qFileName, setQFileName]       = useState('')
  const [qUploader, setQUploader]       = useState('全部')
  const [qDataStatus, setQDataStatus]   = useState('全部')
  const [qFormat, setQFormat]           = useState('全部')
  const [filters, setFilters]           = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const uploaderOptions = useMemo(
    () => ['全部', ...new Set(entryList.map((e) => e.uploader))],
    [entryList],
  )

  const entries = useMemo(() => {
    const { entryId, fileName, uploader, dataStatus, format } = filters
    return entryList.filter((e) => {
      if (entryId   && !e.id.toLowerCase().includes(entryId.toLowerCase()))           return false
      if (fileName  && !e.fileName.toLowerCase().includes(fileName.toLowerCase()))     return false
      if (uploader  && uploader !== '全部' && e.uploader !== uploader)                 return false
      if (dataStatus && dataStatus !== '全部' && e.dataStatus !== dataStatus)          return false
      if (format    && format !== '全部' && e.format !== format)                        return false
      return true
    })
  }, [entryList, filters])

  const applyFilters = () => setFilters({
    entryId: qEntryId, fileName: qFileName, uploader: qUploader,
    dataStatus: qDataStatus, format: qFormat,
  })

  const resetFilters = () => {
    setQEntryId(''); setQFileName(''); setQUploader('全部')
    setQDataStatus('全部'); setQFormat('全部')
    setFilters({})
  }

  const confirmDelete = () => {
    setEntryList((list) => list.filter((e) => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns = [
    { title: '条目ID',   dataIndex: 'id',         render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '文件名',   dataIndex: 'fileName',   render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长',     dataIndex: 'duration' },
    { title: '上传时间', dataIndex: 'uploadTime' },
    { title: '上传人', dataIndex: 'uploader' },
    {
      title: '数据状态',
      dataIndex: 'dataStatus',
      render: (v) => <Badge color={dataStatusColor[v] ?? 'gray'} dot>{v}</Badge>,
    },
    { title: '数据格式', dataIndex: 'format', render: (v) => <div className="flex justify-center"><Badge color="cyan">{v}</Badge></div> },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, row) => (
        <EntryActions entry={row} onDelete={() => setDeleteTarget(row)} />
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {/* 筛选区 */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-nowrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>条目ID</label>
              <input value={qEntryId} onChange={(e) => setQEntryId(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>文件名</label>
              <input value={qFileName} onChange={(e) => setQFileName(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>上传人</label>
              <select value={qUploader} onChange={(e) => setQUploader(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {uploaderOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>数据状态</label>
              <select value={qDataStatus} onChange={(e) => setQDataStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {dataStatusOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>数据格式</label>
              <select value={qFormat} onChange={(e) => setQFormat(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {FORMAT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
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
        <h2 className="text-base font-semibold text-gray-800">条目列表</h2>
      </div>

      <Table columns={columns} dataSource={entries} />

      <DeleteEntryConfirmModal
        entry={deleteTarget}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ---------- 详情页 ---------- */
export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const task = tasks.find((t) => t.id === id)
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
          </div>
          <div className="flex items-center gap-10 text-sm">
            <div>
              <div className="mb-1 text-gray-400">采集进度</div>
              <Progress percent={pct(task.collectDone, task.collectTotal)} />
              <span className="text-xs text-gray-400">{task.collectDone}/{task.collectTotal}</span>
            </div>
            <div>
              <div className="mb-1 text-gray-400">审核进度</div>
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

      <EntryList taskId={id} />
    </div>
  )
}
