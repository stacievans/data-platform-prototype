import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import { SelectChevronWrap, nativeSelectChevronCls } from '../../components/common/SelectControl'
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
import { taskTypeTags } from '../../mock/tags'
import { getAllDeviceTypes, getAllDeviceInstances, getInStockInstancesByTypeId } from '../../mock/devices'
import { useCurrentNickname } from '../../context/AuthContext'

const PURPOSE_OPTIONS = taskTypeTags.map((t) => ({
  value: t.name,
  label: t.name,
}))

const emptyLeftForm = () => ({
  name: '',
  purpose: '',
  target: '',
  deviceInstanceId: '',
  layoutId: '',
})

function leftFormFromTask(task, instances) {
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

function SectionTitle({ children }) {
  return <h4 className="mb-3 text-sm font-semibold text-gray-800">{children}</h4>
}

const BODY_TYPE_HINT = '请先配置采集方案的本体类型'

function ModeToggle({ value, onChange, disabled }) {
  const opts = [
    { key: 'create', label: '创建新方案' },
    { key: 'existing', label: '选择已有方案' },
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
  const ref = useRef(null)
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
  }, [selected])

  return (
    <div className="relative" ref={ref}>
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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
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

  const [planMode, setPlanMode] = useState(initialPlan ? 'existing' : 'create')
  const [leftForm, setLeftForm] = useState(emptyLeftForm)
  const [createPlan, setCreatePlan] = useState(emptyCreatePlan)
  const [existingPlanId, setExistingPlanId] = useState('')
  const [errors, setErrors] = useState({})

  const selectedExistingPlan = useMemo(
    () => projectPlans.find((p) => p.id === (initialPlan?.id ?? existingPlanId)) ?? null,
    [projectPlans, existingPlanId, initialPlan],
  )

  const activeDeviceTypeId = useMemo(() => {
    if (isEdit) return editBoundPlan ? resolvePlanDeviceTypeId(editBoundPlan) : ''
    if (planMode === 'existing') {
      return selectedExistingPlan ? resolvePlanDeviceTypeId(selectedExistingPlan) : ''
    }
    return createPlan.deviceTypeId
  }, [isEdit, editBoundPlan, planMode, selectedExistingPlan, createPlan.deviceTypeId])

  const filteredInstances = useMemo(
    () => (activeDeviceTypeId ? getInStockInstancesByTypeId(activeDeviceTypeId) : []),
    [activeDeviceTypeId],
  )

  const deviceSelectDisabled = !activeDeviceTypeId

  const createDurationMeta = useMemo(
    () => calcPlanDurationMeta(createPlan.steps, createPlan.totalDeviation),
    [createPlan.steps, createPlan.totalDeviation],
  )

  useEffect(() => {
    if (!open) return
    if (isEdit && editTask) {
      setLeftForm(leftFormFromTask(editTask, allInstances))
      setErrors({})
      return
    }
    setPlanMode(initialPlan ? 'existing' : 'create')
    setLeftForm(emptyLeftForm())
    setCreatePlan(emptyCreatePlan())
    setExistingPlanId(initialPlan?.id ?? '')
    setErrors({})
  }, [open, isEdit, editTask, initialPlan?.id, allInstances])

  useEffect(() => {
    if (!activeDeviceTypeId || !leftForm.deviceInstanceId) return
    const ok = filteredInstances.some((i) => i.id === leftForm.deviceInstanceId)
    if (!ok) setLeftForm((f) => ({ ...f, deviceInstanceId: '' }))
  }, [activeDeviceTypeId, filteredInstances, leftForm.deviceInstanceId])

  const setLeft = (patch) => {
    setLeftForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => { delete next[k] })
      return next
    })
  }

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

  const buildPlanFromCreate = () => ({
    id: nextPlanId(),
    projectId: effectiveProjectId,
    ...buildPlanPayloadFromForm(createPlan, deviceTypes),
    taskCount: 0,
    status: '已发布',
  })

  const handleOk = () => {
    const errs = {}
    if (!leftForm.name.trim()) errs.name = true
    if (!leftForm.purpose) errs.purpose = true
    if (!leftForm.target || isNaN(+leftForm.target) || +leftForm.target < 1) errs.target = true
    if (!leftForm.deviceInstanceId) errs.deviceInstanceId = deviceSelectDisabled ? BODY_TYPE_HINT : true

    if (isEdit) {
      if (Object.keys(errs).length) { setErrors(errs); return }
      const instance = allInstances.find((i) => i.id === leftForm.deviceInstanceId)
      onClose({
        name: leftForm.name.trim(),
        purpose: leftForm.purpose,
        collectTotal: +leftForm.target,
        deviceInstanceId: leftForm.deviceInstanceId,
        device: instance?.sn ?? instance?.code ?? '—',
        layoutId: leftForm.layoutId || null,
      })
      return
    }

    let boundPlan = selectedExistingPlan

    if (planMode === 'create') {
      Object.assign(errs, validatePlanForm(createPlan))
    } else if (!initialPlan && !existingPlanId) {
      errs.existingPlanId = true
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

    const instance = allInstances.find((i) => i.id === leftForm.deviceInstanceId)
    const now = nowDatetime()
    const sceneLabel = boundPlan?.sceneLabel
      ?? formatSceneLabel(boundPlan?.scenePath?.sceneId, boundPlan?.scenePath?.subSceneId, boundPlan?.scenePath?.tagId)
      ?? boundPlan?.sceneLabel
      ?? '—'

    onClose({
      id: nextId,
      planId,
      name: leftForm.name.trim(),
      purpose: leftForm.purpose,
      device: instance?.sn ?? instance?.code ?? '—',
      deviceInstanceId: leftForm.deviceInstanceId,
      robotBody: boundPlan?.robotBody ?? '',
      method: boundPlan?.method ?? '',
      scene: sceneLabel,
      projectId: effectiveProjectId,
      projectName: project?.name ?? '',
      collectTotal: +leftForm.target,
      collectDone: 0,
      reviewDone: 0,
      acceptDone: 0,
      dataTotal: 0,
      status: '草稿',
      creator,
      layoutId: leftForm.layoutId || null,
      annotGenConfig: planMode === 'create' ? createPlan.annotGenConfig : boundPlan?.annotGenConfig,
      annotPreLabel: planMode === 'create' ? createPlan.annotPreLabel : boundPlan?.annotPreLabel,
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑任务' : '新建采集任务'}
      onCancel={() => onClose(null)}
      onOk={handleOk}
      okText={isEdit ? '保存' : '确定'}
      width={960}
      fitViewport
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 左区 ── */}
        <div className="space-y-5">
          <div>
            <SectionTitle>基础信息</SectionTitle>
            <div className="space-y-3">
              <Field label="任务名称" required error={errors.name}>
                <div className="flex overflow-hidden rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-500">
                    {nextId}
                  </span>
                  <input
                    placeholder="请输入任务名称"
                    value={leftForm.name}
                    onChange={(e) => setLeft({ name: e.target.value })}
                    className="h-8 min-w-0 flex-1 border-0 px-3 text-sm outline-none"
                  />
                </div>
              </Field>
              <Field label="任务用途" required error={errors.purpose}>
                <select
                  value={leftForm.purpose}
                  onChange={(e) => setLeft({ purpose: e.target.value })}
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
                  value={leftForm.target}
                  onChange={(e) => setLeft({ target: e.target.value })}
                  className={inputCls(errors.target)}
                />
              </Field>
              <Field
                label="指定采集设备"
                required
                error={errors.deviceInstanceId}
                hint={deviceSelectDisabled ? BODY_TYPE_HINT : undefined}
              >
                <select
                  value={leftForm.deviceInstanceId}
                  disabled={deviceSelectDisabled}
                  onChange={(e) => setLeft({ deviceInstanceId: e.target.value })}
                  className={`${selectCls(errors.deviceInstanceId)} disabled:cursor-not-allowed disabled:bg-gray-100`}
                >
                  <option value="" disabled hidden>
                    {deviceSelectDisabled ? BODY_TYPE_HINT : '请选择设备实例（SN）'}
                  </option>
                  {filteredInstances.map((i) => (
                    <option key={i.id} value={i.id}>{i.sn}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div>
            <SectionTitle>审核布局</SectionTitle>
            <Field label="布局配置">
              <select
                value={leftForm.layoutId}
                onChange={(e) => setLeft({ layoutId: e.target.value })}
                className={selectCls(false)}
              >
                <option value="">默认布局</option>
                {projectLayouts.map((l) => (
                  <option key={l.id} value={String(l.id)}>{l.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── 右区：采集方案 ── */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <SectionTitle>
            采集方案
            {!isEdit && (
              <>
                <span className="ml-1 text-xs font-normal text-red-500">*</span>
                <span className="ml-2 text-xs font-normal text-gray-400">选择方式</span>
              </>
            )}
          </SectionTitle>

          {isEdit ? (
            <PlanReadonlySection plan={editBoundPlan} deviceTypes={deviceTypes} />
          ) : (
            <>
              <ModeToggle
                value={planMode}
                onChange={setPlanMode}
                disabled={!!initialPlan}
              />

              {planMode === 'create' ? (
            <CollectPlanFormFields
              form={createPlan}
              errors={errors}
              deviceTypes={deviceTypes}
              durationMeta={createDurationMeta}
              onChange={(patch) => setCreate(patch)}
              updateStep={updateStep}
              addStep={addStep}
              removeStep={removeStep}
            />
          ) : (
            <div className="space-y-3">
              {initialPlan ? (
                <PlanReadonlySection plan={selectedExistingPlan} deviceTypes={deviceTypes} />
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
