import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import {
  getEntryById,
  getEntriesByTaskId,
  updateEntry,
} from '../../mock/entries'
import { getAuditReviewTagGroups } from '../../mock/tags'
import { tasks } from '../../mock/tasks'
import { plans } from '../../mock/plans'
import { useAuth } from '../../context/AuthContext'
import NoPermission from '../System/NoPermission'
import WorkbenchLayoutA from './components/WorkbenchLayoutA'
import WorkbenchLayoutB from './components/WorkbenchLayoutB'
import LayoutToggle from './components/LayoutToggle'
import { generateSignalSeries } from './mock/signalData'

const SPEEDS = [0.5, 1, 1.5, 2]

const SEGMENT_TONE = {
  blue: 'bg-sky-50 text-sky-800 border border-sky-100',
  gray: 'bg-gray-50 text-gray-600 border border-gray-200',
}

function parseMode(raw) {
  if (raw === 'review' || raw === 'accept') return raw
  return 'play'
}

function PendingHint({ children }) {
  return <p className="text-xs text-gray-400">{children}</p>
}

const PANEL_TITLES = {
  play: '播放',
  review: '审核标注',
  accept: '验收',
}

const SIDE_PANEL_WIDTH = 340

function IconLayoutSidebarRight({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16v16H4z" />
      <path d="M15 4v16" />
    </svg>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right text-gray-800">{value ?? '—'}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h4 className="mb-3 text-sm font-medium text-gray-800">{children}</h4>
}

function FieldLabel({ children }) {
  return <div className="mb-2 text-xs text-gray-400">{children}</div>
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
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
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
          <div>
            <p className="mb-1.5 text-xs text-gray-400">步骤列表</p>
            {!plan?.steps?.length ? (
              <p className="text-sm text-gray-500">暂无步骤</p>
            ) : (
              <div className="space-y-1">
                {plan.steps.map((step, i) => (
                  <div
                    key={`${step.description}-${i}`}
                    className="grid grid-cols-[20px_1fr_auto_auto] items-center gap-x-2 gap-y-0.5 rounded bg-white/80 px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium text-blue-600">{i + 1}</span>
                    <span className="text-gray-800">{step.description || '—'}</span>
                    <span className="text-gray-500">{step.atomicSkill}</span>
                    <span className="text-gray-500">{step.duration ?? 0}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SegmentedControl({ options, value, onChange, readOnly, variantMap = {} }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const active = value === opt
        const variant = variantMap[opt]
        let cls = 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        if (active) {
          if (variant === 'pass') cls = 'border-emerald-500 bg-emerald-50 text-emerald-700'
          else if (variant === 'fail') cls = 'border-red-400 bg-red-50 text-red-600'
          else if (variant === 'warn') cls = 'border-amber-400 bg-amber-50 text-amber-700'
          else cls = 'border-blue-500 bg-blue-50 text-blue-700'
        }
        return (
          <button
            key={opt}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(opt)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${cls} ${
              readOnly ? 'cursor-default opacity-90' : 'cursor-pointer'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function TagCheckboxDropdown({ value, onChange, readOnly }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const tagGroups = getAuditReviewTagGroups()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (readOnly) {
    return (
      <div className="min-h-8 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        {value.length ? value.join('、') : '—'}
      </div>
    )
  }

  const toggle = (name) => {
    onChange?.(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-8 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <span className={value.length ? 'text-gray-700' : 'text-gray-400'}>
          {value.length ? value.join('、') : '请选择审核标签'}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-1.5 shadow-lg">
          {tagGroups.map((group) => (
            <div key={group.groupName} className="mb-1 last:mb-0">
              <p className="px-2 py-1 text-xs font-medium text-gray-400">{group.groupName}</p>
              {group.tags.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(name)}
                    onChange={() => toggle(name)}
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                  />
                  {name}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {children}
    </button>
  )
}

function TimelinePanel({
  totalFrames,
  fps,
  currentFrame,
  onFrameChange,
  actionSegments,
  regionFrames,
  playing,
  onTogglePlay,
  speed,
  onSpeedChange,
  editable,
}) {
  const trackRef = useRef(null)
  const maxFrame = totalFrames - 1
  const pct = (frame) => (frame / Math.max(maxFrame, 1)) * 100
  const playPct = pct(currentFrame)

  const tickFrames = useMemo(() => {
    const max = maxFrame
    return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max]
  }, [maxFrame])

  const seekFromPointer = (clientX) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onFrameChange(Math.round(ratio * maxFrame))
  }

  const onProgressPointerDown = (e) => {
    e.preventDefault()
    seekFromPointer(e.clientX)
    const onMove = (ev) => seekFromPointer(ev.clientX)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const rowLabels = ['', '动作', '区域', '']

  return (
    <div className="shrink-0 rounded-lg border border-gray-200/80 bg-white p-2.5">
      <div className="flex gap-2">
        <div className="flex w-[52px] shrink-0 flex-col gap-1.5 pt-0.5">
          {rowLabels.map((lbl, i) => (
            <div
              key={lbl || i}
              className={`flex shrink-0 items-center text-[10px] text-gray-400 ${
                i === 0 ? 'h-5' : i === 3 ? 'h-4' : i === 1 ? 'h-8' : 'h-6'
              }`}
            >
              {lbl}
            </div>
          ))}
        </div>

        <div ref={trackRef} className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-blue-500"
            style={{ left: `${playPct}%`, transform: 'translateX(-50%)' }}
          />

          <div className="relative mb-1.5 h-5 shrink-0">
            <div className="flex justify-between px-0.5 font-mono text-[10px] text-gray-400">
              {tickFrames.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-b border-gray-200" />
          </div>

          <div className="relative mb-1.5 h-8 overflow-hidden rounded border border-gray-200/80 bg-gray-50/50">
            {actionSegments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                {editable ? '暂无片段' : '暂无预标注'}
              </div>
            ) : (
              actionSegments.map((seg, i) => (
                <div
                  key={`${seg.startFrame}-${seg.skill}-${i}`}
                  className={`absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-hidden rounded px-1 text-[10px] font-medium ${
                    SEGMENT_TONE[seg.tone ?? (seg.skill === 'move' ? 'gray' : 'blue')]
                  }`}
                  style={{
                    left: `${pct(seg.startFrame)}%`,
                    width: `${Math.max(pct(seg.endFrame) - pct(seg.startFrame), 1.2)}%`,
                  }}
                  title={`${seg.skill} · ${seg.desc}`}
                >
                  <span className="truncate">{seg.desc || seg.skill}</span>
                </div>
              ))
            )}
          </div>

          <div className="relative mb-2 h-6 overflow-hidden rounded border border-gray-200/80 bg-gray-50/50">
            {regionFrames.map((reg, i) => (
              <div
                key={`${reg.startFrame}-${reg.label}-${i}`}
                className="absolute top-0.5 bottom-0.5 bg-amber-100/70"
                style={{
                  left: `${pct(reg.startFrame)}%`,
                  width: `${Math.max(pct(reg.endFrame) - pct(reg.startFrame), 1.2)}%`,
                }}
                title={reg.label}
              />
            ))}
          </div>

          <div
            className="relative h-1.5 cursor-pointer rounded-full bg-gray-100"
            onPointerDown={onProgressPointerDown}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={maxFrame}
            aria-valuenow={currentFrame}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-blue-500/90"
              style={{ width: `${playPct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm"
              style={{ left: `${playPct}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 pl-[60px]">
        <div className="flex items-center gap-2">
          <IconBtn title="上一帧" onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" /></svg>
          </IconBtn>
          <IconBtn title={playing ? '暂停' : '播放'} onClick={onTogglePlay}>
            {playing ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>
            )}
          </IconBtn>
          <IconBtn title="下一帧" onClick={() => onFrameChange(Math.min(maxFrame, currentFrame + 1))}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6h2v12h-2V6zM6 18l8.5-6L6 6v12z" /></svg>
          </IconBtn>
          <span className="ml-1 font-mono text-xs text-gray-600">{currentFrame} / {maxFrame}</span>
          <span className="text-xs text-gray-400">{fps}fps</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-7 cursor-pointer rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-600 outline-none focus:border-blue-400"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s.toFixed(1)}x</option>
            ))}
          </select>
        </div>
        <span className="shrink-0 text-xs text-gray-400">快捷键：拖选区间 · 数字键打技能 · 空格播放</span>
      </div>
    </div>
  )
}

function AuditPanel({ mode, entry, form, setForm, onSubmitReview, onSubmitAccept }) {
  const showFooter = mode === 'review' || mode === 'accept'
  const ctx = useMemo(() => {
    const task = tasks.find((t) => t.id === entry.taskId)
    const plan = plans.find((p) => p.id === task?.planId)
    return {
      projectName: task?.projectName ?? '—',
      taskName: task?.name ?? '—',
      plan: plan ?? null,
      task: task ?? null,
    }
  }, [entry.taskId])

  const durationSec = entry.duration?.includes(':')
    ? `${parseInt(entry.duration.split(':')[0], 10) * 60 + parseInt(entry.duration.split(':')[1], 10)}s`
    : entry.duration

  const readOnlyFieldCls = 'cursor-default border-gray-200 bg-gray-50 text-gray-800'
  const editFieldCls = 'border-gray-300 focus:border-blue-500'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex shrink-0 items-center border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{PANEL_TITLES[mode]}</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section>
          <SectionTitle>基本信息</SectionTitle>
          <MetaRow label="采集项目" value={ctx.projectName} />
          <MetaRow label="采集任务" value={ctx.taskName} />
          <MetaRow label="采集员" value={entry.uploader} />
          <MetaRow label="采集设备" value={entry.collectDevice} />
          <MetaRow label="采集方式" value={entry.collectMethod} />
          <MetaRow label="格式·时长" value={`${entry.format} · ${durationSec}`} />
          <PlanDetailsExpandable
            plan={ctx.plan}
            task={ctx.task}
            sceneFallback={entry.sceneInitialDetail ?? entry.sceneInitialState ?? '—'}
          />
        </section>

        <section className="mt-5 border-t border-gray-100 pt-5">
          <SectionTitle>审核结论</SectionTitle>
          {mode === 'play' && <PendingHint>待审核</PendingHint>}
          {mode === 'review' && (
            <div className="space-y-4">
              <div>
                <FieldLabel>审核结果</FieldLabel>
                <SegmentedControl
                  options={['通过', '不通过']}
                  value={form.auditResult}
                  variantMap={{ 通过: 'pass', 不通过: 'fail' }}
                  onChange={(v) => setForm((f) => ({ ...f, auditResult: v }))}
                />
              </div>
              <div>
                <FieldLabel>审核标签</FieldLabel>
                <TagCheckboxDropdown
                  value={form.auditTags}
                  onChange={(tags) => setForm((f) => ({ ...f, auditTags: tags }))}
                />
              </div>
              <div>
                <FieldLabel>审核意见</FieldLabel>
                <textarea
                  rows={3}
                  value={form.auditComment}
                  onChange={(e) => setForm((f) => ({ ...f, auditComment: e.target.value }))}
                  placeholder="补充说明…"
                  className={`w-full resize-none rounded-md border px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 ${editFieldCls}`}
                />
              </div>
            </div>
          )}
          {mode === 'accept' && (
            <div className="space-y-4">
              <div>
                <FieldLabel>审核结果</FieldLabel>
                <div className={`min-h-8 rounded-md border px-3 py-2 text-sm ${readOnlyFieldCls}`}>
                  {form.auditResult ?? '—'}
                </div>
              </div>
              <div>
                <FieldLabel>审核标签</FieldLabel>
                <TagCheckboxDropdown value={form.auditTags} readOnly />
              </div>
              <div>
                <FieldLabel>审核意见</FieldLabel>
                <textarea
                  rows={3}
                  readOnly
                  value={form.auditComment}
                  className={`w-full resize-none rounded-md border px-3 py-2 text-sm outline-none ${readOnlyFieldCls}`}
                />
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 border-t border-gray-100 pt-5">
          <SectionTitle>验收结论</SectionTitle>
          {(mode === 'play' || mode === 'review') && <PendingHint>待验收</PendingHint>}
          {mode === 'accept' && (
            <div className="space-y-4">
              <div>
                <FieldLabel>验收结果</FieldLabel>
                <SegmentedControl
                  options={['通过', '不通过']}
                  value={form.acceptResult}
                  variantMap={{ 通过: 'pass', 不通过: 'fail' }}
                  onChange={(v) => setForm((f) => ({ ...f, acceptResult: v }))}
                />
              </div>
              <div>
                <FieldLabel>验收意见</FieldLabel>
                <textarea
                  rows={3}
                  value={form.acceptComment}
                  onChange={(e) => setForm((f) => ({ ...f, acceptComment: e.target.value }))}
                  placeholder="补充说明…"
                  className={`w-full resize-none rounded-md border px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 ${editFieldCls}`}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {showFooter && (
        <div className="shrink-0 border-t border-gray-100 p-4">
          <Button
            variant="primary"
            className="h-10 w-full text-sm font-medium"
            onClick={mode === 'review' ? onSubmitReview : onSubmitAccept}
          >
            {mode === 'review' ? '提交审核 →' : '提交验收 →'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function Workbench() {
  const { entryId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { canAccessRoute } = useAuth()
  const mode = parseMode(searchParams.get('mode'))

  const [entry, setEntry] = useState(() => getEntryById(entryId))
  const [currentFrame, setCurrentFrame] = useState(388)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [mainLayout, setMainLayout] = useState('A')

  const [form, setForm] = useState({
    auditResult: null,
    auditTags: [],
    auditComment: '',
    acceptResult: null,
    acceptComment: '',
  })

  const [actionSegments, setActionSegments] = useState([])
  const [regionFrames, setRegionFrames] = useState([])

  const taskEntries = useMemo(
    () => (entry ? getEntriesByTaskId(entry.taskId) : []),
    [entry?.taskId, entry?.dataStatus],
  )

  const currentIndex = taskEntries.findIndex((e) => e.id === entryId)

  const syncFromEntry = useCallback((e) => {
    if (!e) return
    setEntry(e)
    setForm({
      auditResult: e.auditResult ?? null,
      auditTags: e.auditTags ?? [],
      auditComment: e.auditComment ?? '',
      acceptResult: e.acceptResult ?? null,
      acceptComment: e.acceptComment ?? '',
    })
    setActionSegments(e.actionSegments ?? [])
    setRegionFrames(e.regionFrames ?? [])
    setCurrentFrame(Math.min(388, (e.totalFrames ?? 3140) - 1))
    setPlaying(false)
  }, [])

  useEffect(() => {
    syncFromEntry(getEntryById(entryId))
  }, [entryId, syncFromEntry])

  useEffect(() => {
    if (!playing || !entry) return
    const ms = 1000 / ((entry.fps ?? 30) * speed)
    const timer = setInterval(() => {
      setCurrentFrame((f) => {
        const max = (entry.totalFrames ?? 3140) - 1
        if (f >= max) {
          setPlaying(false)
          return max
        }
        return f + 1
      })
    }, ms)
    return () => clearInterval(timer)
  }, [playing, entry, speed])

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.code === 'Space' && ev.target.tagName !== 'TEXTAREA' && ev.target.tagName !== 'INPUT' && ev.target.tagName !== 'SELECT') {
        ev.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleBack = () => {
    window.close()
    if (entry?.taskId) navigate(`/collection/task/${entry.taskId}`)
  }

  const goSibling = (delta) => {
    const next = taskEntries[currentIndex + delta]
    if (next) navigate(`/review/${next.id}?mode=${mode}`)
  }

  const goNextAfterSubmit = () => {
    if (currentIndex < taskEntries.length - 1) {
      navigate(`/review/${taskEntries[currentIndex + 1].id}?mode=${mode}`)
    } else if (entry?.taskId) {
      navigate(`/collection/task/${entry.taskId}`)
    }
  }

  const handleSubmitReview = () => {
    if (!form.auditResult) return
    const dataStatus = form.auditResult === '通过' ? '已审核' : '审核不通过'
    syncFromEntry(updateEntry(entryId, {
      dataStatus,
      auditResult: form.auditResult,
      auditTags: form.auditTags,
      auditComment: form.auditComment,
      actionSegments,
      regionFrames,
    }))
    goNextAfterSubmit()
  }

  const handleSubmitAccept = () => {
    if (!form.acceptResult) return
    syncFromEntry(updateEntry(entryId, {
      dataStatus: form.acceptResult === '通过' ? '已验收' : '验收不通过',
      acceptResult: form.acceptResult,
      acceptComment: form.acceptComment,
    }))
    goNextAfterSubmit()
  }

  const totalFrames = entry?.totalFrames ?? 3140
  const signalSeries = useMemo(
    () => generateSignalSeries(totalFrames, actionSegments, entryId),
    [totalFrames, actionSegments, entryId],
  )

  if (!canAccessRoute('/review')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <NoPermission />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white text-gray-400">
        条目不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/collection/upload')}>返回采集条目</Button>
        </div>
      </div>
    )
  }

  const fps = entry.fps ?? 30
  const displayName = entry.displayName ?? `${entry.fileName}.h5`
  const maxFrame = totalFrames - 1
  const playPct = (currentFrame / Math.max(maxFrame, 1)) * 100

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex shrink-0 cursor-pointer items-center gap-0.5 text-sm text-gray-500 transition hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="sr-only">返回</span>
          </button>
          <span className="truncate font-mono text-sm text-gray-800">{displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => goSibling(-1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border-[0.5px] border-blue-500 bg-white px-3.5 py-1.5 text-sm text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-white disabled:text-gray-300 disabled:hover:bg-white"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            上一条
          </button>
          <button
            type="button"
            disabled={currentIndex < 0 || currentIndex >= taskEntries.length - 1}
            onClick={() => goSibling(1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border-[0.5px] border-blue-500 bg-white px-3.5 py-1.5 text-sm text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-white disabled:text-gray-300 disabled:hover:bg-white"
          >
            下一条
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="切换右侧面板"
            title="切换右侧面板"
            onClick={() => setPanelCollapsed((p) => !p)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-blue-600"
          >
            <IconLayoutSidebarRight className="ti-layout-sidebar-right h-[18px] w-[18px]" />
          </button>
          <LayoutToggle value={mainLayout} onChange={setMainLayout} />
          <button
            type="button"
            title="布局设置"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-blue-600"
            onClick={() => { /* TODO: 布局设置 */ }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 p-2.5">
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col gap-2 ${panelCollapsed ? '' : 'mr-2.5'}`}>
          {mainLayout === 'A' ? (
            <WorkbenchLayoutA
              playPct={playPct}
              signalSeries={signalSeries}
              totalFrames={totalFrames}
            />
          ) : (
            <WorkbenchLayoutB
              playPct={playPct}
              signalSeries={signalSeries}
              totalFrames={totalFrames}
            />
          )}

          <TimelinePanel
            totalFrames={totalFrames}
            fps={fps}
            currentFrame={currentFrame}
            onFrameChange={setCurrentFrame}
            actionSegments={actionSegments}
            regionFrames={regionFrames}
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            speed={speed}
            onSpeedChange={setSpeed}
            editable={mode === 'review'}
          />
        </div>

        {!panelCollapsed && (
          <div className="relative shrink-0 overflow-hidden" style={{ width: SIDE_PANEL_WIDTH }}>
            <AuditPanel
              mode={mode}
              entry={entry}
              form={form}
              setForm={setForm}
              onSubmitReview={handleSubmitReview}
              onSubmitAccept={handleSubmitAccept}
            />
          </div>
        )}
      </div>
    </div>
  )
}
