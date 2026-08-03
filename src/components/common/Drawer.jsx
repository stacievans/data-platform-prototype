import Button from './Button'
import { IconClose } from './Icons'

const MAIN_THIRD_WIDTH = 'calc((100vw - var(--layout-sidebar-width, 13rem)) / 3)'

export default function Drawer({
  open,
  title,
  children,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  width = MAIN_THIRD_WIDTH,
  footer,
  zIndex = 50,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/45" onClick={onCancel} aria-hidden />
      <div
        className="absolute right-0 top-0 flex h-full flex-col bg-white shadow-xl transition-[width] duration-200"
        style={{ width, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0 flex-1 text-base font-semibold text-gray-800">{title}</div>
          <button
            type="button"
            className="cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={onCancel}
            aria-label="关闭"
          >
            <IconClose />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer !== null && (
          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-3.5">
            {footer || (
              <>
                <Button onClick={onCancel}>{cancelText}</Button>
                <Button variant="primary" onClick={onOk}>
                  {okText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
