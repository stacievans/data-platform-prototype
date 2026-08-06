const ACTION_TYPE_ID = 'preset-action-semantics'
const REGION_TYPE_ID = 'preset-region-frame'

export function createEmptySegmentAttributes(typeConfig) {
  const attrs = {}
  for (const attr of typeConfig?.attributes ?? []) {
    if (attr.inputType === 'multi') {
      const defaults = (attr.options ?? []).filter((o) => o.isDefault).map((o) => o.value || o.name)
      attrs[attr.value] = defaults
    } else if (attr.inputType === 'single') {
      const defaultOpt = (attr.options ?? []).find((o) => o.isDefault)
      attrs[attr.value] = defaultOpt?.value ?? defaultOpt?.name ?? ''
    } else {
      attrs[attr.value] = ''
    }
  }
  return attrs
}

export function createBlankSegment() {
  return { startFrame: '', endFrame: '', attrs: {} }
}

export function createEmptySegment(typeConfig, startFrame = 0, endFrame = 0) {
  return {
    startFrame,
    endFrame,
    attrs: createEmptySegmentAttributes(typeConfig),
  }
}

export function formatAttrDisplayValue(attr, raw) {
  if (attr.inputType === 'multi') {
    const arr = Array.isArray(raw) ? raw : (raw ? [raw] : [])
    const labels = arr.map((v) => {
      const opt = (attr.options ?? []).find((o) => o.value === v || o.name === v)
      return opt?.name ?? v
    }).filter(Boolean)
    return labels.length ? labels.join('、') : '—'
  }
  if (attr.inputType === 'single') {
    const val = raw?.toString?.() ?? ''
    if (!val) return '—'
    const opt = (attr.options ?? []).find((o) => o.value === val || o.name === val)
    return opt?.name ?? val
  }
  const text = raw?.toString?.()?.trim?.() ?? ''
  return text || '—'
}

export function formatAnnotationDisplayText(typeConfig, row) {
  return (typeConfig?.attributes ?? [])
    .map((attr) => {
      const val = formatAttrDisplayValue(attr, row?.attrs?.[attr.value])
      if (!val || val === '—') return null
      return `${attr.name}：${val}`
    })
    .filter(Boolean)
    .join('\n')
}

export function formatAnnotationSummary(typeConfig, row) {
  const text = formatAnnotationDisplayText(typeConfig, row)
  return text || '—'
}

export function formatAnnotationTooltipLines(typeConfig, row) {
  return (typeConfig?.attributes ?? []).map((attr) => ({
    label: attr.name,
    value: formatAttrDisplayValue(attr, row?.attrs?.[attr.value]),
  }))
}

export function legacyActionToSegment(row) {
  return {
    startFrame: row.startFrame ?? 0,
    endFrame: row.endFrame ?? 0,
    attrs: {
      step_desc: row.desc ?? '',
      skill_tags: row.skill ? [row.skill] : [],
    },
  }
}

export function segmentToLegacyAction(row) {
  const skills = row?.attrs?.skill_tags
  const skill = Array.isArray(skills) ? (skills[0] ?? 'move') : (skills || 'move')
  return {
    startFrame: row.startFrame ?? 0,
    endFrame: row.endFrame ?? 0,
    desc: row.attrs?.step_desc ?? '',
    skill,
    tone: skill === 'move' ? 'gray' : 'blue',
  }
}

export function legacyRegionToSegment(row) {
  return {
    startFrame: row.startFrame ?? 0,
    endFrame: row.endFrame ?? 0,
    attrs: {
      region_label: row.label ?? '',
    },
  }
}

export function segmentToLegacyRegion(row) {
  return {
    startFrame: row.startFrame ?? 0,
    endFrame: row.endFrame ?? 0,
    label: row.attrs?.region_label ?? '',
  }
}

