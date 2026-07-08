import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Progress from '../../components/common/Progress'
import { taskStatusColor, pct, toPeopleArray } from '../../mock/tasks'
import { findLatestPendingEntry } from '../../mock/entries'
import { useToast } from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import { IconCopy } from '../../components/common/Icons'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const ACTION_BAR_CLS = 'flex min-w-[400px] flex-nowrap items-center gap-1.5'

function PeopleCell({ value, multi = true }) {
  const people = toPeopleArray(value).filter(Boolean)
  if (!people.length) return <span className="text-red-500">未分配</span>
  if (!multi) return <span className="text-gray-700">{people[0]}</span>
  const extra = people.length - 1
  return (
    <span title={people.join('、')} className="inline-flex h-6 items-center gap-1.5 align-middle text-gray-700">
      <span className="truncate">{people[0]}</span>
      {extra > 0 && (
        <span className="inline-flex h-5 items-center rounded-full bg-blue-50 px-1.5 text-[11px] leading-none text-blue-600">
          +{extra}
        </span>
      )}
    </span>
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

/* 操作列"查看"蓝色实心小按钮 */
const ViewBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-blue-700"
  >
    查看
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

function LinkAction({ permission, onClick, children, danger = false }) {
  return (
    <PermButton
      permission={permission}
      mode="disable"
      variant={danger ? 'linkDanger' : 'link'}
      size="sm"
      className="shrink-0 px-1"
      onClick={onClick}
    >
      {children}
    </PermButton>
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

/* ── 二次确认弹窗（发布 / 归档）── */
function ActionConfirmModal({ open, type, task, onCancel, onConfirm }) {
  if (!open || !task) return null
  const isPublish = type === 'publish'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">{isPublish ? '📢' : '📦'}</span>
            <h2 className="text-base font-semibold text-gray-800">
              {isPublish ? '发布任务' : '归档任务'}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {isPublish
              ? `确认发布任务「${task.name}」？发布后将进入采集与审核流程。`
              : `确认归档任务「${task.name}」？归档后不可再编辑或继续采集。`}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              isPublish ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            确认
          </button>
        </div>
      </div>
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
  showProjectColumn = false,
  pageResetKey,
  onDeleteClick,
  onStatusChange,
  onEditSave,
  onCopy,
}) {
  const navigate = useNavigate()
  const { ToastNode, show: showToast } = useToast()

  const [confirm, setConfirm]   = useState({ open: false, type: null, task: null })
  const [editTask, setEditTask] = useState(null)

  const closeConfirm = () => setConfirm({ open: false, type: null, task: null })

  const handleConfirm = () => {
    const { type, task } = confirm
    if (type === 'publish') onStatusChange?.(task.id, '已发布')
    if (type === 'archive') onStatusChange?.(task.id, '已归档')
    closeConfirm()
  }

  const goAudit = (taskId, mode) => {
    const entry = findLatestPendingEntry(taskId, mode)
    if (!entry) {
      showToast(mode === 'review' ? '暂无待审核条目' : '暂无待验收条目')
      return
    }
    openWorkbench(entry.id, mode)
  }

  const progressCell = (done, total, color) => (
    <div>
      <Progress percent={pct(done, total)} color={color} />
      <span className="text-xs text-gray-400">{done}/{total}</span>
    </div>
  )

  const renderActions = (row) => {
    const goView = () => navigate(`/collection/task/${row.id}`)

    if (row.status === '草稿') {
      return (
        <ActionBar>
          <DuplicateBtn onClick={() => onCopy?.(row)} />
          <LinkAction permission="collection.task.edit" onClick={() => setEditTask(row)}>编辑</LinkAction>
          <LinkAction permission="collection.task.edit" onClick={() => setConfirm({ open: true, type: 'publish', task: row })}>发布</LinkAction>
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
          <LinkAction permission="collection.task.view" onClick={() => goAudit(row.id, 'review')}>审核</LinkAction>
          <LinkAction permission="collection.task.view" onClick={() => goAudit(row.id, 'accept')}>验收</LinkAction>
          <ExportMenu onExport={(type) => showToast(type === 'label' ? '正在导出标签…' : '正在导出质检报告…')} />
          <LinkAction permission="collection.task.edit" onClick={() => setConfirm({ open: true, type: 'archive', task: row })}>归档</LinkAction>
          {onDeleteClick && (
            <LinkAction permission="collection.task.delete" danger onClick={() => onDeleteClick(row)}>删除</LinkAction>
          )}
        </ActionBar>
      )
    }

    /* 已归档 */
    return (
      <ActionBar>
        <DuplicateBtn onClick={() => onCopy?.(row)} />
        <ViewBtn onClick={goView} />
        {onDeleteClick && (
          <LinkAction permission="collection.task.delete" danger onClick={() => onDeleteClick(row)}>删除</LinkAction>
        )}
      </ActionBar>
    )
  }

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      render: (v, row) => (
        <button
          className="cursor-pointer font-medium text-blue-600 hover:text-blue-500"
          onClick={() => navigate(`/collection/task/${row.id}`)}
        >
          {v}
        </button>
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (v, row) => (
        <button
          className="cursor-pointer text-gray-700 hover:text-blue-600"
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
    { title: '采集设备', dataIndex: 'device', render: (v, row) => v ?? row.robotBody ?? '—' },
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
    { title: '总数据量', dataIndex: 'dataTotal', render: (v) => v ?? 0 },
    {
      title: '采集进度',
      dataIndex: 'collectDone',
      render: (v, row) => progressCell(row.collectDone, row.collectTotal),
    },
    {
      title: '审核进度',
      dataIndex: 'reviewDone',
      render: (v, row) => progressCell(row.reviewDone, row.collectTotal, 'bg-purple-500'),
    },
    {
      title: '验收进度',
      dataIndex: 'acceptDone',
      render: (v, row) => progressCell(row.acceptDone ?? 0, row.collectTotal, 'bg-emerald-500'),
    },
    { title: '采集员', dataIndex: 'collector', render: (v) => <PeopleCell value={v} multi /> },
    { title: '标注员', dataIndex: 'reviewer', render: (v) => <PeopleCell value={v} multi={false} /> },
    { title: '创建人', dataIndex: 'creator', render: (v) => v ?? '—' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '更新时间', dataIndex: 'updatedAt', render: (v, row) => v ?? row.createdAt ?? '—' },
    {
      title: '操作',
      key: 'actions',
      width: 400,
      render: (_, row) => renderActions(row),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        pageSize={LIST_PAGE_SIZE}
        pageResetKey={pageResetKey}
      />

      <ActionConfirmModal
        open={confirm.open}
        type={confirm.type}
        task={confirm.task}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
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
