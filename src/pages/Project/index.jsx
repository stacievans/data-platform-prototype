import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar, ListPageBody } from '../../components/common/ListPageCard'
import ListPaginator from '../../components/common/ListPaginator'
import Modal from '../../components/common/Modal'
import Drawer from '../../components/common/Drawer'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { DescriptionField, Input } from '../../components/common/FormField'
import { IconPlus, IconSearch, IconGrid, IconList, IconProject, IconClock, IconUser, IconId } from '../../components/common/Icons'
import { projects as initialProjects } from '../../mock/projects'
import { useAuth, useCurrentNickname } from '../../context/AuthContext'
import { filterProjectsByDataScope } from '../../mock/permissions'
import { PermButton, PermAction, PermMenuItem } from '../../components/common/PermissionAction'
import { LIST_PAGE_SIZE, usePagination } from '../../hooks/usePagination'
import { dtCol, formatDateTime, nowDateTime } from '../../utils/formatDateTime'
import { useToast } from '../../components/common/Toast'
import {
  getProjectStatusMeta,
  normalizeProjectStatus,
} from '../../utils/projectStatus'

function StatusSwitch({ enabled, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
      aria-label={enabled ? '开启' : '关闭'}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function ProjectStatusSwitch({ row, onClose, onOpen }) {
  const status = normalizeProjectStatus(row.status)
  if (status === 'archived') {
    return <StatusSwitch enabled={false} disabled onToggle={() => {}} />
  }

  const enabled = status === 'open'

  const handleToggle = () => {
    if (enabled) onClose(row)
    else onOpen(row)
  }

  return <StatusSwitch enabled={enabled} onToggle={handleToggle} />
}

/* ── three-dot menu (card view) ── */
function CardMenu({
  project,
  onViewDetail,
  onEdit,
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

function CardCircleIcon({ children }) {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
      {children}
    </span>
  )
}

const STATUS_CORNER_CLS = {
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-amber-50 text-amber-600',
  gray: 'bg-gray-100 text-gray-500',
}

function projectCollectProgress(project) {
  const collected = project.collected ?? 0
  const target = project.target ?? 0
  const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0
  return { collected, target, percent }
}

function ProjectCard({
  project,
  onNavigate,
  onViewDetail,
  onEdit,
  onClose,
  onOpen,
  onArchive,
  onDeleteClick,
}) {
  const status = getProjectStatusMeta(project.status)
  const cornerCls = STATUS_CORNER_CLS[status.color] ?? STATUS_CORNER_CLS.blue
  const description = project.description?.trim() ? project.description : '-'
  const { collected, target, percent } = projectCollectProgress(project)
  const barColor = percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'

  return (
    <div
      className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
      onClick={() => onNavigate(project)}
    >
      <span className={`absolute right-0 top-0 z-10 rounded-bl-lg px-2.5 py-1 text-xs font-medium ${cornerCls}`}>
        {status.label}
      </span>

      <div className="p-4">
        {/* header */}
        <div className="flex items-center gap-2.5 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <IconProject width={18} height={18} />
          </div>
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 group-hover:text-blue-600">
            {project.name}
          </h3>
        </div>

        {/* body */}
        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CardCircleIcon><IconId /></CardCircleIcon>
              <span className="text-gray-500">项目 id</span>
              <span className="font-medium text-gray-800">{project.id}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-gray-500">任务数</span>
              <span className="font-medium text-gray-800">{project.taskCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CardCircleIcon><IconUser /></CardCircleIcon>
            <span className="text-gray-500">创建人</span>
            <span className="font-medium text-gray-800">{project.creator}</span>
          </div>
          <p className="line-clamp-2 text-gray-600">
            <span className="text-gray-500">项目描述：</span>
            {description}
          </p>

          <div className="pt-1">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
              <span>采集进度</span>
              <span className="tabular-nums">{collected}/{target} 条 · {percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <IconClock className="text-gray-400" />
            {formatDateTime(project.createdAt)}
          </span>
          <CardMenu
            project={project}
            onViewDetail={() => onViewDetail(project)}
            onEdit={() => onEdit(project)}
            onClose={() => onClose(project)}
            onOpen={() => onOpen(project)}
            onArchive={() => onArchive(project)}
            onDeleteClick={() => onDeleteClick(project)}
          />
        </div>
      </div>
    </div>
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
    </Modal>
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
const DESCRIPTION_MAX = 500

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

function ProjectListActions({ row, onViewDetail, onEdit, onArchive, onDelete }) {
  const status = normalizeProjectStatus(row.status)
  const isArchived = status === 'archived'

  const linkCls = 'cursor-pointer px-1 py-0.5 text-xs text-blue-600 hover:text-blue-500'
  const warnCls = 'cursor-pointer px-1 py-0.5 text-xs text-amber-600 hover:text-amber-500'
  const dangerCls = 'cursor-pointer px-1 py-0.5 text-xs text-red-500 hover:text-red-400'
  const disabledCls = 'px-1 py-0.5 text-xs text-gray-300 cursor-not-allowed select-none'

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ViewDetailBtn onClick={() => onViewDetail(row)} />
      {!isArchived && (
        <PermAction permission="collection.project.edit" className={linkCls} onClick={() => onEdit(row)}>编辑</PermAction>
      )}
      {isArchived ? (
        <span className={disabledCls}>归档</span>
      ) : (
        <PermAction permission="collection.project.archive" className={warnCls} onClick={() => onArchive(row)}>归档</PermAction>
      )}
      {isArchived ? (
        <PermAction permission="collection.project.delete" className={dangerCls} onClick={() => onDelete(row)}>删除</PermAction>
      ) : (
        <span className={disabledCls}>删除</span>
      )}
    </div>
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
    if (filters.creator     && !p.creator.includes(filters.creator))                   return false
    if (filters.dateFrom    && p.createdAt < filters.dateFrom)                          return false
    if (filters.dateTo      && p.createdAt > filters.dateTo + ' 23:59')                return false
    return true
  }), [scopedProjects, filters])

  const paginationResetKey = useMemo(
    () => `${view}:${JSON.stringify(filters)}`,
    [view, filters],
  )
  const { page, setPage, pageItems: pagedFiltered, pageSize, setPageSize } = usePagination(filtered, {
    pageSize: LIST_PAGE_SIZE,
    resetKey: paginationResetKey,
  })

  const applyFilters = () => setFilters({ id: queryId, name: queryName, creator: queryCreator, dateFrom: queryDateFrom, dateTo: queryDateTo })
  const resetFilters = () => { setQueryId(''); setQueryName(''); setQueryCreator(''); setQueryDateFrom(''); setQueryDateTo(''); setFilters({}) }

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

  /* ── shared project form (edit modal) ── */
  const ProjectForm = () => (
    <div className="space-y-4">
      <Input label="项目名称" placeholder="请输入项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <DescriptionField
        label="项目描述"
        placeholder="请输入项目描述（选填）"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
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
      title: '状态',
      dataIndex: 'status',
      render: (_, row) => (
        <ProjectStatusSwitch row={row} onClose={handleCloseProject} onOpen={handleOpenProject} />
      ),
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作', dataIndex: 'id',
      render: (_, row) => (
        <ProjectListActions
          row={row}
          onViewDetail={goViewDetail}
          onEdit={openEdit}
          onArchive={setArchiveTarget}
          onDelete={setDeleteTarget}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <ListPageCard>
        <ListPageFilter>
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
        </ListPageFilter>

        <ListPageToolbar>
        <h2 className="text-base font-semibold text-gray-800">项目列表</h2>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {[{ v: 'card', icon: <IconGrid /> }, { v: 'list', icon: <IconList /> }].map(({ v, icon }) => (
              <button key={v} className={`flex h-8 w-9 cursor-pointer items-center justify-center ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'}`} onClick={() => setView(v)}>{icon}</button>
            ))}
          </div>
          <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={() => { setCreateForm(emptyCreateForm); setCreateErrors({}); setCreateOpen(true) }}>新建</PermButton>
        </div>
        </ListPageToolbar>

      {view === 'card' ? (
        <ListPageBody>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedFiltered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onNavigate={(row) => navigate(`/collection/project/${row.id}`)}
                onViewDetail={goViewDetail}
                onEdit={openEdit}
                onClose={handleCloseProject}
                onOpen={handleOpenProject}
                onArchive={setArchiveTarget}
                onDeleteClick={setDeleteTarget}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400">暂无符合条件的项目</div>
            )}
          </div>
          {filtered.length > 0 && (
              <ListPaginator
                total={filtered.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
          )}
        </ListPageBody>
      ) : (
        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={paginationResetKey}
        />
      )}
      </ListPageCard>

      {/* 新建抽屉 */}
      <Drawer
        open={createOpen}
        title="新建采集项目"
        onCancel={() => { setCreateOpen(false); setCreateForm(emptyCreateForm); setCreateErrors({}) }}
        onOk={handleCreate}
        okText="确定"
      >
        <div className="space-y-4">
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
          <FormRow label="项目描述">
            <div>
              <textarea
                rows={5}
                maxLength={DESCRIPTION_MAX}
                placeholder="请输入项目描述（选填）"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value.slice(0, DESCRIPTION_MAX) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {createForm.description.length}/{DESCRIPTION_MAX}
              </p>
            </div>
          </FormRow>
        </div>
      </Drawer>

      {/* 编辑弹窗 */}
      <Modal open={editOpen} title="编辑项目" onCancel={() => setEditOpen(false)} onOk={handleEdit} okText="保存">
        <ProjectForm />
      </Modal>

      {/* 删除二次确认 */}
      <DeleteConfirmModal
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

      {ToastNode}
    </div>
  )
}
