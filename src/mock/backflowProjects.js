/** 真机回流模块统一项目选项 */
export const BACKFLOW_PROJECTS = [
  { value: 'zhimo', label: '智魔方' },
  { value: 'airport', label: '机场' },
]

export const BACKFLOW_PROJECT_OPTIONS = [
  { value: 'all', label: '全部项目' },
  ...BACKFLOW_PROJECTS,
]

export const BACKFLOW_EVENT_PROJECT_OPTIONS = [
  { value: 'all', label: '全部所属项目' },
  ...BACKFLOW_PROJECTS,
]
