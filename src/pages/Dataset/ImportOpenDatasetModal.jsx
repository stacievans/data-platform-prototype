import { useCallback, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { IconUpload } from '../../components/common/Icons'
import { getNextOpenDatasetIds } from '../../mock/datasets'

const TEMPLATE_HEADERS = ['数据集名称', '发布方', '层级', '外部链接', '数据量', '轨迹数量', '描述']
const HEADER_KEYS = {
  数据集名称: 'name',
  发布方: 'publisher',
  层级: 'level',
  外部链接: 'externalLink',
  数据量: 'dataSize',
  轨迹数量: 'trajCount',
  描述: 'description',
}
const VALID_LEVELS = ['L1', 'L2', 'L3', 'L4']

const formatNow = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatSize = (dataSize, trajCount) => {
  const size = String(dataSize ?? '').trim()
  const traj = String(trajCount ?? '').trim()
  if (!size) return ''
  return traj ? `${size} / ${traj} 轨迹` : size
}

const validateRow = (row) => {
  const errors = {}
  if (!String(row.name ?? '').trim()) errors.name = true
  if (!String(row.publisher ?? '').trim()) errors.publisher = true
  const level = String(row.level ?? '').trim().toUpperCase()
  if (!level) errors.level = true
  else if (!VALID_LEVELS.includes(level)) errors.level = true
  if (!String(row.dataSize ?? '').trim()) errors.dataSize = true
  return { errors, valid: Object.keys(errors).length === 0, level }
}

const parseWorkbookRows = (workbook) => {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!matrix.length) return []

  const headerRow = matrix[0].map((h) => String(h).trim())
  const colMap = {}
  headerRow.forEach((h, i) => {
    if (HEADER_KEYS[h]) colMap[HEADER_KEYS[h]] = i
  })

  const parsed = []
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i]
    const row = {
      name: colMap.name != null ? String(cells[colMap.name] ?? '').trim() : '',
      publisher: colMap.publisher != null ? String(cells[colMap.publisher] ?? '').trim() : '',
      level: colMap.level != null ? String(cells[colMap.level] ?? '').trim() : '',
      externalLink: colMap.externalLink != null ? String(cells[colMap.externalLink] ?? '').trim() : '',
      dataSize: colMap.dataSize != null ? String(cells[colMap.dataSize] ?? '').trim() : '',
      trajCount: colMap.trajCount != null ? String(cells[colMap.trajCount] ?? '').trim() : '',
      description: colMap.description != null ? String(cells[colMap.description] ?? '').trim() : '',
    }
    const empty = Object.values(row).every((v) => !v)
    if (empty) continue

    const { errors, valid, level } = validateRow(row)
    parsed.push({
      key: i,
      ...row,
      level: level || row.level,
      errors,
      valid,
      selected: valid,
    })
  }
  return parsed
}

export function downloadImportTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['示例数据集', '示例发布方', 'L1', 'https://example.com', '1.2 TB', '5万', '可选描述'],
  ])
  ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 8 }, { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 24 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  XLSX.writeFile(wb, '开源数据集导入模板.xlsx')
}

const cellCls = (hasError) =>
  hasError ? 'text-red-600 bg-red-50' : 'text-gray-700'

function StepBadge({ n, active, done }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        done ? 'bg-green-100 text-green-700' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {n}
    </span>
  )
}

