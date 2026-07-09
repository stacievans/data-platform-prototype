/** 全平台统一时间格式：YYYY-MM-DD HH:mm:ss */

const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/
const DATE_HM = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/
const DATE_HMS = /^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}$/

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function formatDateFromDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

/** 将任意时间字符串规范为 YYYY-MM-DD HH:mm:ss；空值返回 — */
export function formatDateTime(value) {
  if (value == null || value === '' || value === '—') return '—'
  const raw = String(value).trim()
  if (DATE_HMS.test(raw)) return raw

  const hm = raw.match(DATE_HM)
  if (hm) return `${hm[1]} ${hm[2]}:00`

  const dateOnly = raw.match(DATE_ONLY)
  if (dateOnly) return `${dateOnly[1]} 00:00:00`

  if (raw.includes('T')) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return formatDateFromDate(d)
  }

  const parsed = new Date(raw.replace(' ', 'T'))
  if (!Number.isNaN(parsed.getTime())) return formatDateFromDate(parsed)

  return raw
}

/** 当前时间，YYYY-MM-DD HH:mm:ss */
export function nowDateTime() {
  return formatDateFromDate(new Date())
}

/** 列表列：统一时间展示 */
export function dtCol(title, dataIndex, { fallbackKey } = {}) {
  return {
    title,
    dataIndex,
    render: (v, row) => formatDateTime(v ?? (fallbackKey ? row[fallbackKey] : undefined)),
  }
}

/** mock 种子：日期补齐 00:00:00 */
export function seedDateTime(dateStr, time = '00:00:00') {
  if (!dateStr) return dateStr
  const raw = String(dateStr).trim()
  if (DATE_HMS.test(raw)) return raw
  const hm = raw.match(DATE_HM)
  if (hm) return `${hm[1]} ${hm[2]}:00`
  const dateOnly = raw.match(DATE_ONLY)
  if (dateOnly) return `${dateOnly[1]} ${time}`
  return formatDateTime(raw)
}

/** 相对时间：24 小时内「x小时前」，超过则「x天前」 */
export function formatRelativeTime(value, now = new Date()) {
  if (value == null || value === '' || value === '—') return '—'
  const ts = formatDateTime(value)
  const d = new Date(ts.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 0) return ts
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `${Math.max(1, hours)}小时前`
  const days = Math.floor(diffMs / 86400000)
  return `${Math.max(1, days)}天前`
}
