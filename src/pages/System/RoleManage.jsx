import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { countPermittedModules } from '../../mock/permissions'
import { useAuth } from '../../context/AuthContext'
import RolePermissionModal from './RolePermissionModal'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const inputCls = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const selCls = `${inputCls} cursor-pointer`

function TooltipWrap({ label, children }) {
  const anchorRef = useRef(null)
  const tipRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [tipStyle, setTipStyle] = useState({ left: 0, top: 0, opacity: 0 })

  const repositionTip = () => {
    const anchor = anchorRef.current
    const tipEl = tipRef.current
    if (!anchor || !tipEl) return

    const rect = anchor.getBoundingClientRect()
    const tipW = tipEl.offsetWidth
    const tipH = tipEl.offsetHeight
    const gap = 6
    const pad = 8
    const vw = window.innerWidth

    const centerX = rect.left + rect.width / 2
    let left = centerX - tipW / 2
    if (left + tipW > vw - pad) left = vw - pad - tipW
    if (left < pad) left = pad

    let top = rect.top - gap - tipH
    if (top < pad) top = rect.bottom + gap

    setTipStyle({ left, top, opacity: 1 })
  }

  useLayoutEffect(() => {
    if (!visible) return
    repositionTip()
    const onMove = () => repositionTip()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [visible, label])

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex shrink-0"
        onMouseEnter={() => {
          setTipStyle({ left: 0, top: 0, opacity: 0 })
          setVisible(true)
        }}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] w-max max-w-[calc(100vw-16px)] whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: tipStyle.left, top: tipStyle.top, opacity: tipStyle.opacity }}
        >
          {label}
        </div>,
        document.body,
      )}
    </>
  )
}

