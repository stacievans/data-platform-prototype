import { SelectChevronWrap, nativeSelectChevronCls } from './SelectControl'
import { PAGE_SIZE_OPTIONS } from '../../hooks/usePagination'

const pageBtnCls = (active) =>
  `min-w-[28px] rounded border px-2 py-1 transition-colors ${
    active
      ? 'border-blue-500 bg-white text-blue-600'
      : 'border-transparent bg-transparent text-gray-600 hover:text-blue-600'
  }`

const navBtnCls = (disabled) =>
  `rounded border px-2 py-1 transition-colors ${
    disabled
      ? 'cursor-not-allowed border-transparent text-gray-300'
      : 'cursor-pointer border-transparent text-gray-500 hover:text-blue-600'
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

function formatRange(page, pageSize, total) {
  if (total <= 0) return { start: 0, end: 0 }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return { start, end }
}

export default function ListPaginator({
  total,
  page,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = buildPageItems(page, totalPages)
  const { start, end } = formatRange(page, pageSize, total)

  const handlePageSizeChange = (next) => {
    const size = Number(next)
    if (!pageSizeOptions.includes(size)) return
    onPageSizeChange?.(size)
    onPageChange(1)
  }

  return (
    <div className={`flex justify-end border-t border-gray-100 px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="whitespace-nowrap text-gray-600">
          第 {start}-{end} 条/总共 {total} 条
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={navBtnCls(page <= 1)}
            aria-label="上一页"
          >
            &lt;
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
            aria-label="下一页"
          >
            &gt;
          </button>
        </div>

        {onPageSizeChange && (
          <SelectChevronWrap>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className={`h-7 cursor-pointer rounded border border-gray-200 bg-white pl-2 text-xs text-gray-600 outline-none transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${nativeSelectChevronCls}`}
              aria-label="每页条数"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size} 条/页</option>
              ))}
            </select>
          </SelectChevronWrap>
        )}
      </div>
    </div>
  )
}
