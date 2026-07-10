import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Table from '../../components/common/Table'
import ListPaginator from '../../components/common/ListPaginator'
import Modal from '../../components/common/Modal'
import { Input, Select, TextArea, CreatorReadonlyField } from '../../components/common/FormField'
import { IconPlus, IconSearch, IconGrid, IconList } from '../../components/common/Icons'
import { projects as initialProjects } from '../../mock/projects'
import { useAuth, useCurrentNickname } from '../../context/AuthContext'
import { filterProjectsByDataScope } from '../../mock/permissions'
import { PermButton, PermAction, PermMenuItem } from '../../components/common/PermissionAction'
import { LIST_PAGE_SIZE, usePagination } from '../../hooks/usePagination'
import { dtCol, formatDateTime, nowDateTime } from '../../utils/formatDateTime'
import { useToast } from '../../components/common/Toast'
import {
  canAcceptProject,
  getProjectStatusMeta,
  normalizeProjectStatus,
  PROJECT_STATUS_FILTER_OPTIONS,
} from '../../utils/projectStatus'

const statusBadge = (status) => {
  const s = getProjectStatusMeta(status)
  return <Badge color={s.color} dot>{s.label}</Badge>
}

/* ── inline mini progress bar ── */
function MiniProgress({ collected, target }) {
  const p = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0
  const done = p >= 100
  return (
    <div className="min-w-[112px]">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{collected}/{target} 条</span>
        <span className={done ? 'font-medium text-emerald-600' : 'text-gray-500'}>{p}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  )
}

