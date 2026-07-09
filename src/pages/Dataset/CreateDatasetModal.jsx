import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import TreeTransfer from '../../components/common/TreeTransfer'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { projects } from '../../mock/projects'
import { tasks } from '../../mock/tasks'
import {
  ACCEPTED_DATA_STATUS,
  filterAcceptedEntriesByTasks,
  computeEntryMetrics,
} from '../../utils/datasetMetrics'
import { nowDateTime } from '../../utils/formatDateTime'

const DATA_FORMATS = ['h5', 'LeRobot']

const emptyForm = () => ({
  name: '',
  description: '',
  taskIds: [],
  formats: [...DATA_FORMATS],
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

  const previewEntries = useMemo(() => {
    if (!form.taskIds.length || !form.formats.length) return []
    return filterAcceptedEntriesByTasks(form.taskIds, form.formats)
  }, [form.taskIds, form.formats])

  const preview = useMemo(() => computeEntryMetrics(previewEntries), [previewEntries])

  const setTaskIds = (taskIds) => {
    setForm((f) => ({ ...f, taskIds }))
    setErrors((e) => ({ ...e, taskIds: false }))
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

  const handleCreate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (!form.taskIds.length) errs.taskIds = true
    if (!form.formats.length) errs.formats = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const projectIds = [...new Set(
      form.taskIds.map((tid) => tasks.find((t) => t.id === tid)?.projectId).filter(Boolean),
    )]
    const projectNames = Object.fromEntries(
      projectIds.map((id) => [id, projects.find((p) => p.id === id)?.name ?? id]),
    )
    const primaryProject = projects.find((p) => p.id === projectIds[0])

    const now = nowDateTime()
    const newId = nextDatasetId(datasets)

    onClose({
      id: newId,
      name: form.name.trim(),
      description: form.description.trim(),
      projectId: projectIds[0],
      projectName: projectIds.length === 1
        ? (primaryProject?.name ?? '')
        : projectIds.map((id) => projectNames[id]).join('、'),
      projectIds,
      projectNames,
      taskIds: [...form.taskIds],
      statuses: [ACCEPTED_DATA_STATUS],
      formats: [...form.formats],
      autoSync: true,
      entryIds: previewEntries.map((e) => e.id),
      trajCount: preview.count,
      totalSize: preview.totalSize,
      totalDuration: preview.totalDuration,
      createdBy: creatorName,
      createdAt: now,
      updatedBy: creatorName,
      updatedAt: now,
      updateLogs: [{
        id: `UL-${newId.slice(4)}-1`,
        updatedAt: now,
        updatedBy: creatorName,
        opType: '创建',
        changeSummary: `创建数据集，纳入 ${preview.count.toLocaleString()} 条数据，${preview.totalSize}`,
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
      width={920}
      fitViewport
    >
      <div className="space-y-6 pr-1">
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

        <section>
          <SectionTitle>选择数据来源</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                纳入任务<span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-gray-400">可勾选多个采集项目，仅纳入验收通过的数据</p>
              <TreeTransfer
                key={open ? 'open' : 'closed'}
                projects={projects}
                tasks={tasks}
                value={form.taskIds}
                onChange={setTaskIds}
                error={errors.taskIds}
              />
              {errors.taskIds && <p className="mt-1 text-xs text-red-500">请至少选择一个任务</p>}
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
              <p className="mt-2 text-xs text-gray-400">
                创建后自动同步：符合条件的新增验收通过数据自动纳入，平台删除的数据自动移除
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>预览</SectionTitle>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
            <p>
              符合条件的条目数：
              <strong className="ml-1 text-base text-blue-700">{preview.count.toLocaleString()}</strong>
            </p>
            <p className="mt-1.5">
              预计总数据量：
              <strong className="ml-1 text-base text-blue-700">{preview.totalSize}</strong>
            </p>
            <p className="mt-1.5">
              预计总时长：
              <strong className="ml-1 text-base text-blue-700">{preview.totalDuration}</strong>
            </p>
          </div>
        </section>
      </div>
    </Modal>
  )
}
