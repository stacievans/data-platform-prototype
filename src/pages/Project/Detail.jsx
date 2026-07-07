import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Tabs from '../../components/common/Tabs'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { Select } from '../../components/common/FormField'
import { IconPlus, IconUpload, IconCopy, IconSearch, IconDownload, IconClose } from '../../components/common/Icons'
import { PermButton, PermAction, PERM_DENIED_TIP } from '../../components/common/PermissionAction'
import { useToast } from '../../components/common/Toast'
import { nativeSelectChevronCls } from '../../components/common/SelectControl'
import TaskList from '../Task/index'
import { projects } from '../../mock/projects'
import {
  getPlansByProjectId,
  appendPlan as storeAppendPlan,
  updatePlanInStore,
  nextPlanId,
  deletePlanFromStore,
  publishPlanInStore,
  copyPlanInStore,
  planStatusColor,
  getQcItemsByProjectId,
  updateQcItemInStore,
  QC_TYPE_OPTIONS,
  qcTypeColor,
  playLayouts as allLayouts,
  buildDefaultPlayLayoutRow,
} from '../../mock/plans'
import { getAllDeviceTypes } from '../../mock/devices'
import {
  EMPTY_STEP,
  emptyCreatePlan,
  planToForm,
  validatePlanForm,
  buildPlanPayloadFromForm,
  calcPlanDurationMeta,
  CollectPlanFormFields,
  Field,
  readonlyCls,
  PlanReadonlyDetails,
  PlanAnnotationDetails,
} from '../../components/collect/CollectPlanForm'
import { users, projectMembers as allProjectMembers } from '../../mock/misc'
import { tasks as allTasks } from '../../mock/tasks'
import { useAuth } from '../../context/AuthContext'
import { canAccessProject } from '../../mock/permissions'
import NoPermission from '../System/NoPermission'

const TABS = [
  { key: 'task',    label: '采集任务' },
  { key: 'scheme',  label: '采标方案' },
  { key: 'members', label: '项目人员' },
]

const MEMBER_ROLES = ['采集员', '标注员']
const ROLE_COLORS  = { 采集员: 'cyan', 标注员: 'orange', 平台运营: 'blue' }
const nowDatetime  = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

const QC_FILTER_LBL = 'mb-1 block text-xs text-gray-500'
const QC_FILTER_INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const QC_FILTER_SELECT_CLS = `${QC_FILTER_INPUT_CLS} cursor-pointer ${nativeSelectChevronCls}`

const PLAN_ACTION_BAR_CLS = 'flex flex-nowrap items-center gap-1.5'

function PlanTooltipWrap({ label, children }) {
  return (
    <span className="group/tip relative inline-flex shrink-0">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover/tip:block">
        {label}
      </span>
    </span>
  )
}

function PlanCopyBtn({ onClick }) {
  const btn = (
    <PermAction
      permission="collection.project.create"
      mode="disable"
      aria-label="创建副本"
      className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
    >
      <IconCopy />
    </PermAction>
  )
  return <PlanTooltipWrap label="创建副本">{btn}</PlanTooltipWrap>
}

function PlanLinkAction({ permission, onClick, children, danger = false }) {
  return (
    <PermButton
      permission={permission}
      mode="disable"
      variant="link"
      size="sm"
      onClick={onClick}
      className={danger ? 'text-red-500 hover:text-red-600' : undefined}
    >
      {children}
    </PermButton>
  )
}

