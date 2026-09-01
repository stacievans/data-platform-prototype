import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { PermAction, PermButton } from '../../components/common/PermissionAction'
import { IconCopy, IconPlus } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { useCurrentNickname } from '../../context/AuthContext'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import {
  getAuditTemplates,
  isAuditTemplateNameTaken,
  nextAuditTemplateId,
  softDeleteAuditTemplate,
  upsertAuditTemplate,
} from '../../mock/tags'
import { isAuditTemplateBoundToCollectPlan } from '../../mock/plans'
import { boundDeleteTip, boundEditTip } from '../../utils/taskBindingTips'
import AuditTemplateModal from './AuditTemplateModal'

const NOT_CREATOR_TIP = '仅创建人可编辑或删除'
const disabledCls = 'cursor-not-allowed text-sm text-gray-300 select-none'

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
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

function CopyIconBtn({ onClick }) {
  const btn = (
    <PermAction
      permission="tag.create"
      mode="disable"
      aria-label="复制"
      title="创建副本"
      className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
    >
      <IconCopy />
    </PermAction>
  )
  return <TooltipWrap label="创建副本">{btn}</TooltipWrap>
}

export default function AuditTemplateListPanel() {
  const navigate = useNavigate()
  const creatorName = useCurrentNickname()
  const { ToastNode, show: showToast } = useToast()
  const [templates, setTemplates] = useState(() => getAuditTemplates())
  const [nameQuery, setNameQuery] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const refresh = () => setTemplates(getAuditTemplates())

  const filtered = useMemo(() => templates.filter((t) => {
    if (appliedName && !t.name.includes(appliedName)) return false
    return true
  }), [templates, appliedName])

  const pageResetKey = `${appliedName}|${templates.length}`

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setModalOpen(true)
  }

  const handleSave = ({ name, description }) => {
    if (editing && editing.creator !== creatorName) return
    const ts = nowDateTime()
    if (editing) {
      upsertAuditTemplate({
        ...editing,
        name,
        description,
        updatedAt: ts,
      })
    } else {
      upsertAuditTemplate({
        id: nextAuditTemplateId(),
        name,
        description,
        taskCount: 0,
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
        deleted: false,
        tagTree: [],
      })
    }
    refresh()
    setModalOpen(false)
    setEditing(null)
  }

  const handleCopy = (row) => {
    const ts = nowDateTime()
    const newId = nextAuditTemplateId()
    upsertAuditTemplate({
      ...cloneDeep(row),
      id: newId,
      name: `${row.name}_副本${newId}`,
      taskCount: 0,
      creator: creatorName,
      createdAt: ts,
      updatedAt: ts,
      deleted: false,
      tagTree: cloneDeep(row.tagTree ?? []),
    })
    refresh()
    showToast('复制成功')
  }

  const requestEdit = (row) => {
    if (row.creator !== creatorName) return
    if (row.taskCount > 0) {
      showToast(boundEditTip(row.name))
      return
    }
    openEdit(row)
  }

  const requestDelete = (row) => {
    if (row.creator !== creatorName) return
    if (row.taskCount > 0) {
      showToast(boundDeleteTip(row.name))
      return
    }
    if (isAuditTemplateBoundToCollectPlan(row.id)) {
      showToast('标注标签模板已绑定采集方案，无法删除')
      return
    }
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.creator !== creatorName) return
    softDeleteAuditTemplate(deleteTarget.id)
    refresh()
    setDeleteTarget(null)
  }

  const columns = [
    {
      title: '模板ID',
      dataIndex: 'id',
      render: (v) => <span className="text-gray-800">{v}</span>,
    },
    { title: '模板名称', dataIndex: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { title: '关联任务数', dataIndex: 'taskCount' },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v) => (
        <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      render: (v) => <span className="text-gray-600">{v || '—'}</span>,
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => {
        const canManage = row.creator === creatorName
        return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CopyIconBtn onClick={() => handleCopy(row)} />
          <PermAction
            permission="tag.view"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
            onClick={() => navigate(`/tag/audit-template/${row.id}`)}
          >
            详情
          </PermAction>
          {canManage ? (
            <PermAction
              permission="tag.edit"
              className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
              onClick={() => requestEdit(row)}
            >
              编辑
            </PermAction>
          ) : (
            <span className={disabledCls} title={NOT_CREATOR_TIP}>编辑</span>
          )}
          {canManage ? (
            <PermAction
              permission="tag.delete"
              className="cursor-pointer text-sm text-red-500 hover:text-red-400"
              onClick={() => requestDelete(row)}
            >
              删除
            </PermAction>
          ) : (
            <span className={disabledCls} title={NOT_CREATOR_TIP}>删除</span>
          )}
        </div>
        )
      },
    },
  ]

  return (
    <ListPageCard>
      <ListPageFilter>
      <div className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">模板名称</label>
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="输入模板名称"
              className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <Button onClick={() => {
            setNameQuery('')
            setAppliedName('')
          }}
          >
            重置
          </Button>
          <Button variant="primary" onClick={() => {
            setAppliedName(nameQuery.trim())
          }}
          >
            查询
          </Button>
        </div>
        <PermButton permission="tag.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>
          新建
        </PermButton>
      </div>
      </ListPageFilter>

      <Table embedded columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />

      <AuditTemplateModal
        open={modalOpen}
        editing={editing}
        nameConflict={(name) => isAuditTemplateNameTaken(name, editing?.id)}
        onCancel={() => { setModalOpen(false); setEditing(null) }}
        onOk={handleSave}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {ToastNode}
    </ListPageCard>
  )
}
