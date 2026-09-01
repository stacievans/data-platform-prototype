import { useCallback, useEffect, useState } from 'react'

function ToastIcon({ variant }) {
  if (variant === 'success') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l4 4L19 7" />
        </svg>
      </span>
    )
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 ring-1 ring-blue-100">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </span>
  )
}

const VARIANT_CLASS = {
  default: 'border-slate-200/90 bg-white/95 text-slate-700',
  success: 'border-emerald-200/80 bg-emerald-50/90 text-slate-700',
}

/**
 * useToast — 轻量 Toast 提示 hook
 *
 * const { ToastNode, show } = useToast()
 * show('消息内容')   // 默认顶部水平居中
 * show('消息内容', { variant: 'success' })  // 浅色成功样式
 * 在 JSX 里渲染 {ToastNode}
 */
export function useToast(duration = 2500) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const [variant, setVariant] = useState('default')

  const show = useCallback((message, options = {}) => {
    setMsg(message)
    setVariant(options.variant ?? 'default')
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [visible, duration])

  const ToastNode = visible ? (
    <div className="pointer-events-none fixed top-6 left-0 right-0 z-[100] flex justify-center">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-[min(90vw,28rem)] animate-toast-in-top items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.default}`}
      >
        <ToastIcon variant={variant} />
        <span className="leading-5">{msg}</span>
      </div>
    </div>
  ) : null

  return { ToastNode, show }
}