function PlanActionConfirmModal({ open, type, plan, onCancel, onConfirm }) {
  if (!open || !plan) return null
  const isPublish = type === 'publish'
  const isDelete = type === 'delete'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">{isDelete ? '⚠️' : '📢'}</span>
            <h2 className={`text-base font-semibold ${isDelete ? 'text-red-600' : 'text-gray-800'}`}>
              {isPublish ? '发布采集方案' : '删除采集方案'}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {isPublish
              ? `确认发布方案「${plan.name}」？发布后将可用于创建采集任务。`
              : `确认删除方案「${plan.name}」？此操作不可恢复。`}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              isDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- 二级 Tab 胶囊切换栏 ---------- */
function SubTabBar({ items, activeKey, onChange }) {
  return (
    <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeKey === item.key
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- 采集方案 ---------- */
function CollectConfigTab({ projectId }) {
  const [plans, setPlans]         = useState(() => getPlansByProjectId(projectId))
  const refreshPlans              = () => setPlans(getPlansByProjectId(projectId))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]           = useState(emptyCreatePlan)
  const [errors, setErrors]       = useState({})
  const [viewTarget, setViewTarget] = useState(null)
  const [annotTarget, setAnnotTarget] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, type: null, plan: null })

  const deviceTypes = useMemo(() => getAllDeviceTypes(), [modalOpen, viewTarget])
  const durationMeta = useMemo(
    () => calcPlanDurationMeta(form.steps, form.totalDeviation),
    [form.steps, form.totalDeviation],
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyCreatePlan())
    setErrors({})
    setModalOpen(true)
  }

  const openView = (row) => setViewTarget(row)

  const openEdit = (row) => {
    if (row.status !== '草稿') return
    setEditTarget(row)
    setForm(planToForm(row))
    setErrors({})
    setModalOpen(true)
  }

  const handleCopy = (row) => {
    copyPlanInStore(row.id)
    refreshPlans()
  }

  const handlePublish = (row) => {
    publishPlanInStore(row.id)
    refreshPlans()
    setConfirm({ open: false, type: null, plan: null })
  }

  const handleDelete = (row) => {
    deletePlanFromStore(row.id)
    refreshPlans()
    setConfirm({ open: false, type: null, plan: null })
  }

  const closeConfirm = () => setConfirm({ open: false, type: null, plan: null })

  const handleConfirmAction = () => {
    const { type, plan } = confirm
    if (!plan) return
    if (type === 'publish') handlePublish(plan)
    if (type === 'delete') handleDelete(plan)
  }

  const renderPlanActions = (row) => {
    const annotBtn = (
      <PlanLinkAction permission="collection.project.view" onClick={() => setAnnotTarget(row)}>标注方案</PlanLinkAction>
    )
    if (row.status === '草稿') {
      return (
        <div className={PLAN_ACTION_BAR_CLS}>
          <PlanCopyBtn onClick={() => handleCopy(row)} />
          {annotBtn}
          <PlanLinkAction permission="collection.project.edit" onClick={() => openEdit(row)}>编辑</PlanLinkAction>
          <PlanLinkAction permission="collection.project.edit" onClick={() => setConfirm({ open: true, type: 'publish', plan: row })}>发布</PlanLinkAction>
          <PlanLinkAction permission="collection.project.delete" danger onClick={() => setConfirm({ open: true, type: 'delete', plan: row })}>删除</PlanLinkAction>
        </div>
      )
    }
    return (
      <div className={PLAN_ACTION_BAR_CLS}>
        <PlanCopyBtn onClick={() => handleCopy(row)} />
        {annotBtn}
        <PlanLinkAction permission="collection.project.view" onClick={() => openView(row)}>查看</PlanLinkAction>
        <PlanLinkAction permission="collection.project.delete" danger onClick={() => setConfirm({ open: true, type: 'delete', plan: row })}>删除</PlanLinkAction>
      </div>
    )
  }

  const setPlan = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => { delete next[`plan_${k}`] })
      if ('sceneId' in patch || 'subSceneId' in patch || 'tagId' in patch) delete next.scene
      if ('name' in patch) delete next.plan_name
      return next
    })
  }

  const updateStep = (i, field, value) =>
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }))

  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP }] }))
  const removeStep = (i) => setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))

  const handleSave = () => {
    const errs = validatePlanForm(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = buildPlanPayloadFromForm(form, deviceTypes)
    if (editTarget) {
      updatePlanInStore(editTarget.id, payload)
      refreshPlans()
    } else {
      storeAppendPlan({
        id: nextPlanId(),
        projectId,
        ...payload,
        taskCount: 0,
        status: '已发布',
      })
      refreshPlans()
    }
    setModalOpen(false)
  }

  const columns = [
    { title: '方案ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '方案名称', dataIndex: 'name' },
    { title: '本体类型', dataIndex: 'robotBody' },
    { title: '采集方式', dataIndex: 'method' },
    { title: '步骤数', dataIndex: 'steps', render: (v) => Array.isArray(v) ? v.length : v },
    {
      title: '状态', dataIndex: 'status',
      render: (v) => <Badge color={planStatusColor[v] ?? 'gray'} dot>{v}</Badge>,
    },
    {
      title: '操作', key: 'actions',
      render: (_, row) => renderPlanActions(row),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">方案列表</h2>
        <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>新建采集方案</PermButton>
      </div>
      <Table columns={columns} dataSource={plans} />

      <Modal
        open={!!viewTarget}
        title="采集方案详情"
        onCancel={() => setViewTarget(null)}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setViewTarget(null)}>关闭</Button>
          </div>
        }
        fitViewport
        width={720}
      >
        {viewTarget && (
          <div className="space-y-3">
            <Field label="方案ID">
              <input readOnly value={viewTarget.id} className={readonlyCls} />
            </Field>
            <Field label="方案名称">
              <input readOnly value={viewTarget.name} className={readonlyCls} />
            </Field>
            <PlanReadonlyDetails plan={viewTarget} deviceTypes={deviceTypes} />
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        title={editTarget ? '编辑采集方案' : '新建采集方案'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editTarget ? '保存' : '创建'}
        fitViewport
        width={720}
      >
        <div className="space-y-3">
          {editTarget && (
            <Field label="方案ID">
              <input readOnly value={editTarget.id} className={readonlyCls} />
            </Field>
          )}
          <CollectPlanFormFields
            form={form}
            errors={errors}
            deviceTypes={deviceTypes}
            durationMeta={durationMeta}
            onChange={setPlan}
            updateStep={updateStep}
            addStep={addStep}
            removeStep={removeStep}
            planNameLabel="方案名称"
          />
        </div>
      </Modal>

      <PlanActionConfirmModal
        open={confirm.open}
        type={confirm.type}
        plan={confirm.plan}
        onCancel={closeConfirm}
        onConfirm={handleConfirmAction}
      />

      <Modal
        open={!!annotTarget}
        title="标注方案"
        onCancel={() => setAnnotTarget(null)}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setAnnotTarget(null)}>关闭</Button>
          </div>
        }
        fitViewport
        width={720}
      >
        {annotTarget && (
          <div className="space-y-3">
            <Field label="采集方案">
              <input readOnly value={`${annotTarget.id} · ${annotTarget.name}`} className={readonlyCls} />
            </Field>
            <PlanAnnotationDetails plan={annotTarget} />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ---------- 质检配置 ---------- */
function QcTab({ projectId }) {
  const { can } = useAuth()
  const canEdit = can('collection.project.edit')
  const { ToastNode, show: showToast } = useToast()

  const [items, setItems] = useState(() => getQcItemsByProjectId(projectId))
  const refreshItems = () => setItems(getQcItemsByProjectId(projectId))

  const [qName, setQName] = useState('')
  const [qType, setQType] = useState('')
  const [qEnabled, setQEnabled] = useState('')
  const [filters, setFilters] = useState({})

  const [viewTarget, setViewTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editRule, setEditRule] = useState('')

  const filtered = useMemo(() => {
    const { name, type, enabled } = filters
    return items.filter((item) => {
      if (name && !item.name.includes(name)) return false
      if (type && item.type !== type) return false
      if (enabled === '开启' && !item.enabled) return false
      if (enabled === '关闭' && item.enabled) return false
      return true
    })
  }, [items, filters])

  const applyFilters = () => setFilters({ name: qName.trim(), type: qType, enabled: qEnabled })
  const resetFilters = () => {
    setQName('')
    setQType('')
    setQEnabled('')
    setFilters({})
  }

  const toggleEnabled = (row) => {
    updateQcItemInStore(row.id, { enabled: !row.enabled })
    refreshItems()
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditRule(row.rule ?? '')
  }

  const handleEditSave = () => {
    if (!editTarget) return
    updateQcItemInStore(editTarget.id, { rule: editRule })
    refreshItems()
    setEditTarget(null)
    setEditRule('')
  }

  const columns = [
    { title: '质检项名称', dataIndex: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    {
      title: '质检项类型',
      dataIndex: 'type',
      render: (v) => <Badge color={qcTypeColor[v] ?? 'gray'}>{v}</Badge>,
    },
    {
      title: '质检规则说明',
      dataIndex: 'rule',
      render: (v) => <span className="block max-w-xl truncate text-gray-600" title={v}>{v}</span>,
    },
    {
      title: '开启状态',
      dataIndex: 'enabled',
      render: (v, row) => (
        <button
          type="button"
          onClick={() => canEdit && toggleEnabled(row)}
          disabled={!canEdit}
          title={canEdit ? undefined : PERM_DENIED_TIP}
          className={`relative h-5 w-9 rounded-full transition-colors ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'} ${v ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${v ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button variant="link" size="sm" onClick={() => setViewTarget(row)}>查看</Button>
          <PermButton permission="collection.project.edit" mode="disable" variant="link" size="sm" onClick={() => openEdit(row)}>编辑</PermButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className={QC_FILTER_LBL}>质检项名称</label>
            <input
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              placeholder="请输入"
              className={QC_FILTER_INPUT_CLS}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className={QC_FILTER_LBL}>质检项类型</label>
            <select value={qType} onChange={(e) => setQType(e.target.value)} className={QC_FILTER_SELECT_CLS}>
              <option value="">请选择</option>
              {QC_TYPE_OPTIONS.filter((v) => v !== '全部').map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <label className={QC_FILTER_LBL}>开启状态</label>
            <select value={qEnabled} onChange={(e) => setQEnabled(e.target.value)} className={QC_FILTER_SELECT_CLS}>
              <option value="">请选择</option>
              <option value="开启">开启</option>
              <option value="关闭">关闭</option>
            </select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">质检方案配置</h2>
        <div className="flex items-center gap-2">
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="primary"
            icon={<IconUpload />}
            onClick={() => showToast('正在导入质检方案…')}
          >
            导入
          </PermButton>
          <PermButton
            permission="collection.project.edit"
            mode="disable"
            variant="primary"
            icon={<IconDownload />}
            onClick={() => showToast('正在导出质检方案…')}
          >
            导出
          </PermButton>
        </div>
      </div>

      <Table columns={columns} dataSource={filtered} />

      <Modal
        open={!!viewTarget}
        title="查看质检规则"
        onCancel={() => setViewTarget(null)}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setViewTarget(null)}>关闭</Button>
          </div>
        }
        width={560}
      >
        {viewTarget && (
          <div className="space-y-4">
            <Field label="质检项名称">
              <input readOnly value={viewTarget.name} className={readonlyCls} />
            </Field>
            <Field label="质检项类型">
              <input readOnly value={viewTarget.type} className={readonlyCls} />
            </Field>
            <Field label="质检规则说明">
              <textarea readOnly rows={4} value={viewTarget.rule} className={`${readonlyCls} h-auto resize-none py-2`} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editTarget}
        title="编辑质检规则"
        onCancel={() => { setEditTarget(null); setEditRule('') }}
        onOk={handleEditSave}
        okText="确定"
        width={560}
      >
        {editTarget && (
          <div className="space-y-4">
            <Field label="质检项名称">
              <input readOnly value={editTarget.name} className={readonlyCls} />
            </Field>
            <Field label="质检项类型">
              <input readOnly value={editTarget.type} className={readonlyCls} />
            </Field>
            <Field label="质检规则说明">
              <textarea
                rows={4}
                value={editRule}
                onChange={(e) => setEditRule(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
          </div>
        )}
      </Modal>

      {ToastNode}
    </div>
  )
}

/* ---------- 采标方案（二级 Tab 容器） ---------- */
const SCHEME_SUB_TABS = [
  { key: 'collect',  label: '采集方案' },
  { key: 'qc',       label: '质检配置' },
  { key: 'layout',   label: '播放布局' },
]

function SchemeTab({ projectId }) {
  const [sub, setSub] = useState('collect')
  return (
    <div>
      <SubTabBar items={SCHEME_SUB_TABS} activeKey={sub} onChange={setSub} />
      {sub === 'collect'  && <CollectConfigTab projectId={projectId} />}
      {sub === 'qc'       && <QcTab projectId={projectId} />}
      {sub === 'layout'   && <LayoutTab projectId={projectId} />}
    </div>
  )
}

const LAYOUT_FILE_MAX_BYTES = 10 * 1024 * 1024

function LayoutFileUpload({ fileName, error, onSelect, onClear }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'json') {
      onSelect(null, '请上传 JSON 格式文件')
      return
    }
    if (file.size > LAYOUT_FILE_MAX_BYTES) {
      onSelect(null, '文件大小不能超过 10MB')
      return
    }
    onSelect(file.name, '')
  }

  const onFileChange = (e) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  if (fileName) {
    return (
      <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${error ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex min-w-0 items-center gap-2">
          <IconUpload className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="truncate text-sm text-gray-800">{fileName}</span>
        </div>
        <button
          type="button"
          onClick={() => { onClear(); if (fileRef.current) fileRef.current.value = '' }}
          className="ml-2 flex shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-red-500"
        >
          <IconClose className="h-3.5 w-3.5" />
          移除
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFileChange} />
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
          error
            ? 'border-red-400 bg-red-50/30'
            : dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <IconUpload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">点击或拖拽文件到此区域上传</p>
        <p className="mt-1 text-xs text-gray-400">支持 JSON 格式，文件大小不超过 10MB</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFileChange} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

/* ---------- 播放布局 ---------- */
function LayoutTab({ projectId }) {
  const { ToastNode, show: showToast } = useToast()
  const [layouts, setLayouts]     = useState(allLayouts.filter((l) => l.projectId === projectId))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]           = useState({ name: '', description: '' })
  const [layoutFileName, setLayoutFileName] = useState('')
  const [layoutFileError, setLayoutFileError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const displayLayouts = useMemo(
    () => [buildDefaultPlayLayoutRow(projectId), ...layouts].map((item, idx) => ({ ...item, seq: idx + 1 })),
    [projectId, layouts],
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', description: '' })
    setLayoutFileName('')
    setLayoutFileError('')
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setForm({ name: row.name ?? '', description: row.description ?? '' })
    setLayoutFileName('')
    setLayoutFileError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm({ name: '', description: '' })
    setLayoutFileName('')
    setLayoutFileError('')
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (!editTarget) {
      if (!layoutFileName) {
        setLayoutFileError('请上传布局文件')
        return
      }
    }
    if (editTarget) {
      setLayouts((list) =>
        list.map((l) => (l.id === editTarget.id
          ? { ...l, name: form.name.trim(), description: form.description.trim() }
          : l)),
      )
    } else {
      setLayouts([
        ...layouts,
        {
          id: Date.now(),
          projectId,
          name: form.name.trim(),
          date: '2026-06-10',
          description: form.description.trim(),
          layoutFileName,
        },
      ])
    }
    closeModal()
  }

  const columns = [
    { title: '序号', dataIndex: 'seq', width: 70 },
    {
      title: '布局名称',
      dataIndex: 'name',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      title: '添加日期',
      dataIndex: 'date',
      render: (v, row) => (
        row.isSystemBuiltIn
          ? <Badge color="gray">系统内置</Badge>
          : v
      ),
    },
    { title: '描述', dataIndex: 'description', render: (v) => <span className="text-gray-500">{v}</span> },
    {
      title: '操作', key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {!row.isSystemBuiltIn && (
            <PermButton permission="collection.project.edit" mode="disable" variant="link" size="sm" onClick={() => openEdit(row)}>编辑</PermButton>
          )}
          <Button variant="link" size="sm" onClick={() => showToast('布局文件已导出')}>下载</Button>
          {!row.isSystemBuiltIn && (
            <PermButton permission="collection.project.delete" mode="disable" variant="linkDanger" size="sm" onClick={() => setDeleteTarget(row)}>删除</PermButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {ToastNode}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">布局列表</h2>
        <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>新建布局</PermButton>
      </div>
      <Table columns={columns} dataSource={displayLayouts} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h2 className="text-base font-semibold text-red-600">删除布局配置</h2>
              </div>
              <p className="text-sm text-gray-500">
                确认删除布局「<strong className="text-gray-800">{deleteTarget.name}</strong>」？此操作不可逆。
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => { setLayouts((l) => l.filter((it) => it.id !== deleteTarget.id)); setDeleteTarget(null) }}
                className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editTarget ? '编辑播放布局' : '新建播放布局'}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editTarget ? '保存' : '创建'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-600">
              布局名称<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              placeholder="请输入布局名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {!editTarget && (
            <div>
              <label className="mb-1.5 block text-sm text-gray-600">
                布局文件<span className="ml-0.5 text-red-500">*</span>
              </label>
              <LayoutFileUpload
                fileName={layoutFileName}
                error={layoutFileError}
                onSelect={(name, err) => {
                  setLayoutFileName(name ?? '')
                  setLayoutFileError(err)
                }}
                onClear={() => {
                  setLayoutFileName('')
                  setLayoutFileError('')
                }}
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-gray-600">布局描述</label>
            <textarea
              rows={3}
              placeholder="请输入布局描述（选填）"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ---------- 项目人员 ---------- */
function MembersTab({ projectId }) {
  const project = projects.find((p) => p.id === projectId)

  // 普通成员（不含平台运营，平台运营由创建人合成）
  const [members, setMembers]       = useState(
    (allProjectMembers[projectId] ?? []).filter((m) => !m.roles.includes('平台运营')),
  )
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState({ name: '', roles: [], taskIds: [] })
  const [errors, setErrors]         = useState({})
  const [removeTarget, setRemoveTarget] = useState(null)
  const [replaceConfirm, setReplaceConfirm] = useState(null)

  // 平台运营（创建人）合成行，固定置顶
  const creatorRow = {
    id:       `__creator__${projectId}`,
    name:     project?.creator ?? '—',
    roles:    ['平台运营'],
    taskIds:  [],
    joinedAt: project?.createdAt ?? '—',
    isCreator: true,
  }

  const projectTasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [projectId])
  const taskNameMap  = useMemo(() => Object.fromEntries(allTasks.map((t) => [t.id, t.name])), [])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ name: '', roles: [], taskIds: [] })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setForm({ name: row.name, roles: [...row.roles], taskIds: [...row.taskIds] })
    setErrors({})
    setModalOpen(true)
  }

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }))
    setErrors((e) => ({ ...e, roles: false }))
  }

  const findAnnotatorForTask = (taskId, excludeMemberId = null) =>
    members.find(
      (m) =>
        m.id !== excludeMemberId &&
        m.roles.includes('标注员') &&
        m.taskIds.includes(taskId),
    )

  const stripAnnotatorTask = (list, taskId, excludeMemberId = null) =>
    list.map((m) => {
      if (m.id === excludeMemberId) return m
      if (m.roles.includes('标注员') && m.taskIds.includes(taskId)) {
        return { ...m, taskIds: m.taskIds.filter((t) => t !== taskId) }
      }
      return m
    })

  const toggleTask = (id) => {
    const isAdding = !form.taskIds.includes(id)
    if (isAdding && form.roles.includes('标注员')) {
      const owner = findAnnotatorForTask(id, editTarget?.id)
      if (owner) {
        setReplaceConfirm({ taskId: id, existingName: owner.name })
        return
      }
    }
    setForm((f) => ({
      ...f,
      taskIds: isAdding ? [...f.taskIds, id] : f.taskIds.filter((t) => t !== id),
    }))
  }

  const confirmReplaceTask = () => {
    const { taskId } = replaceConfirm
    setMembers((list) => stripAnnotatorTask(list, taskId, editTarget?.id))
    setForm((f) => ({
      ...f,
      taskIds: f.taskIds.includes(taskId) ? f.taskIds : [...f.taskIds, taskId],
    }))
    setReplaceConfirm(null)
  }

  const handleSave = () => {
    const errs = {}
    if (!form.name)         errs.name  = true
    if (!form.roles.length) errs.roles = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    let nextMembers = [...members]
    if (form.roles.includes('标注员') && form.taskIds.length) {
      for (const taskId of form.taskIds) {
        nextMembers = stripAnnotatorTask(nextMembers, taskId, editTarget?.id)
      }
    }

    if (editTarget) {
      nextMembers = nextMembers.map((m) =>
        m.id === editTarget.id ? { ...m, roles: form.roles, taskIds: form.taskIds } : m,
      )
    } else {
      nextMembers = [
        ...nextMembers,
        {
          id:       `PM-${projectId}-${Date.now()}`,
          name:     form.name,
          roles:    form.roles,
          taskIds:  form.taskIds,
          joinedAt: nowDatetime(),
        },
      ]
    }
    setMembers(nextMembers)
    setModalOpen(false)
  }

  // 候选用户：排除创建人和已在项目中的（编辑时保留自身）
  const availableUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.status === '启用' &&
          u.nickname !== creatorRow.name &&
          !members.some((m) => m.name === u.nickname && m.id !== editTarget?.id),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, editTarget],
  )

  const columns = [
    {
      title: '姓名', dataIndex: 'name',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      title: '角色', dataIndex: 'roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <Badge key={r} color={ROLE_COLORS[r] || 'gray'}>{r}</Badge>
          ))}
        </div>
      ),
    },
    {
      title: '负责任务', dataIndex: 'taskIds',
      render: (ids, row) => {
        if (row.isCreator || !ids.length) return <span className="text-gray-400">—</span>
        const MAX = 2
        const shown = ids.slice(0, MAX)
        const rest  = ids.length - MAX
        return (
          <div className="flex flex-wrap items-center gap-1">
            {shown.map((id) => {
              const name = taskNameMap[id] ?? id
              return (
                <span
                  key={id}
                  title={name}
                  className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600"
                >
                  {name.length > 10 ? name.slice(0, 10) + '…' : name}
                </span>
              )
            })}
            {rest > 0 && <span className="text-xs text-gray-400">+{rest}</span>}
          </div>
        )
      },
    },
    { title: '加入时间', dataIndex: 'joinedAt' },
    {
      title: '操作', key: 'actions',
      render: (_, row) => {
        if (row.isCreator) return null
        return (
          <div className="flex items-center gap-1">
            <PermButton permission="collection.project.edit" mode="disable" variant="link" size="sm" onClick={() => openEdit(row)}>编辑</PermButton>
            <PermButton permission="collection.project.delete" mode="disable" variant="linkDanger" size="sm" onClick={() => setRemoveTarget(row)}>移除</PermButton>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">项目成员</h2>
        <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openAdd}>添加成员</PermButton>
      </div>
      <Table columns={columns} dataSource={[creatorRow, ...members]} />

      {/* 移除二次确认 */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setRemoveTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h2 className="text-base font-semibold text-red-600">移除成员</h2>
              </div>
              <p className="text-sm text-gray-500">
                确认将「<strong className="text-gray-800">{removeTarget.name}</strong>」从本项目移除？
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setRemoveTarget(null)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => { setMembers((l) => l.filter((m) => m.id !== removeTarget.id)); setRemoveTarget(null) }}
                className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                确认移除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标注员任务替换确认 */}
      {replaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setReplaceConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <h2 className="text-base font-semibold text-gray-800">替换标注员</h2>
              </div>
              <p className="text-sm text-gray-500">
                该任务已有标注员「<strong className="text-gray-800">{replaceConfirm.existingName}</strong>」，是否替换为当前成员？
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setReplaceConfirm(null)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReplaceTask}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      <Modal
        open={modalOpen}
        title={editTarget ? '编辑成员' : '添加成员'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editTarget ? '保存' : '添加'}
      >
        <div className="space-y-4">
          {/* 角色多选 */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              角色<span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-400">（可多选）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                    form.roles.includes(role)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {errors.roles && <p className="mt-1 text-xs text-red-500">请至少选择一个角色</p>}
          </div>

          {/* 选择用户 */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              选择用户<span className="text-red-500">*</span>
            </label>
            {editTarget ? (
              <input
                readOnly
                value={form.name}
                className="h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none"
              />
            ) : (
              <select
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  setErrors((er) => ({ ...er, name: false }))
                }}
                className={`h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none transition-colors focus:ring-2 ${
                  errors.name
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
              >
                <option value="" disabled hidden>请选择用户</option>
                {availableUsers.map((u) => (
                  <option key={u.uid} value={u.nickname}>
                    {u.nickname}
                  </option>
                ))}
              </select>
            )}
            {errors.name && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
          </div>

          {/* 分配任务多选 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">分配任务</label>
            {projectTasks.length === 0 ? (
              <p className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">
                暂无任务
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-md border border-gray-300 bg-white p-2">
                {projectTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.taskIds.includes(task.id)}
                      onChange={() => toggleTask(task.id)}
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                    />
                    <span className="flex-1 text-sm text-gray-700">{task.name}</span>
                    <span className="text-xs text-gray-400">{task.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ---------- 详情页 ---------- */
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState('task')

  const project = projects.find((p) => p.id === id)
  const taskCount = useMemo(
    () => allTasks.filter((t) => t.projectId === id).length,
    [id],
  )
  if (!project) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        项目不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/collection/project')}>返回项目列表</Button>
        </div>
      </div>
    )
  }

  if (!canAccessProject(id, user.nickname, user.role)) {
    return <NoPermission />
  }

  return (
    <div className="space-y-4">
      {/* 项目头部 */}
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-semibold text-white">
              {project.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
                {project.status === 'open' ? (
                  <Badge color="green" dot>开启</Badge>
                ) : (
                  <Badge color="gray" dot>归档</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-gray-400">项目ID</div>
              <div className="mt-0.5 font-medium text-gray-700">{project.id}</div>
            </div>
            <div>
              <div className="text-gray-400">任务数</div>
              <div className="mt-0.5 font-medium text-gray-700">{taskCount}</div>
            </div>
            <div>
              <div className="text-gray-400">创建人</div>
              <div className="mt-0.5 font-medium text-gray-700">{project.creator}</div>
            </div>
            <div>
              <div className="text-gray-400">创建时间</div>
              <div className="mt-0.5 font-medium text-gray-700">{project.createdAt}</div>
            </div>
          </div>
        </div>
        <Tabs items={TABS} activeKey={tab} onChange={setTab} className="mt-4" />
      </div>

      {tab === 'task'    && <TaskList fixedProjectId={id} />}
      {tab === 'scheme'  && <SchemeTab projectId={id} />}
      {tab === 'members' && <MembersTab projectId={id} />}
    </div>
  )
}
