import { getAtomicSkillTags } from '../../mock/tags'

export const FRAGMENT_INPUT_TYPES = [
  { value: 'text', label: '文本输入' },
  { value: 'single', label: '单选' },
  { value: 'multi', label: '多选' },
]

let uid = 0
export function nextFragmentId(prefix = 'frag') {
  uid += 1
  return `${prefix}-${Date.now()}-${uid}`
}

export const MANDATORY_FRAGMENT_TYPE_ID = 'preset-event-marking'

function buildEventMarkingType() {
  return {
    id: MANDATORY_FRAGMENT_TYPE_ID,
    preset: true,
    mandatory: true,
    name: '采集打点',
    value: 'Event Marking',
    color: '#52c41a',
    forbidOverlap: true,
    attributes: [],
  }
}

export function isMandatoryFragmentType(typeItem) {
  return typeItem?.id === MANDATORY_FRAGMENT_TYPE_ID || typeItem?.mandatory === true
}

export function buildOptionalPresetFragmentTypes() {
  const skillOptions = getAtomicSkillTags().map((t) => ({ name: t.name, value: t.name, isDefault: false }))
  return [
    {
      id: 'preset-action-semantics',
      preset: true,
      name: '动作语义',
      value: 'action_semantics',
      color: '#1890ff',
      forbidOverlap: true,
      attributes: [
        {
          id: 'preset-attr-step-desc',
          name: '步骤描述',
          value: 'step_desc',
          inputType: 'text',
          options: [],
        },
        {
          id: 'preset-attr-skill-tags',
          name: '技能标签',
          value: 'skill_tags',
          inputType: 'multi',
          options: skillOptions,
        },
      ],
    },
    {
      id: 'preset-region-frame',
      preset: true,
      name: '区域帧',
      value: 'region_frame',
      color: '#faad14',
      forbidOverlap: true,
      attributes: [
        {
          id: 'preset-attr-region-label',
          name: '区域名称',
          value: 'region_label',
          inputType: 'text',
          options: [],
        },
      ],
    },
  ]
}

export function buildPresetFragmentTypes() {
  return [buildEventMarkingType(), ...buildOptionalPresetFragmentTypes()]
}

function resolveMandatoryFragmentType(storedPresets = []) {
  const stored = storedPresets.find((t) => t.id === MANDATORY_FRAGMENT_TYPE_ID)
  const base = buildEventMarkingType()
  if (!stored) return base
  return {
    ...base,
    ...stored,
    id: MANDATORY_FRAGMENT_TYPE_ID,
    preset: true,
    mandatory: true,
  }
}

function mergeOptionalPresetsWithCatalog(storedPresets = []) {
  const catalog = buildOptionalPresetFragmentTypes()
  const storedById = new Map(
    storedPresets
      .filter((t) => t.id !== MANDATORY_FRAGMENT_TYPE_ID)
      .map((t) => [t.id, t]),
  )
  return catalog.map((preset) => storedById.get(preset.id) ?? preset)
}

function mergeStoredPresetsWithCatalog(storedPresets = []) {
  return [
    resolveMandatoryFragmentType(storedPresets),
    ...mergeOptionalPresetsWithCatalog(storedPresets),
  ]
}

export function ensureMandatoryFragmentTypes(types = []) {
  const mandatory = resolveMandatoryFragmentType(types.filter((t) => t.preset))
  const rest = types.filter((t) => t.id !== MANDATORY_FRAGMENT_TYPE_ID)
  return [mandatory, ...rest]
}

export function emptyCustomFragmentType() {
  return {
    id: nextFragmentId('custom-type'),
    preset: false,
    name: '',
    value: '',
    color: '#722ed1',
    forbidOverlap: false,
    attributes: [],
  }
}

export function emptyFragmentAttribute() {
  return {
    id: nextFragmentId('attr'),
    name: '',
    value: '',
    inputType: 'text',
    options: [],
  }
}

export function emptyFragmentOption() {
  return { name: '', value: '', isDefault: false }
}

export function normalizeFragmentOption(option) {
  return {
    name: option?.name ?? '',
    value: option?.value ?? '',
    isDefault: Boolean(option?.isDefault),
  }
}

export function normalizeFragmentOptions(options = [], inputType = 'multi') {
  const normalized = options.map(normalizeFragmentOption)
  if (inputType !== 'single') return normalized
  const defaultIndex = normalized.findIndex((opt) => opt.isDefault)
  if (defaultIndex < 0) return normalized
  return normalized.map((opt, index) => ({ ...opt, isDefault: index === defaultIndex }))
}

export function mergePresetFragmentTypes(existing = []) {
  const storedPresets = (existing ?? []).filter((t) => t.preset)
  const custom = (existing ?? []).filter((t) => !t.preset)
  return [...mergeStoredPresetsWithCatalog(storedPresets), ...custom]
}

export function stripPresetFragmentTypes(existing = []) {
  return (existing ?? []).filter((t) => !t.preset)
}

/** 表单展示层合并预置大类；采集打点始终存在且置顶 */
export function getDisplayFragmentTypes(autoFromPlan, storedTypes = []) {
  const all = storedTypes ?? []
  const storedPresets = all.filter((t) => t.preset)
  const custom = all.filter((t) => !t.preset)
  const mandatory = resolveMandatoryFragmentType(storedPresets)

  let optionalPresets = []
  if (storedPresets.length > 0 || autoFromPlan) {
    optionalPresets = storedPresets.length > 0
      ? mergeOptionalPresetsWithCatalog(storedPresets)
      : buildOptionalPresetFragmentTypes()
  }

  return [mandatory, ...optionalPresets, ...custom]
}

export function resolveCustomFragmentTypesFromPlan(plan) {
  return stripPresetFragmentTypes(plan?.fragmentAnnotTypes ?? [])
}

export function resolveFragmentTypesFromPlan(plan) {
  const auto = resolveAnnotAutoFragment(plan)
  return getDisplayFragmentTypes(auto, plan?.fragmentAnnotTypes ?? [])
}

export function resolveAnnotAutoFragment(plan) {
  if (plan?.annotGenConfig != null) return plan.annotGenConfig !== false
  if (plan?.annotAutoFragment != null) return plan.annotAutoFragment !== false
  return plan?.annotPreLabel !== false
}
