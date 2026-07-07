/** 从 size 或独立字段解析数据量 / 轨迹数量 */
export function getOpenDatasetMetrics(dataset) {
  if (dataset.dataSize) {
    return {
      dataSize: dataset.dataSize,
      trajCount: dataset.trajCount || '—',
    }
  }
  const m = String(dataset.size ?? '').match(/^(.+?)\s*\/\s*(.+?)\s*轨迹$/)
  if (m) {
    return { dataSize: m[1].trim(), trajCount: m[2].trim() }
  }
  return { dataSize: dataset.size || '—', trajCount: '—' }
}
