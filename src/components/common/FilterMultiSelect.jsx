import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
} from './CheckboxList'

const LBL = 'mb-1 block text-xs text-gray-500'
const SELECT_BTN =
  'flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-2.5 text-left text-sm text-gray-700 outline-none transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
  searchable = false,
  getOptionLabel = (o) => o,
  getOptionValue = (o) => o,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  const normalized = useMemo(
    () => options.map((o) => ({ value: getOptionValue(o), label: getOptionLabel(o) })),
    [options, getOptionLabel, getOptionValue],
  )

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return normalized
    return normalized.filter(
      (o) => o.label.toLowerCase().includes(kw) || String(o.value).toLowerCase().includes(kw),
    )
  }, [normalized, q])

  const allSelected = normalized.length > 0 && value.length === normalized.length
  const someSelected = value.length > 0 && !allSelected
  const display = value.length === 0
    ? placeholder
    : allSelected
      ? '全部'
      : value.length <= 2
        ? normalized.filter((o) => value.includes(o.value)).map((o) => o.label).join('、')
        : `已选 ${value.length} 项`

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val))
    else onChange([...value, val])
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : normalized.map((o) => o.value))
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <label className={LBL}>{label}</label>
      <button type="button" className={SELECT_BTN} onClick={() => setOpen((o) => !o)}>
        <span className="truncate">{display}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-[60] mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <CheckboxListSearchInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="模糊查找"
              />
            </div>
          )}
          <div className="max-h-44 overflow-y-auto">
            {normalized.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">暂无选项</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">无匹配结果</p>
            ) : (
              <>
                <CheckboxListSelectAllRow
                  checked={allSelected}
                  indeterminate={someSelected}
                  onToggle={toggleAll}
                  selectedCount={value.length}
                  totalCount={normalized.length}
                />
                {filtered.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(o.value)}
                      onChange={() => toggle(o.value)}
                      className={CHECKBOX_LIST_CLS}
                    />
                    <span className="truncate text-sm text-gray-700">{o.label}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
