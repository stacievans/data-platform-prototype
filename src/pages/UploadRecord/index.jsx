import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { getUploadRecords, dataStatusColor, dataStatusOptions } from '../../mock/uploads'
import { projects } from '../../mock/projects'
import { tasks } from '../../mock/tasks'
import { IconSearch } from '../../components/common/Icons'
import { useAuth } from '../../context/AuthContext'
import { filterUploadsByDataScope } from '../../mock/permissions'
import EntryActions from '../../components/common/EntryActions'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FORMAT_OPTIONS = ['全部', 'h5', 'LeRobot']
/* ── SDK 说明折叠区块 ── */
function SdkGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
            SDK
          </span>
          <span className="text-sm font-semibold text-gray-800">Python SDK 上传说明</span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <p className="mb-4 text-sm leading-6 text-gray-500">
            适用于离线数据或第三方设备数据的批量上传，上传时需指定对应的任务 ID（<code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">task_id</code>）。
          </p>
          <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-6 text-slate-200">
{`pip install alphaloop-data-sdk

from alphaloop import DataClient

client = DataClient(api_key="YOUR_API_KEY")
client.upload(
    task_id="T-2002",
    files=["./episodes/*.mcap"],
)`}
          </pre>
        </div>
      )}
    </div>
  )
}

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
            <h2 className="text-base font-semibold text-red-600">删除上传记录</h2>
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

export default function UploadRecord() {
  const { user } = useAuth()
  const location = useLocation()
  const [records, setRecords] = useState(() => getUploadRecords())

  useEffect(() => {
    setRecords(getUploadRecords())
  }, [location.key])
  const [qEntryId, setQEntryId]       = useState('')
  const [qFileName, setQFileName]       = useState('')
  const [qTask, setQTask]               = useState('全部')
  const [qProject, setQProject]         = useState('全部')
  const [qUploader, setQUploader]       = useState('全部')
  const [qDataStatus, setQDataStatus]   = useState('全部')
  const [qFormat, setQFormat]           = useState('全部')
  const [filters, setFilters]           = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const scopedRecords = useMemo(
    () => filterUploadsByDataScope(records, user.nickname, user.role, tasks),
    [records, user.nickname, user.role],
  )

  const taskOptions = useMemo(
    () => ['全部', ...new Set(scopedRecords.map((r) => r.taskName))],
    [scopedRecords],
  )
  const uploaderOptions = useMemo(
    () => ['全部', ...new Set(scopedRecords.map((r) => r.uploader))],
    [scopedRecords],
  )

  const filtered = useMemo(() => {
    const { entryId, fileName, task, project, uploader, dataStatus, format } = filters
    return scopedRecords.filter((u) => {
      if (entryId   && !u.id.toLowerCase().includes(entryId.toLowerCase()))           return false
      if (fileName  && !u.fileName.toLowerCase().includes(fileName.toLowerCase()))     return false
      if (task      && task !== '全部' && u.taskName !== task)                          return false
      if (project   && project !== '全部' && u.projectName !== project)               return false
      if (uploader  && uploader !== '全部' && u.uploader !== uploader)                  return false
      if (dataStatus && dataStatus !== '全部' && u.dataStatus !== dataStatus)          return false
      if (format    && format !== '全部' && u.format !== format)                        return false
      return true
    })
  }, [scopedRecords, filters])

  const applyFilters = () => setFilters({
    entryId: qEntryId, fileName: qFileName, task: qTask, project: qProject,
    uploader: qUploader, dataStatus: qDataStatus, format: qFormat,
  })

  const resetFilters = () => {
    setQEntryId(''); setQFileName(''); setQTask('全部'); setQProject('全部')
    setQUploader('全部'); setQDataStatus('全部'); setQFormat('全部')
    setFilters({})
  }

  const confirmDelete = () => {
    setRecords((list) => list.filter((e) => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns = [
    { title: '条目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '文件名', dataIndex: 'fileName', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '所属任务', dataIndex: 'taskName' },
    { title: '所属项目', dataIndex: 'projectName' },
    { title: '文件大小', dataIndex: 'size' },
    { title: '时长', dataIndex: 'duration' },
    { title: '上传时间', dataIndex: 'uploadTime' },
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
      width: 280,
      render: (_, row) => (
        <EntryActions entry={row} onDelete={() => setDeleteTarget(row)} />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <SdkGuide />

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>条目ID</label>
            <input value={qEntryId} onChange={(e) => setQEntryId(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>文件名</label>
            <input value={qFileName} onChange={(e) => setQFileName(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
          </div>
          <div className="min-w-0 flex-1 basis-36">
            <label className={LBL}>所属任务</label>
            <select value={qTask} onChange={(e) => setQTask(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {taskOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-36">
            <label className={LBL}>所属项目</label>
            <select value={qProject} onChange={(e) => setQProject(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {['全部', ...projects.map((p) => p.name)].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>上传人</label>
            <select value={qUploader} onChange={(e) => setQUploader(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {uploaderOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>数据状态</label>
            <select value={qDataStatus} onChange={(e) => setQDataStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {dataStatusOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className={LBL}>数据格式</label>
            <select value={qFormat} onChange={(e) => setQFormat(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
              {FORMAT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={resetFilters}>重置</Button>
          <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
        </div>
      </div>

      <Table columns={columns} dataSource={filtered} />

      <DeleteEntryConfirmModal
        entry={deleteTarget}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
