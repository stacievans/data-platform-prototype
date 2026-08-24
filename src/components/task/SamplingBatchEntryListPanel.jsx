import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { filterEntriesByDataScope } from '../../mock/permissions'
import { getAllEntries, updateEntry } from '../../mock/entries'
import { getBatchById } from '../../mock/samplingBatches'
import { buildBatchTransferPatch } from '../../utils/entryBatchTransfer'
import { tasks } from '../../mock/tasks'
import EntryDataTable from '../entry/EntryDataTable'

export default function SamplingBatchEntryListPanel({ batchId, projectId }) {
  const { user } = useAuth()
  const location = useLocation()
  const [entryList, setEntryList] = useState([])

  useEffect(() => {
    const batch = getBatchById(batchId)
    const idSet = new Set(batch?.entryIds ?? [])
    const raw = getAllEntries().filter((e) => idSet.has(e.id))
    setEntryList(filterEntriesByDataScope(raw, user.nickname, user.role))
  }, [batchId, user.nickname, user.role, location.key])

  const getTask = (entry) => tasks.find((t) => t.id === entry.taskId)
  const getProjectId = () => projectId

  const handleBatchTransfer = useCallback((payload) => {
    const operator = {
      nickname: user.nickname ?? user.username ?? '当前用户',
      id: user.uid ?? user.id ?? 'U-0000',
    }

    setEntryList((list) => list.map((entry) => {
      if (!payload.entryIds.includes(entry.id)) return entry
      const patch = buildBatchTransferPatch(entry, {
        targetProcess: payload.targetProcess,
        targetStatus: payload.targetStatus,
        sourceProcess: payload.sourceProcess,
        sourceStatus: payload.sourceStatus,
        operator,
        keepReviewTags: payload.keepReviewTags,
        keepAcceptTags: payload.keepAcceptTags,
        task: getTask(entry),
      })
      if (!patch) return entry
      updateEntry(entry.id, patch)
      return { ...entry, ...patch }
    }))
  }, [user])

  return (
    <EntryDataTable
      entries={entryList}
      getTask={getTask}
      getProjectId={getProjectId}
      onDelete={(id) => setEntryList((list) => list.filter((e) => e.id !== id))}
      onBatchTransfer={handleBatchTransfer}
      listTitle="抽检条目列表"
      hideProcessTabs
      hideDownload
      hideQcReviewFormFilters
      singleRowFormFilters
      hideToolbarActions
      showTaskColumn
      middleActionMode="acceptOnly"
    />
  )
}
