import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { IconPlus } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { countPermittedModules } from '../../mock/permissions'
import { useAuth } from '../../context/AuthContext'
import RolePermissionModal from './RolePermissionModal'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const inputCls = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const selCls = `${inputCls} cursor-pointer`

export default function RoleManage() {
  const { roles, saveRolePermissions, addRole, can } = useAuth()
  const { ToastNode, show: toast } = useToast()
  const [queryName, setQueryName] = useState('')
  const [queryType, setQueryType] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', type: '自定义' })
  const [createErrors, setCreateErrors] = useState({})
  const [permTarget, setPermTarget] = useState(null)

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
    })
    setCreateOpen(false)
    setCreateForm({ name: '', description: '', type: '自定义' })
    setCreateErrors({})
    toast('角色已创建，请配置权限')
  }

  const filtered = useMemo(() =>
    roles.filter((r) => {
      if (queryName && !r.name.includes(queryName)) return false
      if (queryType && r.type !== queryType)         return false
      return true
    }),
    [roles, queryName, queryType],
  )

  const handleSavePermissions = (permissions) => {
    if (!permTarget) return
    saveRolePermissions(permTarget.id, permissions)
    setPermTarget(null)
    toast(`已更新「${permTarget.name}」权限（${countPermittedModules(permissions)} 个模块）`)
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
      title: '操作',
      key: 'actions',
      render: (_, row) => can('system.role.assignPerm')
        ? <Button variant="link" size="sm" onClick={() => setPermTarget(row)}>编辑权限</Button>
        : <span className="text-xs text-gray-300">—</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">角色管理</h2>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div><label className={LBL}>角色名称</label>
              <input placeholder="请输入角色名称" value={queryName} onChange={(e) => setQueryName(e.target.value)} className={`${inputCls} w-40`} /></div>
            <div><label className={LBL}>角色类型</label>
              <select value={queryType} onChange={(e) => setQueryType(e.target.value)} className={`${selCls} w-28`}>
                <option value="">全部类型</option>
                <option value="内置">内置</option>
                <option value="自定义">自定义</option>
              </select></div>
            <button onClick={() => { setQueryName(''); setQueryType('') }}
              className="h-8 cursor-pointer rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50">重置</button>
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
