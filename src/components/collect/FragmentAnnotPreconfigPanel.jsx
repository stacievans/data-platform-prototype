import { useEffect, useState } from 'react'
import { IconTrash } from '../common/Icons'
import {
  FRAGMENT_INPUT_TYPES,
  emptyCustomFragmentType,
  emptyFragmentAttribute,
  emptyFragmentOption,
  isMandatoryFragmentType,
  normalizeFragmentOptions,
} from './fragmentAnnotPreconfig'

const INPUT_CLS =
  'h-8 w-full rounded-md border border-gray-300 px-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const READONLY_CLS =
  'h-8 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-2.5 text-sm text-gray-500 outline-none'

const SELECT_CLS =
  'h-8 w-full cursor-pointer rounded-md border border-gray-300 px-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const CHEVRON = (
  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

function fieldCls(locked) {
  return locked ? READONLY_CLS : INPUT_CLS
}

function formatTypeSidebarLabel(typeItem) {
  const name = typeItem.name || '未命名类型'
  const value = typeItem.value?.trim()
  return value ? `${name}(${value})` : name
}

function AttributeOptionsEditor({ attribute, locked, onChange }) {
  if (attribute.inputType !== 'single' && attribute.inputType !== 'multi') return null

  const updateOption = (index, patch) => {
    onChange({
      ...attribute,
      options: attribute.options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)),
    })
  }

  const toggleDefault = (index, checked) => {
    if (attribute.inputType === 'single') {
      onChange({
        ...attribute,
        options: attribute.options.map((opt, i) => ({
          ...opt,
          isDefault: i === index ? checked : false,
        })),
      })
      return
    }
    updateOption(index, { isDefault: checked })
  }

  return (
    <div className="mt-2 rounded-md border border-gray-100 bg-gray-50/80 p-2.5">
      <p className="mb-2 text-xs font-medium text-gray-500">属性选项</p>
      <div className="mb-1 grid grid-cols-[1fr_1fr_88px_28px] gap-2 px-0.5 text-xs text-gray-400">
        <span>名称</span>
        <span>值</span>
        <span className="text-center">设为默认值</span>
        <span />
      </div>
      <div className="space-y-2">
        {(attribute.options ?? []).map((opt, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_88px_28px] items-center gap-2">
            <input
              readOnly={locked}
              disabled={locked}
              value={opt.name}
              onChange={(e) => updateOption(i, { name: e.target.value })}
              placeholder="请输入选项名称"
              className={fieldCls(locked)}
            />
            <input
              readOnly={locked}
              disabled={locked}
              value={opt.value}
              onChange={(e) => updateOption(i, { value: e.target.value })}
              placeholder="请输入选项值"
              className={fieldCls(locked)}
            />
            <div className="flex justify-center">
              <input
                type="checkbox"
                disabled={locked}
                checked={Boolean(opt.isDefault)}
                onChange={(e) => toggleDefault(i, e.target.checked)}
                className="h-4 w-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {!locked ? (
              <button
                type="button"
                title="删除选项"
                onClick={() => onChange({
                  ...attribute,
                  options: attribute.options.filter((_, idx) => idx !== i),
                })}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-red-500 hover:bg-red-50"
              >
                <IconTrash />
              </button>
            ) : (
              <span className="h-7 w-7" />
            )}
          </div>
        ))}
      </div>
      {!locked && (
        <button
          type="button"
          onClick={() => onChange({
            ...attribute,
            options: [...(attribute.options ?? []), emptyFragmentOption()],
          })}
          className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-blue-300 py-1.5 text-xs text-blue-600 transition hover:bg-blue-50"
        >
          + 添加选项
        </button>
      )}
    </div>
  )
}

function AttributeRow({ attribute, locked, onChange, onRemove }) {
  const showOptions = attribute.inputType === 'single' || attribute.inputType === 'multi'

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="grid grid-cols-[1fr_1fr_120px_28px] items-end gap-2">
        <div>
          <p className="mb-1 text-xs text-gray-500">属性名称</p>
          <input
            readOnly={locked}
            disabled={locked}
            value={attribute.name}
            onChange={(e) => onChange({ ...attribute, name: e.target.value })}
            placeholder="请输入属性名称"
            className={fieldCls(locked)}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-500">属性值</p>
          <input
            readOnly={locked}
            disabled={locked}
            value={attribute.value}
            onChange={(e) => onChange({ ...attribute, value: e.target.value })}
            placeholder="请输入属性值"
            className={fieldCls(locked)}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-500">输入类型</p>
          <select
            disabled={locked}
            value={attribute.inputType}
            onChange={(e) => {
              const inputType = e.target.value
              const nextOptions = inputType === 'single' || inputType === 'multi'
                ? normalizeFragmentOptions(
                  attribute.options?.length ? attribute.options : [emptyFragmentOption()],
                  inputType,
                )
                : []
              onChange({
                ...attribute,
                inputType,
                options: nextOptions,
              })
            }}
            className={locked ? READONLY_CLS : SELECT_CLS}
          >
            {FRAGMENT_INPUT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {!locked ? (
          <button
            type="button"
            title="删除属性"
            onClick={onRemove}
            className="inline-flex h-8 w-7 cursor-pointer items-center justify-center rounded text-red-500 hover:bg-red-50"
          >
            <IconTrash />
          </button>
        ) : (
          <span className="h-8 w-7" />
        )}
      </div>
      {showOptions && (
        <AttributeOptionsEditor
          attribute={attribute}
          locked={locked}
          onChange={onChange}
        />
      )}
    </div>
  )
}

