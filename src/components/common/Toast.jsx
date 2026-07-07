import { useCallback, useEffect, useState } from 'react'

/**
 * useToast — 轻量 Toast 提示 hook
 *
 * const { ToastNode, show } = useToast()
 * show('消息内容')   // 触发提示，duration ms 后自动消失
 * 在 JSX 里渲染 {ToastNode}
 */
export function useToast(duration = 2500) {
  const [msg, setMsg]         = useState('')
  const [visible, setVisible] = useState(false)

  const show = useCallback((message) => {
    setMsg(message)
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [visible, duration])

  const ToastNode = visible ? (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800/95 px-5 py-2.5 text-sm text-white shadow-xl animate-fade-in">
      {msg}
    </div>
  ) : null

  return { ToastNode, show }
}
