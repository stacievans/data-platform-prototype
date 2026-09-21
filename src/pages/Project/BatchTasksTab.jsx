import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import DetailNavButton from '../../components/common/DetailNavButton'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import { PermButton } from '../../components/common/PermissionAction'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { useCurrentNickname } from '../../context/AuthContext'
import ProjectMutateGate from '../../components/common/ProjectMutateGate'
import { dtCol } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  createBatchTaskFromForm,
  getBatchTaskById,
  getBatchTasksByProjectId,
  softDeleteBatchTask,
  updateBatchTask,
} from '../../mock/batchTasks'
import { tasks as collectionTaskStore } from '../../mock/tasks'
import BatchTaskFormDrawer from './BatchTaskFormDrawer'
import BulkCreateBatchTasksModal from './BulkCreateBatchTasksModal'
import AddBatchTaskDataModal from './AddBatchTaskDataModal'
import BatchTaskAssignModal from './BatchTaskAssignModal'

const INPUT_CLS =
  'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
function MiniProgress({ value }) {
  const p = Math.min(Math.max(value, 0), 100)
  return (
    <div className="min-w-[88px]">
      <div className="mb-1 text-xs text-gray-500">{p}%</div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${p >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  )
}

function CreatorSearchSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) setInputText(value)
  }, [open, value])

  const filteredOptions = useMemo(() => {
    const q = inputText.trim().toLowerCase()
    if (!q) return options
    return options.filter((n) => n.toLowerCase().includes(q))
  }, [options, inputText])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setInputText(value)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, value])

  const pick = (name) => {
    onChange(name)
    setInputText(name)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative min-w-[200px] flex-1">
      <label className={LBL}>创建人</label>
      <input
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value)
          setOpen(true)
          if (!e.target.value.trim()) onChange('')
        }}
        onFocus={() => setOpen(true)}
        placeholder="请输入创建人"
        className={INPUT_CLS}
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">暂无创建人</p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">无匹配结果</p>
          ) : (
            filteredOptions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(name)}
                className={`block w-full cursor-pointer truncate px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                  value === name ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700'
                }`}
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function rowMatchesMemberAssignFilter(row, filter) {
  if (!filter?.username) return true
  const { username, role } = filter
  if (role === '标注员') {
    return (row.reviewAssignees ?? []).some((a) => a.username === username)
  }
  if (role === '验收员') {
    return (row.acceptAssignees ?? []).some((a) => a.username === username)
  }
  return true
}