function TypeDetailEditor({ typeItem, locked, onChange }) {
  const updateAttribute = (index, nextAttr) => {
    onChange({
      ...typeItem,
      attributes: typeItem.attributes.map((attr, i) => (i === index ? nextAttr : attr)),
    })
  }

  const removeAttribute = (index) => {
    onChange({
      ...typeItem,
      attributes: typeItem.attributes.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="min-h-[280px] flex-1 space-y-4 p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">类型配置</p>
        <div className="grid grid-cols-[1fr_1fr_72px_auto] items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-gray-500">类型名称</p>
            <input
              readOnly={locked}
              disabled={locked}
              value={typeItem.name}
              onChange={(e) => onChange({ ...typeItem, name: e.target.value })}
              placeholder="请输入类型名称"
              className={fieldCls(locked)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">类型值</p>
            <input
              readOnly={locked}
              disabled={locked}
              value={typeItem.value}
              onChange={(e) => onChange({ ...typeItem, value: e.target.value })}
              placeholder="请输入类型值"
              className={fieldCls(locked)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">颜色</p>
            <input
              type="color"
              disabled={locked}
              value={typeItem.color || '#1890ff'}
              onChange={(e) => onChange({ ...typeItem, color: e.target.value })}
              className={`h-8 w-full rounded-md border border-gray-300 bg-white p-0.5 ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            />
          </div>
          <label className={`mb-1 inline-flex items-center gap-1.5 text-xs text-gray-600 ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              disabled={locked}
              checked={Boolean(typeItem.forbidOverlap)}
              onChange={(e) => onChange({ ...typeItem, forbidOverlap: e.target.checked })}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            禁止重叠
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">属性配置</p>
        <div className="space-y-2">
          {(typeItem.attributes ?? []).map((attr, i) => (
            <AttributeRow
              key={attr.id ?? i}
              attribute={attr}
              locked={locked}
              onChange={(next) => updateAttribute(i, next)}
              onRemove={() => removeAttribute(i)}
            />
          ))}
        </div>
        {!locked && (
          <button
            type="button"
            onClick={() => onChange({
              ...typeItem,
              attributes: [...(typeItem.attributes ?? []), emptyFragmentAttribute()],
            })}
            className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-600 transition hover:border-blue-400 hover:text-blue-600"
          >
            + 添加属性
          </button>
        )}
      </div>
    </div>
  )
}

export default function FragmentAnnotPreconfigPanel({
  types = [],
  autoFromPlan = true,
  onChange,
  readonly = false,
  defaultExpanded = false,
  embedded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || embedded)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!types.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !types.some((t) => t.id === selectedId)) {
      setSelectedId(types[0].id)
    }
  }, [types, selectedId])

  const selectedType = types.find((t) => t.id === selectedId) ?? null

  const updateType = (nextType) => {
    onChange(types.map((t) => (t.id === nextType.id ? nextType : t)))
  }

  const removeType = (typeId) => {
    const target = types.find((t) => t.id === typeId)
    if (isMandatoryFragmentType(target)) return
    onChange(types.filter((t) => t.id !== typeId))
  }

  const addCustomType = () => {
    const next = emptyCustomFragmentType()
    onChange([...types, next])
    setSelectedId(next.id)
    setExpanded(true)
  }

  const isTypeLocked = (typeItem) => readonly || (autoFromPlan && typeItem.preset)
  const isTypeDeletable = (typeItem) => !readonly && !isMandatoryFragmentType(typeItem) && !(autoFromPlan && typeItem.preset)

  const panelBody = !types.length ? (
    <p className="px-4 py-6 text-sm text-gray-400">暂无配置</p>
  ) : (
    <div className="flex min-h-[320px]">
      <aside className="w-[220px] shrink-0 border-r border-gray-200 bg-white p-2">
        <div className="space-y-1">
          {types.map((t) => {
            const active = t.id === selectedId
            return (
              <div
                key={t.id}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left"
                >
                  {formatTypeSidebarLabel(t)}
                </button>
                {!isTypeDeletable(t) ? (
                  <span className="h-6 w-6 shrink-0" />
                ) : (
                  <button
                    type="button"
                    title="删除类型"
                    onClick={() => removeType(t.id)}
                    className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-red-500 hover:bg-red-50"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {!readonly && (
          <button
            type="button"
            onClick={addCustomType}
            className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-600 transition hover:border-blue-400 hover:text-blue-600"
          >
            + 添加类型
          </button>
        )}
      </aside>

      <div className="min-w-0 flex-1 bg-white">
        {selectedType ? (
          <TypeDetailEditor
            typeItem={selectedType}
            locked={isTypeLocked(selectedType)}
            onChange={updateType}
          />
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-sm text-gray-400">
            <svg className="mb-2 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            请先在左侧选择一个类别
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50/80">
        {panelBody}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/80">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-gray-800">片段标注配置</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {readonly ? '点击展开查看类型、属性与选项' : '类型、属性与选项可在创建前编辑'}
          </p>
        </div>
        <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>{CHEVRON}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200">
          {panelBody}
        </div>
      )}
    </div>
  )
}
