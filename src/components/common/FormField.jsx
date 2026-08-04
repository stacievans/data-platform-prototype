import { useState } from 'react'
import { useCurrentNickname } from '../../context/AuthContext'
import { IconEyeOff, IconEyeOpen } from './Icons'
import { nativeSelectChevronCls } from './SelectControl'

export const DESC_MAX = 500

const descTextareaCls =
  'w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export function Input({ label, className = '', ...rest }) {
  const input = (
    <input
      className={`h-8 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-600">{label}</span>
      {input}
    </label>
  )
}

export function TextArea({ label, className = '', ...rest }) {
  const area = (
    <textarea
      rows={3}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
      {...rest}
    />
  )
  if (!label) return area
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-600">{label}</span>
      {area}
    </label>
  )
}

/** 描述输入框：输入框外右下角 0/500 字数统计 */
export function DescriptionField({
  label = '描述',
  value = '',
  onChange,
  placeholder = '请输入描述（选填）',
  rows = 3,
  maxLength = DESC_MAX,
  required = false,
  error = false,
  errorText = '请填写此项',
  className = '',
  textareaClassName = '',
}) {
  const handleChange = (e) => {
    const next = e.target.value.slice(0, maxLength)
    onChange?.({ ...e, target: { ...e.target, value: next } })
  }

  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={handleChange}
        className={`${descTextareaCls} ${error ? 'border-red-400 focus:ring-red-100' : ''} ${textareaClassName}`}
      />
      <p className="mt-1 text-right text-xs text-gray-400">{String(value ?? '').length}/{maxLength}</p>
      {error && errorText && <p className="mt-1 text-xs text-red-500">{errorText}</p>}
    </div>
  )
}

export function PasswordInput({
  value,
  onChange,
  placeholder = '请输入密码',
  className = '',
  error = false,
  errorText = '请填写此项',
}) {
  const [show, setShow] = useState(false)
  const inputCls = `h-8 w-full rounded-md border px-3 pr-9 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
    error
      ? 'border-red-400 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
  } ${className}`

  return (
    <div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? '隐藏密码' : '显示密码'}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <IconEyeOpen /> : <IconEyeOff />}
        </button>
      </div>
      {error && errorText && <p className="mt-1 text-xs text-red-500">{errorText}</p>}
    </div>
  )
}

export function Select({ label, options = [], className = '', ...rest }) {
  const select = (
    <select
      className={`h-8 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${nativeSelectChevronCls} ${className}`}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
  if (!label) return select
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-600">{label}</span>
      {select}
    </label>
  )
}

const creatorReadonlyCls =
  'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'

/** 新建弹窗只读「创建人」，随演示身份切换实时更新 */
export function CreatorReadonlyField({ label = '创建人', className = '' }) {
  const creator = useCurrentNickname()
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input readOnly value={creator} className={creatorReadonlyCls} />
    </label>
  )
}