/* ── three-dot menu (card view) ── */
function CardMenu({
  project,
  onViewDetail,
  onEdit,
  onAccept,
  onClose,
  onOpen,
  onArchive,
  onDeleteClick,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useMemo(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const close = (fn) => () => { setOpen(false); fn() }
  const status = normalizeProjectStatus(project.status)

  const items = []
  items.push({ permission: null, label: '查看详情', onClick: close(onViewDetail) })

  if (status === 'archived') {
    items.push({ permission: 'collection.project.delete', label: '删除', onClick: close(onDeleteClick), danger: true })
  } else {
    if (canAcceptProject(status)) {
      items.push({ permission: null, label: '验收', onClick: close(onAccept) })
    }
    items.push({ permission: 'collection.project.edit', label: '编辑', onClick: close(onEdit) })
    if (status === 'open') {
      items.push({ permission: 'collection.project.edit', label: '关闭', onClick: close(onClose), warn: true })
    } else {
      items.push({ permission: 'collection.project.edit', label: '开启', onClick: close(onOpen) })
    }
    items.push({ permission: 'collection.project.archive', label: '归档', onClick: close(onArchive), warn: true })
  }

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
          {items.map((item) => (
            item.permission
              ? (
                <PermMenuItem
                  key={item.label}
                  permission={item.permission}
                  label={item.label}
                  onClick={item.onClick}
                  warn={item.warn}
                  danger={item.danger}
                />
              )
              : <CardMenuItem key={item.label} label={item.label} onClick={item.onClick} warn={item.warn} danger={item.danger} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardMenuItem({ label, onClick, warn, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
        danger ? 'text-red-500 hover:text-red-600'
               : warn   ? 'text-amber-600 hover:text-amber-700'
               : 'text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

/* ── archive confirm modal ── */
function ArchiveConfirmModal({ project, open, onCancel, onConfirm }) {
  if (!open || !project) return null
  return (
    <Modal open={open} title="归档项目" onCancel={onCancel} onOk={onConfirm} okText="确定归档" width={480}>
      <p className="text-sm leading-relaxed text-gray-600">
        确认归档项目「<strong className="text-gray-800">{project.name}</strong>」？
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        归档后将无法新建任务、采集方案等；查看与下载不受影响。
      </p>
    </Modal>
  )
}

/* ── delete confirm modal ── */
function DeleteConfirmModal({ project, open, onCancel, onConfirm }) {
  const [input, setInput] = useState('')
  const match = input === project?.name
  const reset = () => setInput('')

  if (!open || !project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          {/* title */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-600">删除数采项目</h2>
          </div>
          {/* body */}
          <p className="mb-2 text-sm text-gray-500 leading-relaxed">
            此操作不可逆。如果确定要删除，请在下方输入{' '}
            <strong className="text-gray-800">{project.name}</strong>{' '}以确认。
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入名称以确认"
            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            autoFocus
          />
        </div>
        {/* footer */}
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
              match
                ? 'cursor-pointer bg-red-500 hover:bg-red-600'
                : 'cursor-not-allowed bg-red-200'
            }`}
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  )
}


/* ── form field wrapper with error ── */
function FormRow({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
    </div>
  )
}

/* ── constants ── */
const emptyForm = { name: '', description: '' }
const emptyCreateForm = { name: '', description: '' }

const STATUS_OPTIONS = PROJECT_STATUS_FILTER_OPTIONS.map(({ value, label }) => ({
  value,
  label: value === '' ? '全部状态' : label,
}))

function ViewDetailBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-blue-700"
    >
      查看详情
    </button>
  )
}

function ProjectListActions({ row, onViewDetail, onAccept, onEdit, onClose, onOpen, onArchive, onDelete }) {
  const status = normalizeProjectStatus(row.status)

  const linkCls = 'cursor-pointer px-1 py-0.5 text-xs text-blue-600 hover:text-blue-500'
  const warnCls = 'cursor-pointer px-1 py-0.5 text-xs text-amber-600 hover:text-amber-500'

  if (status === 'archived') {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <ViewDetailBtn onClick={() => onViewDetail(row)} />
        <PermAction
          permission="collection.project.delete"
          className="cursor-pointer px-1 py-0.5 text-xs text-red-500 hover:text-red-400"
          onClick={() => onDelete(row)}
        >
          删除
        </PermAction>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ViewDetailBtn onClick={() => onViewDetail(row)} />
      {canAcceptProject(status) && (
        <button type="button" className={linkCls} onClick={() => onAccept(row)}>验收</button>
      )}
      <PermAction permission="collection.project.edit" className={linkCls} onClick={() => onEdit(row)}>编辑</PermAction>
      {status === 'open' ? (
        <PermAction permission="collection.project.edit" className={warnCls} onClick={() => onClose(row)}>关闭</PermAction>
      ) : (
        <PermAction permission="collection.project.edit" className={linkCls} onClick={() => onOpen(row)}>开启</PermAction>
      )}
      <PermAction permission="collection.project.archive" className={warnCls} onClick={() => onArchive(row)}>归档</PermAction>
    </div>
  )
}

function AcceptChoiceModal({ project, open, onCancel, onFullAccept, onSampleAccept }) {
  if (!open || !project) return null
  return (
    <Modal open={open} title="项目验收" onCancel={onCancel} footer={null}>
      <p className="mb-4 text-sm text-gray-500">
        为项目 <span className="font-medium text-gray-800">{project.name}</span> 选择验收方式
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onFullAccept}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
        >
          <div className="text-sm font-semibold text-gray-800">全量验收</div>
          <div className="mt-1 text-xs text-gray-500">进入项目详情，在采集任务中逐条验收</div>
        </button>
        <button
          type="button"
          onClick={onSampleAccept}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
        >
          <div className="text-sm font-semibold text-gray-800">抽样验收</div>
          <div className="mt-1 text-xs text-gray-500">创建抽检批次，按抽样规则验收条目</div>
        </button>
      </div>
    </Modal>
  )
}

/* ── date input (shared style) ── */
const dateInputCls = 'h-9 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'

export default function ProjectList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const creatorName = useCurrentNickname()
  const { ToastNode, show: showToast } = useToast()
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView]         = useState('card')

  /* filter states */
  const [queryId,          setQueryId]          = useState('')
  const [queryName,        setQueryName]        = useState('')
  const [queryStatus,      setQueryStatus]      = useState('')
  const [queryCreator,     setQueryCreator]     = useState('')
  const [queryDateFrom,    setQueryDateFrom]    = useState('')
  const [queryDateTo,      setQueryDateTo]      = useState('')
  const [filters, setFilters] = useState({})

  /* modal states */
  const [createOpen,   setCreateOpen]   = useState(false)
  const [createForm,   setCreateForm]   = useState(emptyCreateForm)
  const [createErrors, setCreateErrors] = useState({})
  const [editOpen,     setEditOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [form,         setForm]         = useState(emptyForm)

  /* delete / archive confirm */
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [acceptTarget, setAcceptTarget] = useState(null)

  /* auto-generate next project ID */
  const nextProjectId = useMemo(() => {
    const nums = projects.map((p) => parseInt(p.id.replace('P-', '')) || 0)
    return `P-${Math.max(...nums, 1000) + 1}`
  }, [projects])

  const scopedProjects = useMemo(
    () => filterProjectsByDataScope(projects, user.nickname, user.role),
    [projects, user.nickname, user.role],
  )

  /* ── filter logic ── */
  const filtered = useMemo(() => scopedProjects.filter((p) => {
    if (filters.id          && !p.id.toLowerCase().includes(filters.id.toLowerCase())) return false
    if (filters.name        && !p.name.includes(filters.name))                          return false
    if (filters.status      && normalizeProjectStatus(p.status) !== filters.status)   return false
    if (filters.creator     && !p.creator.includes(filters.creator))                   return false
    if (filters.dateFrom    && p.createdAt < filters.dateFrom)                          return false
    if (filters.dateTo      && p.createdAt > filters.dateTo + ' 23:59')                return false
    return true
  }), [scopedProjects, filters])

  const paginationResetKey = useMemo(
    () => `${view}:${JSON.stringify(filters)}`,
    [view, filters],
  )
  const { page, setPage, pageItems: pagedFiltered } = usePagination(filtered, {
    pageSize: LIST_PAGE_SIZE,
    resetKey: paginationResetKey,
  })

  const applyFilters = () => setFilters({ id: queryId, name: queryName, status: queryStatus, creator: queryCreator, dateFrom: queryDateFrom, dateTo: queryDateTo })
  const resetFilters = () => { setQueryId(''); setQueryName(''); setQueryStatus(''); setQueryCreator(''); setQueryDateFrom(''); setQueryDateTo(''); setFilters({}) }

  /* ── CRUD ── */
  const now = () => nowDateTime()

  const handleCreate = () => {
    const errs = {}
    if (!createForm.name.trim())    errs.name        = true
    if (Object.keys(errs).length > 0) { setCreateErrors(errs); return }

    const t = now()
    setProjects([{
      id: nextProjectId,
      name: createForm.name,
      description: createForm.description,
      taskCount: 0, creator: creatorName,
      createdAt: t, updatedAt: t,
      status: 'open', collected: 0, target: 100,
    }, ...projects])
    setCreateOpen(false)
    setCreateForm(emptyCreateForm)
    setCreateErrors({})
  }

  const openEdit = (p) => { setEditTarget(p); setForm({ name: p.name, description: p.description }); setEditOpen(true) }
  const handleEdit = () => {
    if (!form.name.trim()) return
    setProjects(projects.map((p) => p.id === editTarget.id ? { ...p, name: form.name, description: form.description, updatedAt: now() } : p))
    setEditOpen(false)
  }

  const setProjectStatus = (id, status) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, status, updatedAt: now() } : p)))
  }

  const handleCloseProject = (row) => {
    setProjectStatus(row.id, 'closed')
    showToast(`项目「${row.name}」已关闭`)
  }

  const handleOpenProject = (row) => {
    setProjectStatus(row.id, 'open')
    showToast(`项目「${row.name}」已开启`)
  }

  const confirmArchive = () => {
    if (!archiveTarget) return
    setProjectStatus(archiveTarget.id, 'archived')
    showToast(`项目「${archiveTarget.name}」已归档`)
    setArchiveTarget(null)
  }

  const goViewDetail = (row) => navigate(`/collection/project/${row.id}`)

  const confirmDelete = () => { setProjects(projects.filter((p) => p.id !== deleteTarget.id)); setDeleteTarget(null) }

  const openAcceptChoice = (project) => setAcceptTarget(project)
  const handleFullAccept = () => {
    if (!acceptTarget) return
    navigate(`/collection/project/${acceptTarget.id}?tab=task`)
    setAcceptTarget(null)
  }
  const handleSampleAccept = () => {
    if (!acceptTarget) return
    navigate(`/collection/project/${acceptTarget.id}/sampling`)
    setAcceptTarget(null)
  }

  /* ── shared project form (edit modal) ── */
  const ProjectForm = () => (
    <div className="space-y-4">
      <Input label="项目名称" placeholder="请输入项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <TextArea label="项目描述" placeholder="请输入项目描述（选填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </div>
  )

  /* ── table columns ── */
  const columns = [
    { title: '项目ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '项目名称', dataIndex: 'name', render: (v, row) => (
      <button
        type="button"
        onClick={() => navigate(`/collection/project/${row.id}`)}
        className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
      >
        {v}
      </button>
    ) },
    { title: '任务数',   dataIndex: 'taskCount' },
    { title: '创建人',   dataIndex: 'creator' },
    { title: '项目描述', dataIndex: 'description', render: (v) => <span className="block max-w-56 truncate text-gray-500" title={v}>{v}</span> },
    {
      title: '采集进度', dataIndex: 'collected',
      render: (v, row) => <MiniProgress collected={v} target={row.target} />,
    },
    { title: '状态',     dataIndex: 'status',    render: (v) => statusBadge(v) },
    dtCol('创建时间', 'createdAt'),
    dtCol('最后更新', 'updatedAt'),
    {
      title: '操作', dataIndex: 'id',
      render: (_, row) => (
        <ProjectListActions
          row={row}
          onViewDetail={goViewDetail}
          onAccept={openAcceptChoice}
          onEdit={openEdit}
          onClose={handleCloseProject}
          onOpen={handleOpenProject}
          onArchive={setArchiveTarget}
          onDelete={setDeleteTarget}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── 筛选栏 ── */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        {/* row 1：所有筛选项铺满一行 */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-28">
            <label className="mb-1 block text-xs text-gray-500">项目ID</label>
            <Input placeholder="请输入" value={queryId} onChange={(e) => setQueryId(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className="mb-1 block text-xs text-gray-500">项目名称</label>
            <Input placeholder="请输入" value={queryName} onChange={(e) => setQueryName(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className="mb-1 block text-xs text-gray-500">项目状态</label>
            <Select value={queryStatus} options={STATUS_OPTIONS} onChange={(e) => setQueryStatus(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1 basis-28">
            <label className="mb-1 block text-xs text-gray-500">创建人</label>
            <Input placeholder="请输入" value={queryCreator} onChange={(e) => setQueryCreator(e.target.value)} />
          </div>
          <div className="shrink-0">
            <label className="mb-1 block text-xs text-gray-500">创建时间</label>
            <div className="flex items-center gap-1.5">
              <input type="date" value={queryDateFrom} onChange={(e) => setQueryDateFrom(e.target.value)} className={dateInputCls} style={{ width: 130 }} />
              <span className="text-xs text-gray-400">至</span>
              <input type="date" value={queryDateTo} onChange={(e) => setQueryDateTo(e.target.value)} className={dateInputCls} style={{ width: 130 }} />
            </div>
          </div>
        </div>

        {/* row 2：按钮右对齐 */}
        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={resetFilters}>重置</Button>
          <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
        </div>
      </div>

      {/* ── 标题栏：项目列表 + 视图切换 + 新建 ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">项目列表</h2>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {[{ v: 'card', icon: <IconGrid /> }, { v: 'list', icon: <IconList /> }].map(({ v, icon }) => (
              <button key={v} className={`flex h-8 w-9 cursor-pointer items-center justify-center ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'}`} onClick={() => setView(v)}>{icon}</button>
            ))}
          </div>
          <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={() => { setCreateForm(emptyCreateForm); setCreateErrors({}); setCreateOpen(true) }}>新建项目</PermButton>
        </div>
      </div>

      {/* ── content ── */}
      {view === 'card' ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedFiltered.map((p) => {
            const progress = p.target > 0 ? Math.min(Math.round((p.collected / p.target) * 100), 100) : 0
            const done = progress >= 100
            return (
              <div key={p.id} onClick={() => navigate(`/collection/project/${p.id}`)}
                className="group cursor-pointer rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                {/* header */}
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
                      {p.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-800 group-hover:text-blue-600">{p.name}</h3>
                      <span className="text-xs text-gray-400">{p.id}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pl-2">
                    {statusBadge(p.status)}
                    <CardMenu
                      project={p}
                      onViewDetail={() => goViewDetail(p)}
                      onEdit={() => openEdit(p)}
                      onAccept={() => openAcceptChoice(p)}
                      onClose={() => handleCloseProject(p)}
                      onOpen={() => handleOpenProject(p)}
                      onArchive={() => setArchiveTarget(p)}
                      onDeleteClick={() => setDeleteTarget(p)}
                    />
                  </div>
                </div>

                {/* description */}
                <p className="mt-3 line-clamp-2 h-10 text-sm leading-5 text-gray-500">{p.description}</p>

                {/* tags */}
                <div className="mt-3 flex items-center gap-2">
                  <Badge color="cyan">任务 {p.taskCount}</Badge>
                  <span className="ml-auto text-xs text-gray-400">创建人：{p.creator}</span>
                </div>

                {/* progress */}
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">采集进度</span>
                    <span className={`font-medium ${done ? 'text-emerald-600' : 'text-gray-600'}`}>{p.collected}/{p.target} 条 · {progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* footer */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>创建：{formatDateTime(p.createdAt)}</span>
                  <span>更新：{formatDateTime(p.updatedAt)}</span>
                </div>
              </div>
            )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400">暂无符合条件的项目</div>
            )}
          </div>
          {filtered.length > 0 && (
            <ListPaginator
              total={filtered.length}
              page={page}
              pageSize={LIST_PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={paginationResetKey}
        />
      )}

      {/* 新建弹窗 */}
      <Modal
        open={createOpen}
        title="新建项目"
        onCancel={() => { setCreateOpen(false); setCreateForm(emptyCreateForm); setCreateErrors({}) }}
        onOk={handleCreate}
        okText="创建"
      >
        <div className="space-y-4">
          {/* 项目ID — 只读 */}
          <FormRow label="项目ID" required>
            <input
              readOnly
              value={nextProjectId}
              className="h-8 w-full rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none cursor-default"
            />
          </FormRow>
          {/* 项目名称 */}
          <FormRow label="项目名称" required error={createErrors.name}>
            <input
              placeholder="请输入项目名称"
              value={createForm.name}
              onChange={(e) => { setCreateForm({ ...createForm, name: e.target.value }); setCreateErrors({ ...createErrors, name: false }) }}
              className={`h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
                createErrors.name ? 'border-red-400 ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
          </FormRow>
          {/* 创建人 — 只读，随当前登录用户实时更新 */}
          <CreatorReadonlyField />
          {/* 项目描述 — 非必填 */}
          <FormRow label="项目描述">
            <textarea
              rows={3}
              placeholder="请输入项目描述（选填）"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </FormRow>
        </div>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal open={editOpen} title="编辑项目" onCancel={() => setEditOpen(false)} onOk={handleEdit} okText="保存">
        <ProjectForm />
      </Modal>

      {/* 删除二次确认 */}
      <DeleteConfirmModal
        project={deleteTarget}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ArchiveConfirmModal
        project={archiveTarget}
        open={!!archiveTarget}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
      />

      <AcceptChoiceModal
        project={acceptTarget}
        open={!!acceptTarget}
        onCancel={() => setAcceptTarget(null)}
        onFullAccept={handleFullAccept}
        onSampleAccept={handleSampleAccept}
      />

      {ToastNode}
    </div>
  )
}
