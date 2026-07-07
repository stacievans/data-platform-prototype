import { useEffect, useMemo, useState } from 'react'

export default function Table({ columns, dataSource, rowKey = 'id', pageSize }) {
  const [page, setPage] = useState(1)
  const paginated = Boolean(pageSize)
  const total = dataSource.length
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1

  useEffect(() => {
    setPage(1)
  }, [total, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rows = useMemo(() => {
    if (!paginated) return dataSource
    const start = (page - 1) * pageSize
    return dataSource.slice(start, start + pageSize)
  }, [dataSource, page, pageSize, paginated])

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

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="bg-gray-50 text-center text-gray-600">
            {columns.map((col) => (
              <th
                key={col.key || col.dataIndex}
                className="whitespace-nowrap px-4 py-3 text-center font-medium"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400"
              >
                暂无数据
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row[rowKey] ?? i}
                className={`border-t border-gray-100 transition-colors hover:bg-blue-50/50 ${
                  i % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'
                }`}
              >
                {columns.map((col) => {
                  const value = col.render
                    ? col.render(row[col.dataIndex], row)
                    : row[col.dataIndex] ?? '-'
                  return (
                    <td
                      key={col.key || col.dataIndex}
                      className={`px-4 py-3 text-center text-gray-700 ${col.wrap ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                    >
                      <div className={`flex items-center justify-center ${col.wrap ? 'whitespace-normal' : 'whitespace-nowrap'}`}>
                        {value}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        <span>共 {total} 条记录</span>
        {paginated && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={navBtnCls(page <= 1)}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={pageBtnCls(page === n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={navBtnCls(page >= totalPages)}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
