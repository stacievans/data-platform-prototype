/** 工作台整体标签 — 质量评分（单选） */
export const QUALITY_OPTIONS = ['高质量', '中质量', '低质量']

/** 工作台整体标签 — 问题标签（多选） */
export const PROBLEM_TAG_OPTIONS = [
  '未完成任务要求',
  '机械臂卡顿',
  '操作停顿',
  '剧烈碰撞',
  '失败补充次数过多',
  '其它问题',
  '夹取位置不规范',
  '未按步骤执行',
  '重复操作',
  '深度图缺失',
  '夹爪不合理开合',
  '夹爪开合严重不匹配',
  '夹爪延迟过多',
  '夹爪值异常波动',
  '帧率检查不合格',
  '数据对齐检查不合格',
  '满足要求但数据未完全对齐',
  '左手无位姿信息',
  '右手无位姿信息',
  '左右手均无位姿信息',
  '摄像头遮挡',
]

const LEGACY_QUALITY_MAP = {
  优秀: '高质量',
  可接受: '中质量',
  差: '低质量',
}

export function normalizeAuditQuality(value) {
  if (!value) return null
  return LEGACY_QUALITY_MAP[value] ?? (QUALITY_OPTIONS.includes(value) ? value : null)
}
