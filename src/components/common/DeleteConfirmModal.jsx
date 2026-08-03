function IconWarningCircle(props) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="11" fill="#FAAD14" />
      <path d="M11 6.5V11.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="11" cy="15" r="0.95" fill="white" />
    </svg>
  )
}

/** 删除二次确认弹窗（项目 / 任务 / 条目） */
export default function DeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  message = '确定要删除吗？',
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-[416px] rounded-lg bg-white shadow-2xl">
        <div className="px-6 pb-2 pt-6">
          <div className="flex items-start gap-3">
            <IconWarningCircle className="mt-0.5 h-[22px] w-[22px] shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-6 text-gray-800">提示</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-md border border-transparent bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