function StatusSwitch({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
      aria-label={enabled ? '启用' : '停用'}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function deleteDisabledReason(row) {
  if (row.type === '内置') return '内置角色不可删除'
  if (row.memberCount > 0) return '该角色下存在成员，无法删除'
  return null
}

export default function RoleManage() {
  const { roles, saveRolePermissions, addRole, toggleRoleStatus, deleteRole, can } = useAuth()
  const { ToastNode, show: toast } = useToast()
  const [qName, setQName] = useState('')
  const [qType, setQType] = useState('')
  const [filters, setFilters] = useState({})

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', type: '自定义' })
  const [createErrors, setCreateErrors] = useState({})
  const [permTarget, setPermTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const nextRoleId = useMemo(() => {
    const nums = roles.map((r) => parseInt(r.id.replace('R-', '')) || 0)
    return `R-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }, [roles])

  const setC = (k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }

  const handleCreate = () => {
    const errs = {}
    if (!createForm.name.trim())        errs.name        = true
    if (!createForm.description.trim()) errs.description = true
    if (Object.keys(errs).length) { setCreateErrors(errs); return }
    addRole({
      id: nextRoleId,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      permissions: [],
      moduleCount: 0,
      memberCount: 0,
      createdAt: nowDateTime(),
      type: createForm.type,
      status: '启用',
    })
    setCreateOpen(false)
    setCreateForm({ name: '', description: '', type: '自定义' })
    setCreateErrors({})
    toast('角色已创建，请配置权限')
  }

  const filtered = useMemo(() =>
    roles.filter((r) => {
      if (filters.name && !r.name.includes(filters.name)) return false
      if (filters.type && r.type !== filters.type) return false
      return true
    }),
    [roles, filters],
  )

  const applyFilters = () => setFilters({ name: qName.trim(), type: qType })
  const resetFilters = () => { setQName(''); setQType(''); setFilters({}) }

  const handleSavePermissions = (permissions) => {
    if (!permTarget) return
    saveRolePermissions(permTarget.id, permissions)
    setPermTarget(null)
    toast(`已更新「${permTarget.name}」权限（${countPermittedModules(permissions)} 个模块）`)
  }

  const handleToggleStatus = (row) => {
    const result = toggleRoleStatus(row.id)
    if (!result) return
    toast(`已${result.status}角色「${result.name}」`)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const name = deleteTarget.name
    deleteRole(deleteTarget.id)
    setDeleteTarget(null)
    toast(`已删除角色「${name}」`)
  }

  const columns = [
    { title: '角色ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '角色名称', dataIndex: 'name', render: (v) => <span className="font-medium">{v}</span> },
    { title: '角色描述', dataIndex: 'description', render: (v) => <span className="text-gray-500 max-w-xs truncate block" title={v}>{v}</span> },
    { title: '权限模块数', dataIndex: 'moduleCount' },
    { title: '成员数', dataIndex: 'memberCount' },
    dtCol('创建时间', 'createdAt'),
    { title: '类型', dataIndex: 'type', render: (v) => <Badge color={v === '内置' ? 'blue' : 'purple'}>{v}</Badge> },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v, row) => (
        <StatusSwitch
          enabled={v === '启用'}
          onToggle={() => handleToggleStatus(row)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => {
        const deleteReason = deleteDisabledReason(row)
        const canDelete = !deleteReason
        const deleteBtn = (
          <button
            type="button"
            disabled={!canDelete}
            onClick={canDelete ? () => setDeleteTarget(row) : undefined}
            className={`text-sm ${canDelete ? 'cursor-pointer text-red-500 hover:text-red-400' : 'cursor-not-allowed text-red-300 opacity-40'}`}
          >
            删除
          </button>
        )

        return (
          <div className="flex items-center justify-center gap-2">
            {can('system.role.assignPerm')
              ? <Button variant="link" size="sm" onClick={() => setPermTarget(row)}>编辑权限</Button>
              : <span className="text-xs text-gray-300">—</span>}
            {deleteReason
              ? <TooltipWrap label={deleteReason}>{deleteBtn}</TooltipWrap>
              : deleteBtn}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className={LBL}>角色名称</label>
              <input placeholder="请输入角色名称" value={qName} onChange={(e) => setQName(e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className={LBL}>角色类型</label>
              <select value={qType} onChange={(e) => setQType(e.target.value)} className={selCls}>
                <option value="">全部类型</option>
                <option value="内置">内置</option>
                <option value="自定义">自定义</option>
              </select>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={resetFilters}>重置</Button>
              <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">角色列表</h2>
          {can('system.role.create') && (
            <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>新建角色</Button>
          )}
        </div>
        <Table columns={columns} dataSource={filtered} />

        <Modal open={createOpen} title="新建角色"
          onCancel={() => { setCreateOpen(false); setCreateForm({ name: '', description: '', type: '自定义' }); setCreateErrors({}) }}
          onOk={handleCreate} okText="确认创建"
        >
          {(() => {
            const fCls = (err) => `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
            return (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">角色ID</label>
                  <input readOnly value={nextRoleId} className="h-8 w-full rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none cursor-default" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">角色名称<span className="text-red-500">*</span></label>
                  <input placeholder="请输入角色名称" value={createForm.name} onChange={(e) => setC('name', e.target.value)} className={fCls(createErrors.name)} />
                  {createErrors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">角色描述<span className="text-red-500">*</span></label>
                  <input placeholder="请输入角色描述" value={createForm.description} onChange={(e) => setC('description', e.target.value)} className={fCls(createErrors.description)} />
                  {createErrors.description && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">类型<span className="text-red-500">*</span></label>
                  <select value={createForm.type} onChange={(e) => setC('type', e.target.value)}
                    className="h-8 w-full cursor-pointer rounded-md border border-gray-300 px-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="自定义">自定义</option>
                    <option value="内置">内置</option>
                  </select>
                </div>
              </div>
            )
          })()}
        </Modal>

        <Modal
          open={!!deleteTarget}
          title="删除角色"
          onCancel={() => setDeleteTarget(null)}
          onOk={confirmDelete}
          okText="确定删除"
          width={480}
        >
          <p className="text-sm leading-relaxed text-gray-600">
            确定删除角色「<strong className="text-gray-800">{deleteTarget?.name}</strong>」？
            删除后不可恢复，且该角色将无法分配给用户。
          </p>
        </Modal>

        <RolePermissionModal
          open={!!permTarget}
          role={permTarget}
          onCancel={() => setPermTarget(null)}
          onSave={handleSavePermissions}
        />
        {ToastNode}
      </div>
    </div>
  )
}
