import { useState } from 'react'
import Button from '../../../components/common/Button'
import { plans } from '../../../mock/plans'
import { tasks } from '../../../mock/tasks'
import { PROBLEM_TAG_OPTIONS, QUALITY_OPTIONS } from '../constants/workbenchTags'
import SegmentAnnotateModal from './SegmentAnnotateModal'

function MetaRow({ label, value, title }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right text-gray-800" title={title}>{value ?? '—'}</span>
    </div>
  )
}

function PlanDetailsExpandable({ plan, task, sceneFallback = '—' }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-sm"
      >
        <span className="text-gray-400">采集方案详情</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2.5">
          <div>
            <p className="mb-0.5 text-xs text-gray-400">任务描述</p>
            <p className="text-sm text-gray-800">{task?.name ?? plan?.name ?? '—'}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-gray-400">初始场景状态</p>
            <p className="text-sm text-gray-800">{plan?.initialScene ?? sceneFallback}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CollapsibleBlock({ title, open, onToggle, children }) {
  return (
    <section className="border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  )
}

function IconActionBtn({ title, onClick, disabled, children, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition ${
        disabled
          ? 'cursor-not-allowed text-gray-300'
          : danger
            ? 'cursor-pointer text-red-500 hover:bg-red-50'
            : 'cursor-pointer text-blue-600 hover:bg-blue-50'
      }`}
    >
      {children}
    </button>
  )
}

function FragmentTable({
  title,
  type,
  rows,
  editable,
  onSeek,
  onChange,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editIndex, setEditIndex] = useState(null)

  const openAdd = () => {
    setEditIndex(null)
    setModalOpen(true)
  }

  const openEdit = (index) => {
    setEditIndex(index)
    setModalOpen(true)
  }

  const handleConfirm = (row) => {
    if (editIndex === null) {
      onChange([...rows, row])
    } else {
      onChange(rows.map((r, i) => (i === editIndex ? { ...r, ...row } : r)))
    }
    setModalOpen(false)
  }

  const annotationText = (row) => (type === 'action' ? (row.desc || row.skill || '—') : (row.label || '—'))

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{title}</p>
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-10 px-2 py-1.5 text-center font-medium">序号</th>
              <th className="w-16 px-2 py-1.5 text-center font-medium">起始帧</th>
              <th className="w-16 px-2 py-1.5 text-center font-medium">结束帧</th>
              <th className="px-2 py-1.5 text-left font-medium">标注</th>
              <th className="w-[72px] px-1 py-1.5 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-gray-400">暂无标注</td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={`${type}-${row.startFrame}-${row.endFrame}-${i}`}>
                <td className="px-2 py-1.5 text-center text-gray-600">{i + 1}</td>
                <td className="px-1 py-1.5">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      value={row.startFrame}
                      onChange={(e) => onChange(rows.map((r, idx) => idx === i ? { ...r, startFrame: Number(e.target.value) || 0 } : r))}
                      className="h-7 w-full rounded border border-gray-200 px-1 text-center"
                    />
                  ) : (
                    <span className="block text-center text-gray-700">{row.startFrame}</span>
                  )}
                </td>
                <td className="px-1 py-1.5">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      value={row.endFrame}
                      onChange={(e) => onChange(rows.map((r, idx) => idx === i ? { ...r, endFrame: Number(e.target.value) || 0 } : r))}
                      className="h-7 w-full rounded border border-gray-200 px-1 text-center"
                    />
                  ) : (
                    <span className="block text-center text-gray-700">{row.endFrame}</span>
                  )}
                </td>
                <td className="max-w-[80px] truncate px-2 py-1.5 text-gray-700" title={annotationText(row)}>
                  {annotationText(row)}
                </td>
                <td className="px-1 py-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <IconActionBtn title="编辑" disabled={!editable} onClick={() => openEdit(i)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </IconActionBtn>
                    <IconActionBtn title="预览" onClick={() => onSeek?.(row.startFrame)}>
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
                    </IconActionBtn>
                    <IconActionBtn title="删除" disabled={!editable} danger onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </IconActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
        >
          + 添加标注
        </button>
      )}
      <SegmentAnnotateModal
        open={modalOpen}
        type={type}
        initial={editIndex === null ? null : rows[editIndex]}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default function WorkbenchSidePanel({
  mode,
  entry,
  form,
  setForm,
  actionSegments,
  setActionSegments,
  regionFrames,
  setRegionFrames,
  onSeek,
  onSave,
  saveDisabled,
  showSave,
}) {
  const editable = mode === 'review'
  const readOnlyFieldCls = 'cursor-default border-gray-200 bg-gray-50 text-gray-800'
  const editFieldCls = 'border-gray-300 focus:border-blue-500'

  const [overallOpen, setOverallOpen] = useState(true)
  const [fragmentOpen, setFragmentOpen] = useState(true)

  const ctx = (() => {
    const task = tasks.find((t) => t.id === entry.taskId)
    const plan = plans.find((p) => p.id === task?.planId)
    return { projectName: task?.projectName ?? '—', taskName: task?.name ?? '—', plan, task }
  })()

  const durationSec = entry.duration?.includes(':')
    ? `${parseInt(entry.duration.split(':')[0], 10) * 60 + parseInt(entry.duration.split(':')[1], 10)}s`
    : entry.duration

  const toggleProblemTag = (tag) => {
    setForm((f) => ({
      ...f,
      auditTags: f.auditTags.includes(tag)
        ? f.auditTags.filter((t) => t !== tag)
        : [...f.auditTags, tag],
    }))
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex shrink-0 items-center border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">标注</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section>
          <h4 className="mb-3 text-sm font-medium text-gray-800">基础信息</h4>
          <MetaRow label="采集项目" value={ctx.projectName} />
          <MetaRow label="采集任务" value={ctx.taskName} />
          <MetaRow label="采集员" value={entry.uploader} />
          <MetaRow label="设备类型" value={entry.deviceTypeName ?? '—'} />
          <MetaRow label="采集设备" value={entry.collectDevice} title={entry.collectDeviceSn?.trim() || undefined} />
          <MetaRow label="采集方式" value={entry.collectMethod} />
          <MetaRow label="格式·时长" value={`${entry.format} · ${durationSec}`} />
          <PlanDetailsExpandable
            plan={ctx.plan}
            task={ctx.task}
            sceneFallback={entry.sceneInitialDetail ?? entry.sceneInitialState ?? '—'}
          />
        </section>

        <CollapsibleBlock title="整体标签" open={overallOpen} onToggle={() => setOverallOpen((o) => !o)}>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-gray-500">质量评分</p>
              {editable ? (
                <div className="space-y-1.5">
                  {QUALITY_OPTIONS.map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="audit-quality"
                        checked={form.auditQuality === opt}
                        onChange={() => setForm((f) => ({ ...f, auditQuality: opt }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <div className={`min-h-8 rounded-md border px-3 py-2 text-sm ${readOnlyFieldCls}`}>
                  {form.auditQuality ?? '—'}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500">问题标签</p>
              {editable ? (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                  {PROBLEM_TAG_OPTIONS.map((tag) => (
                    <label key={tag} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={form.auditTags.includes(tag)}
                        onChange={() => toggleProblemTag(tag)}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-blue-600"
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className={`min-h-8 rounded-md border px-3 py-2 text-sm ${readOnlyFieldCls}`}>
                  {form.auditTags.length ? form.auditTags.join('、') : '—'}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500">描述</p>
              <textarea
                rows={4}
                maxLength={500}
                readOnly={!editable}
                value={form.auditComment}
                onChange={(e) => setForm((f) => ({ ...f, auditComment: e.target.value }))}
                placeholder={editable ? '请输入描述' : undefined}
                className={`w-full resize-none rounded-md border px-3 py-2 text-sm outline-none ${
                  editable ? `${editFieldCls} text-gray-800 focus:ring-2 focus:ring-blue-100` : readOnlyFieldCls
                }`}
              />
              {editable && (
                <p className="mt-1 text-right text-xs text-gray-400">{form.auditComment.length} / 500</p>
              )}
            </div>
          </div>
        </CollapsibleBlock>

        <CollapsibleBlock title="片段标注" open={fragmentOpen} onToggle={() => setFragmentOpen((o) => !o)}>
          <div className="space-y-4">
            <FragmentTable
              title="动作语义"
              type="action"
              rows={actionSegments}
              editable={editable}
              onSeek={onSeek}
              onChange={setActionSegments}
            />
            <FragmentTable
              title="区域帧"
              type="region"
              rows={regionFrames}
              editable={editable}
              onSeek={onSeek}
              onChange={setRegionFrames}
            />
          </div>
        </CollapsibleBlock>
      </div>

      {showSave && (
        <div className="shrink-0 border-t border-gray-100 p-4">
          <Button
            variant="primary"
            className="h-10 w-full text-sm font-medium"
            disabled={saveDisabled}
            onClick={onSave}
          >
            保存
          </Button>
        </div>
      )}
    </div>
  )
}
