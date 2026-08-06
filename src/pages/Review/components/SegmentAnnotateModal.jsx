import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import { createEmptySegmentAttributes } from '../utils/fragmentSegments'

const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`
const LBL = 'mb-1 block text-xs text-gray-500'
const READONLY_CLS = 'rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700'

function AttributeValueEditor({ attribute, value, onChange }) {
  if (attribute.inputType === 'text') {
    const isLong = attribute.value === 'step_desc' || (attribute.name ?? '').includes('描述')
    if (isLong) {
      const text = value?.toString?.() ?? ''
      return (
        <div>
          <textarea
            rows={3}
            maxLength={500}
            value={text}
            onChange={(e) => onChange(e.target.value.slice(0, 500))}
            placeholder={`请输入${attribute.name}`}
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{text.length}/500</p>
        </div>
      )
    }
    return (
      <input
        value={value?.toString?.() ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`请输入${attribute.name}`}
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
        <option value="">请选择{attribute.name}</option>
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
      return <span className="text-xs text-gray-400">暂无选项</span>
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt, i) => {
          const optValue = opt.value || opt.name
          const checked = selected.includes(optValue)
          return (
            <label
              key={optValue || i}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
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

export default function SegmentAnnotateModal({
  open,
  fragmentType,
  initial,
  onCancel,
  onConfirm,
}) {
  const [startFrame, setStartFrame] = useState(0)
  const [endFrame, setEndFrame] = useState(0)
  const [attrs, setAttrs] = useState({})

  useEffect(() => {
    if (!open || !fragmentType) return
    setStartFrame(initial?.startFrame ?? 0)
    setEndFrame(initial?.endFrame ?? 0)
    setAttrs({
      ...createEmptySegmentAttributes(fragmentType),
      ...(initial?.attrs ?? {}),
    })
  }, [open, initial, fragmentType])

  const handleOk = () => {
    onConfirm({
      startFrame: Number(startFrame) || 0,
      endFrame: Number(endFrame) || 0,
      attrs: { ...attrs },
    })
  }

  const attributes = fragmentType?.attributes ?? []

  return (
    <Modal
      open={open}
      title="标注"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认"
      width={560}
    >
      {fragmentType && (
        <div className="space-y-4">
          <div>
            <span className={LBL}>标注类型</span>
            <div className={READONLY_CLS}>
              {fragmentType.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>起始帧</label>
              <input
                type="number"
                min={0}
                value={startFrame}
                onChange={(e) => setStartFrame(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LBL}>结束帧</label>
              <input
                type="number"
                min={0}
                value={endFrame}
                onChange={(e) => setEndFrame(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {attributes.length > 0 && (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <div className="grid grid-cols-[120px_1fr] border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                <div className="px-3 py-2">属性名称</div>
                <div className="border-l border-gray-200 px-3 py-2">属性内容</div>
              </div>
              <div className="divide-y divide-gray-100">
                {attributes.map((attr) => (
                  <div key={attr.id ?? attr.value} className="grid grid-cols-[120px_1fr] text-sm">
                    <div className="flex items-start px-3 py-2.5 text-gray-700">{attr.name}</div>
                    <div className="border-l border-gray-100 px-3 py-2.5">
                      <AttributeValueEditor
                        attribute={attr}
                        value={attrs[attr.value]}
                        onChange={(next) => setAttrs((prev) => ({ ...prev, [attr.value]: next }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
