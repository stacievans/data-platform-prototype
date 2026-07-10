import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import {
  EMPTY_STEP,
  emptyCreatePlan,
  Field,
  inputCls,
  selectCls,
  formatSceneLabel,
  calcPlanDurationMeta,
  PlanReadonlySection,
  PlanReadonlyDetails,
  validatePlanForm,
  buildPlanPayloadFromForm,
  CollectPlanFormFields,
} from '../../components/collect/CollectPlanForm'
import { tasks, nextTaskId, nowDatetime } from '../../mock/tasks'
import {
  getPlansByProjectId,
  getPlanById,
  appendPlan,
  nextPlanId,
  resolvePlanDeviceTypeId,
  playLayouts,
} from '../../mock/plans'
import { projects } from '../../mock/projects'
import { getTaskPurposeTags } from '../../mock/tags'
import { getAllDeviceTypes, getAllDeviceInstances, getInStockInstancesByTypeId } from '../../mock/devices'
import { useCurrentNickname } from '../../context/AuthContext'

const PURPOSE_OPTIONS = getTaskPurposeTags().map((t) => ({
  value: t.name,
  label: t.name,
}))

/** 新建任务 / 配置采集方案二级弹窗共用固定面板尺寸 */
const TASK_MODAL_WIDTH = 520
const TASK_MODAL_PANEL_HEIGHT = 'min(85vh, 560px)'
const emptyTaskForm = () => ({
  name: '',
  purpose: '',
  target: '',
  deviceInstanceId: '',
  layoutId: '',
})

function taskFormFromTask(task, instances) {
  let deviceInstanceId = task.deviceInstanceId ?? ''
  if (!deviceInstanceId && task.device) {
    const inst = instances.find((i) => i.sn === task.device || i.code === task.device)
    deviceInstanceId = inst?.id ?? ''
  }
  return {
    name: task.name ?? '',
    purpose: task.purpose ?? '',
    target: String(task.collectTotal ?? ''),
    deviceInstanceId,
    layoutId: task.layoutId != null && task.layoutId !== '' ? String(task.layoutId) : '',
  }
}

function cloneCreatePlan(form) {
  return {
    ...form,
    steps: form.steps.map((s) => ({ ...s, atomicSkills: [...(s.atomicSkills ?? [])] })),
  }
}

function ModeToggle({ value, onChange, disabled }) {
  const opts = [
    { key: 'existing', label: '选择已有方案' },
    { key: 'create', label: '创建新方案' },
  ]
  return (
    <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.key)}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            value === o.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SearchablePlanSelect({ plans, value, onChange, error }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = plans.find((p) => p.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return plans
    return plans.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [plans, query])

  useEffect(() => {
    if (selected) setQuery(`${selected.id} · ${selected.name}`)
    else if (!value) setQuery('')
  }, [selected, value])

  return (
    <div className="relative">
      <SelectChevronWrap>
        <input
          value={query}
          placeholder="搜索并选择采集方案"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange('') }}
          onFocus={() => setOpen(true)}
          className={`${inputCls(error)} pr-8`}
        />
      </SelectChevronWrap>
      {open && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-[66] mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">无匹配方案</p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onChange(p.id)
                  setQuery(`${p.id} · ${p.name}`)
                  setOpen(false)
                }}
              >
                <span className="font-medium text-blue-600">{p.id}</span>
                <span className="mx-1 text-gray-300">·</span>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function resolvePlanTypeName(plan, deviceTypes) {
  if (!plan) return '—'
  const typeId = resolvePlanDeviceTypeId(plan)
  return deviceTypes.find((t) => t.id === typeId)?.name ?? plan.deviceTypeName ?? '—'
}

