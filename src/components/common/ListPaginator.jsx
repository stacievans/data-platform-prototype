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

const SIBLING_COUNT = 2
const FULL_EXPAND_THRESHOLD = 7

/** 生成页码序列：数字为页码，'ellipsis' 为不可点击省略号 */
export function buildPageItems(current, totalPages) {
  if (totalPages <= FULL_EXPAND_THRESHOLD) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items = [1]
  const left = Math.max(2, current - SIBLING_COUNT)
  const right = Math.min(totalPages - 1, current + SIBLING_COUNT)

  if (left > 2) {
    items.push('ellipsis')
  } else {
    for (let n = 2; n < left; n += 1) items.push(n)
  }

  for (let n = left; n <= right; n += 1) items.push(n)

  if (right < totalPages - 1) {
    items.push('ellipsis')
  } else {
    for (let n = right + 1; n < totalPages; n += 1) items.push(n)
  }

  items.push(totalPages)
  return items
}

export default function ListPaginator({
  total,
  page,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = buildPageItems(page, totalPages)

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
        {pageItems.map((item, index) => (
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-gray-400 select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={pageBtnCls(page === item)}
            >
              {item}
            </button>
          )
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
