import { useEffect, useRef, useState } from 'react'
import release from '../../release'

export default function VersionInfo({ collapsed }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const label = collapsed
    ? `v${release.version}`
    : `v${release.version} (${release.date})`

  return (
    <div ref={rootRef} className="relative shrink-0 border-t border-slate-800/80 px-2.5 py-2">
      {open && (
        <div
          className="absolute bottom-full left-2.5 right-2.5 mb-2 rounded-md border border-slate-700 bg-slate-800 p-3 text-xs leading-relaxed text-slate-300 shadow-lg"
          role="dialog"
          aria-label="当前版本更新说明"
        >
          <p className="mb-1 text-slate-500">本版更新</p>
          <p>{release.summary}</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? `v${release.version} (${release.date})` : release.summary}
        className="w-full cursor-pointer truncate text-left text-[11px] text-slate-500 transition-colors hover:text-slate-400"
        aria-expanded={open}
      >
        {label}
      </button>
    </div>
  )
}
