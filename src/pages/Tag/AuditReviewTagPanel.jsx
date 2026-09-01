import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import { PermAction, PermButton } from '../../components/common/PermissionAction'
import { IconPlus } from '../../components/common/Icons'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { useCurrentNickname } from '../../context/AuthContext'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import {
  APPLICATION_SCOPE_OPTIONS,
  getAuditTemplateById,
  saveAuditTemplateTagTree,
} from '../../mock/tags'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'
import AuditReviewTagModal from './AuditReviewTagModal'

const NOT_CREATOR_TIP = '仅创建人可编辑或删除'
const disabledCls = 'cursor-not-allowed text-sm text-gray-300 select-none'

const saveMoment = () => nowDateTime()
const isNewId = (id) => String(id).startsWith('child-')
const filterSelectCls = `h-8 w-40 cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 ${nativeSelectChevronCls}`

function deepCloneTree(tree) {
  return tree.map((g) => ({
    ...g,
    children: (g.children ?? []).map((c) => ({ ...c })),
  }))
}

function mergeItemMeta({ isNew, nameChanged, oldItem, saveTime, currentUser }) {
  if (isNew) {
    return { creator: currentUser, createdAt: saveTime, updatedAt: saveTime }
  }
  if (nameChanged) {
    return { creator: oldItem.creator, createdAt: oldItem.createdAt, updatedAt: saveTime }
  }
  return { creator: oldItem.creator, createdAt: oldItem.createdAt, updatedAt: oldItem.updatedAt }
}

function formToGroup(form, existingGroup, currentUser) {
  const saveTime = saveMoment()
  const isNewGroup = !existingGroup
  const groupId = existingGroup?.id ?? `AT-G-${String(Date.now()).slice(-6)}`

  const groupName = form.name.trim()
  const groupValue = form.value.trim()
  const groupDesc = form.description.trim()
  const applicationScope = form.applicationScope ?? '全局'
  const groupMetaChanged = isNewGroup
    || existingGroup.name !== groupName
    || (existingGroup.value ?? existingGroup.name) !== groupValue
    || (existingGroup.description ?? '') !== groupDesc
    || (existingGroup.applicationScope ?? '全局') !== applicationScope

  const oldChildMap = new Map()
  existingGroup?.children?.forEach((c) => oldChildMap.set(c.id, c))

  const children = form.children.map((child, ci) => {
    const childIsNew = isNewId(child.id)
    const oldChild = oldChildMap.get(child.id)
    const childId = childIsNew
      ? `${groupId}-${String(ci + 1).padStart(3, '0')}`
      : child.id
    const childName = child.name.trim()
    const childValue = child.value.trim()
    const childDesc = (oldChild?.description ?? '').trim()
    const childChanged = childIsNew
      || !oldChild
      || oldChild.name !== childName
      || (oldChild.value ?? oldChild.name) !== childValue
    const meta = mergeItemMeta({
      isNew: childIsNew,
      nameChanged: childChanged,
      oldItem: oldChild,
      saveTime,
      currentUser,
    })
    return {
      id: childId,
      name: childName,
      value: childValue,
      description: childDesc,
      ...meta,
    }
  })

  return {
    id: groupId,
    name: groupName,
    value: groupValue,
    description: groupDesc,
    applicationScope,
    creator: isNewGroup ? currentUser : existingGroup.creator,
    createdAt: isNewGroup ? saveTime : existingGroup.createdAt,
    updatedAt: isNewGroup || groupMetaChanged ? saveTime : existingGroup.updatedAt,
    children,
  }
}

function matchesQuery(row, nameQ, valueQ) {
  if (nameQ && !row.name.includes(nameQ)) return false
  const val = row.value ?? row.name ?? ''
  if (valueQ && !String(val).includes(valueQ)) return false
  return true
}

function groupMatches(group, nameQ, valueQ, scopeQ) {
  if (scopeQ && (group.applicationScope ?? '全局') !== scopeQ) return false
  if (!nameQ && !valueQ) return true
  if (matchesQuery({ name: group.name, value: group.value ?? group.name }, nameQ, valueQ)) return true
  return (group.children ?? []).some((c) => matchesQuery(c, nameQ, valueQ))
}

function buildVisibleRows(groups, expanded, nameQ, valueQ, scopeQ) {
  const rows = []
  const filtered = (nameQ || valueQ || scopeQ)
    ? groups.filter((g) => groupMatches(g, nameQ, valueQ, scopeQ))
    : groups
  const autoExpand = Boolean(nameQ || valueQ)

  filtered.forEach((group) => {
    rows.push({
      id: group.id,
      level: 1,
      rowType: 'group',
      name: group.name,
      value: group.value ?? group.name ?? '—',
      description: group.description,
      applicationScope: group.applicationScope ?? '全局',
      creator: group.creator,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      hasChildren: (group.children ?? []).length > 0,
      groupRef: group,
    })

    const groupExpanded = autoExpand || expanded.has(group.id)
    if (!groupExpanded) return

    ;(group.children ?? []).forEach((child) => {
      if (nameQ || valueQ) {
        const parentHit = matchesQuery({ name: group.name, value: group.value ?? group.name }, nameQ, valueQ)
        if (!parentHit && !matchesQuery(child, nameQ, valueQ)) return
      }
      rows.push({
        id: child.id,
        level: 2,
        rowType: 'leaf',
        name: child.name,
        value: child.value ?? child.name,
        description: child.description,
        applicationScope: group.applicationScope ?? '全局',
        creator: child.creator,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
        hasChildren: false,
        groupRef: group,
        childRef: child,
      })
    })
  })

  return rows
}

