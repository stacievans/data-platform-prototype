const INPUT_CLS = 'h-7 w-full rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`

export function AttributeValueEditor({ attribute, value, onChange, compact = false, hidePlaceholder = false }) {
  if (attribute.inputType === 'text') {
    const isLong = attribute.value === 'step_desc' || (attribute.name ?? '').includes('描述')
    const text = value?.toString?.() ?? ''
    const placeholder = hidePlaceholder ? undefined : `请输入${attribute.name}`
    if (isLong) {
      return (
        <div>
          <textarea
            rows={compact ? 4 : 3}
            maxLength={500}
            value={text}
            onChange={(e) => onChange(e.target.value.slice(0, 500))}
            placeholder={placeholder}
            className="w-full resize-y rounded-md border border-gray-300 px-2 py-1.5 text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          {!compact && !hidePlaceholder && <p className="mt-1 text-right text-xs text-gray-400">{text.length}/500</p>}
        </div>
      )
    }
    return (
      <input
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLS}
      />
    )
  }

  if (attribute.inputType === 'single') {
    const options = attribute.options ?? []
    return (
      <select
        value={value?.toString?.() ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLS}
      >
        {!hidePlaceholder && <option value="">请选择{attribute.name}</option>}
        {hidePlaceholder && <option value="" />}
        {options.map((opt, i) => (
          <option key={opt.value || opt.name || i} value={opt.value || opt.name}>
            {opt.name || opt.value}
          </option>
        ))}
      </select>
    )
  }

  if (attribute.inputType === 'multi') {
    const selected = Array.isArray(value) ? value : (value ? [value] : [])
    const options = attribute.options ?? []
    const toggle = (optValue) => {
      onChange(
        selected.includes(optValue)
          ? selected.filter((v) => v !== optValue)
          : [...selected, optValue],
      )
    }
    if (!options.length) {
      return hidePlaceholder ? null : <span className="text-xs text-gray-400">暂无选项</span>
    }
    return (
      <div className="flex flex-wrap gap-1">
        {options.map((opt, i) => {
          const optValue = opt.value || opt.name
          const checked = selected.includes(optValue)
          return (
            <label
              key={optValue || i}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition ${
                checked
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(optValue)}
                className="h-3 w-3 accent-blue-600"
              />
              {opt.name || opt.value}
            </label>
          )
        })}
      </div>
    )
  }

  return null
}

export function SegmentAttributeGrid({ fragmentType, attrs, onChange, compact = true }) {
  const attributes = fragmentType?.attributes ?? []
  if (!attributes.length) {
    return <p className="text-xs text-gray-400">该类型暂无属性配置</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="grid grid-cols-[minmax(72px,28%)_1fr] border-b border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-500">
        <div className="px-2 py-1.5">属性名称</div>
        <div className="border-l border-gray-200 px-2 py-1.5">属性内容</div>
      </div>
      <div className="divide-y divide-gray-100">
        {attributes.map((attr) => (
          <div key={attr.id ?? attr.value} className="grid grid-cols-[minmax(72px,28%)_1fr] text-xs">
            <div className="px-2 py-2 text-gray-600">{attr.name}</div>
            <div className="border-l border-gray-100 px-2 py-2">
              <AttributeValueEditor
                compact={compact}
                attribute={attr}
                value={attrs?.[attr.value]}
                onChange={(next) => onChange({ ...attrs, [attr.value]: next })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
