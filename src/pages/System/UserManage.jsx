import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { Input, Select } from '../../components/common/FormField'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { users as initialUsers, roleColor } from '../../mock/misc'
import { useAuth } from '../../context/AuthContext'

const roleNames = ['管理员', '平台运营', '采集员', '标注员', '游客', '工程师']

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const emptyCreate = { username: '', nickname: '', phone: '', role: '', status: '启用' }

export default function UserManage() {
  const { can } = useAuth()
  const [users, setUsers]   = useState(initialUsers)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({ nickname: '', role: '', status: '' })
  const [createOpen, setCreateOpen]     = useState(false)
  const [createForm, setCreateForm]     = useState(emptyCreate)
  const [createErrors, setCreateErrors] = useState({})

  const [qUid,      setQUid]      = useState('')
  const [qUsername, setQUsername] = useState('')
  const [qNickname, setQNickname] = useState('')
  const [qRole,     setQRole]     = useState('')
  const [qStatus,   setQStatus]   = useState('')
  const [filters, setFilters]     = useState({})

  const filtered = useMemo(() =>
    users.filter((u) => {
      const { uid, username, nickname, role, status } = filters
      if (uid      && !u.uid?.toLowerCase().includes(uid.toLowerCase()))           return false
      if (username && !u.username.toLowerCase().includes(username.toLowerCase())) return false
      if (nickname && !u.nickname.includes(nickname))   return false
      if (role     && u.role   !== role)                  return false
      if (status   && u.status !== status)                return false
      return true
    }),
    [users, filters],
  )

  const applyFilters = () => setFilters({
    uid: qUid.trim(),
    username: qUsername.trim(),
    nickname: qNickname.trim(),
    role: qRole,
    status: qStatus,
  })

  const resetFilters = () => {
    setQUid('')
    setQUsername('')
    setQNickname('')
    setQRole('')
    setQStatus('')
    setFilters({})
  }

  const setC = (k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }

  const handleCreateUser = () => {
    const errs = {}
    if (!createForm.username.trim()) errs.username = true
    if (!createForm.nickname.trim()) errs.nickname  = true
    if (!createForm.phone.trim())    errs.phone     = true
    if (!createForm.role)            errs.role      = true
    if (Object.keys(errs).length) { setCreateErrors(errs); return }
    const maxId = Math.max(...users.map((u) => u.id), 0)
    const uid   = `U-${String(maxId + 1).padStart(3, '0')}`
    setUsers([{ id: maxId + 1, uid, ...createForm }, ...users])
    setCreateOpen(false); setCreateForm(emptyCreate); setCreateErrors({})
  }

  const openEdit = (user) => { setEditing(user.id); setForm({ nickname: user.nickname, role: user.role, status: user.status }) }
  const handleSave = () => { setUsers((l) => l.map((u) => (u.id === editing ? { ...u, ...form } : u))); setEditing(null) }

  const columns = [
    { title: '用户ID', dataIndex: 'uid', render: (v) => <span className="font-medium text-blue-600">{v ?? '—'}</span> },
    { title: '用户名', dataIndex: 'username', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: '昵称', dataIndex: 'nickname', render: (v) => <span className="font-medium">{v}</span> },
    { title: '手机号', dataIndex: 'phone' },
    { title: '角色', dataIndex: 'role', render: (v) => <Badge color={roleColor[v]}>{v}</Badge> },
    { title: '状态', dataIndex: 'status', render: (v) => <Badge color={v === '启用' ? 'green' : 'gray'} dot>{v}</Badge> },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => can('system.user.edit')
        ? <Button variant="link" size="sm" onClick={() => openEdit(row)}>编辑</Button>
        : <span className="text-xs text-gray-300">—</span>,
    },
  ]

  const fieldCls = (err) => `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
  const fSelCls  = (err) => `h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`
  const Req = ({ label }) => <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">{label}<span className="text-red-500">*</span></label>

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">用户管理</h2>
      </div>

      <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>用户ID</label>
              <input placeholder="请输入用户ID" value={qUid} onChange={(e) => setQUid(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>用户名</label>
              <input placeholder="请输入用户名" value={qUsername} onChange={(e) => setQUsername(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>昵称</label>
              <input placeholder="请输入昵称" value={qNickname} onChange={(e) => setQNickname(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>角色</label>
              <select value={qRole} onChange={(e) => setQRole(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                <option value="">全部角色</option>
                {roleNames.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>状态</label>
              <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                <option value="">全部状态</option>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">用户列表</h2>
        {can('system.user.create') && (
          <Button variant="primary" icon={<IconPlus />} onClick={() => setCreateOpen(true)}>新增用户</Button>
        )}
      </div>
      <Table columns={columns} dataSource={filtered} />

      <Modal open={createOpen} title="新增用户"
        onCancel={() => { setCreateOpen(false); setCreateForm(emptyCreate); setCreateErrors({}) }}
        onOk={handleCreateUser} okText="确认添加">
        <div className="space-y-4">
          <div><Req label="用户名" /><input placeholder="请输入用户名" value={createForm.username} onChange={(e) => setC('username', e.target.value)} className={fieldCls(createErrors.username)} />
            {createErrors.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}</div>
          <div><Req label="昵称" /><input placeholder="请输入昵称" value={createForm.nickname} onChange={(e) => setC('nickname', e.target.value)} className={fieldCls(createErrors.nickname)} />
            {createErrors.nickname && <p className="mt-1 text-xs text-red-500">请填写此项</p>}</div>
          <div><Req label="手机号" /><input placeholder="请输入手机号" value={createForm.phone} onChange={(e) => setC('phone', e.target.value)} className={fieldCls(createErrors.phone)} />
            {createErrors.phone && <p className="mt-1 text-xs text-red-500">请填写此项</p>}</div>
          <div><Req label="角色" />
            <select value={createForm.role} onChange={(e) => setC('role', e.target.value)} className={fSelCls(createErrors.role)}>
              <option value="" disabled hidden>请选择角色</option>
              {roleNames.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {createErrors.role && <p className="mt-1 text-xs text-red-500">请填写此项</p>}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
            <select value={createForm.status} onChange={(e) => setC('status', e.target.value)} className={fSelCls(false)}>
              <option value="启用">启用</option><option value="停用">停用</option>
            </select></div>
        </div>
      </Modal>

      <Modal open={!!editing} title="编辑用户" onCancel={() => setEditing(null)} onOk={handleSave} okText="保存">
        <div className="space-y-4">
          <Input label="昵称" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          <Select label="角色" value={form.role} options={roleNames.map((r) => ({ value: r, label: r }))} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Select label="状态" value={form.status} options={['启用', '停用'].map((s) => ({ value: s, label: s }))} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
      </Modal>
      </div>
    </div>
  )
}