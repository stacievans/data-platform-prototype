import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconCollapse, IconGrid } from '../common/Icons'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../common/Toast'
import { getOrganizations } from '../../mock/organizations'
import logo from '../../assets/logo.png'

const MODULE_TABS = [
  { key: 'collection', label: '数采中心', path: '/dashboard' },
  { key: 'backflow', label: '真机回流', path: '/backflow' },
]

const EXTERNAL_LINKS = [
  { label: '帮助文档', href: 'https://docs.example.com/help' },
  { label: '标注平台', href: 'https://docs.example.com/annotation' },
  { label: '数据看板', href: 'https://docs.example.com/dashboard' },
]

function IconBackflow(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevron({ open, className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      width="12"
      height="12"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${open ? 'rotate-180' : ''} ${className}`}
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  )
}

function displayRole(role) {
  if (role === '超级管理员' || role === '组织管理员') return '管理员'
  return role ?? '管理员'
}

function useClickOutside(refs, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (refs.every((ref) => ref.current && !ref.current.contains(e.target))) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [refs, onClose])
}

function HeaderDropdown({ open, align = 'right', children, className = '' }) {
  if (!open) return null
  return (
    <div
      className={`absolute top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function DropdownItem({ label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

export default function Header({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { ToastNode, show: toast } = useToast()

  const [externalOpen, setExternalOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)

  const externalRef = useRef(null)
  const userRef = useRef(null)

  const activeModule = pathname.startsWith('/backflow') ? 'backflow' : 'collection'
  const orgs = getOrganizations().filter((o) => o.status === '启用')

  const avatarChar = user?.nickname?.slice(0, 1) ?? '?'

  useClickOutside([externalRef, userRef], () => {
    setExternalOpen(false)
    setUserOpen(false)
    setOrgOpen(false)
  })

  const handleLogout = () => {
    setUserOpen(false)
    navigate('/login')
  }

  const handleExternalLink = (item) => {
    setExternalOpen(false)
    window.open(item.href, '_blank', 'noopener,noreferrer')
  }

  const handleSwitchOrg = (org) => {
    setOrgOpen(false)
    setUserOpen(false)
    toast(`已切换至「${org.name}」`)
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-slate-900 pr-6 shadow-md">
        <div className="flex min-w-0 items-center gap-3 pl-4">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
              <img src={logo} alt="ABC-Data" className="h-full w-full object-contain" />
            </div>
            <span className="hidden whitespace-nowrap text-base font-semibold tracking-wide text-white sm:inline">
              ABC-<span className="font-light text-blue-300">Data</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer rounded-md p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <IconCollapse collapsed={collapsed} />
          </button>

          <div className="ml-2 flex items-center gap-1">
            {MODULE_TABS.map((tab) => {
              const active = activeModule === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => navigate(tab.path)}
                  className={`relative flex cursor-pointer flex-col items-center gap-0.5 px-4 pb-3 pt-1 transition-colors ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={active ? 'text-blue-400' : 'text-slate-500'}>
                    {tab.key === 'collection' ? <IconGrid /> : <IconBackflow />}
                  </span>
                  <span className="text-xs font-medium">{tab.label}</span>
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div ref={externalRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setExternalOpen((v) => !v)
                setUserOpen(false)
                setOrgOpen(false)
              }}
              onMouseEnter={() => {
                setExternalOpen(true)
                setUserOpen(false)
                setOrgOpen(false)
              }}
              className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              外部连接
              <IconChevron open={externalOpen} />
            </button>
            <HeaderDropdown open={externalOpen}>
              {EXTERNAL_LINKS.map((item) => (
                <DropdownItem
                  key={item.label}
                  label={item.label}
                  onClick={() => handleExternalLink(item)}
                />
              ))}
            </HeaderDropdown>
          </div>

          <div
            ref={userRef}
            className="relative"
            onMouseEnter={() => {
              setUserOpen(true)
              setExternalOpen(false)
            }}
          >
            <button
              type="button"
              onClick={() => {
                setUserOpen((v) => !v)
                setExternalOpen(false)
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-200 transition hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {avatarChar}
              </div>
              <span className="text-sm">{displayRole(user?.role)}</span>
              <IconChevron open={userOpen} />
            </button>

            <HeaderDropdown open={userOpen}>
              <div className="relative">
                <DropdownItem
                  label="切换组织"
                  onClick={() => setOrgOpen((v) => !v)}
                />
                {orgOpen && (
                  <div className="border-t border-gray-100 py-1">
                    {orgs.map((org) => (
                      <DropdownItem
                        key={org.id}
                        label={org.name}
                        onClick={() => handleSwitchOrg(org)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100">
                <DropdownItem label="退出登录" onClick={handleLogout} danger />
              </div>
            </HeaderDropdown>
          </div>
        </div>
      </header>
      {ToastNode}
    </>
  )
}
