import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import { taskStatusColor, pct, toPeopleArray } from '../../mock/tasks'
import { findLatestPendingEntry } from '../../mock/entries'
import { useToast } from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import { IconCopy } from '../../components/common/Icons'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol } from '../../utils/formatDateTime'
import CreateTaskModal from './CreateTaskModal'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'

const ACTION_BAR_CLS = 'inline-flex flex-nowrap items-center justify-center gap-1.5'

function PeopleCell({ value }) {
  const people = toPeopleArray(value).filter(Boolean)
  if (!people.length) return <span className="text-red-500">未分配</span>
  if (people.length === 1) {
    return <span className="text-gray-700">{people[0]}</span>
  }
  const content = (
    <span className="inline-flex h-6 cursor-default items-center gap-1.5 align-middle text-gray-700">
      <span className="truncate">{people[0]}</span>
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-blue-50 px-1.5 text-[11px] leading-none text-blue-600">
        +{people.length - 1}
      </span>
    </span>
  )
  return (
    <TooltipWrap label={people.join('、')}>
      {content}
    </TooltipWrap>
  )
}

function TooltipWrap({ label, children }) {
  return (
    <span className="group/tip relative inline-flex shrink-0">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover/tip:block">
        {label}
      </span>
    </span>
  )
}

/* 操作列「查看详情」蓝色实心小按钮 */
const ViewBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-blue-700"
  >
    查看详情
  </button>
)

function DuplicateBtn({ onClick }) {
  const { can } = useAuth()
  const allowed = can('collection.task.create')
  const btn = (
    <PermAction
      permission="collection.task.create"
      mode="disable"
      aria-label="创建副本"
      className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
    >
      <IconCopy />
    </PermAction>
  )
  if (allowed) return <TooltipWrap label="创建副本">{btn}</TooltipWrap>
  return btn
}

function LinkAction({ permission, onClick, children, danger = false, warn = false }) {
  return (
    <PermButton
      permission={permission}
      mode="disable"
      variant={danger ? 'linkDanger' : 'link'}
      size="sm"
      className={`shrink-0 px-1${warn ? ' !text-amber-600 hover:!text-amber-500' : ''}`}
      onClick={onClick}
    >
      {children}
    </PermButton>
  )
}

function DisabledLinkAction({ children, title = '任务已归档，不可操作' }) {
  return (
    <button
      type="button"
      disabled
      title={title}
      className="shrink-0 cursor-not-allowed px-1 text-sm text-gray-300"
    >
      {children}
    </button>
  )
}

/* ── 导出 ▾（仅导出子项下拉，操作本身平铺）── */
function ExportMenu({ onExport }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="relative shrink-0">
      <PermButton
        permission="collection.task.edit"
        mode="disable"
        variant="link"
        size="sm"
        className="shrink-0 px-1"
        onClick={() => setOpen((v) => !v)}
      >
        导出 ▾
      </PermButton>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-md border border-gray-100 bg-white py-1 shadow-lg">
            <button
              type="button"
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { close(); onExport('label') }}
            >
              导出标签
            </button>
            <button
              type="button"
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { close(); onExport('report') }}
            >
              导出质检报告
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── 操作栏容器 ── */
function ActionBar({ children }) {
  return <div className={ACTION_BAR_CLS}>{children}</div>
}

function openWorkbench(entryId, mode) {
  window.open(`/review/${entryId}?mode=${mode}`, '_blank', 'noopener,noreferrer')
}

