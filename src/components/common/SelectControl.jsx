import { IconChevronDown } from './Icons'

/** 原生 select 去除系统箭头并预留右侧空间（配合全局样式或 SelectChevronWrap） */
export const nativeSelectChevronCls = 'appearance-none pr-8'

/**
 * 自定义下拉/选择触发器右侧 chevron（箭头不参与布局，点击由父级触发器承接）
 */
export function SelectChevronWrap({ children, className = '', disabled = false }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-2.5 flex items-center ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
      >
        <IconChevronDown />
      </span>
    </div>
  )
}
