import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import feishuLogo from '../../assets/feishu_logo.jpg'

/* ── inline icons ── */
const IconMail = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
    <path d="M2.5 7.5l7.5 5 7.5-5" />
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
    <rect x="4.5" y="9" width="11" height="8" rx="2" />
    <path d="M7 9V6.5a3 3 0 016 0V9" />
  </svg>
)
const IconEyeOpen = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
    <path d="M1.5 10s3-5.5 8.5-5.5S18.5 10 18.5 10s-3 5.5-8.5 5.5S1.5 10 1.5 10z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
)
const IconEyeOff = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 2l16 16" />
    <path d="M6.7 6.8C4.8 8 3.3 9.3 1.5 10c1.5 2.8 4.3 5.5 8.5 5.5 1.5 0 2.9-.4 4.1-1" />
    <path d="M11.3 5.1C10.9 5 10.5 4.5 10 4.5 4.5 4.5 1.5 10 1.5 10" />
    <path d="M13.4 7.7C15.2 9 16.7 9.8 18.5 10c-1.5 2.8-4.3 5.5-8.5 5.5" />
  </svg>
)

/* ── floating orb ── */
function Orb({ style }) {
  return <div style={{ position: 'absolute', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/dashboard'), 600)
  }

  return (
    <div
      style={{ background: '#0a0f1e', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── blur orbs ── */}
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(40px,25px); }
          66%      { transform: translate(-25px,40px); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(-40px,-25px); }
          66%      { transform: translate(25px,-40px); }
        }
        @keyframes orb3 {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(-28px); }
        }
        .login-input {
          width: 100%;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #f9fafb;
          padding: 10px 14px 10px 36px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .login-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px #dbeafe;
        }
        .login-input::placeholder { color: #9ca3af; }
        /* hide browser native password-reveal eye icon */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none !important; }
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button { visibility: hidden; pointer-events: none; }
      `}</style>

      <Orb style={{
        top: '-8%', left: '-8%', width: 520, height: 520,
        background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
        opacity: 0.18,
        animation: 'orb1 9s ease-in-out infinite',
      }} />
      <Orb style={{
        bottom: '-10%', right: '-8%', width: 540, height: 540,
        background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
        opacity: 0.15,
        animation: 'orb2 11s ease-in-out infinite',
      }} />
      <Orb style={{
        top: '38%', left: '50%', width: 320, height: 320,
        background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
        opacity: 0.09,
        animation: 'orb3 13s ease-in-out infinite',
      }} />

      {/* ── centered layout ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>

        {/* logo + title */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#fff', padding: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(59,130,246,.3)',
            }}>
              <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
              ABC-<span style={{ fontWeight: 300, color: '#93c5fd' }}>Data</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>智平方具身数据采集平台</p>
        </div>

        {/* card */}
        <div style={{
          width: 480, maxWidth: '100%',
          background: '#fff',
          borderRadius: 16,
          padding: '36px 40px',
          boxShadow: '0 24px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.05)',
        }}>

          {/* tabs */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid #f1f5f9', marginBottom: 28 }}>
            {[
              { key: 'password', label: '账号密码登录' },
              { key: 'sso',      label: '飞书 SSO 登录' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  marginRight: 28,
                  paddingBottom: 12,
                  marginBottom: -1.5,
                  fontSize: 14,
                  fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? '#2563eb' : '#6b7280',
                  borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'color .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── password tab ── */}
          {tab === 'password' && (
            <form onSubmit={handleLogin}>
              {/* email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  邮箱 / 用户名
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                    color: '#9ca3af', display: 'flex', alignItems: 'center',
                  }}>
                    <IconMail />
                  </span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="输入邮箱或用户名"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  密码
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                    color: '#9ca3af', display: 'flex', alignItems: 'center',
                  }}>
                    <IconLock />
                  </span>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="login-input"
                    style={{ paddingRight: 40 }}
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      color: '#9ca3af', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                    }}
                  >
                    {showPwd ? <IconEyeOpen /> : <IconEyeOff />}
                  </button>
                </div>
              </div>

              {/* remember + forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  记住我
                </label>
                <a
                  href="#"
                  style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
                  onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
                >
                  忘记密码？
                </a>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 10,
                  background: loading ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(37,99,235,.35)',
                  transition: 'background .2s, box-shadow .2s',
                }}
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#1d4ed8' }}
                onMouseOut={(e)  => { if (!loading) e.currentTarget.style.background = '#2563eb' }}
              >
                {loading ? '登录中…' : '登录 →'}
              </button>
            </form>
          )}

          {/* ── SSO tab ── */}
          {tab === 'sso' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '12px 0' }}>
              {/* feishu icon — logo image */}
              <div style={{
                width: 88, height: 88,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(59,130,246,.15)',
                overflow: 'hidden',
              }}>
                <img
                  src={feishuLogo}
                  alt="飞书"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', lineHeight: 1.7, maxWidth: 300 }}>
                使用飞书企业账号快速登录，无需输入密码<br />即可访问智平方数据平台。
              </p>

              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 10,
                  background: '#10b981',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(16,185,129,.3)',
                  transition: 'background .2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#059669')}
                onMouseOut={(e)  => (e.currentTarget.style.background = '#10b981')}
              >
                前往飞书授权登录
              </button>
            </div>
          )}
        </div>

        <p style={{ marginTop: 28, fontSize: 12, color: '#334155' }}>
          © 2026 Al² Robotics · 智平方科技有限公司
        </p>
      </div>
    </div>
  )
}
