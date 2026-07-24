import { useMemo, useState } from 'react'

import Table from '../../components/common/Table'

import Badge from '../../components/common/Badge'

import Button from '../../components/common/Button'

import Modal from '../../components/common/Modal'

import { IconPlus, IconSearch } from '../../components/common/Icons'

import { PermAction } from '../../components/common/PermissionAction'

import { roleColor } from '../../mock/misc'

import { ORG_ADMIN_ROLE, SUPER_ADMIN_ROLE } from '../../mock/permissions'

import {

  appendOrgUser,

  deleteRuntimeUser,

  DEMO_ORG_ID,

  getOrganizations,

  getRuntimeUsers,

  replaceRuntimeUsers,

  updateRuntimeUser,

} from '../../mock/organizations'

import { useAuth } from '../../context/AuthContext'

import { dtCol, formatRelativeTime, nowDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'



const LBL = 'mb-1 block text-xs text-gray-500'

const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'



const emptyCreate = {

  username: '',

  password: '',

  nickname: '',

  phone: '',

  email: '',

  remark: '',

  role: '',

  status: '启用',

}



const emptyEdit = {

  nickname: '',

  phone: '',

  email: '',

  remark: '',

  role: '',

  status: '启用',

}



function toDisplayStatus(status) {

  return status === '停用' ? '停用' : '启用'

}



function toStoreStatus(status) {

  return status === '停用' ? '停用' : '启用'

}



function PasswordInput({ value, onChange, className, error }) {

  const [show, setShow] = useState(false)

  return (

    <div className="relative">

      <input

        type={show ? 'text' : 'password'}

        value={value}

        onChange={onChange}

        placeholder="请输入密码"

        className={className}

      />

      <button

        type="button"

        onClick={() => setShow((v) => !v)}

        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-xs text-gray-400 hover:text-gray-600"

      >

        {show ? '隐藏' : '显示'}

      </button>

      {error && <p className="mt-1 text-xs text-red-500">请填写此项</p>}

    </div>

  )

}



function RemarkField({ value, onChange, max = 500 }) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">备注</label>

      <textarea

        rows={4}

        value={value}

        maxLength={max}

        onChange={onChange}

        placeholder="请输入备注信息"

        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

      />

      <p className="mt-1 text-right text-xs text-gray-400">{value.length} / {max}</p>

    </div>

  )

}



function ReadonlyField({ label, value }) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>

      <input

        readOnly

        value={value}

        className="h-8 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"

      />

    </div>

  )

}



