import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getUploadRecords } from '../../mock/uploads'
import { tasks } from '../../mock/tasks'
import { useAuth } from '../../context/AuthContext'
import { filterUploadsByDataScope } from '../../mock/permissions'
import EntryDataTable from '../../components/entry/EntryDataTable'

/* ── SDK 说明折叠区块 ── */
function SdkGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
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

export default function UploadRecord() {
  const { user } = useAuth()
  const location = useLocation()
  const [records, setRecords] = useState([])

  useEffect(() => {
    const raw = getUploadRecords()
    setRecords(filterUploadsByDataScope(raw, user.nickname, user.role, tasks))
  }, [location.key, user.nickname, user.role])

  const getTask = (entry) => tasks.find((t) => t.id === entry.taskId)
  const getProjectId = (entry) => tasks.find((t) => t.id === entry.taskId)?.projectId

  return (
    <div className="space-y-4">
      <SdkGuide />
      <EntryDataTable
        entries={records}
        getTask={getTask}
        getProjectId={getProjectId}
        onDelete={(id) => setRecords((list) => list.filter((e) => e.id !== id))}
        listTitle="采集条目"
        deleteModalTitle="删除采集条目"
        hideProcessTabs
        showScopeColumns
      />
    </div>
  )
}
