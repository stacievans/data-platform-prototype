import { useEffect, useMemo, useState } from 'react'
import ListPaginator from './ListPaginator'

export default function Table({
  columns,
  dataSource,
  rowKey = 'id',
  pageSize,
  pageResetKey,
  scrollVisibleRows,
  bodyRowHeight = 48,
}) {
  const [page, setPage] = useState(1)
  const scrollable = scrollVisibleRows != null && scrollVisibleRows > 0
  const paginated = Boolean(pageSize)
  const total = dataSource.length
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1

  useEffect(() => {
    setPage(1)
  }, [total, pageSize, scrollVisibleRows, pageResetKey])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rows = useMemo(() => {
    if (!paginated) return dataSource
    const start = (page - 1) * pageSize
    return dataSource.slice(start, start + pageSize)
  }, [dataSource, page, pageSize, paginated])

  const theadHeight = 44
  const scrollMaxHeight = scrollable
    ? theadHeight + scrollVisibleRows * bodyRowHeight
    : undefined

  const tableBody = (
    <>
      <thead className={scrollable ? 'sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_#e5e7eb]' : undefined}>
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
    </>
  )

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        {scrollable ? (
          <div className="overflow-y-auto" style={{ maxHeight: scrollMaxHeight }}>
            <table className="w-full min-w-max text-sm">
              {tableBody}
            </table>
          </div>
        ) : (
          <table className="w-full min-w-max text-sm">
            {tableBody}
          </table>
        )}
      </div>
      {paginated ? (
        <ListPaginator total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
      ) : (
        <div className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
          共 {total} 条记录
        </div>
      )}
    </div>
  )
}