function buildPlanSummaryLines({ planMode, existingPlanId, createPlan, projectPlans, deviceTypes, boundPlan }) {
  if (boundPlan) {
    return {
      name: boundPlan.name ?? '—',
      deviceType: resolvePlanTypeName(boundPlan, deviceTypes),
      method: boundPlan.method ?? '—',
    }
  }
  if (planMode === 'existing') {
    const plan = projectPlans.find((p) => p.id === existingPlanId)
    if (!plan) return null
    return {
      name: plan.name ?? '—',
      deviceType: resolvePlanTypeName(plan, deviceTypes),
      method: plan.method ?? '—',
    }
  }
  return {
    name: createPlan.name.trim() || '—',
    deviceType: deviceTypes.find((t) => t.id === createPlan.deviceTypeId)?.name ?? '—',
    method: createPlan.method || '—',
  }
}

function PlanSummaryBlock({ lines, action }) {
  if (!lines) return null
  return (
    <div className="relative rounded-md bg-gray-50 px-3 py-2.5">
      {action && (
        <div className="absolute right-3 top-2.5">{action}</div>
      )}
      <div className={`space-y-1 text-sm ${action ? 'pr-24' : ''}`}>
        <p>
          <span className="text-gray-500">方案名称：</span>
          <span className="text-gray-700">{lines.name}</span>
        </p>
        <p>
          <span className="text-gray-500">设备类型：</span>
          <span className="text-gray-700">{lines.deviceType}</span>
        </p>
        <p>
          <span className="text-gray-500">采集方式：</span>
          <span className="text-gray-700">{lines.method}</span>
        </p>
      </div>
    </div>
  )
}

