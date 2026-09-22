import { useMemo, useState } from 'react'
import Badge from '../../components/common/Badge'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import { Select } from '../../components/common/FormField'
import Button from '../../components/common/Button'
import { getProjectActivities } from '../../mock/projectActivities'
import { dtCol } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'

/* ── 活动类型 → badge 颜色 ── */
const TYPE_COLOR_MAP = {
  '批量创建批次任务': 'purple',
  '添加数据': 'cyan',
  '分配人员': 'blue',
  '预标注结果导入': 'orange',
  '批量流转': 'green',
}

function progressBadge(progress) {
  if (progress === '进行中') return <Badge color="blue">{progress}</Badge>
  if (progress === '完成') return <Badge color="green">{progress}</Badge>
  if (progress === '失败') return <Badge color="red">{progress}</Badge>
  return <span className="text-gray-500">{progress ?? '—'}</span>
}

/* ── 详情弹窗内容 ── */
function ActivityDetailContent({ row }) {
  const { type, detail } = row

  if (type === '批量流转') {
    return (
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">流转条目数：</span>
          <span className="font-medium">{detail.transferredCount} 条</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">状态变更：</span>
          <Badge color="blue">{detail.fromStatus}</Badge>
          <span className="text-gray-400">→</span>
          <Badge color="green">{detail.toStatus}</Badge>
        </div>
      </div>
    )
  }

  if (type === '分配人员') {
    return (
      <div className="space-y-3 text-sm text-gray-700">
        <p className="text-gray-500">分配了以下人员：</p>
        <div className="space-y-1.5">
          {detail.assignments.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-medium">{a.name}</span>
              <Badge color="blue">{a.role}</Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === '添加数据') {
    return (
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">新增条目：</span>
          <span className="font-medium">{detail.addedCount} 条</span>
        </div>
      </div>
    )
  }

  if (type === '预标注结果导入') {
    return (
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">成功：</span>
          <Badge color="green">{detail.successCount} 条</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">失败：</span>
          <Badge color="red">{detail.failCount} 条</Badge>
        </div>
      </div>
    )
  }

  if (type === '批量创建批次任务') {
    return (
      <div className="space-y-3 text-sm text-gray-700">
        <p className="text-gray-500">创建了以下批次任务：</p>
        <ul className="space-y-1.5">
          {detail.createdTasks.map((t, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="font-mono text-sm">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <span className="text-gray-400">暂无详情</span>
}

/* ── ⓘ 图标 ── */
function IconInfo() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 9.5v5" />
      <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function ActivityLogTab({ projectId }) {
  const allRows = useMemo(() => getProjectActivities(projectId), [projectId])

  /* ── 检索栏状态 ── */
  const [filterType, setFilterType] = useState('')
  const [filterProgress, setFilterProgress] = useState('')
  const [filterExecutor, setFilterExecutor] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ type: '', progress: '', executor: '' })

  /* ── 详情弹窗 ── */
  const [detailRow, setDetailRow] = useState(null)

  const executors = useMemo(() => {
    const set = new Set(allRows.map((r) => r.executor).filter(Boolean))
    return [...set]
  }, [allRows])

  const rows = useMemo(() => {
    const { type, progress, executor } = appliedFilters
    return allRows.filter((r) => {
      if (type && r.type !== type) return false
      if (progress && r.progress !== progress) return false
      if (executor && r.executor !== executor) return false
      return true
    })
  }, [allRows, appliedFilters])

  const handleQuery = () => {
    setAppliedFilters({ type: filterType, progress: filterProgress, executor: filterExecutor })
  }

  const handleReset = () => {
    setFilterType('')
    setFilterProgress('')
    setFilterExecutor('')
    setAppliedFilters({ type: '', progress: '', executor: '' })
  }

  const columns = useMemo(() => [
    {
      title: '活动ID',
      key: 'id',
      dataIndex: 'id',
      render: (v) => <span className="font-mono text-sm text-gray-800">{v}</span>,
    },
    {
      title: (
        <span className="inline-flex items-center gap-1">
          活动类型
          <span
            className="group relative inline-flex cursor-help text-gray-400"
            title="点击查看详情"
          >
            <IconInfo />
          </span>
        </span>
      ),
      key: 'type',
      dataIndex: 'type',
      render: (v, row) => (
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent p-0"
          onClick={() => setDetailRow(row)}
        >
          <Badge color={TYPE_COLOR_MAP[v] ?? 'gray'}>{v}</Badge>
        </button>
      ),
    },
    {
      title: '关联任务',
      key: 'relatedTask',
      dataIndex: 'relatedTask',
      render: (v) => <span className="text-sm text-gray-700">{v || '—'}</span>,
    },
    {
      title: '活动进度',
      key: 'progress',
      dataIndex: 'progress',
      render: (v) => progressBadge(v),
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '执行人',
      key: 'executor',
      dataIndex: 'executor',
      render: (v) => <span className="text-gray-700">{v || '—'}</span>,
    },
  ], [])

  return (
    <ListPageCard>
      <ListPageToolbar>
        <h2 className="text-base font-semibold text-gray-800">活动记录</h2>
      </ListPageToolbar>

      {/* ── 检索栏 ── */}
      <ListPageFilter>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-gray-500">活动类型</label>
            <Select
              className={nativeSelectChevronCls}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: '', label: '全部' },
                ...['批量创建批次任务', '添加数据', '分配人员', '预标注结果导入', '批量流转'].map(
                  (t) => ({ value: t, label: t }),
                ),
              ]}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-gray-500">活动进度</label>
            <Select
              className={nativeSelectChevronCls}
              value={filterProgress}
              onChange={(e) => setFilterProgress(e.target.value)}
              options={[
                { value: '', label: '全部' },
                { value: '进行中', label: '进行中' },
                { value: '完成', label: '完成' },
                { value: '失败', label: '失败' },
              ]}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-gray-500">执行人</label>
            <Select
              className={nativeSelectChevronCls}
              value={filterExecutor}
              onChange={(e) => setFilterExecutor(e.target.value)}
              options={[
                { value: '', label: '全部' },
                ...executors.map((e) => ({ value: e, label: e })),
              ]}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={handleReset}>重置</Button>
            <Button variant="primary" onClick={handleQuery}>查询</Button>
          </div>
        </div>
      </ListPageFilter>

      <Table
        embedded
        columns={columns}
        dataSource={rows}
        pageSize={LIST_PAGE_SIZE}
        emptyText="暂无活动记录"
      />

      {/* ── 详情弹窗 ── */}
      <Modal
        open={!!detailRow}
        title={detailRow?.type ? `${detailRow.type} - 详情` : '活动详情'}
        width={440}
        onCancel={() => setDetailRow(null)}
        footer={null}
      >
        {detailRow && <ActivityDetailContent row={detailRow} />}
      </Modal>
    </ListPageCard>
  )
}