export default function BatchTasksTab({ projectId, projectStatus, initialMemberFilter = null }) {
  const navigate = useNavigate()
  const creatorName = useCurrentNickname()
  const { ToastNode, show: showToast } = useToast()
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const allRows = useMemo(
    () => getBatchTasksByProjectId(projectId),
    [projectId, tick],
  )

  const projectTasks = useMemo(
    () => collectionTaskStore.filter((t) => t.projectId === projectId),
    [projectId],
  )

  const creatorOptions = useMemo(
    () => [...new Set(allRows.map((b) => b.creator).filter(Boolean))].sort(),
    [allRows],
  )

  const [qBatchId, setQBatchId] = useState('')
  const [qBatchName, setQBatchName] = useState('')
  const [qCreator, setQCreator] = useState('')
  const [filters, setFilters] = useState({ batchId: '', batchName: '', creator: '' })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addDataTarget, setAddDataTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)

  const filtered = useMemo(() => {
    const idKw = filters.batchId.trim().toLowerCase()
    const nameKw = filters.batchName.trim().toLowerCase()
    const creator = filters.creator.trim()
    return allRows.filter((row) => {
      if (!rowMatchesMemberAssignFilter(row, initialMemberFilter)) return false
      if (idKw && !row.id.toLowerCase().includes(idKw)) return false
      if (nameKw && !row.name.toLowerCase().includes(nameKw)) return false
      if (creator && row.creator !== creator) return false
      return true
    })
  }, [allRows, filters, initialMemberFilter])

  const pageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const applyFilters = () => setFilters({
    batchId: qBatchId.trim(),
    batchName: qBatchName.trim(),
    creator: qCreator.trim(),
  })
  const resetFilters = () => {
    setQBatchId('')
    setQBatchName('')
    setQCreator('')
    setFilters({ batchId: '', batchName: '', creator: '' })
  }

  const openCreate = () => {
    setEditTarget(null)
    setDrawerOpen(true)
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setDrawerOpen(true)
  }

  const handleSave = ({ name, remark }) => {
    if (editTarget) {
      updateBatchTask(editTarget.id, { name, remark })
      showToast('批次任务已更新')
    } else {
      createBatchTaskFromForm({ projectId, name, remark, creator: creatorName })
      showToast('批次任务已创建')
    }
    setDrawerOpen(false)
    setEditTarget(null)
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    softDeleteBatchTask(deleteTarget.id)
    showToast(`已删除批次任务「${deleteTarget.name}」`)
    setDeleteTarget(null)
    refresh()
  }

  const columns = [
    {
      title: '批次任务ID',
      dataIndex: 'id',
      render: (v) => <span className="font-medium text-gray-700">{v}</span>,
    },
    {
      title: '批次任务名称',
      dataIndex: 'name',
      render: (v, row) => (
        <Link
          to={`/collection/project/${projectId}/batch-task/${row.id}`}
          className="cursor-pointer font-medium text-blue-600 transition hover:text-blue-500"
        >
          {v}
        </Link>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (v) => (
        <span className="block max-w-xs truncate text-gray-600" title={v || undefined}>
          {v?.trim() ? v : '—'}
        </span>
      ),
    },
    { title: '条目数', dataIndex: 'entryCount' },
    {
      title: '验收通过率',
      dataIndex: 'acceptPassRate',
      render: (v) => <span className="font-medium text-emerald-600">{v}%</span>,
    },
    {
      title: '验收驳回率',
      dataIndex: 'acceptRejectRate',
      render: (v) => <span className="font-medium text-amber-600">{v}%</span>,
    },
    {
      title: '验收进度',
      key: 'acceptProgress',
      render: (_, row) => <MiniProgress value={row.acceptProgress} />,
    },
    { title: '创建人', dataIndex: 'creator' },
    dtCol('创建时间', 'createdAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <DetailNavButton onClick={() => navigate(`/collection/project/${projectId}/batch-task/${row.id}`)} />
          <PermButton permission="collection.project.edit" mode="disable" variant="link" size="sm" onClick={() => openEdit(row)}>编辑</PermButton>
          <PermButton permission="collection.project.edit" mode="disable" variant="link" size="sm" onClick={() => setAddDataTarget(row)}>添加数据</PermButton>
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="link"
            size="sm"
            onClick={() => setAssignTarget(getBatchTaskById(row.id) ?? row)}
          >
            分配
          </PermButton>
          <PermButton permission="collection.project.delete" mode="disable" variant="linkDanger" size="sm" onClick={() => setDeleteTarget(row)}>删除</PermButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {ToastNode}
      <ListPageCard>
        <ListPageFilter>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className={LBL}>批次任务ID</label>
              <input
                value={qBatchId}
                onChange={(e) => setQBatchId(e.target.value)}
                placeholder="请输入批次任务ID"
                className={INPUT_CLS}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className={LBL}>批次任务名称</label>
              <input
                value={qBatchName}
                onChange={(e) => setQBatchName(e.target.value)}
                placeholder="请输入批次任务名称"
                className={INPUT_CLS}
              />
            </div>
            <CreatorSearchSelect options={creatorOptions} value={qCreator} onChange={setQCreator} />
            <div className="flex shrink-0 gap-2">
              <Button onClick={resetFilters}>重置</Button>
              <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
            </div>
          </div>
        </ListPageFilter>

        <ListPageToolbar>
          <h2 className="text-base font-semibold text-gray-800">批次任务列表</h2>
          <ProjectMutateGate projectStatus={projectStatus}>
            <div className="flex items-center gap-2">
              <span
                className="group/bulk relative inline-flex"
                title="基于所选择的采集任务，逐一创建批次任务"
              >
                <PermButton permission="collection.project.create" onClick={() => setBulkOpen(true)}>
                  批量创建
                </PermButton>
              </span>
              <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>
                新建
              </PermButton>
            </div>
          </ProjectMutateGate>
        </ListPageToolbar>

        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
        />
      </ListPageCard>

      <BatchTaskFormDrawer
        open={drawerOpen}
        editTarget={editTarget}
        projectId={projectId}
        onClose={() => {
          setDrawerOpen(false)
          setEditTarget(null)
        }}
        onSave={handleSave}
      />

      <BulkCreateBatchTasksModal
        open={bulkOpen}
        projectId={projectId}
        projectTasks={projectTasks}
        creatorNickname={creatorName}
        onClose={() => setBulkOpen(false)}
        onCreated={(count) => {
          refresh()
          showToast(`批量创建成功 ${count} 个批次任务`)
        }}
        showToast={showToast}
      />

      <AddBatchTaskDataModal
        open={!!addDataTarget}
        batchTask={addDataTarget}
        projectId={projectId}
        projectTasks={projectTasks}
        onClose={() => setAddDataTarget(null)}
        onAdded={(count) => {
          refresh()
          showToast(`添加成功 ${count} 条`)
        }}
        showToast={showToast}
      />

      <BatchTaskAssignModal
        open={!!assignTarget}
        batchTask={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSaved={() => refresh()}
        showToast={showToast}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