export function loadFragmentSegmentsFromEntry(entry, fragmentTypes = []) {
  const byType = {}
  for (const type of fragmentTypes) {
    byType[type.id] = []
  }

  const stored = entry?.fragmentSegmentsByType
  if (stored && typeof stored === 'object') {
    for (const type of fragmentTypes) {
      byType[type.id] = (stored[type.id] ?? []).map((row) => ({
        startFrame: row.startFrame ?? 0,
        endFrame: row.endFrame ?? 0,
        attrs: { ...(row.attrs ?? {}) },
      }))
    }
    return byType
  }

  if (byType[ACTION_TYPE_ID]) {
    byType[ACTION_TYPE_ID] = (entry?.actionSegments ?? []).map(legacyActionToSegment)
  }
  if (byType[REGION_TYPE_ID]) {
    byType[REGION_TYPE_ID] = (entry?.regionFrames ?? []).map(legacyRegionToSegment)
  }
  return byType
}

export function buildEntryFragmentPayload(fragmentSegmentsByType = {}) {
  return {
    fragmentSegmentsByType,
    actionSegments: (fragmentSegmentsByType[ACTION_TYPE_ID] ?? []).map(segmentToLegacyAction),
    regionFrames: (fragmentSegmentsByType[REGION_TYPE_ID] ?? []).map(segmentToLegacyRegion),
  }
}

export function hasAnyFragmentSegments(fragmentSegmentsByType = {}) {
  return Object.values(fragmentSegmentsByType).some((rows) => rows?.length > 0)
}

export function deriveLegacySegments(fragmentSegmentsByType = {}) {
  return {
    actionSegments: (fragmentSegmentsByType[ACTION_TYPE_ID] ?? []).map(segmentToLegacyAction),
    regionFrames: (fragmentSegmentsByType[REGION_TYPE_ID] ?? []).map(segmentToLegacyRegion),
  }
}

const LONG_PICK_DESC = [
  '1. 视觉定位目标物体中心点',
  '2. 末端沿安全轨迹接近抓取位',
  '3. 夹爪张开至预设开口宽度',
  '4. 垂直下降并包络物体轮廓',
  '5. 确认力矩反馈稳定后抬升',
].join('\n')

const LONG_MOVE_DESC = [
  '1. 规划无碰撞路径至目标区域',
  '2. 保持物体姿态水平移动',
  '3. 途经中间航点减速通过',
  '4. 接近放置点前降低速度',
  '5. 悬停等待下游工序就绪',
].join('\n')

const LONG_HANG_DESC = [
  '1. 对齐挂架或容器的定位销',
  '2. 微调腕部角度满足公差',
  '3. 缓慢释放夹持力',
  '4. 确认物体已可靠放置',
  '5. 回撤至安全待机位',
].join('\n')

/** 工作台 mock 默认片段标注（含多行步骤描述） */
export function buildDefaultFragmentSegmentsMock() {
  return {
    'preset-event-marking': [
      { startFrame: 0, endFrame: 0, attrs: {} },
      { startFrame: 388, endFrame: 388, attrs: {} },
      { startFrame: 1200, endFrame: 1200, attrs: {} },
    ],
    'preset-action-semantics': [
      {
        startFrame: 0,
        endFrame: 480,
        attrs: { step_desc: LONG_PICK_DESC, skill_tags: ['grasp', 'pick'] },
      },
      {
        startFrame: 481,
        endFrame: 1200,
        attrs: { step_desc: LONG_MOVE_DESC, skill_tags: ['move'] },
      },
      {
        startFrame: 1201,
        endFrame: 2100,
        attrs: { step_desc: LONG_HANG_DESC, skill_tags: ['open', 'place'] },
      },
      {
        startFrame: 2101,
        endFrame: 3139,
        attrs: {
          step_desc: '复核放置结果并回到初始姿态，准备下一轮循环。',
          skill_tags: ['grasp'],
        },
      },
    ],
    'preset-region-frame': [
      {
        startFrame: 0,
        endFrame: 800,
        attrs: { region_label: '接近段：从待机位进入作业区域，保持低速与开阔视野。' },
      },
      {
        startFrame: 801,
        endFrame: 2000,
        attrs: {
          region_label: [
            '操作段：核心抓取与转移动作发生区间。',
            '包含抓取、平移、对准与释放等关键步骤。',
            '需重点关注末端轨迹平滑度。',
            '掉帧或抖动多发生在此区间。',
            '标注员应核对动作语义边界是否准确。',
          ].join('\n'),
        },
      },
      {
        startFrame: 2001,
        endFrame: 3139,
        attrs: { region_label: '收尾段：回撤至安全位并等待任务结束信号。' },
      },
    ],
  }
}
