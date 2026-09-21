/** 条目 / 相机流 rgb.attrs.decoded_color_order → 列表与播放器展示 */

export const COLOR_ENCODING_FILTER_OPTIONS = ['全部', 'RGB', 'BGR', '-']

const CAMERA_BASE_LABELS = {
  head: '头部摄像头',
  chest: '胸部摄像头',
  leftWrist: '左腕摄像头',
  rightWrist: '右腕摄像头',
}

function normalizeOrder(raw) {
  if (raw == null || raw === '') return null
  const upper = String(raw).trim().toUpperCase()
  if (upper === 'RGB' || upper === 'BGR') return upper
  return null
}

/** 读取 rgb 节点上的 decoded_color_order */
export function readDecodedColorOrder(rgbNode) {
  if (!rgbNode || typeof rgbNode !== 'object') return null
  return normalizeOrder(rgbNode.attrs?.decoded_color_order ?? rgbNode.decoded_color_order)
}

/** 条目级色彩编码（列表列） */
export function getEntryDecodedColorOrder(entry) {
  if (!entry) return null
  return readDecodedColorOrder(entry.rgb)
}

/** 列表展示：RGB / BGR / - */
export function formatEntryColorEncoding(entry) {
  const order = getEntryDecodedColorOrder(entry)
  return order ?? '-'
}

/** 单路相机流色彩编码；无 cameraRgb 时回退条目级 rgb */
export function getCameraDecodedColorOrder(entry, viewKey) {
  if (!entry) return null
  const perCamera = entry.cameraRgb?.[viewKey]
  const fromCamera = readDecodedColorOrder(perCamera)
  if (fromCamera) return fromCamera
  return getEntryDecodedColorOrder(entry)
}

export function getCameraViewLabel(viewKey) {
  return CAMERA_BASE_LABELS[viewKey] ?? viewKey
}

/** 播放器角标：如「头部摄像头 RGB」；无编码时不追加 */
export function formatCameraLabelWithEncoding(entry, viewKey) {
  const base = getCameraViewLabel(viewKey)
  const order = getCameraDecodedColorOrder(entry, viewKey)
  return order ? `${base} ${order}` : base
}

export function matchColorEncodingFilter(entry, filterValue) {
  if (!filterValue || filterValue === '全部') return true
  const display = formatEntryColorEncoding(entry)
  return display === filterValue
}
