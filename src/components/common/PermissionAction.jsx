import { useAuth } from '../../context/AuthContext'
import Button from './Button'

export const PERM_DENIED_TIP = '暂无操作权限，请联系管理员分配'

/** 顶部/全局：无权限时不渲染 */
export function IfPerm({ permission, children }) {
  const { can } = useAuth()
  if (!can(permission)) return null
  return children
}

function DisabledTooltipWrap({ children, title = PERM_DENIED_TIP }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover:block">
        {title}
      </span>
    </span>
  )
}

/**
 * @param {'hide'|'disable'} mode — hide: 不渲染；disable: 置灰 + Tooltip
 */
export function PermButton({ permission, mode = 'hide', className = '', children, ...rest }) {
  const { can } = useAuth()
  const allowed = can(permission)
  if (allowed) return <Button className={className} {...rest}>{children}</Button>
  if (mode === 'hide') return null
  return (
    <DisabledTooltipWrap>
      <Button
        {...rest}
        disabled
        className={`${className} pointer-events-none cursor-not-allowed opacity-40`}
      >
        {children}
      </Button>
    </DisabledTooltipWrap>
  )
}

/** 行内 text 按钮（link 风格） */
export function PermAction({
  permission,
  mode = 'disable',
  className = '',
  children,
  onClick,
  ...rest
}) {
  const { can } = useAuth()
  const allowed = can(permission)
  if (allowed) {
    return (
      <button type="button" className={className} onClick={onClick} {...rest}>
        {children}
      </button>
    )
  }
  if (mode === 'hide') return null
  return (
    <DisabledTooltipWrap>
      <button
        type="button"
        disabled
        aria-disabled
        className={`${className} cursor-not-allowed opacity-40`}
        {...rest}
      >
        {children}
      </button>
    </DisabledTooltipWrap>
  )
}

/** 卡片三点菜单项 */
export function PermMenuItem({ permission, label, onClick, mode = 'disable', warn, danger }) {
  const { can } = useAuth()
  const allowed = can(permission)
  const colorCls = danger
    ? 'text-red-500'
    : warn
      ? 'text-amber-600'
      : 'text-gray-700'

  if (allowed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${colorCls}`}
      >
        {label}
      </button>
    )
  }
  if (mode === 'hide') return null
  return (
    <DisabledTooltipWrap>
      <button
        type="button"
        disabled
        aria-disabled
        className={`w-full px-3 py-1.5 text-left text-sm ${colorCls} cursor-not-allowed opacity-40`}
      >
        {label}
      </button>
    </DisabledTooltipWrap>
  )
}
