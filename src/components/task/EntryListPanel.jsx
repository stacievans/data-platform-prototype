import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { filterEntriesByDataScope } from '../../mock/permissions'
import { getAllEntries } from '../../mock/entries'
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

  return (
    <EntryDataTable
      entries={entryList}
      getTask={getTask}
      getProjectId={getProjectId}
      onDelete={(id) => setEntryList((list) => list.filter((e) => e.id !== id))}
    />
  )
}
