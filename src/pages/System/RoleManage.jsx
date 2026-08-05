import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Drawer from '../../components/common/Drawer'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'
import RolePermissionModal from './RolePermissionModal'
import MenuPermissionTree, { normalizeRolePermissions } from './MenuPermissionTree'
import ProjectDataTransfer from './ProjectDataTransfer'
import { DescriptionField } from '../../components/common/FormField'
import { projects } from '../../mock/projects'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'

const LBL = 'mb-1 block text-xs text-gray-500'
const inputCls = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const selCls = `${inputCls} cursor-pointer`

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



export default function RoleManage() {
  const { roles, updateRole, addRole, toggleRoleStatus, deleteRole, can } = useAuth()
  const { ToastNode, show: toast } = useToast()
  const [qName, setQName] = useState('')
  const [qType, setQType] = useState('')
  const [qStatus, setQStatus] = useState('')
  const [filters, setFilters] = useState({})

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [createMenuPermissions, setCreateMenuPermissions] = useState([])
  const [createProjectIds, setCreateProjectIds] = useState([])
  const [createErrors, setCreateErrors] = useState({})
  const [permTarget, setPermTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const nextRoleId = useMemo(() => {
    const nums = roles.map((r) => parseInt(r.id.replace('R-', '')) || 0)
    return `R-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`
  }, [roles])

  const setC = (k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }

  const resetCreateForm = () => {
    setCreateForm({ name: '', description: '' })
    setCreateMenuPermissions([])
    setCreateProjectIds([])
    setCreateErrors({})
  }

  const handleCreate = () => {
    const errs = {}
    if (!createForm.name.trim()) errs.name = true
    if (Object.keys(errs).length) { setCreateErrors(errs); return }
    addRole({
      id: nextRoleId,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      permissions: normalizeRolePermissions(createMenuPermissions),
      projectIds: [...createProjectIds],
      createdAt: nowDateTime(),
      type: '自定义',
      status: '启用',
    })
    setCreateOpen(false)
    resetCreateForm()
    toast('角色已创建')
  }

  const filtered = useMemo(() =>
    roles.filter((r) => {
      if (filters.name && !r.name.includes(filters.name)) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.status && r.status !== filters.status) return false
      return true
    }),
    [roles, filters],
  )

  const applyFilters = () => setFilters({ name: qName.trim(), type: qType, status: qStatus })
  const resetFilters = () => { setQName(''); setQType(''); setQStatus(''); setFilters({}) }

  const handleSavePermissions = ({ name, description, permissions, projectIds }) => {
    if (!permTarget) return
    const patch = { name, description, permissions }
    if (permTarget.type !== '内置') {
      patch.projectIds = projectIds ?? []
    }
    updateRole(permTarget.id, patch)
    setPermTarget(null)
    toast(`已更新「${name}」`)
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
    { title: '角色ID', dataIndex: 'id', render: (v) => <span className="text-gray-700">{v}</span> },
    { title: '角色名称', dataIndex: 'name', render: (v) => <span className="text-gray-800">{v}</span> },
    { title: '描述', dataIndex: 'description', render: (v) => <span className="text-gray-500 max-w-xs truncate block" title={v}>{v}</span> },
    { title: '权限数', dataIndex: 'moduleCount' },
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
        const isBuiltin = row.type === '内置'

        return (
          <div className="flex items-center justify-center gap-2">
            {can('system.role.assignPerm')
              ? <Button variant="link" size="sm" onClick={() => setPermTarget(row)}>编辑</Button>
              : <span className="text-xs text-gray-300">—</span>}
            {!isBuiltin && (
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="cursor-pointer text-sm text-red-500 hover:text-red-400"
              >
                删除
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <ListPageCard>
        <ListPageFilter>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className={LBL}>角色名称</label>
              <input placeholder="请输入角色名称" value={qName} onChange={(e) => setQName(e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className={LBL}>角色类型</label>
              <select value={qType} onChange={(e) => setQType(e.target.value)} className={selCls}>
                <option value="">全部</option>
                <option value="内置">内置</option>
                <option value="自定义">自定义</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className={LBL}>状态</label>
              <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={selCls}>
                <option value="">全部</option>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={resetFilters}>重置</Button>
              <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
            </div>
          </div>
        </ListPageFilter>
        <ListPageToolbar>
          <h2 className="text-base font-semibold text-gray-800">角色列表</h2>
          {can('system.role.create') && (
            <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>新建</Button>
          )}
        </ListPageToolbar>
        <Table embedded columns={columns} dataSource={filtered} />
      </ListPageCard>

        <Drawer
          open={createOpen}
          title="新建角色"
          onCancel={() => { setCreateOpen(false); resetCreateForm() }}
          onOk={handleCreate}
          okText="确定"
          width="min(920px, calc(100vw - var(--layout-sidebar-width, 13rem)))"
        >
          {(() => {
            const fCls = (err) => `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
            return (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">角色名称<span className="text-red-500">*</span></label>
                  <input placeholder="请输入角色名称" value={createForm.name} onChange={(e) => setC('name', e.target.value)} className={fCls(createErrors.name)} />
                  {createErrors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
                </div>
                <DescriptionField
                  value={createForm.description}
                  onChange={(e) => setC('description', e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">菜单权限</label>
                  <MenuPermissionTree value={createMenuPermissions} onChange={setCreateMenuPermissions} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">数据权限</label>
                  <ProjectDataTransfer
                    projects={projects}
                    value={createProjectIds}
                    onChange={setCreateProjectIds}
                  />
                </div>
              </div>
            )
          })()}
        </Drawer>

        <DeleteConfirmModal
          open={!!deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        <RolePermissionModal
          open={!!permTarget}
          role={permTarget}
          onCancel={() => setPermTarget(null)}
          onSave={handleSavePermissions}
        />
        {ToastNode}
    </div>
  )
}
