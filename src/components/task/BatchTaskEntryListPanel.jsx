import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAllEntries } from '../../mock/entries'
import { removeEntryFromBatchTask } from '../../mock/batchTasks'
import { tasks } from '../../mock/tasks'
import { ENTRIES_CHANGED_EVENT } from '../../utils/preAnnotationImport'
import EntryDataTable from '../entry/EntryDataTable'
import { useToast } from '../common/Toast'
import BatchFlowTransferDrawer from '../../pages/Project/BatchFlowTransferDrawer'
import {
  claimBatchEntry,
  isEntryLockedForUser,
} from '../../utils/batchTaskEntryOps'

export default function BatchTaskEntryListPanel({ batchTask, onBatchUpdated }) {
  const { user } = useAuth()
  const { ToastNode, show: showToast } = useToast()
  const [entries, setEntries] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [flowDrawerOpen, setFlowDrawerOpen] = useState(false)
  const [processTab, setProcessTab] = useState('qc')

  const reload = useCallback(() => {
    if (!batchTask?.entryIds?.length) {
      setEntries([])
      return
    }
    const idSet = new Set(batchTask.entryIds)
    setEntries(getAllEntries().filter((e) => idSet.has(e.id)))
  }, [batchTask?.entryIds, refreshKey])

  useEffect(() => {
    reload()
    const onChange = () => setRefreshKey((k) => k + 1)
    window.addEventListener(ENTRIES_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(ENTRIES_CHANGED_EVENT, onChange)
  }, [reload])

  const getTask = useCallback((entry) => tasks.find((t) => t.id === entry.taskId), [])
  const getProjectId = useCallback(() => batchTask?.projectId, [batchTask?.projectId])

  const handleClaimAndOpen = useCallback((entry, mode) => {
    if (mode === 'play') return true
    if (isEntryLockedForUser(entry, user)) {
      showToast('该条目已被他人锁定')
      return false
    }
    if (mode === 'review' || mode === 'accept') {
      const result = claimBatchEntry(entry.id, mode, user, batchTask)
      if (!result.ok) {
        showToast(result.toast ?? '无法领取')
        return false
      }
      setRefreshKey((k) => k + 1)
      return true
    }
    return true
  }, [batchTask, showToast, user])

  const handleBatchEntryDelete = useCallback((entry) => {
    removeEntryFromBatchTask(batchTask.id, entry.id)
    onBatchUpdated?.()
    setRefreshKey((k) => k + 1)
    showToast('条目已从批次移除')
  }, [batchTask.id, onBatchUpdated, showToast])

  return (
    <>
      {ToastNode}
      <EntryDataTable
        entries={entries}
        getTask={getTask}
        getProjectId={getProjectId}
        listTitle="条目列表"
        filterPreset="batchTask"
        hideSelectColumn
        hideDeviceColumns
        hideDownload
        hideToolbarActions
        showTaskColumn
        showBatchFlowTransfer
        processTab={processTab}
        onProcessTabChange={setProcessTab}
        onOpenBatchFlowTransfer={() => setFlowDrawerOpen(true)}
        onClaimAndOpen={handleClaimAndOpen}
        onBatchEntryDelete={handleBatchEntryDelete}
        onDelete={() => {}}
      />

      <BatchFlowTransferDrawer
        open={flowDrawerOpen}
        onClose={() => setFlowDrawerOpen(false)}
        entries={entries}
        getTask={getTask}
        showToast={showToast}
        onApplied={() => {
          setRefreshKey((k) => k + 1)
          onBatchUpdated?.()
        }}
      />
    </>
  )
}
