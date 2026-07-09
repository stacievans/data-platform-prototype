import { IconSearch } from './Icons'

export const CHECKBOX_LIST_CLS = 'h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600'

export function IndeterminateCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  className = CHECKBOX_LIST_CLS,
  ...rest
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      onChange={disabled ? undefined : onChange}
      className={`${className}${disabled ? ' cursor-not-allowed opacity-50' : ''}`}
      {...rest}
    />
  )
}

/** 列表内首行全选：浅灰底 + 底部分隔线 + 已选计数 */
export function CheckboxListSelectAllRow({
  checked,
  indeterminate = false,
  onToggle,
  selectedCount,
  totalCount,
  disabled = false,
  label = '全选',
}) {
  if (totalCount === 0) return null

  return (
    <label
      className={`flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2.5 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100/80'
      }`}
    >
      <span className="flex items-center gap-2">
        <IndeterminateCheckbox
          checked={checked}
          indeterminate={indeterminate}
          disabled={disabled}
          onChange={onToggle}
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </span>
      <span className="shrink-0 text-xs text-gray-500">
        已选 {selectedCount} / 共 {totalCount}
      </span>
    </label>
  )
}

export function CheckboxListShell({ children, empty, className = 'max-h-44' }) {
  return (
    <div className={`overflow-y-auto rounded-lg border border-gray-200 bg-white ${className}`}>
      {empty ?? children}
    </div>
  )
}

export function CheckboxListSearchInput({
  value,
  onChange,
  placeholder = '模糊查找',
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}
