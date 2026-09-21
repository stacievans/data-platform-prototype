import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import ListPageCard from '../../components/common/ListPageCard'
import ListPaginator from '../../components/common/ListPaginator'
import { IconDownload } from '../../components/common/Icons'
import { getBatchTasksByProjectId } from '../../mock/batchTasks'
import {
  getProjectPerformanceStats,
  sumPerformanceRows,
} from '../../mock/projectPerformance'

const PAGE_SIZE = 10
const ROW_LABEL_CLS = 'shrink-0 text-sm text-gray-500'

const PERFORMANCE_PROCESS_TABS = [
  { key: 'collect', label: '采集' },
  { key: 'review', label: '标注' },
  { key: 'accept', label: '验收' },
]

const INPUT_CLS =
  'h-9 min-w-[200px] rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function ProcessTabBar({ activeKey, onChange }) {
  return (
    <div className="flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
      {PERFORMANCE_PROCESS_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeKey === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function numCell(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(1)
  return v
}

function StatsTable({ columns, rows, numericKeys }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const summary = useMemo(() => sumPerformanceRows(rows, numericKeys), [rows, numericKeys])

  useEffect(() => {
    setPage(1)
  }, [rows])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section>
      <div className="overflow-x-auto rounded-md border border-gray-100">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-center text-gray-600">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100 bg-blue-50/60 font-medium text-gray-800">
              <td colSpan={2} className="whitespace-nowrap px-4 py-3 text-center">
                总计
              </td>
              {columns.slice(2).map((col) => {
                const value = col.render
                  ? col.render(summary[col.dataIndex], summary)
                  : summary[col.dataIndex] ?? '—'
                return (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center">
                    {value}
                  </td>
                )
              })}
            </tr>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={`border-t border-gray-100 hover:bg-blue-50/50 ${i % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}`}
                >
                  {columns.map((col) => {
                    const value = col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex] ?? '—'
                    return (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center text-gray-700">
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <ListPaginator
          className="border-gray-100 px-0"
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </section>
  )
}

function escapeCsvCell(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsv(columns, rows, numericKeys) {
  const header = columns.map((c) => escapeCsvCell(c.title)).join(',')
  const summary = sumPerformanceRows(rows, numericKeys)
  const summaryLine = columns.map((c, i) => {
    if (i === 0) return escapeCsvCell('总计')
    if (i === 1) return ''
    return escapeCsvCell(summary[c.dataIndex])
  }).join(',')
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.dataIndex])).join(',')).join('\n')
  return [header, summaryLine, body].filter(Boolean).join('\n')
}

function downloadPerformanceCsv({ scopeLabel, collect, review, accept, collectCols, reviewCols, acceptCols }) {
  const sections = [
    ['采集表', rowsToCsv(collectCols, collect.rows, collect.numericKeys)],
    ['标注表', rowsToCsv(reviewCols, review.rows, review.numericKeys)],
    ['验收表', rowsToCsv(acceptCols, accept.rows, accept.numericKeys)],
  ]
  const content = `\ufeff${scopeLabel}\n\n${sections.map(([name, csv]) => `${name}\n${csv}`).join('\n\n')}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `绩效统计_${scopeLabel.replace(/\//g, '_')}_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const COLLECT_COLS = [
  { title: '用户名', key: 'username', dataIndex: 'username' },
  { title: '昵称', key: 'nickname', dataIndex: 'nickname' },
  { title: '采集总条数', key: 'collectTotalCount', dataIndex: 'collectTotalCount', render: numCell },
  { title: '采集总时长', key: 'collectTotalDuration', dataIndex: 'collectTotalDuration', render: numCell },
  { title: '验收通过数', key: 'acceptPassCount', dataIndex: 'acceptPassCount', render: numCell },
  { title: '验收通过总时长', key: 'acceptPassDuration', dataIndex: 'acceptPassDuration', render: numCell },
]
const COLLECT_NUM_KEYS = ['collectTotalCount', 'collectTotalDuration', 'acceptPassCount', 'acceptPassDuration']

const REVIEW_COLS = [
  { title: '用户名', key: 'username', dataIndex: 'username' },
  { title: '昵称', key: 'nickname', dataIndex: 'nickname' },
  { title: '标注总条数', key: 'reviewTotalCount', dataIndex: 'reviewTotalCount', render: numCell },
  { title: '标注总时长', key: 'reviewTotalDuration', dataIndex: 'reviewTotalDuration', render: numCell },
  { title: '标注总标签数', key: 'reviewTotalTags', dataIndex: 'reviewTotalTags', render: numCell },
  { title: '标注总阶段数', key: 'reviewTotalStages', dataIndex: 'reviewTotalStages', render: numCell },
  { title: '验收通过总条数', key: 'acceptPassTotalCount', dataIndex: 'acceptPassTotalCount', render: numCell },
  { title: '验收通过总时长', key: 'acceptPassTotalDuration', dataIndex: 'acceptPassTotalDuration', render: numCell },
  { title: '验收通过总标签数', key: 'acceptPassTotalTags', dataIndex: 'acceptPassTotalTags', render: numCell },
  { title: '验收通过总阶段数', key: 'acceptPassTotalStages', dataIndex: 'acceptPassTotalStages', render: numCell },
]
const REVIEW_NUM_KEYS = [
  'reviewTotalCount', 'reviewTotalDuration', 'reviewTotalTags', 'reviewTotalStages',
  'acceptPassTotalCount', 'acceptPassTotalDuration', 'acceptPassTotalTags', 'acceptPassTotalStages',
]

const ACCEPT_COLS = [
  { title: '用户名', key: 'username', dataIndex: 'username' },
  { title: '昵称', key: 'nickname', dataIndex: 'nickname' },
  { title: '验收总条数', key: 'acceptTotalCount', dataIndex: 'acceptTotalCount', render: numCell },
  { title: '验收总时长', key: 'acceptTotalDuration', dataIndex: 'acceptTotalDuration', render: numCell },
  { title: '验收总标签数', key: 'acceptTotalTags', dataIndex: 'acceptTotalTags', render: numCell },
  { title: '验收总阶段数', key: 'acceptTotalStages', dataIndex: 'acceptTotalStages', render: numCell },
  { title: '验收通过总条数', key: 'acceptPassTotalCount', dataIndex: 'acceptPassTotalCount', render: numCell },
  { title: '验收通过总时长', key: 'acceptPassTotalDuration', dataIndex: 'acceptPassTotalDuration', render: numCell },
  { title: '验收通过总标签数', key: 'acceptPassTotalTags', dataIndex: 'acceptPassTotalTags', render: numCell },
  { title: '验收通过总阶段数', key: 'acceptPassTotalStages', dataIndex: 'acceptPassTotalStages', render: numCell },
]
const ACCEPT_NUM_KEYS = [
  'acceptTotalCount', 'acceptTotalDuration', 'acceptTotalTags', 'acceptTotalStages',
  'acceptPassTotalCount', 'acceptPassTotalDuration', 'acceptPassTotalTags', 'acceptPassTotalStages',
]

const TABLE_BY_PROCESS = {
  collect: { columns: COLLECT_COLS, numericKeys: COLLECT_NUM_KEYS, rowsKey: 'collect' },
  review: { columns: REVIEW_COLS, numericKeys: REVIEW_NUM_KEYS, rowsKey: 'review' },
  accept: { columns: ACCEPT_COLS, numericKeys: ACCEPT_NUM_KEYS, rowsKey: 'accept' },
}

export default function PerformanceStatsTab({ projectId }) {
  const [processTab, setProcessTab] = useState('collect')
  const [batchId, setBatchId] = useState('')

  const batches = useMemo(
    () => getBatchTasksByProjectId(projectId).filter((b) => !b.deleted),
    [projectId],
  )

  const stats = useMemo(
    () => getProjectPerformanceStats(projectId, batchId || null),
    [projectId, batchId],
  )

  const activeTable = TABLE_BY_PROCESS[processTab] ?? TABLE_BY_PROCESS.collect
  const activeRows = stats[activeTable.rowsKey] ?? []

  const scopeLabel = useMemo(() => {
    if (!batchId) return '项目整体'
    const batch = batches.find((b) => b.id === batchId)
    return batch ? `${batch.name}(${batch.id})` : '任务批次'
  }, [batchId, batches])

  const handleExport = () => {
    downloadPerformanceCsv({
      scopeLabel,
      collect: { rows: stats.collect, numericKeys: COLLECT_NUM_KEYS },
      review: { rows: stats.review, numericKeys: REVIEW_NUM_KEYS },
      accept: { rows: stats.accept, numericKeys: ACCEPT_NUM_KEYS },
      collectCols: COLLECT_COLS,
      reviewCols: REVIEW_COLS,
      acceptCols: ACCEPT_COLS,
    })
  }

  return (
    <ListPageCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={ROW_LABEL_CLS}>工序</span>
          <ProcessTabBar activeKey={processTab} onChange={setProcessTab} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">任务批次</span>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className={`${INPUT_CLS} cursor-pointer`}
            >
              <option value="">全部</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}（{b.id}）</option>
              ))}
            </select>
          </div>
          <Button icon={<IconDownload />} onClick={handleExport}>
            导出 CSV
          </Button>
        </div>
      </div>

      <div className="px-4 py-5">
        <StatsTable
          key={processTab}
          columns={activeTable.columns}
          rows={activeRows}
          numericKeys={activeTable.numericKeys}
        />
      </div>
    </ListPageCard>
  )
}
