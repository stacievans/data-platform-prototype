/** 采集设备展示：列表显示设备名称，hover 展示完整 SN */

export function snLast6(sn) {
  if (!sn || typeof sn !== 'string') return '—'
  const s = sn.trim()
  return s.length <= 6 ? s : s.slice(-6)
}

export function formatDeviceSelectLabel({ code, sn }) {
  if (!code) return '—'
  return `${code}（${snLast6(sn)}）`
}

export function CollectDeviceCell({ code, sn }) {
  const display = code ?? '—'
  if (!display || display === '—') return <span className="text-gray-500">—</span>
  const fullSn = sn?.trim()
  return (
    <span
      className="cursor-default font-mono text-xs text-gray-700"
      title={fullSn || undefined}
    >
      {display}
    </span>
  )
}
