import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { Input, Select } from '../../components/common/FormField'
import { IconPlus } from '../../components/common/Icons'
import { users as initialUsers, roleColor } from '../../mock/misc'

const roles    = ['管理员', '平台运营', '采集员', '标注员']
const inputCls = 'h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const selCls   = 'h-8 cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'

const emptyCreate = { username: '', nickname: '', phone: '', role: '', status: '启用' }

export default function SystemManage() {
  const [users, setUsers]   = useState(initialUsers)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({ nickname: '', role: '', status: '' })

  const [createOpen, setCreateOpen]     = useState(false)
  const [createForm, setCreateForm]     = useState(emptyCreate)
  const [createErrors, setCreateErrors] = useState({})

  const setC = (k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }

  const handleCreateUser = () => {
    const errs = {}
    if (!createForm.username.trim()) errs.username = true
    if (!createForm.nickname.trim()) errs.nickname  = true
    if (!createForm.phone.trim())    errs.phone     = true
    if (!createForm.role)            errs.role      = true
    if (Object.keys(errs).length) { setCreateErrors(errs); return }

    const maxId = Math.max(...users.map((u) => u.id), 0)
    setUsers([{ id: maxId + 1, ...createForm }, ...users])
    setCreateOpen(false)
    setCreateForm(emptyCreate)
    setCreateErrors({})
  }

  const [queryUsername, setQueryUsername] = useState('')
  const [queryNickname, setQueryNickname] = useState('')
  const [queryRole,     setQueryRole]     = useState('')
  const [queryStatus,   setQueryStatus]   = useState('')

  const filtered = useMemo(() =>
    users.filter((u) => {
      if (queryUsername && !u.username.toLowerCase().includes(queryUsername.toLowerCase())) return false
      if (queryNickname && !u.nickname.includes(queryNickname))                             return false
      if (queryRole   && u.role   !== queryRole)                                            return false
      if (queryStatus && u.status !== queryStatus)                                          return false
      return true
    }),
    [users, queryUsername, queryNickname, queryRole, queryStatus],
  )

  const reset = () => {
    setQueryUsername(''); setQueryNickname(''); setQueryRole(''); setQueryStatus('')
  }

  const openEdit = (user) => {
    setEditing(user.id)
    setForm({ nickname: user.nickname, role: user.role, status: user.status })
  }

  const handleSave = () => {
    setUsers((list) => list.map((u) => (u.id === editing ? { ...u, ...form } : u)))
    setEditing(null)
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '昵称', dataIndex: 'nickname', render: (v) => <span className="font-medium">{v}</span> },
    { title: '手机号', dataIndex: 'phone' },
    { title: '角色', dataIndex: 'role', render: (v) => <Badge color={roleColor[v]}>{v}</Badge> },
    { title: '状态', dataIndex: 'status', render: (v) => <Badge color={v === '启用' ? 'green' : 'gray'} dot>{v}</Badge> },
    { title: '操作', key: 'actions', render: (_, row) => <Button variant="link" size="sm" onClick={() => openEdit(row)}>编辑</Button> },
  ]

  return (
    <div className="space-y-3">
      {/* 筛选区 */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">用户名</label>
            <input placeholder="请输入用户名" value={queryUsername} onChange={(e) => setQueryUsername(e.target.value)} className={`${inputCls} w-36`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">昵称</label>
            <input placeholder="请输入昵称" value={queryNickname} onChange={(e) => setQueryNickname(e.target.value)} className={`${inputCls} w-36`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">角色</label>
            <select value={queryRole} onChange={(e) => setQueryRole(e.target.value)} className={`${selCls} w-28`}>
              <option value="">全部</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">状态</label>
            <select value={queryStatus} onChange={(e) => setQueryStatus(e.target.value)} className={`${selCls} w-24`}>
              <option value="">全部</option>
              <option value="启用">启用</option>
              <option value="停用">停用</option>
            </select>
          </div>
          <button onClick={reset} className="h-8 cursor-pointer rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50">
            重置
          </button>
        </div>
      </div>

      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">用户列表</h2>
        <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>新增用户</Button>
      </div>

      <Table columns={columns} dataSource={filtered} />

      {/* 新增用户弹窗 */}
      <Modal open={createOpen} title="新增用户"
        onCancel={() => { setCreateOpen(false); setCreateForm(emptyCreate); setCreateErrors({}) }}
        onOk={handleCreateUser} okText="确认添加"
      >
        {(() => {
          const fieldCls = (err) => `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
          const selCls   = (err) => `h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
          const Label = ({ label }) => (
            <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              {label}<span className="text-red-500">*</span>
            </label>
          )
          return (
            <div className="space-y-4">
              <div>
                <Label label="用户名" />
                <input placeholder="请输入用户名" value={createForm.username} onChange={(e) => setC('username', e.target.value)} className={fieldCls(createErrors.username)} />
                {createErrors.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
              </div>
              <div>
                <Label label="昵称" />
                <input placeholder="请输入昵称" value={createForm.nickname} onChange={(e) => setC('nickname', e.target.value)} className={fieldCls(createErrors.nickname)} />
                {createErrors.nickname && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
              </div>
              <div>
                <Label label="手机号" />
                <input placeholder="请输入手机号" value={createForm.phone} onChange={(e) => setC('phone', e.target.value)} className={fieldCls(createErrors.phone)} />
                {createErrors.phone && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
              </div>
              <div>
                <Label label="角色" />
                <select value={createForm.role} onChange={(e) => setC('role', e.target.value)} className={selCls(createErrors.role)}>
                  <option value="" disabled hidden>请选择角色</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {createErrors.role && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
                <select value={createForm.status} onChange={(e) => setC('status', e.target.value)} className={selCls(false)}>
                  <option value="启用">启用</option>
                  <option value="停用">停用</option>
                </select>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal open={!!editing} title="编辑用户" onCancel={() => setEditing(null)} onOk={handleSave} okText="保存">
        <div className="space-y-4">
          <Input label="昵称" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          <Select label="角色" value={form.role} options={roles.map((r) => ({ value: r, label: r }))} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Select label="状态" value={form.status} options={['启用', '停用'].map((s) => ({ value: s, label: s }))} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