/* ══════════════════════════════════════════
   TaskTable
══════════════════════════════════════════ */
export default function TaskTable({
  data,
  embedded = false,
  showProjectColumn = false,
  pageResetKey,
  onDeleteClick,
  onStatusChange,
  onEditSave,
  onCopy,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) {
  const navigate = useNavigate()
  const { ToastNode, show: showToast } = useToast()

  const [confirm, setConfirm]   = useState({ open: false, type: null, task: null })
  const [editTask, setEditTask] = useState(null)

  const closeConfirm = () => setConfirm({ open: false, type: null, task: null })

  const handlePublish = (task) => {
    onStatusChange?.(task.id, '已发布')
    showToast('状态更新成功')
  }

  const handleConfirm = () => {
    const { type, task } = confirm
    if (type === 'archive') onStatusChange?.(task.id, '已归档')
    closeConfirm()
  }

  const selectedSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds ?? [])
  const allSelected = selectable && data.length > 0 && data.every((row) => selectedSet.has(row.id))
  const someSelected = selectable && data.some((row) => selectedSet.has(row.id))

  const goAudit = (taskId, mode) => {
    const entry = findLatestPendingEntry(taskId, mode)
    if (!entry) {
      showToast(mode === 'review' ? '暂无待标注条目' : '暂无待验收条目')
      return
    }
    openWorkbench(entry.id, mode)
  }

  const progressCell = (done, total, color) => {
    const percent = pct(done, total)
    const barColor = percent >= 100 ? 'bg-emerald-500' : color
    return (
      <div className="flex min-w-[7rem] items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-gray-500">{done}/{total}</span>
      </div>
    )
  }

  const renderActions = (row) => {
    const goView = () => navigate(`/collection/task/${row.id}`)

    if (row.status === '草稿') {
      return (
        <ActionBar>
          <DuplicateBtn onClick={() => onCopy?.(row)} />
          <LinkAction permission="collection.task.edit" onClick={() => setEditTask(row)}>编辑</LinkAction>
          <LinkAction permission="collection.task.edit" onClick={() => handlePublish(row)}>发布</LinkAction>
          {onDeleteClick && (
            <LinkAction permission="collection.task.delete" danger onClick={() => onDeleteClick(row)}>删除</LinkAction>
          )}
        </ActionBar>
      )
    }

    if (row.status === '已发布') {
      return (
        <ActionBar>
          <DuplicateBtn onClick={() => onCopy?.(row)} />
          <ViewBtn onClick={goView} />
          <LinkAction permission="collection.task.view" onClick={() => goAudit(row.id, 'review')}>标注</LinkAction>
          <LinkAction permission="collection.task.view" onClick={() => goAudit(row.id, 'accept')}>验收</LinkAction>
          <ExportMenu onExport={(type) => showToast(type === 'label' ? '正在导出标签…' : '正在导出质检报告…')} />
          <LinkAction permission="collection.task.edit" warn onClick={() => setConfirm({ open: true, type: 'archive', task: row })}>归档</LinkAction>
        </ActionBar>
      )
    }

    /* 已归档 */
    return (
      <ActionBar>
        <DuplicateBtn onClick={() => onCopy?.(row)} />
        <ViewBtn onClick={goView} />
        <DisabledLinkAction>标注</DisabledLinkAction>
        <DisabledLinkAction>验收</DisabledLinkAction>
        <ExportMenu onExport={(type) => showToast(type === 'label' ? '正在导出标签…' : '正在导出质检报告…')} />
        {onDeleteClick && (
          <LinkAction permission="collection.task.delete" danger onClick={() => onDeleteClick(row)}>删除</LinkAction>
        )}
      </ActionBar>
    )
  }

  const columns = [
    ...(selectable ? [{
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected
          }}
          onChange={() => onToggleSelectAll?.()}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
        />
      ),
      key: 'select',
      width: 48,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={() => onToggleSelect?.(row.id)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
        />
      ),
    }] : []),
    {
      title: '任务ID',
      dataIndex: 'id',
      render: (v) => <span className="font-medium text-gray-700">{v}</span>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (v, row) => (
        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
          onClick={() => navigate(`/collection/task/${row.id}`)}
        >
          {v}
        </button>
      ),
    },
    ...(showProjectColumn ? [{
      title: '所属项目名称',
      dataIndex: 'projectName',
      render: (v) => <span className="text-gray-700">{v ?? '—'}</span>,
    }] : []),
    { title: '任务用途', dataIndex: 'purpose', render: (v) => v ?? '—' },
    { title: '设备类型', dataIndex: 'robotBody', render: (v) => v ?? '—' },
    { title: '采集方案ID', dataIndex: 'planId' },
    { title: '所属场景', dataIndex: 'scene', render: (v) => v ?? '—' },
    { title: '采集方式', dataIndex: 'method' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => (
        <Badge color={taskStatusColor[v] ?? 'gray'} dot>
          {v}
        </Badge>
      ),
    },
    { title: '总数据量（MB）', dataIndex: 'dataTotal', render: (v) => v ?? 0 },
    {
      title: '采集进度',
      dataIndex: 'collectDone',
      render: (v, row) => progressCell(row.collectDone, row.collectTotal),
    },
    {
      title: '标注进度',
      dataIndex: 'reviewDone',
      render: (v, row) => progressCell(row.reviewDone, row.collectTotal, 'bg-purple-500'),
    },
    {
      title: '验收进度',
      dataIndex: 'acceptDone',
      render: (v, row) => progressCell(row.acceptDone ?? 0, row.collectTotal, 'bg-emerald-500'),
    },
    { title: '采集员', dataIndex: 'collectors', render: (v) => <PeopleCell value={v} /> },
    { title: '标注员', dataIndex: 'annotators', render: (v) => <PeopleCell value={v} /> },
    { title: '创建人', dataIndex: 'creator', render: (v) => v ?? '—' },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt', { fallbackKey: 'createdAt' }),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => renderActions(row),
    },
  ]

  return (
    <>
      <Table
        embedded={embedded}
        columns={columns}
        dataSource={data}
        pageSize={LIST_PAGE_SIZE}
        pageResetKey={pageResetKey}
      />

      <DeleteConfirmModal
        open={confirm.open && confirm.type === 'archive'}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
        message={
          confirm.task
            ? `确认归档任务「${confirm.task.name}」？归档后不可继续采集。`
            : ''
        }
      />

      {editTask && (
        <CreateTaskModal
          open
          editTask={editTask}
          projectId={editTask.projectId}
          onClose={(changes) => {
            if (changes) onEditSave?.(editTask.id, changes)
            setEditTask(null)
          }}
        />
      )}

      {ToastNode}
    </>
  )
}
