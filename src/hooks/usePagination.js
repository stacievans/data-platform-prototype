import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const LIST_PAGE_SIZE = 10

export function usePagination(items, { pageSize: initialPageSize = LIST_PAGE_SIZE, resetKey } = {}) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return { page, setPage, pageItems, total, totalPages, pageSize, setPageSize }
}
