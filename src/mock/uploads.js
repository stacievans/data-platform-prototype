import { tasks } from './tasks'
import { getAllEntries, dataStatusColor, dataStatusOptions } from './entries'

export function getUploadRecords() {
  return getAllEntries().map((e) => {
    const task = tasks.find((t) => t.id === e.taskId)
    return {
      ...e,
      taskName: task?.name ?? '—',
      projectName: task?.projectName ?? '—',
    }
  })
}

/** @deprecated 请使用 getUploadRecords() 获取最新条目 */
export const uploads = getUploadRecords()

export { dataStatusColor, dataStatusOptions }
