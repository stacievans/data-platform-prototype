/** 条目质检结果（与 plans.js 质检项配置联动） */

export const FRAME_DROP_QC_NAME = '掉帧检查'

export function buildFrameDropResult(seed, fail = false) {
  if (fail) {
    const effectiveFps = 24.6 + (seed % 4) * 0.15
    const fpsStdDev = 1.05 + (seed % 6) * 0.07
    return {
      passed: false,
      effectiveFps: Math.round(effectiveFps * 10) / 10,
      fpsStdDev: Math.round(fpsStdDev * 100) / 100,
    }
  }
  const effectiveFps = 28 + (seed % 21) * 0.1
  const fpsStdDev = 0.32 + (seed % 10) * 0.04
  return {
    passed: true,
    effectiveFps: Math.round(effectiveFps * 10) / 10,
    fpsStdDev: Math.round(fpsStdDev * 100) / 100,
  }
}

export function buildEntryQcResults(seed, { frameDropFail = false } = {}) {
  return {
    frameDrop: buildFrameDropResult(seed, frameDropFail),
  }
}

export function entryQcSeed(entryId) {
  return String(entryId ?? '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
}

/** 单条质检项检查结果（用于详情弹窗） */
export function resolveQcRowResult(entry, item) {
  const hasQc = entry.dataStatus !== '已上传'
  if (!hasQc) return { passed: null, detail: '—' }

  if (item.name === FRAME_DROP_QC_NAME) {
    const seed = entryQcSeed(entry.id)
    const fd = entry.qcResults?.frameDrop ?? buildFrameDropResult(seed, entry.dataStatus === '质检不通过')
    return {
      passed: fd.passed,
      detail: `有效帧率 ${fd.effectiveFps} Hz、帧率标准差 ${fd.fpsStdDev}`,
    }
  }

  if (entry.dataStatus === '质检不通过') {
    return { passed: true, detail: '—' }
  }

  return { passed: true, detail: '—' }
}

export function ensureEntryQcResults(entry) {
  if (entry.qcResults) return entry.qcResults
  if (entry.dataStatus === '已上传') return undefined
  const seed = entryQcSeed(entry.id)
  const fail = entry.dataStatus === '质检不通过'
  return buildEntryQcResults(seed, { frameDropFail: fail })
}
