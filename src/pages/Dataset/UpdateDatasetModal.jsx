import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import { tasks } from '../../mock/tasks'
import {
  diffInclusion,
  filterEntriesByCriteria,
  formatUpdateChangeSummary,
} from '../../utils/datasetMetrics'

// TODO: 真机数据集「纳入数据状态」筛选项与条目新状态枚举联动（下一版）
const DATA_STATUSES = ['已上传', '已解析', '已审核']
const DATA_FORMATS = ['h5', 'LeRobot']

function SectionTitle({ children }) {
  return <h4 className="mb-3 text-sm font-semibold text-gray-800">{children}</h4>
}

export default function UpdateDatasetModal({ open, dataset, onClose }) {
  const [form, setForm] = useState({ taskIds: [], statuses: [], formats: [], remark: '' })
  const [errors, setErrors] = useState({})
  const [boundTaskIds, setBoundTaskIds] = useState([])

  useEffect(() => {
    if (open && dataset) {
      setForm({
        taskIds: [...(dataset.taskIds ?? [])],
        statuses: [...(dataset.statuses ?? [])],
        formats: [...(dataset.formats ?? [])],
        remark: '',
      })
      setBoundTaskIds([...(dataset.taskIds ?? [])])
      setErrors({})
    }
  }, [open, dataset])

  const projectTasks = useMemo(
    () => (dataset?.projectId ? tasks.filter((t) => t.projectId === dataset.projectId) : []),
    [dataset?.projectId],
  )

  const previewDiff = useMemo(() => {
    if (!dataset || !form.statuses.length || !form.formats.length) {
      return {
        added: [],
        removed: [],
        addedMetrics: { count: 0, totalSize: '0 MB' },
        removedMetrics: { count: 0, totalSize: '0 MB' },
        finalMetrics: { count: 0, totalSize: '0 MB', totalDuration: '0 小时', totalSec: 0 },
        nextEntryIds: [],
      }
    }
    const nextEntries = filterEntriesByCriteria(form.taskIds, form.statuses, form.formats)
    return diffInclusion(dataset.entryIds, nextEntries)
  }, [dataset, form.taskIds, form.statuses, form.formats])

  const toggleTask = (taskId) => {
    setForm((f) => ({
      ...f,
      taskIds: f.taskIds.includes(taskId)
        ? f.taskIds.filter((id) => id !== taskId)
        : [...f.taskIds, taskId],
    }))
  }

  const toggleAllTasks = () => {
    const allIds = projectTasks.map((t) => t.id)
    const allSelected = allIds.length > 0 && allIds.every((id) => form.taskIds.includes(id))
    setForm((f) => ({ ...f, taskIds: allSelected ? [] : allIds }))
  }

  const toggleStatus = (status) => {
    setForm((f) => ({
      ...f,
      statuses: f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status],
    }))
    setErrors((e) => ({ ...e, statuses: false }))
  }

  const toggleFormat = (format) => {
    setForm((f) => ({
      ...f,
      formats: f.formats.includes(format)
        ? f.formats.filter((x) => x !== format)
        : [...f.formats, format],
    }))
    setErrors((e) => ({ ...e, formats: false }))
  }

  const allTasksSelected = projectTasks.length > 0
    && projectTasks.every((t) => form.taskIds.includes(t.id))

  const hasChange = previewDiff.added.length > 0 || previewDiff.removed.length > 0

  const handleConfirm = () => {
    const errs = {}
    if (!form.statuses.length) errs.statuses = true
    if (!form.formats.length) errs.formats = true
    if (!form.remark.trim()) errs.remark = true
    if (!hasChange) errs.noChange = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const changeSummary = formatUpdateChangeSummary({
      addedCount: previewDiff.addedMetrics.count,
      addedSize: previewDiff.addedMetrics.totalSize,
      removedCount: previewDiff.removedMetrics.count,
      removedSize: previewDiff.removedMetrics.totalSize,
    })

    onClose({
      entryIds: previewDiff.nextEntryIds,
      taskIds: form.taskIds,
      statuses: form.statuses,
      formats: form.formats,
      trajCount: previewDiff.finalMetrics.count,
      totalSize: previewDiff.finalMetrics.totalSize,
      totalDuration: previewDiff.finalMetrics.totalDuration,
      updatedBy: '李明',
      updatedAt: now,
      updateLog: {
        id: `UL-${dataset.id.slice(4)}-${Date.now()}`,
        updatedAt: now,
        updatedBy: '李明',
        opType: '更新数据',
        changeSummary,
        remark: form.remark.trim(),
      },
    })
  }

  if (!dataset) return null

  return (
    <Modal
      open={open}
      title="更新数据集"
      onCancel={() => onClose(null)}
      onOk={handleConfirm}
      okText="确认更新"
      width={640}
      fitViewport
    >
      <div className="space-y-6 pr-1">
        <section>
          <SectionTitle>数据来源</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">来源项目</label>
              <input
                readOnly
                value={dataset.projectName ?? dataset.projectId ?? '—'}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">纳入任务</label>
              <div className="rounded-md border border-gray-200 p-3">
                <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-gray-100 pb-2">
                  <input
                    type="checkbox"
                    checked={allTasksSelected}
                    onChange={toggleAllTasks}
                    className="cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">全选</span>
                </label>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {projectTasks.map((t) => {
                    const isBound = boundTaskIds.includes(t.id)
                    return (
                      <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.taskIds.includes(t.id)}
                          onChange={() => toggleTask(t.id)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{t.name}</span>
                        {isBound && (
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                            已纳入
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{t.id}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                取消勾选将移除该任务下已纳入数据；新勾选将按下方状态/格式条件追加数据。
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                纳入数据状态<span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-4 rounded-md border px-3 py-2.5 ${errors.statuses ? 'border-red-400' : 'border-gray-200'}`}>
                {DATA_STATUSES.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.statuses.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="cursor-pointer"
                    />
                    {s}
                  </label>
                ))}
              </div>
              {errors.statuses && <p className="mt-1 text-xs text-red-500">请至少选择一种数据状态</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                数据格式<span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-4 rounded-md border px-3 py-2.5 ${errors.formats ? 'border-red-400' : 'border-gray-200'}`}>
                {DATA_FORMATS.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.formats.includes(f)}
                      onChange={() => toggleFormat(f)}
                      className="cursor-pointer"
                    />
                    {f}
                  </label>
                ))}
              </div>
              {errors.formats && <p className="mt-1 text-xs text-red-500">请至少选择一种数据格式</p>}
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>预览</SectionTitle>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">新增条目</p>
                <p className="mt-0.5 font-semibold text-green-700">
                  +{previewDiff.addedMetrics.count.toLocaleString()} 条
                </p>
                <p className="text-xs text-green-600">+{previewDiff.addedMetrics.totalSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">移除条目</p>
                <p className="mt-0.5 font-semibold text-red-600">
                  -{previewDiff.removedMetrics.count.toLocaleString()} 条
                </p>
                <p className="text-xs text-red-500">-{previewDiff.removedMetrics.totalSize}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-blue-100 pt-2.5">
              更新后预计：
              <strong className="ml-1 text-blue-700">
                {previewDiff.finalMetrics.count.toLocaleString()} 条 / {previewDiff.finalMetrics.totalSize}
              </strong>
            </p>
            {errors.noChange && (
              <p className="mt-2 text-xs text-red-500">当前筛选条件下无数据变更，请调整任务或筛选条件</p>
            )}
          </div>
        </section>

        <section>
          <SectionTitle>更新说明</SectionTitle>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              更新说明<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="请填写本次更新的说明"
              value={form.remark}
              onChange={(e) => { setForm({ ...form, remark: e.target.value }); setErrors({ ...errors, remark: false }) }}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
                errors.remark
                  ? 'border-red-400 focus:ring-red-100'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {errors.remark && <p className="mt-1 text-xs text-red-500">请填写更新说明</p>}
          </div>
        </section>
      </div>
    </Modal>
  )
}
