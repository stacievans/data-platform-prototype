import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { IconGrid, IconList, IconPlus, IconSearch } from '../../components/common/Icons'
import { PermButton, PermAction, PermMenuItem } from '../../components/common/PermissionAction'
import { selfDatasets as initialDatasets, prependSelfDataset } from '../../mock/datasets'
import CreateDatasetModal from './CreateDatasetModal'
const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const dateInputCls = 'h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/* ── 卡片三点菜单 ── */
function CardMenu({ dataset, onViewDetail, onEdit, onDeleteClick }) {
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
        <div className="absolute right-0 top-7 z-20 w-32 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
          <button type="button" onClick={close(onViewDetail)} className="w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">查看详情</button>
          <PermMenuItem permission="dataset.self.edit" label="编辑" onClick={close(onEdit)} />
          <PermMenuItem permission="dataset.self.delete" label="删除" onClick={close(onDeleteClick)} danger />
        </div>
      )}
    </div>
  )
}

/* ── 删除确认弹窗 ── */
function DeleteConfirmModal({ dataset, open, onCancel, onConfirm }) {
  const [input, setInput] = useState('')
  const match = input === dataset?.name
  const reset = () => setInput('')

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
          <p className="mb-2 text-sm leading-relaxed text-gray-500">
            此操作不可逆。如果确定要删除，请在下方输入{' '}
            <strong className="text-gray-800">{dataset.name}</strong>{' '}以确认。
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入名称以确认"
            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => { reset(); onCancel() }}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            取消
          </button>
          <button
            disabled={!match}
            onClick={() => { reset(); onConfirm() }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              match ? 'cursor-pointer bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-200'
            }`}
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
  const [qName, setQName]           = useState('')
  const [qUpdater, setQUpdater]     = useState('全部')
  const [qDateFrom, setQDateFrom]   = useState('')
  const [qDateTo, setQDateTo]       = useState('')
  const [filters, setFilters]       = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [nameErr, setNameErr] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [view, setView] = useState('card')
  const [createOpen, setCreateOpen] = useState(false)
  const updaterOptions = useMemo(
    () => ['全部', ...new Set(datasets.map((d) => d.updatedBy))],
    [datasets],
  )

  const filtered = useMemo(() => {
    const { name, updater, dateFrom, dateTo } = filters
    return datasets.filter((d) => {
      if (name     && !d.name.includes(name)) return false
      if (updater  && updater !== '全部' && d.updatedBy !== updater) return false
      if (dateFrom && d.updatedAt < dateFrom) return false
      if (dateTo   && d.updatedAt > dateTo + ' 23:59') return false
      return true
    })
  }, [datasets, filters])

  const applyFilters = () => setFilters({
    name: qName, updater: qUpdater, dateFrom: qDateFrom, dateTo: qDateTo,
  })

  const resetFilters = () => {
    setQName('')
    setQUpdater('全部')
    setQDateFrom('')
    setQDateTo('')
    setFilters({})
  }
  const openEdit = (row) => {
    setEditTarget(row)
    setEditName(row.name)
    setNameErr(false)
  }

  const handleEditSave = () => {
    if (!editName.trim()) { setNameErr(true); return }
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    setDatasets((list) =>
      list.map((d) =>
        d.id === editTarget.id
          ? { ...d, name: editName.trim(), updatedBy: '李明', updatedAt: now }
          : d,
      ),
    )
    setEditTarget(null)
  }

  const confirmDelete = () => {
    setDatasets((list) => list.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns = [
    { title: '数据集ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '数据集名称', dataIndex: 'name', render: (v) => <span className="font-medium">{v}</span> },
    { title: '轨迹数量', dataIndex: 'trajCount', render: (v) => v.toLocaleString() },
    { title: '总数据量', dataIndex: 'totalSize' },
    { title: '最后更新人', dataIndex: 'updatedBy' },
    { title: '最后更新时间', dataIndex: 'updatedAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="link" size="sm" onClick={() => navigate(`/dataset/self/${row.id}`)}>查看详情</Button>
          <PermButton permission="dataset.self.edit" mode="disable" variant="link" size="sm" onClick={() => openEdit(row)}>编辑</PermButton>
          <PermButton permission="dataset.self.delete" mode="disable" variant="linkDanger" size="sm" onClick={() => setDeleteTarget(row)}>删除</PermButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {/* 筛选区 */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>数据集名称</label>
              <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>最后更新人</label>
              <select value={qUpdater} onChange={(e) => setQUpdater(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {updaterOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>最后更新时间</label>
              <div className="flex items-center gap-1">
                <input type="date" value={qDateFrom} onChange={(e) => setQDateFrom(e.target.value)} className={`${dateInputCls} min-w-0 flex-1`} />
                <span className="shrink-0 text-xs text-gray-400">至</span>
                <input type="date" value={qDateTo} onChange={(e) => setQDateTo(e.target.value)} className={`${dateInputCls} min-w-0 flex-1`} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">真机数据集列表</h2>
          <PermButton permission="dataset.self.download" onClick={() => navigate('/dataset/self/download')}>下载数据集</PermButton>
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
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((d) => (
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
                    dataset={d}
                    onViewDetail={() => navigate(`/dataset/self/${d.id}`)}
                    onEdit={() => openEdit(d)}
                    onDeleteClick={() => setDeleteTarget(d)}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                  <div className="text-xs text-gray-400">轨迹数量</div>
                  <div className="mt-0.5 text-xs font-semibold text-gray-800">{d.trajCount.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                  <div className="text-xs text-gray-400">总数据量</div>
                  <div className="mt-0.5 text-xs font-semibold text-gray-800">{d.totalSize}</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] text-gray-400">
                <span className="truncate">最后更新人：{d.updatedBy}</span>
                <span className="shrink-0">{d.updatedAt}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400">
              暂无符合条件的数据集
            </div>
          )}
        </div>
      ) : (
        <Table columns={columns} dataSource={filtered} />
      )}
      <Modal
        open={!!editTarget}
        title="编辑数据集"
        onCancel={() => setEditTarget(null)}
        onOk={handleEditSave}
        okText="保存"
        width={480}
      >
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            数据集名称<span className="text-red-500">*</span>
          </label>
          <input
            value={editName}
            onChange={(e) => { setEditName(e.target.value); setNameErr(false) }}
            className={`h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:ring-2 ${
              nameErr
                ? 'border-red-400 focus:ring-red-100'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
            }`}
          />
          {nameErr && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
        </div>
      </Modal>

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
