import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { filterEntriesByDataScope } from '../../mock/permissions'
import { getAllEntries, getEntryById, updateEntry } from '../../mock/entries'
import { getBatchById, syncBatchesAfterEntryAccept } from '../../mock/samplingBatches'
import { buildAcceptResetPatch, canAcceptReset } from '../../utils/entryBatchTransfer'
import { tasks } from '../../mock/tasks'
import EntryDataTable from '../entry/EntryDataTable'

export default function SamplingBatchEntryListPanel({ batchId, projectId, onBatchUpdated }) {
  const { user } = useAuth()
  const location = useLocation()
  const [entryList, setEntryList] = useState([])

  const reloadEntries = useCallback(() => {
    const batch = getBatchById(batchId)
    const idSet = new Set(batch?.entryIds ?? [])
    const raw = getAllEntries().filter((e) => idSet.has(e.id))
    setEntryList(filterEntriesByDataScope(raw, user.nickname, user.role))
  }, [batchId, user.nickname, user.role])

  useEffect(() => {
    reloadEntries()
  }, [reloadEntries, location.key])

  const getTask = (entry) => tasks.find((t) => t.id === entry.taskId)
  const getProjectId = () => projectId

  const handleBatchAcceptReset = useCallback((entryIds) => {
    const operator = {
      nickname: user.nickname ?? user.username ?? '当前用户',
      id: user.uid ?? user.id ?? 'U-0000',
    }
    let processed = 0
    entryIds.forEach((id) => {
      const entry = getEntryById(id)
      if (!entry || !canAcceptReset(entry)) return
      const patch = buildAcceptResetPatch(entry, { operator, task: getTask(entry) })
      if (!patch) return
      updateEntry(id, patch)
      syncBatchesAfterEntryAccept(id, 'pass')
      processed += 1
    })
    if (processed > 0) {
      reloadEntries()
      onBatchUpdated?.()
    }
    return processed
  }, [user.nickname, user.username, user.uid, user.id, reloadEntries, onBatchUpdated])

  return (
    <EntryDataTable
      entries={entryList}
      getTask={getTask}
      getProjectId={getProjectId}
      onDelete={(id) => setEntryList((list) => list.filter((e) => e.id !== id))}
      listTitle="抽检条目列表"
      hideProcessTabs
      hideDownload
      hideQcReviewFormFilters
      singleRowFormFilters
      hideToolbarActions
      showTaskColumn
      middleActionMode="acceptOnly"
      onBatchAcceptReset={handleBatchAcceptReset}
    />
  )
}
