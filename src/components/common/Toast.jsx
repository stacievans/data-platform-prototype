import { useCallback, useEffect, useState } from 'react'

function SuccessIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l4 4L19 7" />
      </svg>
    </span>
  )
}

/**
 * useToast — 轻量 Toast 提示 hook
 *
 * const { ToastNode, show } = useToast()
 * show('消息内容')   // 触发提示，duration ms 后自动消失
 * show('消息内容', { placement: 'top', variant: 'success' })
 * 在 JSX 里渲染 {ToastNode}
 */
export function useToast(duration = 2500) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const [placement, setPlacement] = useState('bottom')
  const [variant, setVariant] = useState('default')

  const show = useCallback((message, options = {}) => {
    setMsg(message)
    setPlacement(options.placement ?? 'bottom')
    setVariant(options.variant ?? 'default')
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [visible, duration])

  const positionClass = placement === 'top'
    ? 'top-6'
    : 'bottom-6'

  const styleClass = variant === 'success'
    ? 'flex items-center gap-2 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-lg'
    : 'bg-gray-800/95 px-5 py-2.5 text-sm text-white shadow-xl'

  const ToastNode = visible ? (
    <div className={`fixed ${positionClass} left-1/2 z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg ${styleClass} animate-fade-in`}>
      {variant === 'success' ? <SuccessIcon /> : null}
      {msg}
    </div>
  ) : null

  return { ToastNode, show }
}
