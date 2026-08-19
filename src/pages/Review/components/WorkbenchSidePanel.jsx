import { useMemo, useState } from 'react'
import Button from '../../../components/common/Button'
import { PlanStepsReadonly } from '../../../components/collect/CollectPlanForm'
import { resolveFragmentTypesFromPlan } from '../../../components/collect/fragmentAnnotPreconfig'
import { plans } from '../../../mock/plans'
import { tasks } from '../../../mock/tasks'
import { PROBLEM_TAG_OPTIONS, QUALITY_OPTIONS } from '../constants/workbenchTags'
import {
  formatAnnotationDisplayText,
  formatAnnotationTooltipLines,
  createBlankSegment,
  hasAnyFragmentSegments,
} from '../utils/fragmentSegments'
import { AttributeValueEditor } from './SegmentAttributeEditors'
import WorkbenchModeBadge from './WorkbenchModeBadge'

const CHEVRON = (
  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

function PlaceholderDash() {
  return <div className="text-xs text-gray-800">-</div>
}

function hasOverallAnnotation(entry, form, fragmentSegmentsByType) {
  return Boolean(
    entry?.auditResult
    || form.auditConclusion
    || hasAnyFragmentSegments(fragmentSegmentsByType),
  )
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

function ConclusionButtons({ value, onChange, disabled }) {
  const selectPass = () => {
    if (disabled) return
    onChange('pass')
  }
  const selectReject = () => {
    if (disabled) return
    onChange('reject')
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

function AnnotationTooltip({ lines }) {
  if (!lines.length) return null
  return (
    <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden min-w-[220px] max-w-[320px] rounded-md bg-gray-800 px-3 py-2 text-left text-xs leading-relaxed text-white shadow-lg group-hover/annot:block">
      {lines.map(({ label, value }) => (
        <div key={label} className="py-0.5">
          <span className="text-gray-300">{label}：</span>
          {value}
        </div>
      ))}
    </div>
  )
}

function InlineFragmentAttrs({ fragmentType, attrs, onChange }) {
  const attributes = fragmentType?.attributes ?? []
  if (!attributes.length) return null
  return (
    <div className="space-y-1.5">
      {attributes.map((attr) => (
        <AttributeValueEditor
          key={attr.id ?? attr.value}
          attribute={attr}
          value={attrs?.[attr.value]}
          onChange={(next) => onChange({ ...attrs, [attr.value]: next })}
          compact
          hidePlaceholder
        />
      ))}
    </div>
  )
}

function FragmentTable({
  fragmentType,
  rows,
  editable,
  onSeek,
  onChange,
}) {
  const [editingIndex, setEditingIndex] = useState(null)
  const colSpan = editable ? 5 : (onSeek ? 5 : 4)

  const updateRow = (index, patch) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const updateRowAttrs = (index, attrs) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, attrs } : r)))
  }

  const handleAdd = () => {
    setEditingIndex(null)
    onChange([...rows, createBlankSegment()])
  }

  const toggleEdit = (index) => {
    setEditingIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{fragmentType.name}</p>
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full min-w-[280px] table-fixed text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-9 px-1 py-1.5 text-center font-medium">序号</th>
              <th className="w-14 px-1 py-1.5 text-center font-medium">起始帧</th>
              <th className="w-14 px-1 py-1.5 text-center font-medium">结束帧</th>
              <th className="px-2 py-1.5 text-left font-medium">标注</th>
              {editable && <th className="w-[68px] px-1 py-1.5 text-center font-medium">操作</th>}
              {!editable && onSeek && <th className="w-9 px-1 py-1.5 text-center font-medium">预览</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-2 py-4 text-center text-gray-400">暂无标注</td>
              </tr>
            ) : rows.map((row, i) => {
              const displayText = formatAnnotationDisplayText(fragmentType, row)
              const tooltipLines = formatAnnotationTooltipLines(fragmentType, row)
              const editing = editable && editingIndex === i
              return (
                <tr key={`${fragmentType.id}-row-${i}`}>
                    <td className="px-1 py-1.5 text-center align-top text-gray-600">{i + 1}</td>
                    <td className="px-1 py-1.5 align-top">
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          value={row.startFrame === '' ? '' : row.startFrame}
                          onChange={(e) => {
                            const v = e.target.value
                            updateRow(i, { startFrame: v === '' ? '' : Number(v) || 0 })
                          }}
                          className="h-7 w-full rounded border border-gray-200 px-1 text-center"
                        />
                      ) : (
                        <span className="block text-center text-gray-700">{row.startFrame}</span>
                      )}
                    </td>
                    <td className="px-1 py-1.5 align-top">
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          value={row.endFrame === '' ? '' : row.endFrame}
                          onChange={(e) => {
                            const v = e.target.value
                            updateRow(i, { endFrame: v === '' ? '' : Number(v) || 0 })
                          }}
                          className="h-7 w-full rounded border border-gray-200 px-1 text-center"
                        />
                      ) : (
                        <span className="block text-center text-gray-700">{row.endFrame}</span>
                      )}
                    </td>
                    <td className="group/annot relative min-w-0 px-2 py-1.5 align-top text-gray-700">
                      {editing ? (
                        <InlineFragmentAttrs
                          fragmentType={fragmentType}
                          attrs={row.attrs ?? {}}
                          onChange={(attrs) => updateRowAttrs(i, attrs)}
                        />
                      ) : (
                        <span className="block cursor-default whitespace-pre-wrap break-words text-xs leading-relaxed">
                          {displayText}
                        </span>
                      )}
                      {!editable && tooltipLines.length > 0 && (
                        <AnnotationTooltip lines={tooltipLines} />
                      )}
                    </td>
                    {editable ? (
                      <td className="px-1 py-1 align-top">
                        <div className="flex items-center justify-center gap-0.5">
                          <IconActionBtn title={editing ? '收起' : '编辑'} onClick={() => toggleEdit(i)}>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </IconActionBtn>
                          <IconActionBtn title="预览" onClick={() => onSeek?.(row.startFrame)}>
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
                          </IconActionBtn>
                          <IconActionBtn
                            title="删除"
                            danger
                            onClick={() => {
                              onChange(rows.filter((_, idx) => idx !== i))
                              setEditingIndex((prev) => (prev === i ? null : prev > i ? prev - 1 : prev))
                            }}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </IconActionBtn>
                        </div>
                      </td>
                    ) : onSeek && (
                      <td className="px-1 py-1 align-top">
                        <div className="flex items-center justify-center">
                          <IconActionBtn title="预览" onClick={() => onSeek(row.startFrame)}>
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
                          </IconActionBtn>
                        </div>
                      </td>
                    )}
                  </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {editable && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-white py-2 text-xs text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
        >
          + 添加标注
        </button>
      )}
    </div>
  )
}

