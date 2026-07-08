import Button from './Button'
import { IconClose } from './Icons'

export default function Modal({
  open,
  title,
  children,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  width = 520,
  footer,
  fitViewport = false,
  viewportMaxHeight = '85vh',
  bodyClassName = '',
  zIndex = 50,
}) {
  if (!open) return null
  return (
    <div
      className={`fixed inset-0 bg-black/45 ${
        fitViewport
          ? 'flex items-center justify-center p-4'
          : 'flex items-start justify-center overflow-y-auto p-4 pt-24'
      }`}
      style={{ zIndex }}
    >
      <div
        className={`w-full rounded-lg bg-white shadow-xl ${fitViewport ? 'flex max-h-full flex-col' : ''}`}
        style={{
          maxWidth: width,
          ...(fitViewport ? { maxHeight: viewportMaxHeight } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button
            className="cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={onCancel}
          >
            <IconClose />
          </button>
        </div>
        <div
          className={`px-6 py-5 ${fitViewport ? 'min-h-0 flex-1 overflow-y-auto' : ''} ${bodyClassName}`}
        >
          {children}
        </div>
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
