import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCollapse } from '../common/Icons'
import { useToast } from '../common/Toast'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const IconLogout = () => (
  <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.6">
    <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" />
    <path d="M13 14l3-4-3-4" />
    <path d="M16 10H8" />
  </svg>
)

const IconChevron = ({ open }) => (
  <svg
    viewBox="0 0 20 20" fill="none" width="12" height="12"
    stroke="currentColor" strokeWidth="2"
    style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M5 8l5 5 5-5" />
  </svg>
)

export default function Header({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { user, demoPersonas, switchUser } = useAuth()
  const { ToastNode, show: toast } = useToast()
  const [open, setOpen] = useState(false)
  const [personaOpen, setPersonaOpen] = useState(false)
  const dropRef = useRef(null)

  const avatarChar = user?.nickname?.slice(0, 1) ?? '?'

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false)
        setPersonaOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    navigate('/login')
  }

  const handleSwitchPersona = (uid) => {
    const ok = switchUser(uid)
    if (ok) {
      const label = demoPersonas.find((p) => p.uid === uid)?.label ?? ''
      toast(`已切换演示身份：${label}`)
    }
    setOpen(false)
    setPersonaOpen(false)
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-slate-900 pr-6 shadow-md">
        <div className="flex items-center">
          <div
            className={`flex h-14 items-center gap-2.5 px-4 transition-all duration-200 ${
              collapsed ? 'w-16 justify-center' : 'w-52'
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
              <img src={logo} alt="ABC-Data" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <span className="whitespace-nowrap text-base font-semibold tracking-wide text-white">
                ABC-<span className="font-light text-blue-300">Data</span>
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="ml-2 cursor-pointer rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <IconCollapse collapsed={collapsed} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">{user?.role}</span>
          <span className="h-4 w-px bg-slate-700" />

          <div ref={dropRef} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-200 transition hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {avatarChar}
              </div>
              <span className="text-sm">{user?.nickname}</span>
              <IconChevron open={open} />
            </button>

            {open && (
              <div
                className="absolute right-0 top-full mt-1 w-52 overflow-hidden rounded-xl shadow-2xl"
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.08)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <p className="text-sm font-medium text-white">{user?.nickname}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{user?.email}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{user?.role}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => setPersonaOpen(!personaOpen)}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-[13px] text-slate-300 transition hover:bg-white/5"
                  >
                    <span>演示身份切换</span>
                    <IconChevron open={personaOpen} />
                  </button>
                  {personaOpen && (
                    <div className="border-t border-white/5 pb-1">
                      {demoPersonas.map((p) => (
                        <button
                          key={p.uid}
                          type="button"
                          onClick={() => handleSwitchPersona(p.uid)}
                          className={`block w-full cursor-pointer px-6 py-1.5 text-left text-xs transition hover:bg-white/5 ${
                            user?.uid === p.uid ? 'text-blue-400' : 'text-slate-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 0' }} />
                  <MenuItem icon={<IconLogout />} label="退出登录" onClick={handleLogout} danger />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {ToastNode}
    </>
  )
}

function MenuItem({ icon, label, onClick, danger }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 16px',
        background: hover ? (danger ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.06)') : 'transparent',
        color: danger ? (hover ? '#f87171' : '#fc8181') : (hover ? '#e2e8f0' : '#94a3b8'),
        fontSize: 13, border: 'none', cursor: 'pointer',
        transition: 'background .15s, color .15s',
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