function OverallAnnotationEditor({
  form,
  setForm,
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
          <RequiredLabel>问题标签</RequiredLabel>
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
          onChange={(e) => setForm((f) => ({ ...f, auditComment: e.target.value.slice(0, 500) }))}
          placeholder="请输入描述"
          className={`w-full resize-none rounded-md border px-3 py-2 text-xs text-gray-800 outline-none ${editFieldCls} focus:ring-2 focus:ring-blue-100`}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.auditComment.length}/500</p>
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
          onChange={(e) => setAcceptForm((f) => ({ ...f, acceptComment: e.target.value.slice(0, 500) }))}
          placeholder="请输入描述"
          className={`w-full resize-none rounded-md border px-3 py-2 text-xs text-gray-800 outline-none ${editFieldCls} focus:ring-2 focus:ring-blue-100`}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{acceptForm.acceptComment.length}/500</p>
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
  fragmentSegmentsByType,
  setFragmentSegmentsForType,
  onSeek,
  onSave,
  saveDisabled,
  showSave,
  showSubmit,
  onSubmit,
}) {
  const annotationEditable = mode === 'review'
  const acceptEditable = mode === 'accept'

  const [basicInfoOpen, setBasicInfoOpen] = useState(false)
  const [annotationOpen, setAnnotationOpen] = useState(false)
  const [fragmentOpen, setFragmentOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)

  const hasOverall = hasOverallAnnotation(entry, form, fragmentSegmentsByType)
  const hasFragment = hasAnyFragmentSegments(fragmentSegmentsByType)
  const hasAcceptance = hasAcceptanceData(entry, acceptForm)

  const ctx = (() => {
    const task = tasks.find((t) => t.id === entry.taskId)
    const plan = plans.find((p) => p.id === task?.planId)
    return { projectName: task?.projectName ?? '—', taskName: task?.name ?? '—', plan, task }
  })()

  const fragmentTypes = useMemo(
    () => resolveFragmentTypesFromPlan(ctx.plan ?? {}),
    [ctx.plan],
  )

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
        />
      )
    }
    return <OverallAnnotationReadonly form={form} />
  }

  const renderFragmentAnnotation = () => {
    if (mode === 'play' && !hasFragment) return <PlaceholderDash />
    return (
      <div className="space-y-4">
        {fragmentTypes.map((fragmentType) => (
          <FragmentTable
            key={fragmentType.id}
            fragmentType={fragmentType}
            rows={fragmentSegmentsByType[fragmentType.id] ?? []}
            editable={annotationEditable}
            onSeek={onSeek}
            onChange={(rows) => setFragmentSegmentsForType(fragmentType.id, rows)}
          />
        ))}
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
        <WorkbenchModeBadge mode={mode} />
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

      {(showSave || showSubmit) && (
        <div className="shrink-0 border-t border-gray-100 p-3">
          <div className="flex gap-2">
            {showSave && (
              <Button
                variant="default"
                className="h-9 flex-1 text-sm font-medium"
                disabled={saveDisabled}
                onClick={onSave}
              >
                保存
              </Button>
            )}
            {showSubmit && (
              <Button
                variant="primary"
                className="h-9 flex-1 text-sm font-medium"
                onClick={onSubmit}
              >
                提交
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
