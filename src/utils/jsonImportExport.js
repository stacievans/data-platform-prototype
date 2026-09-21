export const MAX_JSON_IMPORT_BYTES = 10 * 1024 * 1024

export function downloadJsonFile(filename, data) {
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName.endsWith('.json') ? safeName : `${safeName}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function readJsonImportFile(file) {
  if (!file) {
    return { ok: false, message: '请选择文件' }
  }
  const name = file.name?.toLowerCase() ?? ''
  if (!name.endsWith('.json') && file.type && file.type !== 'application/json') {
    return { ok: false, message: '仅支持 JSON 文件' }
  }
  if (file.size > MAX_JSON_IMPORT_BYTES) {
    return { ok: false, message: '文件不能超过 10MB' }
  }
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, message: 'JSON 格式无效' }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, message: 'JSON 解析失败，请检查文件内容' }
  }
}

export function openJsonFilePicker(onFile) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.style.display = 'none'
  input.onchange = () => {
    const file = input.files?.[0]
    input.remove()
    if (file) onFile(file)
  }
  document.body.appendChild(input)
  input.click()
}
