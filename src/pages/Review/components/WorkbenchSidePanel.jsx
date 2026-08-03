import { useState } from 'react'
import Button from '../../../components/common/Button'
import { PlanStepsReadonly } from '../../../components/collect/CollectPlanForm'
import { plans } from '../../../mock/plans'
import { tasks } from '../../../mock/tasks'
import { PROBLEM_TAG_OPTIONS, QUALITY_OPTIONS } from '../constants/workbenchTags'
import SegmentAnnotateModal from './SegmentAnnotateModal'

const CHEVRON = (
  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

function PlaceholderDash() {
  return <div className="text-xs text-gray-800">-</div>
}

function hasOverallAnnotation(entry, form, actionSegments, regionFrames) {
  return Boolean(
    entry?.auditResult
    || form.auditConclusion
    || actionSegments.length
    || regionFrames.length,
  )
}

function hasFragmentData(actionSegments, regionFrames) {
  return actionSegments.length > 0 || regionFrames.length > 0
}

function hasAcceptanceData(entry, acceptForm) {
  return Boolean(entry?.acceptResult || acceptForm?.acceptConclusion)
}

function DescGrid({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      {items.map(({ label, value, title, span }) => (
        <div key={label} className={`min-w-0 ${span === 'full' ? 'col-span-2' : ''}`}>
          <dt className="text-left tracking-tight text-gray-400">{label}</dt>
          <dd className="mt-0.5 truncate text-left text-gray-800" title={title || (typeof value === 'string' ? value : undefined)}>
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function PanelCard({ title, open, onToggle, children }) {
  return (
    <section className="rounded-lg border border-gray-100 bg-gray-50/90 p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>{CHEVRON}</span>
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </section>
  )
}

function PlanDetailsExpandable({ plan }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2.5 border-t border-gray-200/80 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="text-xs font-medium text-gray-700">采集方案详情</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>{CHEVRON}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2.5">
          <DescGrid
            items={[
              { label: '初始场景状态', value: plan?.initialScene ?? '—', span: 'full' },
            ]}
          />
          <div>
            <p className="mb-1 text-xs tracking-tight text-gray-400">采集步骤</p>
            <PlanStepsReadonly steps={plan?.steps} />
          </div>
        </div>
      )}
    </div>
  )
}

function ConclusionButtons({ value, onChange, onPass, onReject, disabled }) {
  const selectPass = () => {
    if (disabled) return
    if (value === 'pass') {
      onPass?.()
    } else {
      onChange('pass')
    }
  }
  const selectReject = () => {
    if (disabled) return
    if (value === 'reject') {
      onReject?.()
    } else {
      onChange('reject')
    }
  }
  const defaultBtnCls = 'flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={selectPass}
        className={value === 'pass'
          ? 'flex-1 cursor-pointer rounded-md border border-emerald-500 bg-[#52c41a] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50'
          : defaultBtnCls}
      >
        通过
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={selectReject}
        className={value === 'reject'
          ? 'flex-1 cursor-pointer rounded-md border border-red-500 bg-[#ff4d4f] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50'
          : defaultBtnCls}
      >
        驳回
      </button>
    </div>
  )
}

function RequiredLabel({ children, optional = false }) {
  return (
    <p className="mb-1.5 text-xs text-gray-500">
      {children}
      {!optional && <span className="text-red-500"> *</span>}
      {optional && <span className="text-gray-400">（选填）</span>}
    </p>
  )
}

function OverallAnnotationReadonly({ form }) {
  const isPass = form.auditConclusion === 'pass'
  const isReject = form.auditConclusion === 'reject'
  const conclusionLabel = isPass
    ? '通过'
    : isReject
      ? '驳回'
      : '—'
  const conclusionCls = isPass
    ? 'text-emerald-600'
    : isReject
      ? 'text-red-500'
      : 'text-gray-800'

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs text-gray-500">标注结论</p>
        <div className={`min-h-8 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium ${conclusionCls}`}>
          {conclusionLabel}
        </div>
      </div>

      {isPass && (
        <div>
          <p className="mb-1.5 text-xs text-gray-500">质量评分</p>
          <div className="min-h-8 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
            {form.auditQuality ?? '—'}
          </div>
        </div>
      )}

      {isReject && (
        <div>
          <p className="mb-1.5 text-xs text-gray-500">问题标签</p>
          <div className="min-h-8 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
            {form.auditTags.length ? form.auditTags.join('、') : '—'}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs text-gray-500">描述</p>
        <div className="min-h-8 whitespace-pre-wrap rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
          {form.auditComment?.trim() ? form.auditComment : '—'}
        </div>
      </div>
    </div>
  )
}

function AcceptanceReadonly({ entry, acceptForm }) {
  const isPass = acceptForm.acceptConclusion === 'pass' || entry?.acceptResult === '通过'
  const isReject = acceptForm.acceptConclusion === 'reject' || entry?.acceptResult === '不通过'
  const conclusionLabel = isPass ? '通过' : isReject ? '驳回' : '—'
  const conclusionCls = isPass
    ? 'text-emerald-600'
    : isReject
      ? 'text-red-500'
      : 'text-gray-800'

  const passComment = acceptForm.acceptComment?.trim()
    || entry?.acceptComment
    || ''

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs text-gray-500">验收结论</p>
        <div className={`min-h-8 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium ${conclusionCls}`}>
          {conclusionLabel}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-gray-500">描述</p>
        <div className="min-h-8 whitespace-pre-wrap rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
          {passComment?.trim() ? passComment : '—'}
        </div>
      </div>
    </div>
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
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-10 px-2 py-1.5 text-center font-medium">序号</th>
              <th className="w-16 px-2 py-1.5 text-center font-medium">起始帧</th>
              <th className="w-16 px-2 py-1.5 text-center font-medium">结束帧</th>
              <th className="px-2 py-1.5 text-left font-medium">标注</th>
              {editable && <th className="w-[72px] px-1 py-1.5 text-center font-medium">操作</th>}
              {!editable && onSeek && <th className="w-10 px-1 py-1.5 text-center font-medium">预览</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={editable ? 5 : (onSeek ? 5 : 4)} className="px-2 py-4 text-center text-gray-400">暂无标注</td>
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
                {editable ? (
                  <td className="px-1 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <IconActionBtn title="编辑" onClick={() => openEdit(i)}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </IconActionBtn>
                      <IconActionBtn title="预览" onClick={() => onSeek?.(row.startFrame)}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
                      </IconActionBtn>
                      <IconActionBtn title="删除" danger onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </IconActionBtn>
                    </div>
                  </td>
                ) : onSeek && (
                  <td className="px-1 py-1">
                    <div className="flex items-center justify-center">
                      <IconActionBtn title="预览" onClick={() => onSeek(row.startFrame)}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
                      </IconActionBtn>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-white py-2 text-xs text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
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

function OverallAnnotationEditor({
  form,
  setForm,
  onPass,
  onReject,
}) {
  const readOnlyFieldCls = 'cursor-default border-gray-200 bg-white text-gray-800'
  const editFieldCls = 'border-gray-300 bg-white focus:border-blue-500'

  const setConclusion = (value) => {
    setForm((f) => ({ ...f, auditConclusion: value }))
  }

  const toggleProblemTag = (tag) => {
    setForm((f) => ({
      ...f,
      auditTags: f.auditTags.includes(tag)
        ? f.auditTags.filter((t) => t !== tag)
        : [...f.auditTags, tag],
    }))
  }

  return (
    <div className="space-y-3">
      <div>
        <RequiredLabel>标注结论</RequiredLabel>
        <ConclusionButtons
          value={form.auditConclusion}
          onChange={setConclusion}
          onPass={onPass}
          onReject={onReject}
        />
      </div>

      {form.auditConclusion === 'pass' && (
        <div>
          <RequiredLabel>质量标签</RequiredLabel>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {QUALITY_OPTIONS.map((opt) => (
              <label key={opt} className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-700">
                <input
                  type="radio"
                  name="audit-quality"
                  checked={form.auditQuality === opt}
                  onChange={() => setForm((f) => ({ ...f, auditQuality: opt }))}
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )}

      {form.auditConclusion === 'reject' && (
        <div>
          <RequiredLabel optional>问题标签</RequiredLabel>
          <div className="flex flex-wrap gap-1.5">
            {PROBLEM_TAG_OPTIONS.map((tag) => {
              const checked = form.auditTags.includes(tag)
              return (
                <label
                  key={tag}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProblemTag(tag)}
                    className="h-3 w-3 shrink-0 accent-blue-600"
                  />
                  {tag}
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <RequiredLabel optional>描述</RequiredLabel>
        <textarea
          rows={3}
          maxLength={500}
          value={form.auditComment}
          onChange={(e) => setForm((f) => ({ ...f, auditComment: e.target.value }))}
          placeholder="请输入描述"
          className={`w-full resize-none rounded-md border px-3 py-2 text-xs text-gray-800 outline-none ${editFieldCls} focus:ring-2 focus:ring-blue-100`}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.auditComment.length} / 500</p>
      </div>
    </div>
  )
}

function AcceptanceEditor({ acceptForm, setAcceptForm }) {
  const editFieldCls = 'border-gray-300 bg-white focus:border-blue-500'

  return (
    <div className="space-y-3">
      <div>
        <RequiredLabel>验收结论</RequiredLabel>
        <ConclusionButtons
          value={acceptForm.acceptConclusion}
          onChange={(value) => setAcceptForm((f) => ({ ...f, acceptConclusion: value }))}
        />
      </div>

      <div>
        <RequiredLabel optional>描述</RequiredLabel>
        <textarea
          rows={3}
          maxLength={500}
          value={acceptForm.acceptComment}
          onChange={(e) => setAcceptForm((f) => ({ ...f, acceptComment: e.target.value }))}
          placeholder="请输入描述"
          className={`w-full resize-none rounded-md border px-3 py-2 text-xs text-gray-800 outline-none ${editFieldCls} focus:ring-2 focus:ring-blue-100`}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{acceptForm.acceptComment.length} / 500</p>
      </div>
    </div>
  )
}

export default function WorkbenchSidePanel({
  mode,
  entry,
  form,
  setForm,
  acceptForm,
  setAcceptForm,
  actionSegments,
  setActionSegments,
  regionFrames,
  setRegionFrames,
  onSeek,
  onSave,
  saveDisabled,
  showSave,
  showSubmit,
  onAcceptSubmit,
  onPass,
  onReject,
}) {
  const annotationEditable = mode === 'review'
  const acceptEditable = mode === 'accept'

  const [basicInfoOpen, setBasicInfoOpen] = useState(true)
  const [annotationOpen, setAnnotationOpen] = useState(true)
  const [fragmentOpen, setFragmentOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(mode === 'accept')

  const panelTitle = mode === 'accept' ? '验收' : mode === 'review' ? '标注' : '播放'

  const hasOverall = hasOverallAnnotation(entry, form, actionSegments, regionFrames)
  const hasFragment = hasFragmentData(actionSegments, regionFrames)
  const hasAcceptance = hasAcceptanceData(entry, acceptForm)

  const ctx = (() => {
    const task = tasks.find((t) => t.id === entry.taskId)
    const plan = plans.find((p) => p.id === task?.planId)
    return { projectName: task?.projectName ?? '—', taskName: task?.name ?? '—', plan, task }
  })()

  const durationSec = entry.duration?.includes(':')
    ? `${parseInt(entry.duration.split(':')[0], 10) * 60 + parseInt(entry.duration.split(':')[1], 10)}s`
    : entry.duration

  const basicInfoItems = [
    { label: '采集项目', value: ctx.projectName },
    { label: '采集任务', value: ctx.taskName },
    { label: '所属场景', value: ctx.task?.scene ?? '—' },
    { label: '采集员', value: entry.uploader },
    { label: '设备类型', value: entry.deviceTypeName ?? '—' },
    { label: '采集设备', value: entry.collectDevice, title: entry.collectDeviceSn?.trim() || undefined },
    { label: '采集方式', value: entry.collectMethod },
    { label: '格式·时长', value: `${entry.format} · ${durationSec}`, span: 'full' },
  ]

  const renderOverallAnnotation = () => {
    if (mode === 'play' && !hasOverall) return <PlaceholderDash />
    if (annotationEditable) {
      return (
        <OverallAnnotationEditor
          form={form}
          setForm={setForm}
          onPass={onPass}
          onReject={onReject}
        />
      )
    }
    return <OverallAnnotationReadonly form={form} />
  }

  const renderFragmentAnnotation = () => {
    if (mode === 'play' && !hasFragment) return <PlaceholderDash />
    return (
      <div className="space-y-4">
        <FragmentTable
          title="动作语义"
          type="action"
          rows={actionSegments}
          editable={annotationEditable}
          onSeek={onSeek}
          onChange={setActionSegments}
        />
        <FragmentTable
          title="区域帧"
          type="region"
          rows={regionFrames}
          editable={annotationEditable}
          onSeek={onSeek}
          onChange={setRegionFrames}
        />
      </div>
    )
  }

  const renderAcceptance = () => {
    if ((mode === 'play' || mode === 'review') && !hasAcceptance) return <PlaceholderDash />
    if (acceptEditable) return <AcceptanceEditor acceptForm={acceptForm} setAcceptForm={setAcceptForm} />
    return <AcceptanceReadonly entry={entry} acceptForm={acceptForm} />
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex shrink-0 items-center border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{panelTitle}</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-3">
          <PanelCard title="基础信息" open={basicInfoOpen} onToggle={() => setBasicInfoOpen((o) => !o)}>
            <DescGrid items={basicInfoItems} />
            <PlanDetailsExpandable plan={ctx.plan} />
          </PanelCard>

          <PanelCard title="整体标注" open={annotationOpen} onToggle={() => setAnnotationOpen((o) => !o)}>
            {renderOverallAnnotation()}
          </PanelCard>

          <PanelCard title="片段标注" open={fragmentOpen} onToggle={() => setFragmentOpen((o) => !o)}>
            {renderFragmentAnnotation()}
          </PanelCard>

          <PanelCard title="验收" open={acceptOpen} onToggle={() => setAcceptOpen((o) => !o)}>
            {renderAcceptance()}
          </PanelCard>
        </div>
      </div>

      {showSave && (
        <div className="shrink-0 border-t border-gray-100 p-3">
          <Button
            variant="primary"
            className="h-9 w-full text-sm font-medium"
            disabled={saveDisabled}
            onClick={onSave}
          >
            保存
          </Button>
        </div>
      )}

      {showSubmit && (
        <div className="shrink-0 border-t border-gray-100 p-3">
          <Button
            variant="primary"
            className="h-9 w-full text-sm font-medium"
            onClick={onAcceptSubmit}
          >
            提交
          </Button>
        </div>
      )}
    </div>
  )
}
