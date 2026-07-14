import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import CreateTaskModal from '../Task/CreateTaskModal'
import MembersTab from './MembersTab'
import { projects } from '../../mock/projects'
import {
  getPlansByProjectId,
  appendPlan as storeAppendPlan,
  updatePlanInStore,
  nextPlanId,
  deletePlanFromStore,
  publishPlanInStore,
  archivePlanInStore,
  incrementPlanTaskCount,
  copyPlanInStore,
  planStatusColor,
  resolvePlanDeviceTypeId,
  resolveDeviceTypeName,
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
import { getAnyEntryIdByProjectId } from '../../mock/entries'
import { tasks as taskStore, syncTasks, nowDatetime } from '../../mock/tasks'
import { useAuth, useCurrentNickname } from '../../context/AuthContext'
import { canAccessProject } from '../../mock/permissions'
import NoPermission from '../System/NoPermission'
import RealDataTab from '../Dashboard/tabs/RealDataTab'
import { dtCol, formatDateTime, nowDateTime } from '../../utils/formatDateTime'
import { getProjectStatusMeta, normalizeProjectStatus, canProjectMutate } from '../../utils/projectStatus'
import ProjectMutateGate from '../../components/common/ProjectMutateGate'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import SamplingPanel from './Sampling'

const PLAN_STATUS_OPTIONS = ['全部', '草稿', '已发布', '已归档']
const PLAN_FILTER_LBL = 'mb-1 block text-xs text-gray-500'
const PLAN_FILTER_INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const TABS = [
  { key: 'task',      label: '采集任务' },
  { key: 'scheme',    label: '采标方案' },
  { key: 'members',   label: '项目成员' },
  { key: 'sampling',  label: '抽样验收' },
  { key: 'dashboard', label: '运营看板' },
]

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
  const isArchive = type === 'archive'
  const isDelete = type === 'delete'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">{isDelete ? '⚠️' : isArchive ? '📦' : '📢'}</span>
            <h2 className={`text-base font-semibold ${isDelete ? 'text-red-600' : 'text-gray-800'}`}>
              {isPublish ? '发布采集方案' : isArchive ? '归档采集方案' : '删除采集方案'}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {isPublish
              ? `确认发布方案「${plan.name}」？发布后将可用于创建采集任务。`
              : isArchive
                ? `确认将方案「${plan.name}」归档？归档后不可再创建任务。`
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
function CollectConfigTab({ projectId, projectStatus, onTasksChange }) {
  const creatorName = useCurrentNickname()
  const [plans, setPlans]         = useState(() => getPlansByProjectId(projectId))
  const refreshPlans              = () => setPlans(getPlansByProjectId(projectId))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]           = useState(emptyCreatePlan)
  const [errors, setErrors]       = useState({})
  const [viewTarget, setViewTarget] = useState(null)
  const [annotTarget, setAnnotTarget] = useState(null)
  const [createTaskPlan, setCreateTaskPlan] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, type: null, plan: null })

  const [qPlanId, setQPlanId] = useState('')
  const [qPlanName, setQPlanName] = useState('')
  const [qStatus, setQStatus] = useState('全部')
  const [filters, setFilters] = useState({})

  const deviceTypes = useMemo(() => getAllDeviceTypes(), [modalOpen, viewTarget])
  const durationMeta = useMemo(
    () => calcPlanDurationMeta(form.steps, form.totalDeviation),
    [form.steps, form.totalDeviation],
  )

  const filteredPlans = useMemo(() => {
    const { planId, planName, status } = filters
    return plans.filter((p) => {
      if (planId && !p.id.toLowerCase().includes(planId.toLowerCase())) return false
      if (planName && !p.name.toLowerCase().includes(planName.toLowerCase())) return false
      if (status && status !== '全部' && p.status !== status) return false
      return true
    })
  }, [plans, filters])

  const planPageResetKey = useMemo(() => JSON.stringify(filters), [filters])

  const applyFilters = () => setFilters({
    planId: qPlanId.trim(),
    planName: qPlanName.trim(),
    status: qStatus,
  })

  const resetFilters = () => {
    setQPlanId('')
    setQPlanName('')
    setQStatus('全部')
    setFilters({})
  }

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

  const handleArchive = (row) => {
    archivePlanInStore(row.id)
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
    if (type === 'archive') handleArchive(plan)
    if (type === 'delete') handleDelete(plan)
  }

  const renderPlanActions = (row) => {
    if (row.status === '草稿') {
      return (
        <div className={PLAN_ACTION_BAR_CLS}>
          <PlanCopyBtn onClick={() => handleCopy(row)} />
          <PlanLinkAction permission="collection.project.edit" onClick={() => openEdit(row)}>编辑</PlanLinkAction>
          <PlanLinkAction permission="collection.project.edit" onClick={() => setConfirm({ open: true, type: 'publish', plan: row })}>发布</PlanLinkAction>
          <PlanLinkAction permission="collection.project.delete" danger onClick={() => setConfirm({ open: true, type: 'delete', plan: row })}>删除</PlanLinkAction>
        </div>
      )
    }
    if (row.status === '已发布') {
      return (
        <div className={PLAN_ACTION_BAR_CLS}>
          <PlanCopyBtn onClick={() => handleCopy(row)} />
          <PlanLinkAction permission="collection.project.view" onClick={() => openView(row)}>查看</PlanLinkAction>
          <PlanLinkAction permission="collection.project.edit" onClick={() => setConfirm({ open: true, type: 'archive', plan: row })}>归档</PlanLinkAction>
          {canProjectMutate(projectStatus) && (
            <PlanLinkAction permission="collection.project.create" onClick={() => setCreateTaskPlan(row)}>创建任务</PlanLinkAction>
          )}
          <PlanLinkAction permission="collection.project.view" onClick={() => setAnnotTarget(row)}>标注配置</PlanLinkAction>
        </div>
      )
    }
    return (
      <div className={PLAN_ACTION_BAR_CLS}>
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
    const payload = buildPlanPayloadFromForm(form)
    const now = nowDatetime()
    if (editTarget) {
      updatePlanInStore(editTarget.id, { ...payload, updatedAt: now })
      refreshPlans()
    } else {
      storeAppendPlan({
        id: nextPlanId(),
        projectId,
        ...payload,
        taskCount: 0,
        status: '草稿',
        creator: creatorName,
        createdAt: now,
        updatedAt: now,
      })
      refreshPlans()
    }
    setModalOpen(false)
  }

  const columns = [
    { title: '方案ID', dataIndex: 'id', render: (v) => <span className="font-medium text-blue-600">{v}</span> },
    { title: '方案名称', dataIndex: 'name' },
    {
      title: '设备类型',
      key: 'robotBody',
      render: (_, row) => resolveDeviceTypeName(resolvePlanDeviceTypeId(row)) || '—',
    },
    { title: '所属场景', dataIndex: 'sceneLabel', render: (v) => v || '—' },
    { title: '采集方式', dataIndex: 'method' },
    { title: '动作步骤数', dataIndex: 'steps', render: (v) => (Array.isArray(v) ? v.length : v ?? '—') },
    { title: '关联任务数', dataIndex: 'taskCount', render: (v) => v ?? 0 },
    { title: '创建人', dataIndex: 'creator', render: (v) => v || '—' },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
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
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className={PLAN_FILTER_LBL}>方案ID</label>
            <input
              value={qPlanId}
              onChange={(e) => setQPlanId(e.target.value)}
              placeholder="请输入方案ID"
              className={PLAN_FILTER_INPUT_CLS}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className={PLAN_FILTER_LBL}>方案名称</label>
            <input
              value={qPlanName}
              onChange={(e) => setQPlanName(e.target.value)}
              placeholder="请输入方案名称"
              className={PLAN_FILTER_INPUT_CLS}
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className={PLAN_FILTER_LBL}>状态</label>
            <select
              value={qStatus}
              onChange={(e) => setQStatus(e.target.value)}
              className={`${PLAN_FILTER_INPUT_CLS} cursor-pointer`}
            >
              {PLAN_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">方案列表</h2>
        <ProjectMutateGate projectStatus={projectStatus}>
          <PermButton permission="collection.project.create" variant="primary" onClick={openCreate}>+ 新建</PermButton>
        </ProjectMutateGate>
      </div>
      <Table
        columns={columns}
        dataSource={filteredPlans}
        pageSize={LIST_PAGE_SIZE}
        pageResetKey={planPageResetKey}
      />

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
        title={editTarget ? '编辑采集方案' : '新建'}
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
        title="标注配置"
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

      <CreateTaskModal
        open={!!createTaskPlan}
        projectId={projectId}
        initialPlan={createTaskPlan}
        onClose={(task) => {
          setCreateTaskPlan(null)
          if (!task) return
          if (onTasksChange) {
            onTasksChange((prev) => [task, ...prev])
          } else {
            syncTasks((prev) => [task, ...prev])
          }
          incrementPlanTaskCount(task.planId)
          refreshPlans()
        }}
      />
    </div>
  )
}

/* ---------- 质检配置 ---------- */
function QcTab({ projectId, projectStatus }) {
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

  const pageResetKey = useMemo(() => `${JSON.stringify(filters)}:${filtered.length}`, [filters, filtered.length])

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
          <ProjectMutateGate projectStatus={projectStatus}>
            <PermButton
              permission="collection.project.edit"
              mode="disable"
              variant="primary"
              icon={<IconUpload />}
              onClick={() => showToast('正在导入质检方案…')}
            >
              导入
            </PermButton>
          </ProjectMutateGate>
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

      <Table columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />

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
  { key: 'layout',   label: '标注布局' },
]

function SchemeTab({ projectId, projectStatus, onTasksChange }) {
  const [sub, setSub] = useState('collect')
  return (
    <div>
      <SubTabBar items={SCHEME_SUB_TABS} activeKey={sub} onChange={setSub} />
      {sub === 'collect'  && <CollectConfigTab projectId={projectId} projectStatus={projectStatus} onTasksChange={onTasksChange} />}
      {sub === 'qc'       && <QcTab projectId={projectId} projectStatus={projectStatus} />}
      {sub === 'layout'   && <LayoutTab projectId={projectId} projectStatus={projectStatus} />}
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
function LayoutTab({ projectId, projectStatus }) {
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
          date: nowDateTime(),
          description: form.description.trim(),
          layoutFileName,
        },
      ])
    }
    closeModal()
  }

  const openLayoutPreview = (layoutName) => {
    const entryId = getAnyEntryIdByProjectId(projectId)
    if (!entryId) {
      showToast('该项目下暂无采集条目，无法预览布局')
      return
    }
    const params = new URLSearchParams({ mode: 'play', layoutPreview: layoutName })
    window.open(`/review/${entryId}?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  const columns = [
    { title: '序号', dataIndex: 'seq', width: 70 },
    {
      title: '布局名称',
      dataIndex: 'name',
      render: (v) => (
        <button
          type="button"
          className="cursor-pointer font-medium text-blue-600 hover:text-blue-500"
          onClick={() => openLayoutPreview(v)}
        >
          {v}
        </button>
      ),
    },
    {
      title: '添加日期',
      dataIndex: 'date',
      render: (v, row) => (
        row.isSystemBuiltIn
          ? <Badge color="gray">系统内置</Badge>
          : formatDateTime(v)
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
        <ProjectMutateGate projectStatus={projectStatus}>
          <PermButton permission="collection.project.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>新建布局</PermButton>
        </ProjectMutateGate>
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

/* ---------- 详情页 ---------- */
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const tabFromUrl = searchParams.get('tab')
  const initialTab = TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : 'task'
  const [tab, setTab] = useState(initialTab)
  const highlightBatchId = searchParams.get('highlight')

  useEffect(() => {
    const next = searchParams.get('tab')
    if (next && TABS.some((t) => t.key === next)) setTab(next)
  }, [searchParams])

  const handleTabChange = (key) => {
    setTab(key)
    const params = new URLSearchParams(searchParams)
    params.set('tab', key)
    if (key !== 'sampling') params.delete('highlight')
    navigate(`/collection/project/${id}?${params.toString()}`, { replace: true })
  }

  const clearHighlightParam = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    if (!params.has('highlight')) return
    params.delete('highlight')
    navigate(`/collection/project/${id}?${params.toString()}`, { replace: true })
  }, [id, navigate, searchParams])

  const [tasks, setTasksState] = useState(() => [...taskStore])
  const [taskMemberFilter, setTaskMemberFilter] = useState(null)

  const setTasks = useCallback((updater) => {
    setTasksState(syncTasks(updater))
  }, [])

  const project = projects.find((p) => p.id === id)
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id],
  )
  const taskCount = useMemo(
    () => projectTasks.length,
    [projectTasks],
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

  const projectStatus = normalizeProjectStatus(project.status)
  const statusMeta = getProjectStatusMeta(project.status)
  const headerAvatarCls = projectStatus === 'archived'
    ? 'bg-gray-400'
    : projectStatus === 'closed'
      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
      : 'bg-gradient-to-br from-blue-500 to-blue-700'

  return (
    <div className="space-y-4">
      {/* 项目头部 */}
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold text-white ${headerAvatarCls}`}>
              {project.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
                <Badge color={statusMeta.color} dot>{statusMeta.label}</Badge>
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
              <div className="mt-0.5 font-medium text-gray-700">{formatDateTime(project.createdAt)}</div>
            </div>
          </div>
        </div>
        <Tabs items={TABS} activeKey={tab} onChange={handleTabChange} className="mt-4" />
      </div>

      {tab === 'task' && (
        <TaskList
          fixedProjectId={id}
          projectStatus={projectStatus}
          tasks={tasks}
          onTasksChange={setTasks}
          initialMemberFilter={taskMemberFilter}
          onMemberFilterApplied={() => setTaskMemberFilter(null)}
        />
      )}
      {tab === 'scheme'    && <SchemeTab projectId={id} projectStatus={projectStatus} onTasksChange={setTasks} />}
      {tab === 'members' && (
        <MembersTab
          projectId={id}
          projectTasks={projectTasks}
          onTasksChange={setTasks}
          onViewMemberTasks={(name, role) => {
            setTaskMemberFilter({ name, role })
            handleTabChange('task')
          }}
        />
      )}
      {tab === 'sampling' && (
        <SamplingPanel
          projectId={id}
          highlightBatchId={highlightBatchId}
          onHighlightConsumed={clearHighlightParam}
          onGoToTaskTab={() => handleTabChange('task')}
        />
      )}
      {tab === 'dashboard' && <RealDataTab fixedProjectId={id} />}
    </div>
  )
}
