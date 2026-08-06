import { useEffect, useMemo, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import Button from '../../components/common/Button'
import { IconChevronLeft } from '../../components/common/Icons'
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
  COLLECT_PLAN_DRAWER_WIDTH,
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
import { getAllDeviceTypes, getAllDeviceInstances } from '../../mock/devices'
import { useCurrentNickname } from '../../context/AuthContext'

const PURPOSE_OPTIONS = getTaskPurposeTags().map((t) => ({
  value: t.name,
  label: t.name,
}))

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
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-[56] mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
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

function SearchableDeviceSelect({ instances, value, onChange, error }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = instances.find((i) => i.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return instances
    return instances.filter((i) => {
      const haystack = [i.code, i.sn, i.typeName, i.description]
        .filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [instances, query])

  useEffect(() => {
    if (selected) setQuery(selected.code ?? '')
    else if (!value) setQuery('')
  }, [selected, value])

  return (
    <div className="relative">
      <SelectChevronWrap>
        <input
          value={query}
          placeholder="请选择采集设备"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange('') }}
          onFocus={() => setOpen(true)}
          className={`${inputCls(error)} pr-8`}
        />
      </SelectChevronWrap>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-[56] mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">无匹配设备</p>
            )}
            {filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  onChange(i.id)
                  setQuery(i.code ?? '')
                  setOpen(false)
                }}
              >
                {i.code ?? '—'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PlanConfigPanel({
  projectPlans,
  deviceTypes,
  lockExistingPlan,
  planMode,
  onPlanModeChange,
  existingPlanId,
  onExistingPlanIdChange,
  createPlan,
  onCreatePlanChange,
  errors,
}) {
  const selectedExistingPlan = useMemo(
    () => projectPlans.find((p) => p.id === existingPlanId) ?? null,
    [projectPlans, existingPlanId],
  )

  const createDurationMeta = useMemo(
    () => calcPlanDurationMeta(createPlan.steps, createPlan.totalDeviation),
    [createPlan.steps, createPlan.totalDeviation],
  )

  const setCreate = (patch) => {
    onCreatePlanChange({ ...createPlan, ...patch })
  }

  const updateStep = (i, field, value) =>
    onCreatePlanChange({
      ...createPlan,
      steps: createPlan.steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    })

  const addStep = () =>
    onCreatePlanChange({ ...createPlan, steps: [...createPlan.steps, { ...EMPTY_STEP }] })

  const removeStep = (i) =>
    onCreatePlanChange({ ...createPlan, steps: createPlan.steps.filter((_, idx) => idx !== i) })

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      {lockExistingPlan ? (
        <PlanReadonlySection plan={selectedExistingPlan} deviceTypes={deviceTypes} />
      ) : (
        <>
          <ModeToggle value={planMode} onChange={onPlanModeChange} disabled={false} />
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
                  onChange={onExistingPlanIdChange}
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

function PlanConfigSection({ lines, onConfigure, showAction = true }) {
  const configured = !!lines
  return (
    <div className="relative rounded-md bg-gray-50 px-3 py-2.5">
      {showAction && onConfigure && (
        <div className="absolute right-3 top-2.5">
          <Button variant="primary" size="sm" onClick={onConfigure}>
            配置
          </Button>
        </div>
      )}
      <div className={`space-y-1 text-sm ${showAction ? 'pr-24' : ''}`}>
        {configured ? (
          <>
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
          </>
        ) : (
          <p className="text-gray-400">点击配置按钮选择或新建采集方案</p>
        )}
      </div>
    </div>
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
  const [modalView, setModalView] = useState('task')
  const [planDraft, setPlanDraft] = useState(null)
  const [planErrors, setPlanErrors] = useState({})
  const [errors, setErrors] = useState({})

  const selectedExistingPlan = useMemo(
    () => projectPlans.find((p) => p.id === existingPlanId) ?? null,
    [projectPlans, existingPlanId],
  )

  const activeDeviceTypeId = useMemo(() => {
    if (taskForm.deviceInstanceId) {
      return allInstances.find((i) => i.id === taskForm.deviceInstanceId)?.typeId ?? ''
    }
    if (isEdit) return editBoundPlan ? resolvePlanDeviceTypeId(editBoundPlan) : ''
    if (!planConfigured) return ''
    if (planMode === 'existing') {
      return selectedExistingPlan ? resolvePlanDeviceTypeId(selectedExistingPlan) : ''
    }
    return createPlan.deviceTypeId
  }, [
    taskForm.deviceInstanceId,
    allInstances,
    isEdit,
    editBoundPlan,
    planConfigured,
    planMode,
    selectedExistingPlan,
    createPlan.deviceTypeId,
  ])

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

  const showPlanConfigAction = !isEdit && !initialPlan
  const isPlanView = modalView === 'plan'

  useEffect(() => {
    if (!open) return
    if (isEdit && editTask) {
      setTaskForm(taskFormFromTask(editTask, allInstances))
      setModalView('task')
      setPlanDraft(null)
      setPlanErrors({})
      setErrors({})
      return
    }
    setTaskForm(emptyTaskForm())
    setPlanMode('existing')
    setCreatePlan(emptyCreatePlan())
    setExistingPlanId(initialPlan?.id ?? '')
    setPlanConfigured(!!initialPlan)
    setModalView('task')
    setPlanDraft(null)
    setPlanErrors({})
    setErrors({})
  }, [open, isEdit, editTask, initialPlan?.id, allInstances])

  const openPlanConfig = () => {
    setPlanDraft({
      planMode,
      existingPlanId,
      createPlan: cloneCreatePlan(createPlan),
    })
    setPlanErrors({})
    setModalView('plan')
  }

  const handlePlanBack = () => {
    setModalView('task')
    setPlanDraft(null)
    setPlanErrors({})
  }

  const patchPlanDraft = (patch) => {
    setPlanDraft((draft) => {
      if (!draft) return draft
      const next = { ...draft, ...patch }
      if (patch.createPlan) {
        next.createPlan = patch.createPlan
      }
      return next
    })
    setPlanErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => {
        if (k === 'createPlan' && patch.createPlan) {
          Object.keys(patch.createPlan).forEach((pk) => { delete next[`plan_${pk}`] })
          if ('sceneId' in patch.createPlan || 'subSceneId' in patch.createPlan || 'tagId' in patch.createPlan) {
            delete next.scene
          }
        } else {
          delete next[k]
          delete next.existingPlanId
        }
      })
      return next
    })
  }

  const handlePlanConfirm = () => {
    if (!planDraft) return
    const nextErrs = {}
    if (planDraft.planMode === 'create') {
      Object.assign(nextErrs, validatePlanForm(planDraft.createPlan))
    } else if (!planDraft.existingPlanId) {
      nextErrs.existingPlanId = true
    }
    if (Object.keys(nextErrs).length) {
      setPlanErrors(nextErrs)
      return
    }
    setPlanMode(planDraft.planMode)
    setExistingPlanId(planDraft.existingPlanId)
    setCreatePlan(
      planDraft.planMode === 'create'
        ? cloneCreatePlan(planDraft.createPlan)
        : emptyCreatePlan(),
    )
    setPlanConfigured(true)
    setModalView('task')
    setPlanDraft(null)
    setPlanErrors({})
    setErrors((e) => {
      const next = { ...e }
      delete next.plan
      return next
    })
  }

  const setTask = (patch) => {
    setTaskForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => { delete next[k] })
      return next
    })
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

    const instance = taskForm.deviceInstanceId
      ? allInstances.find((i) => i.id === taskForm.deviceInstanceId)
      : null

    if (isEdit) {
      if (Object.keys(errs).length) { setErrors(errs); return }
      onClose({
        name: taskForm.name.trim(),
        purpose: taskForm.purpose,
        collectTotal: +taskForm.target,
        deviceInstanceId: taskForm.deviceInstanceId || '',
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

    const instanceTypeName = instance
      ? deviceTypes.find((t) => t.id === instance.typeId)?.name ?? '—'
      : ''

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
      deviceInstanceId: taskForm.deviceInstanceId || '',
      deviceTypeId: instance?.typeId || activeDeviceTypeId || resolvePlanDeviceTypeId(boundPlan),
      deviceTypeName: instanceTypeName || activeDeviceTypeName || boundPlan?.deviceTypeName || '—',
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
    <Drawer
      open={open}
      width={isPlanView ? COLLECT_PLAN_DRAWER_WIDTH : undefined}
      title={
        isPlanView ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="返回"
              onClick={handlePlanBack}
              className="-ml-2 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md font-normal text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <IconChevronLeft />
            </button>
            <span>配置采集方案</span>
          </div>
        ) : (
          isEdit ? '编辑采集任务' : '新建采集任务'
        )
      }
      onCancel={() => onClose(null)}
      onOk={isPlanView ? handlePlanConfirm : handleOk}
      okText="确定"
      cancelText="取消"
      footer={
        isPlanView ? (
          <>
            <Button onClick={handlePlanBack}>取消</Button>
            <Button variant="primary" onClick={handlePlanConfirm}>确定</Button>
          </>
        ) : undefined
      }
    >
      {isPlanView && planDraft ? (
        <PlanConfigPanel
          projectPlans={projectPlans}
          deviceTypes={deviceTypes}
          lockExistingPlan={!!initialPlan}
          planMode={planDraft.planMode}
          onPlanModeChange={(mode) => patchPlanDraft({ planMode: mode })}
          existingPlanId={planDraft.existingPlanId}
          onExistingPlanIdChange={(id) => patchPlanDraft({ existingPlanId: id })}
          createPlan={planDraft.createPlan}
          onCreatePlanChange={(form) => patchPlanDraft({ createPlan: form })}
          errors={planErrors}
        />
      ) : (
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
            <PlanConfigSection
              lines={isEdit ? planSummaryLines : (planConfigured ? planSummaryLines : null)}
              onConfigure={showPlanConfigAction ? openPlanConfig : undefined}
              showAction={showPlanConfigAction}
            />
          </Field>

          <Field label="指定采集设备">
            <SearchableDeviceSelect
              instances={allInstances}
              value={taskForm.deviceInstanceId}
              onChange={(id) => setTask({ deviceInstanceId: id })}
            />
          </Field>

          <Field label="布局配置">
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
      )}
    </Drawer>
  )
}
