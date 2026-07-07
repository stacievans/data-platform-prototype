export function buildTypeName(body, leftEnd, rightEnd) {
  return `${body} · ${leftEnd}+${rightEnd}`
}

/** 弹窗内参考预览（无空格） */
export function buildTypeNameReference(body, leftEnd, rightEnd) {
  if (!body || !leftEnd || !rightEnd) return '—'
  return `${body}·${leftEnd}+${rightEnd}`
}
