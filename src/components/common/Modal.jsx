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
  /** 与 fitViewport 联用：固定弹窗面板高度（宽+高不随内容变化） */
  panelHeight,
  bodyClassName = '',
  zIndex = 50,
  /** center：居中；nested：相对居中向右下偏移，用于二级弹窗 */
  align = 'center',
  offsetX = 40,
  offsetY = 40,
}) {
  if (!open) return null
  const nested = align === 'nested'
  const fixedPanel = fitViewport || Boolean(panelHeight)
  const resolvedHeight = panelHeight ?? (fitViewport ? viewportMaxHeight : undefined)
  return (
    <div
      className={`fixed inset-0 bg-black/45 ${
        fixedPanel || nested
          ? 'flex items-center justify-center p-4'
          : 'flex items-start justify-center overflow-y-auto p-4 pt-24'
      }`}
      style={{ zIndex }}
    >
      <div
        className={`w-full rounded-lg bg-white shadow-xl ${fixedPanel ? 'flex max-h-full flex-col' : ''}`}
        style={{
          maxWidth: width,
          ...(resolvedHeight
            ? {
                height: resolvedHeight,
                minHeight: resolvedHeight,
                maxHeight: resolvedHeight,
              }
            : {}),
          ...(nested ? { transform: `translate(${offsetX}px, ${offsetY}px)` } : {}),
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
          className={`px-6 py-5 ${fixedPanel ? 'min-h-0 flex-1 overflow-y-auto' : ''} ${bodyClassName}`}
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
