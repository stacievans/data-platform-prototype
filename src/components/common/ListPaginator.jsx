const pageBtnCls = (active) =>
  `rounded border px-2.5 py-1 transition-colors ${
    active
      ? 'border-blue-500 bg-blue-50 text-blue-600'
      : 'border-gray-200 hover:border-blue-400 hover:text-blue-600'
  }`

const navBtnCls = (disabled) =>
  `rounded border px-2 py-1 transition-colors ${
    disabled
      ? 'cursor-not-allowed border-gray-100 text-gray-300'
      : 'cursor-pointer border-gray-200 hover:border-blue-400 hover:text-blue-600'
  }`

export default function ListPaginator({
  total,
  page,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className={`flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 ${className}`}>
      <span>{pageSize} 条/页 · 共 {total} 条记录</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={navBtnCls(page <= 1)}
        >
          上一页
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={pageBtnCls(page === n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className={navBtnCls(page >= totalPages)}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
