import { useEffect, useMemo, useRef, useState } from 'react'
import { IconChevronDown } from './Icons'

const TRIGGER_CLS =
  'flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/**
 * @param {{ tree: { process: string, label: string, statuses: string[] }[], value: { process: string|null, status: string|null }, onChange, placeholder?, required? }} props
 */
export default function DataScopeCascader({
  tree,
  value,
  onChange,
  placeholder = '请选择',
  required = false,
}) {
  const [open, setOpen] = useState(false)
  const [hoverProcess, setHoverProcess] = useState(null)
  const rootRef = useRef(null)

  const displayText = useMemo(() => {
    if (!value?.process || !value?.status) return ''
    const node = tree.find((t) => t.process === value.process)
    if (!node) return ''
    return `${node.label}/${value.status}`
  }, [tree, value])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const current = value?.process ?? tree[0]?.process ?? null
    setHoverProcess(current)
  }, [open, tree, value?.process])

  const activeNode = tree.find((t) => t.process === hoverProcess) ?? tree[0]

  const pick = (process, status) => {
    onChange?.({ process, status })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={TRIGGER_CLS}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={displayText ? 'text-gray-800' : 'text-gray-400'}>
          {displayText || placeholder}
        </span>
        <IconChevronDown className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 flex overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <ul className="min-w-[140px] border-r border-gray-100 py-1">
            {tree.map((node) => {
              const active = hoverProcess === node.process
              return (
                <li key={node.process}>
                  <button
                    type="button"
                    className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm ${
                      active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoverProcess(node.process)}
                    onFocus={() => setHoverProcess(node.process)}
                  >
                    <span>{node.label}</span>
                    <span className="text-gray-400">›</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <ul className="min-w-[120px] py-1">
            {(activeNode?.statuses ?? []).map((status) => (
              <li key={status}>
                <button
                  type="button"
                  className={`w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 ${
                    value?.process === activeNode?.process && value?.status === status
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-700'
                  }`}
                  onClick={() => pick(activeNode.process, status)}
                >
                  {status}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