export default function ImportOpenDatasetModal({ open, onCancel, onImport }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [rows, setRows] = useState([])

  const reset = useCallback(() => {
    setDragOver(false)
    setFileName('')
    setParseError('')
    setRows([])
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleClose = () => {
    reset()
    onCancel()
  }

  const processFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      setParseError('请上传 .xlsx 或 .xls 格式的 Excel 文件')
      return
    }
    setParseError('')
    setFileName(file.name)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const parsed = parseWorkbookRows(workbook)
      if (!parsed.length) {
        setParseError('未解析到有效数据行，请检查模板格式')
        setRows([])
        return
      }
      setRows(parsed)
    } catch {
      setParseError('文件解析失败，请确认文件格式正确')
      setRows([])
    }
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  const validCount = useMemo(() => rows.filter((r) => r.valid).length, [rows])
  const importCount = useMemo(() => rows.filter((r) => r.selected && r.valid).length, [rows])

  const toggleRow = (key) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)))
  }

  const toggleAll = (checked) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked && r.valid })))
  }

  const handleConfirm = () => {
    const toImport = rows.filter((r) => r.selected && r.valid)
    if (!toImport.length) return
    const ids = getNextOpenDatasetIds(toImport.length)
    const createdAt = formatNow()
    const records = toImport.map((row, i) => ({
      id: ids[i],
      name: row.name.trim(),
      publisher: row.publisher.trim(),
      level: row.level.trim().toUpperCase(),
      dataSize: row.dataSize.trim(),
      trajCount: row.trajCount.trim() || undefined,
      size: formatSize(row.dataSize, row.trajCount),
      createdAt,
      externalLink: row.externalLink || undefined,
      description: row.description || undefined,
    }))
    onImport(records)
    reset()
  }

  const allValidSelected = rows.length > 0 && rows.filter((r) => r.valid).every((r) => r.selected)

  return (
    <Modal
      open={open}
      title="导入数据集"
      width={880}
      fitViewport
      onCancel={handleClose}
      okText="确认导入"
      footer={
        <>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="primary" disabled={importCount === 0} onClick={handleConfirm}>
            确认导入{importCount > 0 ? `（${importCount} 条）` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 第一步 */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <StepBadge n={1} active={!rows.length} done={!!rows.length} />
            <h4 className="text-sm font-medium text-gray-800">下载导入模板</h4>
          </div>
          <p className="ml-8 text-sm text-gray-500">
            模板包含列：数据集名称、发布方、层级（L1/L2/L3/L4）、外部链接、数据量、轨迹数量、描述。
          </p>
          <div className="ml-8 mt-2">
            <Button variant="link" onClick={downloadImportTemplate}>
              下载导入模板
            </Button>
          </div>
        </section>

        {/* 第二步 */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <StepBadge n={2} active={!rows.length} done={!!rows.length} />
            <h4 className="text-sm font-medium text-gray-800">上传 Excel 文件</h4>
          </div>
          <div
            className={`ml-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <IconUpload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">拖拽文件到此处，或点击选择文件</p>
            <p className="mt-1 text-xs text-gray-400">支持 .xlsx / .xls</p>
            {fileName && <p className="mt-2 text-xs text-blue-600">{fileName}</p>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          </div>
          {parseError && <p className="ml-8 mt-2 text-sm text-red-600">{parseError}</p>}
        </section>

        {/* 第三步 */}
        {rows.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <StepBadge n={3} active done />
              <h4 className="text-sm font-medium text-gray-800">预览解析结果</h4>
            </div>
            <p className="ml-8 mb-3 text-sm text-gray-500">
              共解析 <span className="font-medium text-gray-800">{rows.length}</span> 条，有效{' '}
              <span className="font-medium text-green-600">{validCount}</span> 条
            </p>
            <div className="ml-8 overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-center text-xs text-gray-500">
                    <th className="w-10 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={allValidSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-3 py-2 text-center">数据集名称</th>
                    <th className="px-3 py-2 text-center">发布方</th>
                    <th className="px-3 py-2 text-center">层级</th>
                    <th className="px-3 py-2 text-center">外部链接</th>
                    <th className="px-3 py-2 text-center">数据量</th>
                    <th className="px-3 py-2 text-center">轨迹数量</th>
                    <th className="px-3 py-2 text-center">描述</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50/30' : ''}`}>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={row.selected}
                          disabled={!row.valid}
                          onChange={() => toggleRow(row.key)}
                        />
                        </div>
                      </td>
                      <td className={`px-3 py-2 text-center ${cellCls(row.errors.name)}`}>{row.name || '—'}</td>
                      <td className={`px-3 py-2 text-center ${cellCls(row.errors.publisher)}`}>{row.publisher || '—'}</td>
                      <td className={`px-3 py-2 text-center ${cellCls(row.errors.level)}`}>{row.level || '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{row.externalLink || '—'}</td>
                      <td className={`px-3 py-2 text-center ${cellCls(row.errors.dataSize)}`}>{row.dataSize || '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{row.trajCount || '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{row.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validCount < rows.length && (
              <p className="ml-8 mt-2 text-xs text-gray-400">
                标红字段为缺失必填项或层级不合法（须为 L1/L2/L3/L4），无效行默认不勾选。
              </p>
            )}
          </section>
        )}
      </div>
    </Modal>
  )
}
