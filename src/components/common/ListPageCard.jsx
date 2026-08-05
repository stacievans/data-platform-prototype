import { Children } from 'react'

/** 检索栏 + 列表/表格统一白色容器 */
export default function ListPageCard({ children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

/** 检索栏区域（容器内顶部，统一内边距；底部分割线与列表区分） */
export function ListPageFilter({ children, className = '' }) {
  return <div className={`border-b border-gray-100 px-4 pb-4 pt-4 ${className}`}>{children}</div>
}

/** 标题栏 + 操作按钮（列表标题与新建等） */
export function ListPageToolbar({ children, className = '', first = false }) {
  const childArray = Children.toArray(children)
  const left = childArray[0] ?? null
  const right = childArray.slice(1)

  return (
    <div className={`flex items-center justify-between gap-3 border-b border-gray-100 px-4 pb-3 ${first ? 'pt-4' : 'pt-3'} ${className}`}>
      <div className="min-w-0">{left}</div>
      {right.length > 0 && (
        <div className="flex shrink-0 items-center gap-3">
          {right}
        </div>
      )}
    </div>
  )
}

/** 列表主体（卡片视图网格等非 Table 内容） */
export function ListPageBody({ children, className = '' }) {
  return <div className={className}>{children}</div>
}
