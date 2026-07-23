import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { useToast } from '../../components/common/Toast'
import {
  getEntryById,
  getEntriesByTaskId,
  updateEntry,
} from '../../mock/entries'
import { syncBatchesAfterEntryAccept } from '../../mock/samplingBatches'
import { useAuth } from '../../context/AuthContext'
import { nowDateTime } from '../../utils/formatDateTime'
import NoPermission from '../System/NoPermission'
import WorkbenchLayoutA from './components/WorkbenchLayoutA'
import WorkbenchLayoutB from './components/WorkbenchLayoutB'
import LayoutToggle from './components/LayoutToggle'
import WorkbenchSidePanel from './components/WorkbenchSidePanel'
import { normalizeAuditQuality } from './constants/workbenchTags'
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

const MODE_LABELS = {
  play: '播放',
  review: '标注',
  accept: '验收',
}

const SIDE_PANEL_WIDTH = 340

function buildPanelSnapshot(form, actionSegments, regionFrames) {
  return JSON.stringify({ form, actionSegments, regionFrames })
}

function IconLayoutSidebarRight({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16v16H4z" />
      <path d="M15 4v16" />
    </svg>
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

export default function Workbench() {
  const { entryId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { canAccessRoute, user } = useAuth()
  const { ToastNode, show: showToast } = useToast()
  const mode = parseMode(searchParams.get('mode'))
  const layoutPreviewName = searchParams.get('layoutPreview')
  const isLayoutPreview = Boolean(layoutPreviewName)

  const [entry, setEntry] = useState(() => getEntryById(entryId))
  const [currentFrame, setCurrentFrame] = useState(388)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [mainLayout, setMainLayout] = useState('B')

  const [form, setForm] = useState({
    auditConclusion: null,
    auditQuality: null,
    auditTags: [],
    auditComment: '',
    auditRejectReason: '',
  })

  const [actionSegments, setActionSegments] = useState([])
  const [regionFrames, setRegionFrames] = useState([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [acceptRejectOpen, setAcceptRejectOpen] = useState(false)
  const [acceptRejectReason, setAcceptRejectReason] = useState('')

  const taskEntries = useMemo(
    () => (entry ? getEntriesByTaskId(entry.taskId) : []),
    [entry?.taskId, entry?.dataStatus],
  )

  const currentIndex = taskEntries.findIndex((e) => e.id === entryId)

  const syncFromEntry = useCallback((e) => {
    if (!e) return
    setEntry(e)
    const nextForm = {
      auditConclusion: e.auditResult === '通过'
        ? 'pass'
        : e.auditResult === '不通过' || e.auditResult === '异常数据'
          ? 'reject'
          : null,
      auditQuality: normalizeAuditQuality(e.auditQuality),
      auditTags: e.auditTags ?? [],
      auditComment: e.auditComment ?? '',
      auditRejectReason: e.auditRejectReason
        ?? (e.auditResult && e.auditResult !== '通过' ? (e.auditComment ?? '') : ''),
    }
    const nextActions = e.actionSegments ?? []
    const nextRegions = e.regionFrames ?? []
    setForm(nextForm)
    setActionSegments(nextActions)
    setRegionFrames(nextRegions)
    setSavedSnapshot(buildPanelSnapshot(nextForm, nextActions, nextRegions))
    setCurrentFrame(Math.min(388, (e.totalFrames ?? 3140) - 1))
    setPlaying(false)
  }, [])

  useEffect(() => {
    let e = getEntryById(entryId)
    if (!e) {
      syncFromEntry(null)
      return
    }
    if (!isLayoutPreview) {
      if (mode === 'review' && ['已解析', '标注不通过'].includes(e.dataStatus) && !e.reviewClaimedBy) {
        e = updateEntry(entryId, {
          reviewClaimedBy: { nickname: user.nickname, id: user.uid },
          reviewClaimedAt: nowDateTime(),
        })
      }
      if (mode === 'accept' && ['已标注', '验收不通过'].includes(e.dataStatus) && !e.acceptClaimedBy) {
        e = updateEntry(entryId, {
          acceptClaimedBy: { nickname: user.nickname, id: user.uid },
          acceptClaimedAt: nowDateTime(),
        })
      }
    }
    syncFromEntry(e)
  }, [entryId, mode, isLayoutPreview, syncFromEntry, user.nickname, user.uid])

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

  const currentSnapshot = useMemo(
    () => buildPanelSnapshot(form, actionSegments, regionFrames),
    [form, actionSegments, regionFrames],
  )

  const isDirty = currentSnapshot !== savedSnapshot
  const saveDisabled = !isDirty

  const ensureReviewSaved = () => {
    if (isDirty) {
      showToast('请先保存标注')
      return false
    }
    return true
  }

  const handleSaveDraft = () => {
    if (mode !== 'review') return
    const updated = updateEntry(entryId, {
      auditQuality: form.auditQuality,
      auditTags: form.auditTags,
      auditComment: form.auditComment,
      auditRejectReason: form.auditRejectReason,
      actionSegments,
      regionFrames,
    })
    setEntry(updated)
    setSavedSnapshot(currentSnapshot)
    showToast('保存成功')
  }

  const handlePass = () => {
    if (mode === 'play' || isLayoutPreview) return
    if (mode === 'review') {
      if (!ensureReviewSaved()) return
      if (form.auditConclusion !== 'pass') {
        setForm((f) => ({ ...f, auditConclusion: 'pass' }))
      }
      if (!form.auditQuality) {
        showToast('请选择质量标签')
        return
      }
      syncFromEntry(updateEntry(entryId, {
        dataStatus: '已标注',
        auditResult: '通过',
        auditQuality: form.auditQuality,
        auditTags: form.auditTags,
        auditComment: form.auditComment,
        actionSegments,
        regionFrames,
        reviewClaimedBy: null,
        reviewClaimedAt: null,
        reviewTime: nowDateTime(),
      }))
      goNextAfterSubmit()
      return
    }
    if (mode === 'accept') {
      syncFromEntry(updateEntry(entryId, {
        dataStatus: '已验收',
        acceptResult: '通过',
        acceptClaimedBy: null,
        acceptClaimedAt: null,
        acceptTime: nowDateTime(),
      }))
      syncBatchesAfterEntryAccept(entryId, 'pass')
      goNextAfterSubmit()
    }
  }

  const handleAcceptRejectOpen = () => {
    if (mode !== 'accept' || isLayoutPreview) return
    setAcceptRejectReason('')
    setAcceptRejectOpen(true)
  }

  const handleAcceptRejectConfirm = () => {
    const reason = acceptRejectReason.trim()
    if (!reason) return
    syncFromEntry(updateEntry(entryId, {
      dataStatus: '验收不通过',
      acceptResult: '不通过',
      acceptComment: reason,
      acceptClaimedBy: null,
      acceptClaimedAt: null,
      acceptTime: nowDateTime(),
    }))
    syncBatchesAfterEntryAccept(entryId, 'reject')
    setAcceptRejectOpen(false)
    setAcceptRejectReason('')
    goNextAfterSubmit()
  }

  const handleReject = () => {
    if (mode === 'play' || isLayoutPreview || mode === 'accept') return
    if (mode === 'review') {
      if (!ensureReviewSaved()) return
      if (form.auditConclusion !== 'reject') {
        setForm((f) => ({ ...f, auditConclusion: 'reject' }))
      }
      const reason = form.auditRejectReason.trim()
      if (!reason) {
        showToast('请填写驳回理由')
        return
      }
      syncFromEntry(updateEntry(entryId, {
        dataStatus: '标注不通过',
        auditResult: '不通过',
        auditQuality: form.auditQuality,
        auditTags: form.auditTags,
        auditComment: form.auditComment,
        auditRejectReason: reason,
        actionSegments,
        regionFrames,
        reviewClaimedBy: null,
        reviewClaimedAt: null,
        reviewTime: nowDateTime(),
      }))
      goNextAfterSubmit()
      return
    }
  }

  const passRejectDisabled = mode === 'play' || isLayoutPreview

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
      <header className="relative flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-2.5">
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium text-gray-800">{MODE_LABELS[mode]}</span>
          <LayoutToggle value={mainLayout} onChange={setMainLayout} />
        </div>
        <div className="pointer-events-none absolute left-1/2 max-w-[min(520px,50vw)] -translate-x-1/2 truncate px-4 text-center">
          <span className="text-sm font-semibold text-gray-900">{displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLayoutPreview && (
            <>
              {mode === 'accept' && (
                <>
                  <button
                    type="button"
                    onClick={handlePass}
                    className="inline-flex cursor-pointer items-center rounded-md border-[0.5px] border-blue-500 bg-blue-600 px-3.5 py-1.5 text-sm text-white transition hover:bg-blue-700"
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptRejectOpen}
                    className="inline-flex cursor-pointer items-center rounded-md border-[0.5px] border-blue-500 bg-white px-3.5 py-1.5 text-sm text-blue-600 transition hover:bg-blue-50"
                  >
                    驳回
                  </button>
                </>
              )}
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
            </>
          )}
          <button
            type="button"
            aria-label="切换右侧面板"
            title="切换右侧面板"
            onClick={() => setPanelCollapsed((p) => !p)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-blue-600"
          >
            <IconLayoutSidebarRight className="ti-layout-sidebar-right h-[18px] w-[18px]" />
          </button>
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
            <WorkbenchSidePanel
              mode={isLayoutPreview ? 'play' : mode}
              entry={entry}
              form={form}
              setForm={setForm}
              actionSegments={actionSegments}
              setActionSegments={setActionSegments}
              regionFrames={regionFrames}
              setRegionFrames={setRegionFrames}
              onSeek={setCurrentFrame}
              onSave={handleSaveDraft}
              saveDisabled={saveDisabled}
              showSave={mode === 'review' && !isLayoutPreview}
              onPass={mode === 'review' ? handlePass : undefined}
              onReject={mode === 'review' ? handleReject : undefined}
              passRejectDisabled={passRejectDisabled}
            />
          </div>
        )}
      </div>

      {ToastNode}

      <Modal
        open={acceptRejectOpen}
        title="驳回理由"
        onCancel={() => {
          setAcceptRejectOpen(false)
          setAcceptRejectReason('')
        }}
        footer={(
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAcceptRejectOpen(false)
                setAcceptRejectReason('')
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              disabled={!acceptRejectReason.trim()}
              onClick={handleAcceptRejectConfirm}
            >
              确认
            </Button>
          </div>
        )}
        width={480}
      >
        <div>
          <label className="mb-2 block text-sm text-gray-600">
            驳回理由
            <span className="text-red-500"> *</span>
          </label>
          <textarea
            rows={4}
            value={acceptRejectReason}
            onChange={(e) => setAcceptRejectReason(e.target.value)}
            placeholder="请输入驳回理由"
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </Modal>
    </div>
  )
}
