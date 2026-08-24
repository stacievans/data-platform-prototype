import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDown } from './Icons'
import { nativeSelectChevronCls } from './SelectControl'

const COL_WIDTH = 140
const PROCESS_LABEL = '验收工序'

function ChevronRight() {
  return (
    <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * 工序 / 状态二级级联选择（样式对齐 SceneCascader）
 * value 为 status key；展示为「验收工序/xxx」
 */
export default function ProcessStatusCascader({
  statusOptions,
  value = null,
  onChange,
  disabled = false,
  placeholder = '请选择',
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: COL_WIDTH * 2 })
  const rootRef = useRef(null)
  const panelRef = useRef(null)

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    const hit = statusOptions.find((opt) => opt.key === value)
    return hit ? `${PROCESS_LABEL}/${hit.label}` : ''
  }, [statusOptions, value])

  const updateMenuPos = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelWidth = COL_WIDTH * 2
    let left = rect.left
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8)
    }
    setMenuPos({ top: rect.bottom + 4, left, width: panelWidth })
  }

  useEffect(() => {
    if (!open) return undefined
    updateMenuPos()
    const onDocClick = (e) => {
      if (rootRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onReposition = () => updateMenuPos()
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

  const commitSelection = (statusKey) => {
    onChange?.(statusKey)
    setOpen(false)
  }

  const panel = open && !disabled ? createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
      className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <div className="flex">
        <div
          className="shrink-0 overflow-y-auto border-r border-gray-100"
          style={{ width: COL_WIDTH, maxHeight: 240 }}
        >
          <button
            type="button"
            className="w-full cursor-default bg-blue-50 px-2.5 py-2 text-left text-sm font-medium text-blue-700"
          >
            <span className="inline-flex max-w-full items-center gap-0.5">
              <span className="truncate">{PROCESS_LABEL}</span>
              <ChevronRight />
            </span>
          </button>
        </div>
        <div className="shrink-0 overflow-y-auto" style={{ width: COL_WIDTH, maxHeight: 240 }}>
          {statusOptions.map((opt) => {
            const active = opt.key === value
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => commitSelection(opt.key)}
                className={`w-full cursor-pointer px-2.5 py-2 text-left text-sm transition ${
                  active ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
        className={`relative flex h-9 w-full items-center rounded-md border bg-white px-3 text-left text-sm outline-none transition focus:ring-2 ${nativeSelectChevronCls} ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
            : open
              ? 'cursor-pointer border-blue-500 ring-2 ring-blue-100'
              : 'cursor-pointer border-gray-200 focus:border-blue-400 focus:ring-blue-100'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedLabel ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-400">
          <IconChevronDown className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </span>
      </button>
      {panel}
    </div>
  )
}