function ExpandToggle({ expanded, hasChildren, onClick }) {
  if (!hasChildren) return <span className="mr-1.5 inline-block w-5 shrink-0" />
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-1.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white text-xs font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600"
    >
      {expanded ? '−' : '+'}
    </button>
  )
}

export default function AuditReviewTagPanel({ templateId }) {
  const creatorName = useCurrentNickname()
  const template = getAuditTemplateById(templateId)
  const [tree, setTree] = useState(() => deepCloneTree(template?.tagTree ?? []))
  const [expanded, setExpanded] = useState(() => new Set())
  const [nameQuery, setNameQuery] = useState('')
  const [valueQuery, setValueQuery] = useState('')
  const [scopeQuery, setScopeQuery] = useState(APPLICATION_SCOPE_OPTIONS[0])
  const [appliedName, setAppliedName] = useState('')
  const [appliedValue, setAppliedValue] = useState('')
  const [appliedScope, setAppliedScope] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const syncStore = (next) => {
    setTree(next)
    saveAuditTemplateTagTree(templateId, next)
  }

  const visibleRows = useMemo(
    () => buildVisibleRows(tree, expanded, appliedName, appliedValue, appliedScope),
    [tree, expanded, appliedName, appliedValue, appliedScope],
  )

  const pageResetKey = `${appliedName}|${appliedValue}|${appliedScope}|${tree.length}`

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setEditingGroup(null)
    setModalOpen(true)
  }

  const openEdit = (group) => {
    setEditingGroup(group)
    setModalOpen(true)
  }

  const handleSave = (form) => {
    const nextGroup = formToGroup(form, editingGroup, creatorName)
    if (editingGroup) {
      syncStore(tree.map((g) => (g.id === editingGroup.id ? nextGroup : g)))
    } else {
      syncStore([nextGroup, ...tree])
    }
    setModalOpen(false)
    setEditingGroup(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.creator !== creatorName) return
    syncStore(tree.filter((g) => g.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const canManageGroup = (group) => group?.creator === creatorName

  const requestEdit = (group) => {
    if (!canManageGroup(group)) return
    openEdit(group)
  }

  const requestDelete = (group) => {
    if (!canManageGroup(group)) return
    setDeleteTarget(group)
  }

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      render: (_, row) => {
        const indent = row.level === 2 ? 20 : 0
        return (
          <div className="flex min-w-0 items-center" style={{ paddingLeft: indent }}>
            <ExpandToggle
              hasChildren={row.hasChildren}
              expanded={expanded.has(row.id)}
              onClick={() => toggleExpand(row.id)}
            />
            <span className="truncate font-bold text-gray-800">{row.name}</span>
          </div>
        )
      },
    },
    {
      title: '标签值',
      dataIndex: 'value',
      render: (v) => <span className="text-gray-600">{v || '—'}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v) => (
        <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span>
      ),
    },
    {
      title: '应用范围',
      dataIndex: 'applicationScope',
      render: (v) => <span className="text-gray-600">{v || '—'}</span>,
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
        if (row.level !== 1) return null
        const canManage = canManageGroup(row.groupRef)
        return (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {canManage ? (
              <PermAction
                permission="tag.edit"
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
                onClick={() => requestEdit(row.groupRef)}
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
                onClick={() => requestDelete(row.groupRef)}
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

  if (!template) {
    return <div className="py-12 text-center text-gray-400">模板不存在</div>
  }

  return (
    <ListPageCard>
      <ListPageFilter>
      <div className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">标签名称</label>
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="输入标签名称"
              className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">标签值</label>
            <input
              value={valueQuery}
              onChange={(e) => setValueQuery(e.target.value)}
              placeholder="输入标签值"
              className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">应用范围</label>
            <select
              value={scopeQuery}
              onChange={(e) => setScopeQuery(e.target.value)}
              className={filterSelectCls}
            >
              {APPLICATION_SCOPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => {
            setNameQuery('')
            setValueQuery('')
            setScopeQuery(APPLICATION_SCOPE_OPTIONS[0])
            setAppliedName('')
            setAppliedValue('')
            setAppliedScope('')
          }}
          >
            重置
          </Button>
          <Button variant="primary" onClick={() => {
            setAppliedName(nameQuery.trim())
            setAppliedValue(valueQuery.trim())
            setAppliedScope(scopeQuery)
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

      <Table embedded columns={columns} dataSource={visibleRows} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />

      <AuditReviewTagModal
        open={modalOpen}
        group={editingGroup}
        onCancel={() => { setModalOpen(false); setEditingGroup(null) }}
        onOk={handleSave}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </ListPageCard>
  )
}
