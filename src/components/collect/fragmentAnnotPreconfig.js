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

export function buildPresetFragmentTypes() {
  const skillOptions = getAtomicSkillTags().map((t) => ({ name: t.name, value: t.name }))
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
  return { name: '', value: '' }
}

export function mergePresetFragmentTypes(existing = []) {
  const presets = buildPresetFragmentTypes()
  const custom = (existing ?? []).filter((t) => !t.preset)
  return [...presets, ...custom]
}

export function stripPresetFragmentTypes(existing = []) {
  return (existing ?? []).filter((t) => !t.preset)
}

/** 表单仅存自定义类型；勾选时展示层合并预置大类 */
export function getDisplayFragmentTypes(autoFromPlan, customTypes = []) {
  const custom = (customTypes ?? []).filter((t) => !t.preset)
  return autoFromPlan ? mergePresetFragmentTypes(custom) : custom
}

export function resolveCustomFragmentTypesFromPlan(plan) {
  return stripPresetFragmentTypes(plan?.fragmentAnnotTypes ?? [])
}

export function resolveFragmentTypesFromPlan(plan) {
  const auto = resolveAnnotAutoFragment(plan)
  const custom = resolveCustomFragmentTypesFromPlan(plan)
  return getDisplayFragmentTypes(auto, custom)
}

export function resolveAnnotAutoFragment(plan) {
  if (plan?.annotAutoFragment != null) return plan.annotAutoFragment !== false
  return plan?.annotGenConfig !== false && plan?.annotPreLabel !== false
}
