import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { filterEntriesByDataScope } from '../../mock/permissions'
import { getAllEntries, updateEntry } from '../../mock/entries'
import { buildReQcPatch } from '../../utils/entryReQc'
import { tasks } from '../../mock/tasks'
import EntryDataTable from '../entry/EntryDataTable'

export default function EntryListPanel({ taskId, projectId }) {
  const { user } = useAuth()
  const location = useLocation()
  const [entryList, setEntryList] = useState([])

  useEffect(() => {
    const raw = getAllEntries().filter((e) => e.taskId === taskId)
    setEntryList(filterEntriesByDataScope(raw, user.nickname, user.role))
  }, [taskId, user.nickname, user.role, location.key])

  const getTask = (entry) => tasks.find((t) => t.id === entry.taskId)
  const getProjectId = () => projectId

  const handleReQc = useCallback(({ entryIds, keepReviewTags }) => {
    const operator = {
      nickname: user.nickname ?? user.username ?? '当前用户',
      id: user.uid ?? user.id ?? 'U-0000',
    }

    setEntryList((list) => list.map((entry) => {
      if (!entryIds.includes(entry.id)) return entry
      const patch = buildReQcPatch(entry, {
        keepReviewTags,
        operator,
        task: getTask(entry),
      })
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
      onReQc={handleReQc}
    />
  )
}
