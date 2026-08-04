import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { IconPlus, IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import {
  appendOrganization,
  deleteOrganization,
  getOrganizations,
  isOrganizationNameTaken,
  setOrganizationStatus,
  updateOrganization,
} from '../../mock/organizations'
import { dtCol } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

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

function OrgFormModal({ open, title, form, errors, onChange, onCancel, onOk }) {
  return (
    <Modal open={open} title={title} onCancel={onCancel} onOk={onOk} okText="确定" width={480}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
            组织名称<span className="text-red-500">*</span>
          </label>
          <input
            placeholder="请输入组织名称"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={`h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`}
          />
          {errors.name === 'required' && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
          {errors.name === 'duplicate' && <p className="mt-1 text-xs text-red-500">组织名称已存在</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">备注</label>
          <textarea
            rows={4}
            maxLength={500}
            placeholder="请输入备注信息"
            value={form.remark}
            onChange={(e) => onChange('remark', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{form.remark.length} / 500</p>
        </div>
      </div>
    </Modal>
  )
}

const emptyForm = { name: '', remark: '' }

export default function OrgManage() {
  const navigate = useNavigate()
  const { ToastNode, show: toast } = useToast()
  const [orgs, setOrgs] = useState(() => getOrganizations())
  const [qName, setQName] = useState('')
  const [qStatus, setQStatus] = useState('')
  const [filters, setFilters] = useState({})

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createErrors, setCreateErrors] = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editErrors, setEditErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const refresh = () => setOrgs(getOrganizations())

  const filtered = useMemo(() =>
    orgs.filter((o) => {
      if (filters.name && !o.name.includes(filters.name)) return false
      if (filters.status && o.status !== filters.status) return false
      return true
    }),
    [orgs, filters],
  )

  const pageResetKey = useMemo(() => `${JSON.stringify(filters)}:${filtered.length}`, [filters, filtered.length])

  const applyFilters = () => setFilters({ name: qName.trim(), status: qStatus })
  const resetFilters = () => { setQName(''); setQStatus(''); setFilters({}) }

  const validateForm = (form, excludeId = null) => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'required'
    else if (isOrganizationNameTaken(form.name, excludeId)) errs.name = 'duplicate'
    return errs
  }

  const handleCreate = () => {
    const errs = validateForm(createForm)
    if (Object.keys(errs).length) { setCreateErrors(errs); return }
    appendOrganization(createForm)
    refresh()
    setCreateOpen(false)
    setCreateForm(emptyForm)
    setCreateErrors({})
    toast('组织已创建')
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({ name: row.name, remark: row.remark ?? '' })
    setEditErrors({})
  }

  const handleEdit = () => {
    if (!editTarget) return
    const errs = validateForm(editForm, editTarget.id)
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    updateOrganization(editTarget.id, { name: editForm.name.trim(), remark: editForm.remark.trim() })
    refresh()
    setEditTarget(null)
    toast('组织信息已更新')
  }

  const handleToggleStatus = (row) => {
    const next = row.status === '启用' ? '停用' : '启用'
    setOrganizationStatus(row.id, next)
    refresh()
    toast(`已${next}组织「${row.name}」及其下全部用户`)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const name = deleteTarget.name
    deleteOrganization(deleteTarget.id)
    refresh()
    setDeleteTarget(null)
    toast(`已删除组织「${name}」及其下用户`)
  }

  const columns = [
    { title: '组织ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    {
      title: '组织名称',
      dataIndex: 'name',
      render: (v, row) => (
        <button
          type="button"
          onClick={() => navigate(`/system/org/${row.id}`)}
          className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          {v}
        </button>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (v) => (
        <span className="block max-w-xs truncate text-gray-500" title={v || undefined}>{v || '—'}</span>
      ),
    },
    { title: '组织人数', dataIndex: 'memberCount' },
    dtCol('创建时间', 'createdAt'),
    {
      title: '状态',
      dataIndex: 'status',
      render: (v, row) => (
        <StatusSwitch enabled={v === '启用'} onToggle={() => handleToggleStatus(row)} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="link" size="sm" onClick={() => navigate(`/system/org/${row.id}`)}>详情</Button>
          <Button variant="link" size="sm" onClick={() => openEdit(row)}>编辑</Button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="cursor-pointer text-sm text-red-500 hover:text-red-400"
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <ListPageCard>
        <ListPageFilter>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className={LBL}>组织名称</label>
              <input placeholder="请输入组织名称" value={qName} onChange={(e) => setQName(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className={LBL}>状态</label>
              <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
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
          <h2 className="text-base font-semibold text-gray-800">组织列表</h2>
          <Button variant="primary" icon={<IconPlus />} onClick={() => { setCreateForm(emptyForm); setCreateErrors({}); setCreateOpen(true) }}>
            新建组织
          </Button>
        </ListPageToolbar>

        <Table embedded columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      </ListPageCard>

      <OrgFormModal
        open={createOpen}
        title="新建组织"
        form={createForm}
        errors={createErrors}
        onChange={(k, v) => { setCreateForm((f) => ({ ...f, [k]: v })); setCreateErrors((e) => ({ ...e, [k]: false })) }}
        onCancel={() => { setCreateOpen(false); setCreateForm(emptyForm); setCreateErrors({}) }}
        onOk={handleCreate}
      />

      <OrgFormModal
        open={!!editTarget}
        title="编辑组织"
        form={editForm}
        errors={editErrors}
        onChange={(k, v) => { setEditForm((f) => ({ ...f, [k]: v })); setEditErrors((e) => ({ ...e, [k]: false })) }}
        onCancel={() => setEditTarget(null)}
        onOk={handleEdit}
      />

      <Modal
        open={!!deleteTarget}
        title="删除组织"
        onCancel={() => setDeleteTarget(null)}
        onOk={confirmDelete}
        okText="确定删除"
        width={480}
      >
        <p className="text-sm leading-relaxed text-gray-600">
          确定删除组织「<strong className="text-gray-800">{deleteTarget?.name}</strong>」？
          将同时删除该组织下全部用户，关联项目与采集数据不受影响，此操作不可恢复。
        </p>
      </Modal>

      {ToastNode}
    </div>
  )
}