function PlanConfigModal({
  open,
  projectPlans,
  deviceTypes,
  lockExistingPlan,
  initialPlanMode,
  initialExistingPlanId,
  initialCreatePlan,
  onCancel,
  onConfirm,
}) {
  const [planMode, setPlanMode] = useState('existing')
  const [existingPlanId, setExistingPlanId] = useState('')
  const [createPlan, setCreatePlan] = useState(emptyCreatePlan)
  const [errors, setErrors] = useState({})

  const selectedExistingPlan = useMemo(
    () => projectPlans.find((p) => p.id === existingPlanId) ?? null,
    [projectPlans, existingPlanId],
  )

  const createDurationMeta = useMemo(
    () => calcPlanDurationMeta(createPlan.steps, createPlan.totalDeviation),
    [createPlan.steps, createPlan.totalDeviation],
  )

  useEffect(() => {
    if (!open) return
    setPlanMode(initialPlanMode)
    setExistingPlanId(initialExistingPlanId)
    setCreatePlan(cloneCreatePlan(initialCreatePlan))
    setErrors({})
  }, [open, initialPlanMode, initialExistingPlanId, initialCreatePlan])

  const setCreate = (patch) => {
    setCreatePlan((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => { delete next[`plan_${k}`] })
      if ('sceneId' in patch || 'subSceneId' in patch || 'tagId' in patch) delete next.scene
      return next
    })
  }

  const updateStep = (i, field, value) =>
    setCreatePlan((f) => ({
      ...f,
      steps: f.steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }))

  const addStep = () =>
    setCreatePlan((f) => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP }] }))

  const removeStep = (i) =>
    setCreatePlan((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))

  const handleConfirm = () => {
    const nextErrs = {}
    if (planMode === 'create') {
      Object.assign(nextErrs, validatePlanForm(createPlan))
    } else if (!existingPlanId) {
      nextErrs.existingPlanId = true
    }
    if (Object.keys(nextErrs).length) {
      setErrors(nextErrs)
      return
    }
    onConfirm({
      planMode,
      existingPlanId: planMode === 'existing' ? existingPlanId : '',
      createPlan: planMode === 'create' ? cloneCreatePlan(createPlan) : emptyCreatePlan(),
    })
  }

  return (
    <Modal
      open={open}
      title="配置采集方案"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={TASK_MODAL_WIDTH}
      fitViewport
      panelHeight={TASK_MODAL_PANEL_HEIGHT}
      align="nested"
      offsetX={40}
      offsetY={40}
      zIndex={60}
    >
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        {lockExistingPlan ? (
          <PlanReadonlySection plan={selectedExistingPlan} deviceTypes={deviceTypes} />
        ) : (
          <>
            <ModeToggle value={planMode} onChange={setPlanMode} disabled={false} />
            {planMode === 'create' ? (
              <CollectPlanFormFields
                form={createPlan}
                errors={errors}
                deviceTypes={deviceTypes}
                durationMeta={createDurationMeta}
                onChange={setCreate}
                updateStep={updateStep}
                addStep={addStep}
                removeStep={removeStep}
              />
            ) : (
              <div className="space-y-3">
                <Field label="采集方案名称" required error={errors.existingPlanId}>
                  <SearchablePlanSelect
                    plans={projectPlans}
                    value={existingPlanId}
                    onChange={setExistingPlanId}
                    error={errors.existingPlanId}
                  />
                </Field>
                {selectedExistingPlan && (
                  <PlanReadonlyDetails plan={selectedExistingPlan} deviceTypes={deviceTypes} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default function CreateTaskModal({ open, onClose, projectId, initialPlan = null, editTask = null }) {
  const isEdit = !!editTask
  const effectiveProjectId = editTask?.projectId ?? projectId
  const project = projects.find((p) => p.id === effectiveProjectId)
  const creator = useCurrentNickname()
  const nextId = useMemo(() => (isEdit ? editTask.id : nextTaskId(tasks)), [open, isEdit, editTask?.id])

  const projectPlans = useMemo(() => getPlansByProjectId(effectiveProjectId), [effectiveProjectId, open])
  const deviceTypes = useMemo(() => getAllDeviceTypes(), [open])
  const allInstances = useMemo(() => getAllDeviceInstances(), [open])
  const projectLayouts = useMemo(
    () => playLayouts.filter((l) => l.projectId === effectiveProjectId),
    [effectiveProjectId],
  )

  const editBoundPlan = useMemo(
    () => (isEdit && editTask ? getPlanById(editTask.planId) : null),
    [isEdit, editTask, open],
  )

  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [planMode, setPlanMode] = useState('existing')
  const [createPlan, setCreatePlan] = useState(emptyCreatePlan)
  const [existingPlanId, setExistingPlanId] = useState('')
  const [planConfigured, setPlanConfigured] = useState(false)
  const [planConfigOpen, setPlanConfigOpen] = useState(false)
  const [errors, setErrors] = useState({})

  const selectedExistingPlan = useMemo(
    () => projectPlans.find((p) => p.id === existingPlanId) ?? null,
    [projectPlans, existingPlanId],
  )

  const activeDeviceTypeId = useMemo(() => {
    if (isEdit) return editBoundPlan ? resolvePlanDeviceTypeId(editBoundPlan) : ''
    if (!planConfigured) return ''
    if (planMode === 'existing') {
      return selectedExistingPlan ? resolvePlanDeviceTypeId(selectedExistingPlan) : ''
    }
    return createPlan.deviceTypeId
  }, [isEdit, editBoundPlan, planConfigured, planMode, selectedExistingPlan, createPlan.deviceTypeId])

  const filteredInstances = useMemo(
    () => (activeDeviceTypeId ? getInStockInstancesByTypeId(activeDeviceTypeId) : []),
    [activeDeviceTypeId],
  )

  const deviceSelectDisabled = !activeDeviceTypeId

  const activeDeviceTypeName = useMemo(
    () => deviceTypes.find((t) => t.id === activeDeviceTypeId)?.name ?? '',
    [deviceTypes, activeDeviceTypeId],
  )

  const planSummaryLines = useMemo(() => {
    if (isEdit) {
      return editBoundPlan
        ? buildPlanSummaryLines({ boundPlan: editBoundPlan, deviceTypes })
        : null
    }
    if (!planConfigured) return null
    return buildPlanSummaryLines({
      planMode,
      existingPlanId,
      createPlan,
      projectPlans,
      deviceTypes,
    })
  }, [
    isEdit,
    editBoundPlan,
    planConfigured,
    planMode,
    existingPlanId,
    createPlan,
    projectPlans,
    deviceTypes,
  ])

  const showPlanReconfigure = !isEdit && !initialPlan

  useEffect(() => {
    if (!open) return
    if (isEdit && editTask) {
      setTaskForm(taskFormFromTask(editTask, allInstances))
      setPlanConfigOpen(false)
      setErrors({})
      return
    }
    setTaskForm(emptyTaskForm())
    setPlanMode('existing')
    setCreatePlan(emptyCreatePlan())
    setExistingPlanId(initialPlan?.id ?? '')
    setPlanConfigured(!!initialPlan)
    setPlanConfigOpen(false)
    setErrors({})
  }, [open, isEdit, editTask, initialPlan?.id, allInstances])

  useEffect(() => {
    if (!activeDeviceTypeId || !taskForm.deviceInstanceId) return
    const ok = filteredInstances.some((i) => i.id === taskForm.deviceInstanceId)
    if (!ok) setTaskForm((f) => ({ ...f, deviceInstanceId: '' }))
  }, [activeDeviceTypeId, filteredInstances, taskForm.deviceInstanceId])

  const setTask = (patch) => {
    setTaskForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => { delete next[k] })
      return next
    })
  }

  const handlePlanConfigConfirm = ({ planMode: nextMode, existingPlanId: nextExistingId, createPlan: nextCreatePlan }) => {
    const prevTypeId = activeDeviceTypeId
    setPlanMode(nextMode)
    setExistingPlanId(nextExistingId)
    setCreatePlan(nextCreatePlan)
    setPlanConfigured(true)
    setPlanConfigOpen(false)
    setErrors((e) => {
      const next = { ...e }
      delete next.plan
      return next
    })

    const nextTypeId = nextMode === 'existing'
      ? resolvePlanDeviceTypeId(projectPlans.find((p) => p.id === nextExistingId))
      : nextCreatePlan.deviceTypeId

    if (prevTypeId && nextTypeId && prevTypeId !== nextTypeId) {
      setTaskForm((f) => ({ ...f, deviceInstanceId: '' }))
    }
  }

  const buildPlanFromCreate = () => ({
    id: nextPlanId(),
    projectId: effectiveProjectId,
    ...buildPlanPayloadFromForm(createPlan),
    taskCount: 0,
    status: '已发布',
  })

  const handleOk = () => {
    const errs = {}
    if (!taskForm.name.trim()) errs.name = true
    if (!taskForm.purpose) errs.purpose = true
    if (!taskForm.target || isNaN(+taskForm.target) || +taskForm.target < 1) errs.target = true
    if (!taskForm.deviceInstanceId) errs.deviceInstanceId = true

    if (isEdit) {
      if (Object.keys(errs).length) { setErrors(errs); return }
      const instance = allInstances.find((i) => i.id === taskForm.deviceInstanceId)
      onClose({
        name: taskForm.name.trim(),
        purpose: taskForm.purpose,
        collectTotal: +taskForm.target,
        deviceInstanceId: taskForm.deviceInstanceId,
        device: instance?.code ?? '—',
        layoutId: taskForm.layoutId || null,
      })
      return
    }

    if (!planConfigured) errs.plan = true

    let boundPlan = selectedExistingPlan

    if (planConfigured && planMode === 'create') {
      Object.assign(errs, validatePlanForm(createPlan))
    } else if (planConfigured && planMode === 'existing' && !existingPlanId) {
      errs.plan = true
    }

    if (Object.keys(errs).length) { setErrors(errs); return }

    let planId = boundPlan?.id
    let planSnapshot = boundPlan

    if (planMode === 'create') {
      planSnapshot = buildPlanFromCreate()
      appendPlan(planSnapshot)
      planId = planSnapshot.id
      boundPlan = planSnapshot
    }

    const instance = allInstances.find((i) => i.id === taskForm.deviceInstanceId)
    const now = nowDatetime()
    const sceneLabel = boundPlan?.sceneLabel
      ?? formatSceneLabel(boundPlan?.scenePath?.sceneId, boundPlan?.scenePath?.subSceneId, boundPlan?.scenePath?.tagId)
      ?? '—'

    onClose({
      id: nextId,
      planId,
      name: taskForm.name.trim(),
      purpose: taskForm.purpose,
      device: instance?.code ?? '—',
      deviceInstanceId: taskForm.deviceInstanceId,
      deviceTypeId: activeDeviceTypeId || resolvePlanDeviceTypeId(boundPlan),
      deviceTypeName: activeDeviceTypeName || boundPlan?.deviceTypeName || '—',
      method: boundPlan?.method ?? '',
      scene: sceneLabel,
      projectId: effectiveProjectId,
      projectName: project?.name ?? '',
      collectTotal: +taskForm.target,
      collectDone: 0,
      reviewDone: 0,
      acceptDone: 0,
      dataTotal: 0,
      status: '草稿',
      creator,
      layoutId: taskForm.layoutId || null,
      annotGenConfig: planMode === 'create' ? createPlan.annotGenConfig : boundPlan?.annotGenConfig,
      annotPreLabel: planMode === 'create' ? createPlan.annotPreLabel : boundPlan?.annotPreLabel,
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? '编辑任务' : '新建采集任务'}
        onCancel={() => onClose(null)}
        onOk={handleOk}
        okText={isEdit ? '保存' : '确定'}
        width={TASK_MODAL_WIDTH}
        fitViewport
        panelHeight={TASK_MODAL_PANEL_HEIGHT}
      >
        <div className="space-y-3">
          <Field label="任务名称" required error={errors.name}>
            <div className="flex overflow-hidden rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <span className="flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-500">
                {nextId}
              </span>
              <input
                placeholder="请输入任务名称"
                value={taskForm.name}
                onChange={(e) => setTask({ name: e.target.value })}
                className="h-8 min-w-0 flex-1 border-0 px-3 text-sm outline-none"
              />
            </div>
          </Field>

          <Field label="任务用途" required error={errors.purpose}>
            <select
              value={taskForm.purpose}
              onChange={(e) => setTask({ purpose: e.target.value })}
              className={selectCls(errors.purpose)}
            >
              <option value="" disabled hidden>请选择</option>
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="目标条数" required error={errors.target}>
            <input
              type="number"
              min="1"
              placeholder="请输入目标条数"
              value={taskForm.target}
              onChange={(e) => setTask({ target: e.target.value })}
              className={inputCls(errors.target)}
            />
          </Field>

          <Field label="配置采集方案" required={!isEdit} error={errors.plan}>
            {(isEdit ? editBoundPlan : planConfigured) ? (
              <PlanSummaryBlock
                lines={planSummaryLines}
                action={showPlanReconfigure ? (
                  <Button variant="primary" size="sm" onClick={() => setPlanConfigOpen(true)}>
                    重新配置
                  </Button>
                ) : null}
              />
            ) : (
              <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2.5">
                <span className="text-sm text-gray-400">未配置</span>
                <Button variant="primary" size="sm" onClick={() => setPlanConfigOpen(true)}>
                  配置
                </Button>
              </div>
            )}
          </Field>

          <Field label="指定采集设备" required error={errors.deviceInstanceId}>
            <select
              value={taskForm.deviceInstanceId}
              disabled={deviceSelectDisabled}
              onChange={(e) => setTask({ deviceInstanceId: e.target.value })}
              className={`${selectCls(errors.deviceInstanceId)} disabled:cursor-not-allowed disabled:bg-gray-100`}
            >
              <option value="" disabled hidden>
                {deviceSelectDisabled ? '请先配置采集方案' : '请选择设备实例'}
              </option>
              {filteredInstances.map((i) => (
                <option key={i.id} value={i.id}>{i.code}</option>
              ))}
            </select>
          </Field>

          <Field label="标注布局">
            <select
              value={taskForm.layoutId}
              onChange={(e) => setTask({ layoutId: e.target.value })}
              className={selectCls(false)}
            >
              <option value="">默认布局</option>
              {projectLayouts.map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <PlanConfigModal
        open={planConfigOpen}
        projectPlans={projectPlans}
        deviceTypes={deviceTypes}
        lockExistingPlan={!!initialPlan}
        initialPlanMode={planMode}
        initialExistingPlanId={existingPlanId}
        initialCreatePlan={createPlan}
        onCancel={() => setPlanConfigOpen(false)}
        onConfirm={handlePlanConfigConfirm}
      />
    </>
  )
}
