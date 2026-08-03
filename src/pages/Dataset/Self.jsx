import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar, ListPageBody } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import { IconGrid, IconList, IconPlus, IconSearch } from '../../components/common/Icons'
import { PermButton, PermMenuItem } from '../../components/common/PermissionAction'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { selfDatasets as initialDatasets, prependSelfDataset } from '../../mock/datasets'
import { getDatasetListStats, matchesDatasetListFilter } from '../../utils/datasetMetrics'
import CreateDatasetModal from './CreateDatasetModal'
import { dtCol, formatDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FILTER_GRID = 'flex min-w-0 flex-1 flex-wrap items-end gap-3'
const FILTER_FIELD = 'min-w-0 flex-1 basis-40'

/* ── 卡片三点菜单 ── */
function CardMenu({ onViewDetail, onDeleteClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const close = (fn) => () => { setOpen(false); fn() }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <circle cx="8" cy="3" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 w-28 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
          <button type="button" onClick={close(onViewDetail)} className="w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">详情</button>
          <PermMenuItem permission="dataset.self.delete" label="删除" onClick={close(onDeleteClick)} danger />
        </div>
      )}
    </div>
  )
}

/* ── 删除确认弹窗 ── */
function DeleteConfirmModal({ dataset, open, onCancel, onConfirm }) {
  if (!open || !dataset) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-600">删除数据集</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">
            确定删除数据集「<strong className="text-gray-800">{dataset.name}</strong>」？此操作不可逆。
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelfDataset() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState(initialDatasets)
  const [qName, setQName] = useState('')
  const [qProjectName, setQProjectName] = useState('')
  const [qTaskName, setQTaskName] = useState('')
  const [filters, setFilters] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [view, setView] = useState('card')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(
    () => datasets.filter((d) => matchesDatasetListFilter(d, filters)),
    [datasets, filters],
  )

  const pageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const applyFilters = () => setFilters({
    name: qName.trim(),
    projectName: qProjectName.trim(),
    taskName: qTaskName.trim(),
  })

  const resetFilters = () => {
    setQName('')
    setQProjectName('')
    setQTaskName('')
    setFilters({})
  }

  const confirmDelete = () => {
    setDatasets((list) => list.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    {
      title: '数据集名称',
      dataIndex: 'name',
      render: (v, row) => (
        <button
          type="button"
          onClick={() => navigate(`/dataset/self/${row.id}`)}
          className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-500"
        >
          {v}
        </button>
      ),
    },
    {
      title: '关联项目数',
      key: 'projectCount',
      render: (_, row) => getDatasetListStats(row).projectCount,
    },
    {
      title: '关联任务数',
      key: 'taskCount',
      render: (_, row) => getDatasetListStats(row).taskCount,
    },
    {
      title: '条目数量',
      key: 'entryCount',
      render: (_, row) => getDatasetListStats(row).entryCount.toLocaleString(),
    },
    { title: '总数据量', dataIndex: 'totalSize' },
    { title: '总时长', dataIndex: 'totalDuration', render: (v) => v ?? '—' },
    { title: '创建人', dataIndex: 'createdBy' },
    dtCol('创建时间', 'createdAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="link" size="sm" onClick={() => navigate(`/dataset/self/${row.id}`)}>详情</Button>
          <PermButton permission="dataset.self.delete" mode="disable" variant="linkDanger" size="sm" onClick={() => setDeleteTarget(row)}>删除</PermButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <ListPageCard>
        <ListPageFilter>
        <div className="flex flex-wrap items-end gap-3">
          <div className={FILTER_GRID}>
            <div className={FILTER_FIELD}>
              <label className={LBL}>数据集名称</label>
              <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="请输入数据集名称" className={INPUT_CLS} />
            </div>
            <div className={FILTER_FIELD}>
              <label className={LBL}>项目名称</label>
              <input value={qProjectName} onChange={(e) => setQProjectName(e.target.value)} placeholder="请输入项目名称" className={INPUT_CLS} />
            </div>
            <div className={FILTER_FIELD}>
              <label className={LBL}>任务名称</label>
              <input value={qTaskName} onChange={(e) => setQTaskName(e.target.value)} placeholder="请输入任务名称" className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
        </ListPageFilter>

        <ListPageToolbar>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">真机数据集列表</h2>
          <PermButton permission="dataset.self.download" onClick={() => navigate('/dataset/self/download')}>下载说明</PermButton>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {[{ v: 'card', icon: <IconGrid /> }, { v: 'list', icon: <IconList /> }].map(({ v, icon }) => (
              <button
                key={v}
                className={`flex h-8 w-9 cursor-pointer items-center justify-center ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'
                }`}
                onClick={() => setView(v)}
              >
                {icon}
              </button>
            ))}
          </div>
          <PermButton permission="dataset.self.create" variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>
            新建数据集
          </PermButton>
        </div>
        </ListPageToolbar>

      {view === 'card' ? (
        <ListPageBody className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((d) => {
            const stats = getDatasetListStats(d)
            return (
              <div
                key={d.id}
                onClick={() => navigate(`/dataset/self/${d.id}`)}
                className="group cursor-pointer rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-800 group-hover:text-blue-600">{d.name}</h3>
                    <span className="text-xs text-gray-400">{d.id}</span>
                  </div>
                  <div className="shrink-0 pl-2">
                    <CardMenu
                      onViewDetail={() => navigate(`/dataset/self/${d.id}`)}
                      onDeleteClick={() => setDeleteTarget(d)}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                    <div className="text-xs text-gray-400">条目数量</div>
                    <div className="mt-0.5 text-xs font-semibold text-gray-800">{stats.entryCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                    <div className="text-xs text-gray-400">总数据量</div>
                    <div className="mt-0.5 text-xs font-semibold text-gray-800">{stats.totalSize}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                    <div className="text-xs text-gray-400">关联项目</div>
                    <div className="mt-0.5 text-xs font-semibold text-gray-800">{stats.projectCount}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                    <div className="text-xs text-gray-400">关联任务</div>
                    <div className="mt-0.5 text-xs font-semibold text-gray-800">{stats.taskCount}</div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] text-gray-400">
                  <span className="truncate">创建人：{d.createdBy}</span>
                  <span className="shrink-0">{formatDateTime(d.createdAt)}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400">
              暂无符合条件的数据集
            </div>
          )}
        </div>
        </ListPageBody>
      ) : (
        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
        />
      )}
      </ListPageCard>

      <DeleteConfirmModal
        dataset={deleteTarget}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <CreateDatasetModal
        open={createOpen}
        datasets={datasets}
        onClose={(newDataset) => {
          setCreateOpen(false)
          if (newDataset) {
            prependSelfDataset(newDataset)
            setDatasets((list) => [newDataset, ...list])
          }
        }}
      />
    </div>
  )
}
