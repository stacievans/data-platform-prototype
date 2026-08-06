import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { IconTrash, IconChevronDown } from '../common/Icons'
import { SelectChevronWrap, nativeSelectChevronCls } from '../common/SelectControl'
import SceneCascader from '../common/SceneCascader'
import { getSceneTypeTree, getCollectionMethodTags, getAtomicSkillTags, getAuditTemplates, getAuditTemplateById } from '../../mock/tags'
import { resolvePlanDeviceTypeId } from '../../mock/plans'
import FragmentAnnotPreconfigPanel from './FragmentAnnotPreconfigPanel'
import {
  getDisplayFragmentTypes,
  resolveAnnotAutoFragment,
  resolveCustomFragmentTypesFromPlan,
  stripPresetFragmentTypes,
} from './fragmentAnnotPreconfig'

export const EMPTY_STEP = { description: '', atomicSkills: [], duration: '' }

export const COLLECT_PLAN_DRAWER_WIDTH = 'min(960px, calc(100vw - var(--layout-sidebar-width, 13rem)))'

export const emptyCreatePlan = () => ({
  name: '',
  sceneId: '',
  subSceneId: '',
  tagId: '',
  deviceTypeId: '',
  method: getCollectionMethodTags()[0]?.name ?? '算法采集',
  initialScene: '',
  steps: [{ ...EMPTY_STEP }],
  totalDeviation: '',
  annotTemplateId: '',
  annotAutoFragment: true,
  annotGenConfig: true,
  annotPreLabel: true,
  fragmentAnnotTypes: [],
})

export function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{typeof error === 'string' ? error : '请填写此项'}</p>}
    </div>
  )
}

export const readonlyCls =
  'h-8 w-full rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none cursor-default'

