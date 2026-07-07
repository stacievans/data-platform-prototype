import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { projects } from '../../mock/projects'
import { tasks } from '../../mock/tasks'
import { entries } from '../../mock/entries'
import {
  formatTotalDuration,
  formatTotalSize,
  parseDurationToSec,
  parseSizeToMB,
} from '../../utils/datasetMetrics'

// TODO: 真机数据集「纳入数据状态」筛选项与条目新状态枚举联动（下一版）
const DATA_STATUSES = ['已上传', '已解析', '已审核']
const DATA_FORMATS = ['h5', 'LeRobot']

const emptyForm = () => ({
  name: '',
  description: '',
  projectId: '',
  taskIds: [],
  statuses: [],
  formats: [],
})

function FormRow({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
    </div>
  )
}

function SectionTitle({ children }) {
  return <h4 className="mb-3 text-sm font-semibold text-gray-800">{children}</h4>
}

function nextDatasetId(existing) {
  const nums = existing.map((d) => parseInt(d.id.replace('DS-', ''), 10) || 0)
  return `DS-${String(Math.max(0, ...nums, 0) + 1).padStart(3, '0')}`
}

export default function CreateDatasetModal({ open, datasets, onClose }) {
  const creatorName = useCurrentNickname()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setErrors({})
    }
  }, [open])

  const projectTasks = useMemo(
    () => (form.projectId ? tasks.filter((t) => t.projectId === form.projectId) : []),
    [form.projectId],
  )

  const previewEntries = useMemo(() => {
    if (!form.projectId || !form.taskIds.length || !form.statuses.length || !form.formats.length) return []
    return entries.filter(
      (e) =>
        form.taskIds.includes(e.taskId)
        && form.statuses.includes(e.dataStatus)
        && form.formats.includes(e.format),
    )
  }, [form.projectId, form.taskIds, form.statuses, form.formats])

  const preview = useMemo(() => {
    const count = previewEntries.length
    const totalMB = previewEntries.reduce((sum, e) => sum + parseSizeToMB(e.size), 0)
    const totalSec = previewEntries.reduce((sum, e) => sum + parseDurationToSec(e.duration), 0)
    return {
      count,
      size: formatTotalSize(totalMB),
      duration: formatTotalDuration(totalSec),
    }
  }, [previewEntries])

  const setProjectId = (projectId) => {
    setForm((f) => ({ ...f, projectId, taskIds: [] }))
    setErrors((e) => ({ ...e, projectId: false, taskIds: false }))
  }

  const toggleTask = (taskId) => {
    setForm((f) => ({
      ...f,
      taskIds: f.taskIds.includes(taskId)
        ? f.taskIds.filter((id) => id !== taskId)
        : [...f.taskIds, taskId],
    }))
    setErrors((e) => ({ ...e, taskIds: false }))
  }

  const toggleAllTasks = () => {
    const allIds = projectTasks.map((t) => t.id)
    const allSelected = allIds.length > 0 && allIds.every((id) => form.taskIds.includes(id))
    setForm((f) => ({ ...f, taskIds: allSelected ? [] : allIds }))
    setErrors((e) => ({ ...e, taskIds: false }))
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

  const handleCreate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (!form.projectId) errs.projectId = true
    if (!form.taskIds.length) errs.taskIds = true
    if (!form.statuses.length) errs.statuses = true
    if (!form.formats.length) errs.formats = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const project = projects.find((p) => p.id === form.projectId)
    const newId = nextDatasetId(datasets)
    onClose({
      id: newId,
      name: form.name.trim(),
      description: form.description.trim(),
      projectId: form.projectId,
      projectName: project?.name ?? '',
      taskIds: [...form.taskIds],
      statuses: [...form.statuses],
      formats: [...form.formats],
      entryIds: previewEntries.map((e) => e.id),
      trajCount: preview.count,
      totalSize: preview.size,
      totalDuration: preview.duration,
      createdBy: creatorName,
      createdAt: now,
      updatedBy: creatorName,
      updatedAt: now,
      updateLogs: [{
        id: `UL-${newId.slice(4)}-1`,
        updatedAt: now,
        updatedBy: creatorName,
        opType: '创建',
        changeSummary: `创建数据集，纳入 ${preview.count.toLocaleString()} 条数据，${preview.size}`,
        remark: form.description.trim() || '—',
      }],
    })
  }

  const inputCls = (err) =>
    `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
      err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
    }`

  return (
    <Modal
      open={open}
      title="新建数据集"
      onCancel={() => onClose(null)}
      onOk={handleCreate}
      okText="创建"
      width={640}
      fitViewport
    >
      <div className="space-y-6 pr-1">
        {/* 区块一：基本信息 */}
        <section>
          <SectionTitle>基本信息</SectionTitle>
          <div className="space-y-4">
            <CreatorReadonlyField />
            <FormRow label="数据集名称" required error={errors.name}>
              <input
                placeholder="请输入数据集名称"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: false }) }}
                className={inputCls(errors.name)}
              />
            </FormRow>
            <FormRow label="描述">
              <textarea
                rows={3}
                placeholder="请输入描述（选填）"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormRow>
          </div>
        </section>

        {/* 区块二：选择数据来源 */}
        <section>
          <SectionTitle>选择数据来源</SectionTitle>
          <div className="space-y-4">
            <FormRow label="来源项目" required error={errors.projectId}>
              <select
                value={form.projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={`${inputCls(errors.projectId)} cursor-pointer ${form.projectId ? 'text-gray-700' : 'text-gray-400'}`}
              >
                <option value="" disabled hidden>请选择采集项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormRow>

            {form.projectId && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  纳入任务<span className="text-red-500">*</span>
                </label>
                <div className={`rounded-md border p-3 ${errors.taskIds ? 'border-red-400' : 'border-gray-200'}`}>
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
                    {projectTasks.map((t) => (
                      <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.taskIds.includes(t.id)}
                          onChange={() => toggleTask(t.id)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{t.name}</span>
                        <span className="text-xs text-gray-400">{t.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {errors.taskIds && <p className="mt-1 text-xs text-red-500">请至少选择一个任务</p>}
              </div>
            )}

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

        {/* 区块三：预览 */}
        <section>
          <SectionTitle>预览</SectionTitle>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
            <p>
              符合条件的条目数：
              <strong className="ml-1 text-base text-blue-700">{preview.count.toLocaleString()}</strong>
            </p>
            <p className="mt-1.5">
              预计总数据量：
              <strong className="ml-1 text-base text-blue-700">{preview.size}</strong>
            </p>
            <p className="mt-2 text-xs text-gray-400">
              创建后将按当前条件生成快照，后续项目新增数据不会自动纳入本数据集。
            </p>
          </div>
        </section>
      </div>
    </Modal>
  )
}