function StatusSwitch({ enabled, disabled, onToggle }) {

  return (

    <button

      type="button"

      disabled={disabled}

      onClick={onToggle}

      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${

        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'

      } ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}

      aria-label={enabled ? '启用' : '停用'}

    >

      <span

        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`}

      />

    </button>

  )

}



function StatusRadio({ name, value, onChange }) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>

      <div className="flex items-center gap-6">

        {['启用', '停用'].map((s) => (

          <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">

            <input

              type="radio"

              name={name}

              checked={value === s}

              onChange={() => onChange(s)}

              className="h-4 w-4 accent-blue-600"

            />

            {s}

          </label>

        ))}

      </div>

    </div>

  )

}



/**

 * @param {'global'|'org'} variant — global: 系统用户管理；org: 组织详情内用户列表

 */

export default function UserListPanel({

  variant = 'global',

  orgId = null,

  orgName = '',

  listTitle = '用户列表',

  onUsersChange,

}) {

  const { can, user: currentUser, roles, enabledRoles } = useAuth()

  const isSuperAdmin = currentUser?.role === SUPER_ADMIN_ROLE



  const [users, setUsers] = useState(() => getRuntimeUsers())

  const [organizations, setOrganizations] = useState(() => getOrganizations())

  const [editingUser, setEditingUser] = useState(null)

  const [editForm, setEditForm] = useState(emptyEdit)

  const [createOpen, setCreateOpen] = useState(false)

  const [createForm, setCreateForm] = useState(emptyCreate)

  const [createErrors, setCreateErrors] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)



  const [qUid, setQUid] = useState('')

  const [qUsername, setQUsername] = useState('')

  const [qNickname, setQNickname] = useState('')

  const [qOrgId, setQOrgId] = useState('')

  const [qRole, setQRole] = useState('')

  const [qStatus, setQStatus] = useState('')

  const [filters, setFilters] = useState({})



  const orgMap = useMemo(() => {

    const map = new Map()

    organizations.forEach((o) => map.set(o.id, o.name))

    return map

  }, [organizations])



  const currentUserOrgId = useMemo(() => {

    const u = getRuntimeUsers().find((x) => x.uid === currentUser?.uid)

    if (u?.orgId) return u.orgId

    return DEMO_ORG_ID

  }, [currentUser?.uid])



  const currentUserOrgName = orgMap.get(currentUserOrgId) ?? '—'

  const readonlyOrgName = variant === 'org' ? orgName : currentUserOrgName



  const refreshUsers = () => {

    const next = getRuntimeUsers()

    setUsers(next)

    setOrganizations(getOrganizations())

    onUsersChange?.(next)

  }



  const scopedUsers = useMemo(() => {

    if (!orgId) return users

    return users.filter((u) => u.orgId === orgId)

  }, [users, orgId])



  const relativeNow = useMemo(() => new Date(), [users])



  const allRoleNames = useMemo(() => roles.map((r) => r.name), [roles])



  const assignableRoleNames = useMemo(() =>

    enabledRoles

      .map((r) => r.name)

      .filter((name) => name !== ORG_ADMIN_ROLE && name !== SUPER_ADMIN_ROLE),

    [enabledRoles],

  )



  const editRoleOptions = useMemo(() => {

    const names = new Set(assignableRoleNames)

    if (editForm.role) names.add(editForm.role)

    return [...names]

  }, [assignableRoleNames, editForm.role])



  const filtered = useMemo(() =>

    scopedUsers.filter((u) => {

      const { uid, username, nickname, orgId: fOrgId, role, status } = filters

      if (uid && !u.uid?.toLowerCase().includes(uid.toLowerCase())) return false

      if (username && !u.username.toLowerCase().includes(username.toLowerCase())) return false

      if (nickname && !u.nickname.includes(nickname)) return false

      if (fOrgId && u.orgId !== fOrgId) return false

      if (role && u.role !== role) return false

      if (status && u.status !== status) return false

      return true

    }),

    [scopedUsers, filters],

  )

  const pageResetKey = useMemo(() => `${JSON.stringify(filters)}:${filtered.length}`, [filters, filtered.length])

  const applyFilters = () => setFilters({

    uid: qUid.trim(),

    username: qUsername.trim(),

    nickname: qNickname.trim(),

    orgId: qOrgId,

    role: qRole,

    status: qStatus,

  })



  const resetFilters = () => {

    setQUid('')

    setQUsername('')

    setQNickname('')

    setQOrgId('')

    setQRole('')

    setQStatus('')

    setFilters({})

  }



  const setC = (k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }



  const handleCreateUser = () => {

    const errs = {}

    if (!createForm.username.trim()) errs.username = true

    if (!createForm.password.trim()) errs.password = true

    if (!createForm.nickname.trim()) errs.nickname = true

    if (variant === 'global' && !createForm.role) errs.role = true

    if (Object.keys(errs).length) { setCreateErrors(errs); return }



    const maxId = Math.max(...users.map((u) => u.id), 0)

    const uid = `U-${String(maxId + 1).padStart(3, '0')}`

    const now = nowDateTime()

    const targetOrgId = variant === 'org' ? orgId : currentUserOrgId



    appendOrgUser({

      id: maxId + 1,

      uid,

      username: createForm.username.trim(),

      nickname: createForm.nickname.trim(),

      phone: createForm.phone.trim(),

      email: createForm.email.trim(),

      remark: createForm.remark.trim(),

      role: variant === 'org' ? ORG_ADMIN_ROLE : createForm.role,

      orgId: targetOrgId,

      status: toStoreStatus(createForm.status),

      createdAt: now,

      lastLoginAt: null,

    })

    refreshUsers()

    setCreateOpen(false)

    setCreateForm(emptyCreate)

    setCreateErrors({})

  }



  const openEdit = (user) => {

    setEditingUser(user)

    setEditForm({

      nickname: user.nickname,

      phone: user.phone ?? '',

      email: user.email ?? '',

      remark: user.remark ?? '',

      role: user.role,

      status: toDisplayStatus(user.status),

    })

  }



  const handleSave = () => {

    if (!editingUser) return

    updateRuntimeUser(editingUser.id, {

      nickname: editForm.nickname.trim(),

      phone: editForm.phone.trim(),

      email: editForm.email.trim(),

      remark: editForm.remark.trim(),

      role: variant === 'org' ? ORG_ADMIN_ROLE : editForm.role,

      status: toStoreStatus(editForm.status),

    })

    refreshUsers()

    setEditingUser(null)

  }



  const confirmDelete = () => {

    if (!deleteTarget) return

    deleteRuntimeUser(deleteTarget.id)

    refreshUsers()

    setDeleteTarget(null)

  }



  const handleToggleStatus = (row) => {

    const next = row.status === '启用' ? '停用' : '启用'

    updateRuntimeUser(row.id, { status: next })

    refreshUsers()

  }



  const canEdit = can('system.user.edit')

  const canDelete = can('system.user.delete')



  const columns = [

    { title: '用户ID', dataIndex: 'uid', render: (v) => <span className="font-medium text-blue-600">{v ?? '—'}</span> },

    { title: '账号', dataIndex: 'username', render: (v) => <span className="font-mono text-xs">{v}</span> },

    { title: '用户昵称', dataIndex: 'nickname', render: (v) => <span className="font-medium">{v}</span> },

    {

      title: '所属组织',

      dataIndex: 'orgId',

      render: (v) => <span className="text-gray-600">{v ? (orgMap.get(v) ?? '—') : '—'}</span>,

    },

    { title: '角色', dataIndex: 'role', render: (v) => <Badge color={roleColor[v] ?? 'gray'}>{v}</Badge> },

    { title: '手机号', dataIndex: 'phone', render: (v) => v || '—' },

    { title: '邮箱', dataIndex: 'email', render: (v) => <span className="text-gray-600">{v || '—'}</span> },

    { title: '状态', dataIndex: 'status', render: (v, row) => {
      const isSelf = currentUser?.uid === row.uid
      return (
        <StatusSwitch
          enabled={v === '启用'}
          disabled={!canEdit || isSelf}
          onToggle={() => handleToggleStatus(row)}
        />
      )
    } },

    dtCol('创建时间', 'createdAt'),

    {

      title: '最后登录',

      dataIndex: 'lastLoginAt',

      render: (v) => (

        <span className="text-gray-600">{formatRelativeTime(v, relativeNow)}</span>

      ),

    },

    {

      title: '操作',

      key: 'actions',

      render: (_, row) => {

        if (!canEdit && !canDelete) return <span className="text-xs text-gray-300">—</span>

        const isSelf = currentUser?.uid === row.uid

        return (

          <div className="flex items-center justify-center gap-2">

            {canEdit && (

              <Button variant="link" size="sm" onClick={() => openEdit(row)}>编辑</Button>

            )}

            {canDelete && !isSelf && (

              <PermAction

                permission="system.user.delete"

                mode="hide"

                className="cursor-pointer text-sm text-red-500 hover:text-red-400"

                onClick={() => setDeleteTarget(row)}

              >

                删除

              </PermAction>

            )}

          </div>

        )

      },

    },

  ]



  const fieldCls = (err) => `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`

  const fSelCls = (err) => `h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none focus:ring-2 ${err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`

  const Req = ({ label }) => <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">{label}<span className="text-red-500">*</span></label>



  const createTitle = variant === 'org' ? '新建组织管理员' : '新建用户'

  const createButtonLabel = variant === 'org' ? '新建组织管理员' : '新建用户'



  const renderUserFormFields = ({ mode }) => {

    const isCreate = mode === 'create'

    const form = isCreate ? createForm : editForm

    const setForm = isCreate

      ? (k, v) => setC(k, v)

      : (k, v) => setEditForm((f) => ({ ...f, [k]: v }))

    const errors = isCreate ? createErrors : {}



    return (

      <div className="space-y-4">

        {isCreate ? (

          <div>

            <Req label="账号" />

            <input

              placeholder="请输入账号"

              value={form.username}

              onChange={(e) => setForm('username', e.target.value)}

              className={fieldCls(errors.username)}

            />

            {errors.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}

          </div>

        ) : (

          <ReadonlyField label="账号" value={editingUser?.username ?? ''} />

        )}



        {isCreate && (

          <div>

            <Req label="密码" />

            <PasswordInput

              value={form.password}

              onChange={(e) => setForm('password', e.target.value)}

              className={fieldCls(errors.password)}

              error={errors.password}

            />

          </div>

        )}



        <div>

          <Req label="用户昵称" />

          <input

            placeholder="请输入用户昵称"

            value={form.nickname}

            onChange={(e) => setForm('nickname', e.target.value)}

            className={fieldCls(isCreate && errors.nickname)}

          />

          {isCreate && errors.nickname && <p className="mt-1 text-xs text-red-500">请填写此项</p>}

        </div>



        <ReadonlyField label="所属组织" value={readonlyOrgName} />



        {variant === 'org' ? (

          <ReadonlyField label="角色" value={ORG_ADMIN_ROLE} />

        ) : (

          <div>

            <Req label="角色" />

            <select
              value={form.role}
              onChange={(e) => setForm('role', e.target.value)}
              className={fSelCls(isCreate && errors.role)}
            >

              {isCreate && <option value="" disabled hidden>请选择角色</option>}

              {(isCreate ? assignableRoleNames : editRoleOptions).map((r) => (

                <option key={r} value={r}>{r}</option>

              ))}

            </select>

            {isCreate && errors.role && <p className="mt-1 text-xs text-red-500">请填写此项</p>}

          </div>

        )}



        <div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">手机号</label>

          <input

            placeholder="请输入手机号"

            value={form.phone}

            onChange={(e) => setForm('phone', e.target.value)}

            className={fieldCls(false)}

          />

        </div>



        <div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">邮箱</label>

          <input

            placeholder="请输入邮箱"

            value={form.email}

            onChange={(e) => setForm('email', e.target.value)}

            className={fieldCls(false)}

          />

        </div>



        <StatusRadio

          name={isCreate ? 'create-user-status' : 'edit-user-status'}

          value={form.status}

          onChange={(s) => setForm('status', s)}

        />



        <RemarkField

          value={form.remark}

          onChange={(e) => setForm('remark', e.target.value)}

        />

      </div>

    )

  }



  return (

    <div className="space-y-3">

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">

        <div className="flex flex-wrap items-end gap-3">

          <div className="flex min-w-0 flex-1 items-end gap-3">

            <div className="min-w-0 flex-1 basis-0">

              <label className={LBL}>用户ID</label>

              <input placeholder="请输入用户ID" value={qUid} onChange={(e) => setQUid(e.target.value)} className={INPUT_CLS} />

            </div>

            <div className="min-w-0 flex-1 basis-0">

              <label className={LBL}>账号</label>

              <input placeholder="请输入账号" value={qUsername} onChange={(e) => setQUsername(e.target.value)} className={INPUT_CLS} />

            </div>

            <div className="min-w-0 flex-1 basis-0">

              <label className={LBL}>用户昵称</label>

              <input placeholder="请输入用户昵称" value={qNickname} onChange={(e) => setQNickname(e.target.value)} className={INPUT_CLS} />

            </div>

            {variant === 'global' && isSuperAdmin && (

              <div className="min-w-0 flex-1 basis-0">

                <label className={LBL}>所属组织</label>

                <select value={qOrgId} onChange={(e) => setQOrgId(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>

                  <option value="">全部</option>

                  {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}

                </select>

              </div>

            )}

            <div className="min-w-0 flex-1 basis-0">

              <label className={LBL}>角色</label>

              <select value={qRole} onChange={(e) => setQRole(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>

                <option value="">全部</option>

                {allRoleNames.map((r) => <option key={r} value={r}>{r}</option>)}

              </select>

            </div>

            <div className="min-w-0 flex-1 basis-0">

              <label className={LBL}>状态</label>

              <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>

                <option value="">全部</option>

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

        <h2 className="text-base font-semibold text-gray-800">{listTitle}</h2>

        {can('system.user.create') && (

          <Button

            variant="primary"

            icon={<IconPlus />}

            onClick={() => {

              setCreateForm({ ...emptyCreate })

              setCreateErrors({})

              setCreateOpen(true)

            }}

          >

            {createButtonLabel}

          </Button>

        )}

      </div>

      <Table columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />



      <Modal

        open={createOpen}

        title={createTitle}

        onCancel={() => {

          setCreateOpen(false)

          setCreateForm(emptyCreate)

          setCreateErrors({})

        }}

        onOk={handleCreateUser}

        okText="确定"

        width={520}

      >

        {renderUserFormFields({ mode: 'create' })}

      </Modal>



      <Modal

        open={!!editingUser}

        title="编辑用户"

        onCancel={() => setEditingUser(null)}

        onOk={handleSave}

        okText="保存"

        width={520}

      >

        {renderUserFormFields({ mode: 'edit' })}

      </Modal>



      <Modal

        open={!!deleteTarget}

        title="删除用户"

        onCancel={() => setDeleteTarget(null)}

        onOk={confirmDelete}

        okText="确定删除"

        width={480}

      >

        <p className="text-sm leading-relaxed text-gray-600">

          确定删除用户「<strong className="text-gray-800">{deleteTarget?.nickname}</strong>」（{deleteTarget?.username}）？

          删除后该用户将无法登录平台，此操作不可恢复。

        </p>

      </Modal>

    </div>

  )

}



/** 供外部在组织删除等场景后同步用户列表 */

export function syncUserListFromStore(setUsers) {

  setUsers(getRuntimeUsers())

}



export { replaceRuntimeUsers }