export const inputCls = (err) =>
  `h-8 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

export const selectCls = (err) =>
  `h-8 w-full cursor-pointer rounded-md border px-2.5 text-sm text-gray-700 outline-none transition-colors focus:ring-2 ${nativeSelectChevronCls} ${
    err ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  }`

export function formatSceneLabel(sceneId, subSceneId, tagId) {
  const scene = getSceneTypeTree().find((s) => s.id === sceneId)
  const sub = scene?.subScenes?.find((s) => s.id === subSceneId)
  const tag = sub?.tags?.find((t) => t.id === tagId)
  return [scene?.name, sub?.name, tag?.name].filter(Boolean).join(' / ')
}

export function normalizeAtomicSkills(step) {
  if (Array.isArray(step?.atomicSkills) && step.atomicSkills.length) return step.atomicSkills
  if (step?.atomicSkill) return [step.atomicSkill]
  return []
}

export function isStepEmpty(step) {
  const hasDesc = !!step?.description?.trim()
  const hasSkills = normalizeAtomicSkills(step).length > 0
  const hasDuration = step?.duration !== '' && step?.duration != null && Number(step.duration) > 0
  return !hasDesc && !hasSkills && !hasDuration
}

export function normalizeStepsForSave(steps) {
  return (steps ?? [])
    .filter((s) => !isStepEmpty(s))
    .map((s) => ({
      description: s.description,
      atomicSkills: s.atomicSkills ?? [],
      atomicSkill: (s.atomicSkills ?? [])[0] ?? '',
      duration: Number(s.duration) || 0,
    }))
}

function calcStepTotalDuration(steps) {
  return (steps ?? [])
    .filter((s) => !isStepEmpty(s))
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
}

export function calcPlanDurationMeta(steps, totalDeviation) {
  const totalDuration = calcStepTotalDuration(steps)
  const dev = Math.max(0, Number(totalDeviation) || 0)
  if (totalDuration === 0) {
    return { totalDuration: 0, totalDeviation: dev, durationMin: 0, durationMax: 0 }
  }
  return {
    totalDuration,
    totalDeviation: dev,
    durationMin: Math.max(0, totalDuration - dev),
    durationMax: totalDuration + dev,
  }
}

export function resolvePlanDurationMeta(plan) {
  const totalDuration = calcStepTotalDuration(plan?.steps)
  let totalDeviation = plan?.totalDeviation
  if (totalDeviation == null || totalDeviation === '') {
    if (plan?.durationMax != null && plan?.durationMin != null) {
      totalDeviation = Math.round((plan.durationMax - plan.durationMin) / 2)
    } else {
      totalDeviation = 0
    }
  }
  return calcPlanDurationMeta(plan?.steps, totalDeviation)
}

function StepField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      {children}
    </div>
  )
}

function BodyTypeParsedPanel({ type }) {
  return (
    <div className="mt-2 space-y-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
      <div>
        本体机型：<strong className="text-gray-800">{type?.body ?? '—'}</strong>
      </div>
      <div className="flex gap-6">
        <span>左末端：<strong className="text-gray-800">{type?.leftEnd ?? '—'}</strong></span>
        <span>右末端：<strong className="text-gray-800">{type?.rightEnd ?? '—'}</strong></span>
      </div>
    </div>
  )
}

export function BodyTypeField({ typeId, deviceTypes, onChange, error, readonly = false }) {
  const type = deviceTypes.find((t) => t.id === typeId) ?? null

  if (readonly) {
    return (
      <Field label="设备类型">
        <input readOnly value={type?.name ?? '—'} className={readonlyCls} />
        <BodyTypeParsedPanel type={type} />
      </Field>
    )
  }

  return (
    <Field label="设备类型" required error={error}>
      <select
        value={typeId}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls(error)}
      >
        <option value="" disabled hidden>请选择设备类型</option>
        {deviceTypes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <BodyTypeParsedPanel type={type} />
    </Field>
  )
}

export function SceneCascadeFields({ form, onChange, readonly = false, errors = {} }) {
  if (readonly) {
    return (
      <Field label="所属场景">
        <input readOnly value={formatSceneLabel(form.sceneId, form.subSceneId, form.tagId) || form.sceneLabel || '—'} className={readonlyCls} />
      </Field>
    )
  }

  return (
    <Field label="所属场景" required error={errors.scene}>
      <SceneCascader
        sceneId={form.sceneId}
        subSceneId={form.subSceneId}
        tagId={form.tagId}
        error={Boolean(errors.scene)}
        onChange={({ sceneId, subSceneId, tagId }) => onChange({ sceneId, subSceneId, tagId })}
      />
    </Field>
  )
}

function SearchableAuditTemplateSelect({ templates, value, onChange, error }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = templates.find((t) => t.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q))
  }, [templates, query])

  useEffect(() => {
    if (selected) setQuery(selected.name)
    else if (!value) setQuery('')
  }, [selected, value])

  return (
    <div className="relative">
      <SelectChevronWrap>
        <input
          value={query}
          placeholder="请选择标注标签模板"
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
              <p className="px-3 py-2 text-sm text-gray-400">无匹配模板</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onChange(t.id)
                  setQuery(t.name)
                  setOpen(false)
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AnnotationManagementBlock({ form, errors, onChange, readonly = false }) {
  const auditTemplates = useMemo(() => getAuditTemplates(), [])
  const templateName = getAuditTemplateById(form.annotTemplateId)?.name ?? '—'
  const autoFromPlan = form.annotAutoFragment !== false
  const customTypes = useMemo(
    () => stripPresetFragmentTypes(form.fragmentAnnotTypes ?? []),
    [form.fragmentAnnotTypes],
  )
  const displayTypes = useMemo(
    () => getDisplayFragmentTypes(autoFromPlan, customTypes),
    [autoFromPlan, customTypes],
  )

  const handleAutoToggle = (checked) => {
    onChange({
      annotAutoFragment: checked,
      annotGenConfig: checked,
      annotPreLabel: checked,
    })
  }

  const handleFragmentTypesChange = (nextTypes) => {
    onChange({ fragmentAnnotTypes: stripPresetFragmentTypes(nextTypes) })
  }

  if (readonly) {
    return (
      <div className="space-y-3">
        <Field label="整体标签模板">
          <input readOnly value={templateName} className={readonlyCls} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">片段标注配置</p>
          <p className="mb-2 text-sm text-gray-600">
            {autoFromPlan ? '☑' : '☐'} 基于采集方案生成片段标注配置并预标注
          </p>
          <FragmentAnnotPreconfigPanel
            readonly
            types={displayTypes}
            autoFromPlan={autoFromPlan}
            onChange={() => {}}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Field label="整体标签模板" required error={errors.plan_annotTemplateId}>
        <SearchableAuditTemplateSelect
          templates={auditTemplates}
          value={form.annotTemplateId}
          onChange={(annotTemplateId) => onChange({ annotTemplateId })}
          error={errors.plan_annotTemplateId}
        />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">片段标注配置</p>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={autoFromPlan}
            onChange={(e) => handleAutoToggle(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          基于采集方案生成片段标注配置并预标注
        </label>
        <FragmentAnnotPreconfigPanel
          types={displayTypes}
          autoFromPlan={autoFromPlan}
          onChange={handleFragmentTypesChange}
          defaultExpanded={false}
        />
      </div>
    </div>
  )
}

export function AtomicSkillMultiSelect({ value = [], onChange, readonly = false }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const updateMenuPos = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }

  useEffect(() => {
    if (!open) return undefined
    updateMenuPos()
    const onDocClick = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onReposition = () => updateMenuPos()
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

  const toggle = (name) => {
    onChange(value.includes(name) ? value.filter((s) => s !== name) : [...value, name])
  }

  if (readonly) {
    const skills = value
    if (!skills.length) return <span className="text-xs text-gray-400">—</span>
    return (
      <div className="flex flex-wrap gap-1">
        {skills.map((skill) => (
          <Badge key={skill} color="cyan">{skill}</Badge>
        ))}
      </div>
    )
  }

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
      className="rounded-md border border-gray-200 bg-white py-1 shadow-lg"
    >
      {getAtomicSkillTags().map((t) => {
        const checked = value.includes(t.name)
        return (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(t.name)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            {t.name}
          </label>
        )
      })}
    </div>,
    document.body,
  ) : null

  return (
    <div ref={triggerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => { setOpen((v) => !v); if (!open) updateMenuPos() }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setOpen((v) => !v); if (!open) updateMenuPos() } }}
        className="relative flex min-h-10 w-full cursor-pointer items-center rounded-md border border-gray-300 bg-white py-2 pl-2.5 pr-8 text-left text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <div className="min-w-0 flex-1">
          {value.length === 0 ? (
            <span className="text-gray-400">请选择原子技能</span>
          ) : (
            <span className="flex flex-wrap gap-1.5">
              {value.map((skill) => (
                <Badge key={skill} color="cyan">
                  {skill}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 cursor-pointer text-cyan-800/60 hover:text-cyan-900"
                    onClick={(e) => { e.stopPropagation(); toggle(skill) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggle(skill) } }}
                  >
                    ×
                  </span>
                </Badge>
              ))}
            </span>
          )}
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-400" aria-hidden>
          <IconChevronDown />
        </span>
      </div>
      {menu}
    </div>
  )
}

export function PlanDurationSummary({ totalDuration, totalDeviation, onDeviationChange, readonly = false }) {
  const dev = Math.max(0, Number(totalDeviation) || 0)
  const min = totalDuration === 0 ? 0 : Math.max(0, totalDuration - dev)
  const max = totalDuration === 0 ? 0 : totalDuration + dev

  return (
    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
      <div className="flex flex-nowrap items-center gap-4 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          <span className="text-gray-600">总时长：</span>
          <span className="font-medium text-gray-800">{totalDuration} 秒</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          <span className="text-gray-600">总偏差：</span>
          {readonly ? (
            <span className="font-medium text-gray-800">{dev} 秒</span>
          ) : (
            <>
              <input
                type="number"
                min="0"
                placeholder="秒"
                value={totalDeviation}
                onChange={(e) => onDeviationChange(e.target.value)}
                className="h-8 w-12 shrink-0 rounded-md border border-gray-300 px-1.5 text-center text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-gray-600">秒</span>
            </>
          )}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-gray-600">目标时间范围：</span>
        <span className="font-medium text-gray-800">{min} ~ {max} 秒</span>
      </div>
    </div>
  )
}

export function PlanStepsReadonly({ steps }) {
  const visible = (steps ?? []).filter((s) => !isStepEmpty(s))
  if (!visible.length) return <p className="text-sm text-gray-400">暂无步骤</p>
  return (
    <div className="space-y-1.5">
      {visible.map((s, i) => (
        <div key={i} className="grid grid-cols-[24px_1fr_auto_56px] items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5 text-xs">
          <span className="font-semibold text-blue-600">{i + 1}</span>
          <span className="text-gray-700">{s.description || '—'}</span>
          <AtomicSkillMultiSelect value={normalizeAtomicSkills(s)} readonly />
          <span className="text-gray-500">{s.duration ?? 0}s</span>
        </div>
      ))}
    </div>
  )
}

export function PlanReadonlyDetails({ plan, deviceTypes }) {
  const durationMeta = useMemo(
    () => (plan ? resolvePlanDurationMeta(plan) : null),
    [plan],
  )
  const readonlySceneForm = plan?.scenePath
    ? plan.scenePath
    : { sceneLabel: plan?.sceneLabel ?? '—' }

  if (!plan) return null

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
      <SceneCascadeFields
        readonly
        form={{
          ...readonlySceneForm,
          sceneId: plan.scenePath?.sceneId,
          subSceneId: plan.scenePath?.subSceneId,
          tagId: plan.scenePath?.tagId,
          sceneLabel: plan.sceneLabel,
        }}
      />
      <BodyTypeField
        readonly
        typeId={resolvePlanDeviceTypeId(plan)}
        deviceTypes={deviceTypes}
      />
      <Field label="采集方式">
        <input readOnly value={plan.method ?? '—'} className={readonlyCls} />
      </Field>
      <Field label="原始场景状态">
        <textarea readOnly rows={2} value={plan.initialScene || '—'} className={`${readonlyCls} h-auto py-2`} />
      </Field>
      <Field label="采集步骤">
        <PlanStepsReadonly steps={plan.steps} />
      </Field>
      {durationMeta && (
        <PlanDurationSummary
          readonly
          totalDuration={durationMeta.totalDuration}
          totalDeviation={durationMeta.totalDeviation}
        />
      )}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-800">标注配置</p>
        <AnnotationManagementBlock
          readonly
          form={{
            annotTemplateId: plan.annotTemplateId ?? '',
            annotAutoFragment: resolveAnnotAutoFragment(plan),
            annotGenConfig: plan.annotGenConfig,
            annotPreLabel: plan.annotPreLabel,
            fragmentAnnotTypes: resolveCustomFragmentTypesFromPlan(plan),
          }}
          onChange={() => {}}
        />
      </div>
    </div>
  )
}

export function PlanReadonlySection({ plan, deviceTypes }) {
  if (!plan) return <p className="text-sm text-gray-400">未找到绑定方案</p>
  return (
    <div className="space-y-3">
      <Field label="采集方案名称">
        <input readOnly value={`${plan.id} · ${plan.name}`} className={readonlyCls} />
      </Field>
      <PlanReadonlyDetails plan={plan} deviceTypes={deviceTypes} />
    </div>
  )
}

export function validatePlanForm(form) {
  const errs = {}
  if (!form.name.trim()) errs.plan_name = true
  if (!form.sceneId || !form.subSceneId || !form.tagId) errs.scene = true
  if (!form.deviceTypeId) errs.plan_deviceTypeId = true
  if (!form.method) errs.plan_method = true
  if (!form.annotTemplateId) errs.plan_annotTemplateId = true
  return errs
}

export function planToForm(plan) {
  if (!plan) return emptyCreatePlan()
  const totalDeviation = plan.totalDeviation ?? (
    plan.durationMax != null && plan.durationMin != null
      ? Math.round((plan.durationMax - plan.durationMin) / 2)
      : ''
  )
  const steps = (plan.steps?.length ? plan.steps : [{ ...EMPTY_STEP }]).map((s) => ({
    description: s.description ?? '',
    atomicSkills: normalizeAtomicSkills(s),
    duration: s.duration ?? '',
  }))
  return {
    name: plan.name ?? '',
    sceneId: plan.scenePath?.sceneId ?? '',
    subSceneId: plan.scenePath?.subSceneId ?? '',
    tagId: plan.scenePath?.tagId ?? '',
    deviceTypeId: resolvePlanDeviceTypeId(plan),
    method: plan.method ?? '',
    initialScene: plan.initialScene ?? '',
    steps,
    totalDeviation,
    annotTemplateId: plan.annotTemplateId ?? '',
    annotAutoFragment: resolveAnnotAutoFragment(plan),
    annotGenConfig: plan.annotGenConfig !== false,
    annotPreLabel: plan.annotPreLabel !== false,
    fragmentAnnotTypes: resolveCustomFragmentTypesFromPlan(plan),
  }
}

export function buildPlanPayloadFromForm(form) {
  const { durationMin, durationMax, totalDeviation } = calcPlanDurationMeta(form.steps, form.totalDeviation)
  const sceneLabel = formatSceneLabel(form.sceneId, form.subSceneId, form.tagId)
  return {
    name: form.name.trim(),
    deviceTypeId: form.deviceTypeId,
    method: form.method,
    sceneLabel,
    scenePath: {
      sceneId: form.sceneId,
      subSceneId: form.subSceneId,
      tagId: form.tagId,
    },
    initialScene: form.initialScene,
    totalDeviation,
    durationMin,
    durationMax,
    steps: normalizeStepsForSave(form.steps),
    annotTemplateId: form.annotTemplateId,
    annotAutoFragment: form.annotAutoFragment !== false,
    annotGenConfig: form.annotAutoFragment !== false,
    annotPreLabel: form.annotAutoFragment !== false,
    fragmentAnnotTypes: stripPresetFragmentTypes(form.fragmentAnnotTypes ?? []),
  }
}

export function CollectPlanFormFields({
  form,
  errors = {},
  deviceTypes,
  durationMeta,
  onChange,
  updateStep,
  addStep,
  removeStep,
  planNameLabel = '方案名称',
  readonly = false,
}) {
  if (readonly) {
    const visibleSteps = (form.steps ?? []).filter((s) => !isStepEmpty(s))
    return (
      <div className="space-y-5">
        <section>
          <p className="mb-3 text-sm font-semibold text-gray-800">基础信息</p>
          <div className="space-y-3">
            <Field label={planNameLabel}>
              <input readOnly value={form.name || '—'} className={readonlyCls} />
            </Field>
            <SceneCascadeFields form={form} readonly />
            <BodyTypeField readonly typeId={form.deviceTypeId} deviceTypes={deviceTypes} />
            <Field label="采集方式">
              <input readOnly value={form.method || '—'} className={readonlyCls} />
            </Field>
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-800">动作模板</p>
          <div className="space-y-3">
            <Field label="原始场景状态">
              <textarea
                readOnly
                rows={3}
                value={form.initialScene || '—'}
                className={`${readonlyCls} h-auto py-2`}
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">采集步骤</p>
              {visibleSteps.length === 0 ? (
                <p className="text-sm text-gray-400">暂无步骤</p>
              ) : (
                <div className="space-y-3">
                  {visibleSteps.map((step, i) => (
                    <div key={i} className="rounded-md border border-gray-200 bg-white p-3">
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-blue-600">步骤 {i + 1}</span>
                      </div>
                      <div className="space-y-3">
                        <StepField label="步骤描述">
                          <input readOnly value={step.description || '—'} className={readonlyCls} />
                        </StepField>
                        <div className="grid grid-cols-[2fr_1fr] gap-3">
                          <StepField label="原子技能">
                            <AtomicSkillMultiSelect value={step.atomicSkills ?? []} readonly />
                          </StepField>
                          <StepField label="时长(秒)">
                            <input readOnly value={step.duration ?? 0} className={readonlyCls} />
                          </StepField>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <PlanDurationSummary
                  readonly
                  totalDuration={durationMeta.totalDuration}
                  totalDeviation={form.totalDeviation}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-800">标注配置</p>
          <AnnotationManagementBlock readonly form={form} onChange={() => {}} />
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-3 text-sm font-semibold text-gray-800">基础信息</p>
        <div className="space-y-3">
          <Field label={planNameLabel} required error={errors.plan_name}>
            <input
              placeholder="请输入方案名称"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={inputCls(errors.plan_name)}
            />
          </Field>

          <SceneCascadeFields
            form={form}
            errors={errors}
            onChange={onChange}
          />

          <BodyTypeField
            typeId={form.deviceTypeId}
            deviceTypes={deviceTypes}
            error={errors.plan_deviceTypeId}
            onChange={(deviceTypeId) => onChange({ deviceTypeId })}
          />

          <Field label="采集方式" required error={errors.plan_method}>
            <select
              value={form.method}
              onChange={(e) => onChange({ method: e.target.value })}
              className={selectCls(errors.plan_method)}
            >
              {getCollectionMethodTags().map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-800">动作模板</p>
        <div className="space-y-3">
          <Field label="原始场景状态">
            <textarea
              rows={3}
              maxLength={500}
              placeholder="描述场景初始状态"
              value={form.initialScene}
              onChange={(e) => onChange({ initialScene: e.target.value.slice(0, 500) })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">{form.initialScene.length}/500</p>
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">采集步骤</p>
            <div className="space-y-3">
              {form.steps.map((step, i) => (
                <div key={i} className="rounded-md border border-gray-200 bg-white p-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-600">步骤 {i + 1}</span>
                    {form.steps.length >= 2 && (
                      <button
                        type="button"
                        title="删除步骤"
                        onClick={() => removeStep(i)}
                        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <StepField label="步骤描述">
                      <input
                        placeholder="步骤描述"
                        value={step.description}
                        onChange={(e) => updateStep(i, 'description', e.target.value)}
                        className={inputCls(false)}
                      />
                    </StepField>
                    <div className="grid grid-cols-[2fr_1fr] gap-3">
                      <StepField label="原子技能">
                        <AtomicSkillMultiSelect
                          value={step.atomicSkills ?? []}
                          onChange={(skills) => updateStep(i, 'atomicSkills', skills)}
                        />
                      </StepField>
                      <StepField label="时长(秒)">
                        <input
                          type="number"
                          min="0"
                          placeholder="时长(秒)"
                          value={step.duration}
                          onChange={(e) => updateStep(i, 'duration', e.target.value)}
                          className={inputCls(false)}
                        />
                      </StepField>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <Button variant="link" size="sm" onClick={addStep}>+ 添加步骤</Button>
            </div>
            <div className="mt-3">
              <PlanDurationSummary
                totalDuration={durationMeta.totalDuration}
                totalDeviation={form.totalDeviation}
                onDeviationChange={(v) => onChange({ totalDeviation: v })}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-800">标注配置</p>
        <AnnotationManagementBlock form={form} errors={errors} onChange={onChange} />
      </section>
    </div>
  )
}

const ACTION_SEMANTIC_MAP = {
  grasp: '抓取',
  open: '打开',
  close: '关闭',
  move: '移动',
  pull: '拉取',
  push: '推送',
  press: '按压',
}

function deriveActionSemantic(step) {
  if (step?.semantic?.trim()) return step.semantic.trim()
  if (step?.actionSemantic?.trim()) return step.actionSemantic.trim()
  const skills = normalizeAtomicSkills(step)
  if (!skills.length) return '—'
  return ACTION_SEMANTIC_MAP[skills[0]] ?? skills[0]
}

export function isPlanAnnotConfigEnabled(plan) {
  if (!plan) return false
  if (plan.annotAutoFragment != null) return plan.annotAutoFragment !== false
  return plan.annotGenConfig !== false || plan.annotPreLabel !== false
}

export function buildAnnotationConfigRows(plan) {
  return (plan?.steps ?? [])
    .filter((s) => !isStepEmpty(s))
    .map((s) => ({
      category: deriveActionSemantic(s),
      attribute: s.description?.trim() || '—',
      skills: normalizeAtomicSkills(s),
      duration: Number(s.duration) || 0,
    }))
}

export function PlanAnnotationDetails({ plan }) {
  const enabled = isPlanAnnotConfigEnabled(plan)
  const rows = buildAnnotationConfigRows(plan)

  if (!enabled) {
    return <p className="text-sm text-gray-500">该方案未启用标注配置生成</p>
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
        由采集方案步骤自动生成。
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">暂无有效步骤</p>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[minmax(88px,1fr)_minmax(120px,1.4fr)_auto_56px] gap-3 px-3 text-xs font-medium text-gray-400">
            <span>动作语义（类别）</span>
            <span>步骤描述（属性）</span>
            <span>技能标签（原子技能）</span>
            <span>时长</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(88px,1fr)_minmax(120px,1.4fr)_auto_56px] items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="text-gray-800">{row.category}</span>
              <span className="text-gray-700">{row.attribute}</span>
              <span className="flex flex-wrap gap-1">
                {row.skills.length ? row.skills.map((skill) => (
                  <Badge key={skill} color="cyan">{skill}</Badge>
                )) : <span className="text-gray-400">—</span>}
              </span>
              <span className="text-gray-600">{row.duration}s</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
