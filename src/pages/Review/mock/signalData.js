function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function segmentAtFrame(segments, frame) {
  return segments.find((s) => frame >= s.startFrame && frame <= s.endFrame) ?? null
}

function segmentPhase(seg, frame) {
  if (!seg) return 0
  return (frame - seg.startFrame) / Math.max(seg.endFrame - seg.startFrame, 1)
}

function smoothNoise(rand, t, freq = 3) {
  return Math.sin(t * Math.PI * freq) * 0.4 + Math.sin(t * Math.PI * (freq * 1.7) + 1.2) * 0.25 + (rand() - 0.5) * 0.08
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function valueForType(type, t, phase, skill, rand, side) {
  const sideOff = side === 'left' ? 0 : 0.12
  const s = smoothNoise(rand, t + sideOff, type === 'gripper' ? 2 : 4)

  if (type === 'joint') {
    let base = Math.sin(t * Math.PI * 2) * 60 + s * 35
    if (skill === 'grasp') base += phase * 45 - 20
    else if (skill === 'move') base += Math.sin(phase * Math.PI) * 80
    else if (skill === 'open') base += (1 - phase) * 30
    return clamp(base + (side === 'right' ? 18 : -12), -180, 180)
  }

  if (type === 'pose') {
    let base = Math.sin(t * Math.PI * 1.5 + 0.5) * 0.9 + s * 0.35
    if (skill === 'grasp') base += phase * 0.6 - 0.3
    else if (skill === 'move') base += Math.sin(phase * Math.PI * 2) * 0.5
    return clamp(base + (side === 'right' ? 0.25 : -0.15), -2, 2)
  }

  // gripper 0~1010
  let base = 820 + s * 60
  if (skill === 'grasp') base = 1010 - phase * 420
  else if (skill === 'open') base = 580 + phase * 430
  else if (skill === 'move') base = 560 + Math.sin(phase * Math.PI) * 40
  return clamp(base + (side === 'right' ? 25 : -15), 0, 1010)
}

const SAMPLE_POINTS = 320

export function generateSignalSeries(totalFrames, actionSegments = [], seedKey = 'default') {
  const rand = mulberry32(hashSeed(seedKey))
  const maxFrame = Math.max(totalFrames - 1, 1)
  const step = maxFrame / SAMPLE_POINTS
  const types = ['joint', 'pose', 'gripper']

  const result = { joint: [], pose: [], gripper: [] }

  for (let i = 0; i <= SAMPLE_POINTS; i += 1) {
    const frame = Math.round(i * step)
    const t = frame / maxFrame
    const seg = segmentAtFrame(actionSegments, frame)
    const phase = segmentPhase(seg, frame)
    const skill = seg?.skill ?? 'move'

    const row = { frame }
    types.forEach((type) => {
      row[`left_${type}`] = Number(valueForType(type, t, phase, skill, rand, 'left').toFixed(type === 'pose' ? 2 : 0))
      row[`right_${type}`] = Number(valueForType(type, t, phase, skill, rand, 'right').toFixed(type === 'pose' ? 2 : 0))
    })

    result.joint.push({ frame, left: row.left_joint, right: row.right_joint })
    result.pose.push({ frame, left: row.left_pose, right: row.right_pose })
    result.gripper.push({ frame, left: row.left_gripper, right: row.right_gripper })
  }

  return result
}

export const SIGNAL_CHART_CONFIG = {
  joint: { title: '关节 (左+右)', domain: [-180, 180], unit: '°' },
  pose: { title: '末端位姿 (左+右)', domain: [-2, 2], unit: 'm' },
  gripper: { title: '夹爪 (左+右)', domain: [0, 1010], unit: '' },
}
