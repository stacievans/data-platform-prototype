import { useEffect, useMemo, useRef, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import { DescriptionField, PasswordInput } from '../../components/common/FormField'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import { isUsernameTakenInOrg } from '../../mock/organizations'

const CHECKBOX_CLS = 'h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600'

const fieldCls = (err, disabled = false) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
      : err
        ? 'border-red-400 focus:ring-red-100'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

function Req({ label }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
      {label}
      <span className="text-red-500">*</span>
    </label>
  )
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input readOnly value={value} className={fieldCls(false, true)} />
    </div>
  )
}

function ModeToggle({ value, onChange }) {
  const opts = [
    { key: 'create', label: '新建用户' },
    { key: 'invite', label: '邀请用户' },
  ]
  return (
    <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            value === o.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function RoleMultiSelect({ value = [], onChange, options, error }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return options
    return options.filter((name) => name.toLowerCase().includes(kw))
  }, [options, q])

  const closeDropdown = () => {
    setOpen(false)
    setQ('')
  }

  const toggle = (name) => {
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name])
  }

  const boxCls = `min-h-8 w-full rounded-md border bg-white py-1 pl-2 pr-8 text-sm text-gray-700 outline-none focus-within:ring-2 ${
    error
      ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
      : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-100'
  }`

  return (
    <SelectChevronWrap className="w-full">
      <div className="relative">
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={-1}
          onClick={() => {
            setOpen(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className={`${boxCls} flex cursor-text flex-wrap items-center gap-1`}
        >
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600"
            >
              {name}
              <button
                type="button"
                tabIndex={-1}
                aria-label={`移除 ${name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(value.filter((n) => n !== name))
                }}
                className="cursor-pointer leading-none text-blue-400 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onClick={(e) => e.stopPropagation()}
            placeholder={value.length === 0 ? '请选择角色' : ''}
            className="min-w-[4rem] flex-1 border-0 bg-transparent py-0.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label="展开选项"
          onClick={(e) => {
            e.stopPropagation()
            open ? closeDropdown() : setOpen(true)
          }}
          className="absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
        >
          ▾
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={closeDropdown} />
            <div className="absolute z-[71] mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">无匹配角色</p>
              ) : (
                filtered.map((name) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(name)}
                      onChange={() => toggle(name)}
                      className={CHECKBOX_CLS}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </SelectChevronWrap>
  )
}

function SearchableUserSelect({ users, value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = users.find((u) => u.id === value)

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return users
    return users.filter((u) =>
      u.username.toLowerCase().includes(kw)
      || u.nickname.includes(kw)
      || u.uid?.toLowerCase().includes(kw),
    )
  }, [users, q])

  useEffect(() => {
    if (selected) setQ(selected.username)
    else if (!value) setQ('')
  }, [selected, value])

  return (
    <div className="relative">
      <SelectChevronWrap>
        <input
          value={q}
          placeholder="搜索并选择用户名"
          onChange={(e) => { setQ(e.target.value); setOpen(true); onChange(null) }}
          onFocus={() => setOpen(true)}
          className={`${fieldCls(error)} pr-8`}
        />
      </SelectChevronWrap>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-[71] mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">无匹配用户</p>
            )}
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onChange(u.id)
                  setQ(u.username)
                  setOpen(false)
                }}
              >
                {u.username}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="mt-1 text-xs text-red-500">请选择用户</p>}
    </div>
  )
}

export function formatRoles(roles) {
  if (!roles.length) return ''
  if (roles.length === 1) return roles[0]
  return roles.join('&')
}

const emptyCreate = {
  username: '',
  password: '',
  roles: [],
  phone: '',
  email: '',
  remark: '',
}

const emptyInvite = {
  userId: null,
  roles: [],
  remark: '',
}

export default function CreateInviteUserModal({
  open,
  onCancel,
  onCreate,
  onInvite,
  currentOrgId,
  currentOrgName,
  roleOptions,
  inviteCandidates,
  orgMap,
}) {
  const [mode, setMode] = useState('create')
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [inviteForm, setInviteForm] = useState(emptyInvite)
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) return
    setMode('create')
    setCreateForm(emptyCreate)
    setInviteForm(emptyInvite)
    setErrs({})
  }, [open])

  const selectedInviteUser = useMemo(
    () => inviteCandidates.find((u) => u.id === inviteForm.userId) ?? null,
    [inviteCandidates, inviteForm.userId],
  )

  const setCreate = (k, v) => {
    setCreateForm((f) => ({ ...f, [k]: v }))
    setErrs((e) => ({ ...e, [k]: false, usernameConflict: false }))
  }

  const setInvite = (k, v) => {
    setInviteForm((f) => ({ ...f, [k]: v }))
    setErrs((e) => ({ ...e, [k]: false }))
  }

  const handleOk = () => {
    if (mode === 'create') {
      const nextErrs = {}
      const username = createForm.username.trim()
      if (!username) nextErrs.username = true
      else if (isUsernameTakenInOrg(username, currentOrgId)) nextErrs.usernameConflict = true
      if (!createForm.password.trim()) nextErrs.password = true
      if (!createForm.roles.length) nextErrs.roles = true
      if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }
      onCreate({
        username,
        password: createForm.password.trim(),
        roles: createForm.roles,
        role: formatRoles(createForm.roles),
        phone: createForm.phone.trim(),
        email: createForm.email.trim(),
        remark: createForm.remark.trim(),
      })
      return
    }

    const nextErrs = {}
    if (!inviteForm.userId) nextErrs.userId = true
    if (!inviteForm.roles.length) nextErrs.roles = true
    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }
    onInvite({
      userId: inviteForm.userId,
      roles: inviteForm.roles,
      role: formatRoles(inviteForm.roles),
      remark: inviteForm.remark.trim(),
    })
  }

  return (
    <Drawer
      open={open}
      title="新建/邀请用户"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
    >
      <ModeToggle value={mode} onChange={setMode} />

      {mode === 'create' ? (
        <div className="space-y-4">
          <div>
            <Req label="用户名" />
            <input
              placeholder="请输入用户名"
              value={createForm.username}
              onChange={(e) => setCreate('username', e.target.value)}
              className={fieldCls(errs.username || errs.usernameConflict)}
            />
            {errs.username && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
            {errs.usernameConflict && (
              <p className="mt-1 text-xs text-red-500">用户名在当前组织内已存在，请更换</p>
            )}
          </div>
          <div>
            <Req label="密码" />
            <PasswordInput
              value={createForm.password}
              onChange={(e) => setCreate('password', e.target.value)}
              error={errs.password}
            />
          </div>
          <ReadonlyField label="所属组织" value={currentOrgName} />
          <div>
            <Req label="角色" />
            <RoleMultiSelect
              value={createForm.roles}
              onChange={(roles) => setCreate('roles', roles)}
              options={roleOptions}
              error={errs.roles}
            />
            {errs.roles && <p className="mt-1 text-xs text-red-500">请至少选择一个角色</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">手机号</label>
            <input
              placeholder="请输入手机号（选填）"
              value={createForm.phone}
              onChange={(e) => setCreate('phone', e.target.value)}
              className={fieldCls(false)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">邮箱</label>
            <input
              placeholder="请输入邮箱（选填）"
              value={createForm.email}
              onChange={(e) => setCreate('email', e.target.value)}
              className={fieldCls(false)}
            />
          </div>
          <DescriptionField
            value={createForm.remark}
            onChange={(e) => setCreate('remark', e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Req label="用户名" />
            <SearchableUserSelect
              users={inviteCandidates}
              value={inviteForm.userId}
              onChange={(userId) => setInvite('userId', userId)}
              error={errs.userId}
            />
          </div>
          <ReadonlyField
            label="所属组织"
            value={selectedInviteUser ? (orgMap.get(selectedInviteUser.orgId) ?? '—') : ''}
          />
          <div>
            <Req label="角色" />
            <RoleMultiSelect
              value={inviteForm.roles}
              onChange={(roles) => setInvite('roles', roles)}
              options={roleOptions}
              error={errs.roles}
            />
            {errs.roles && <p className="mt-1 text-xs text-red-500">请至少选择一个角色</p>}
          </div>
          <ReadonlyField label="手机号" value={selectedInviteUser?.phone ?? ''} />
          <ReadonlyField label="邮箱" value={selectedInviteUser?.email ?? ''} />
          <DescriptionField
            value={inviteForm.remark}
            onChange={(e) => setInvite('remark', e.target.value)}
          />
        </div>
      )}
    </Drawer>
  )
}
