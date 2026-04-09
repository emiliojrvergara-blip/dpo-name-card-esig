import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import dpoLogo from '../assets/dpo-logo.png'

export default function Login() {
  const { login, forgotPassword } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 350))
    const ok = login(email.trim(), password)
    setLoading(false)
    if (!ok) { setError('Incorrect email or password.'); return }
    if (email.trim().toLowerCase() === 'info@dpointernational.com') navigate('/admin')
    else navigate('/dashboard')
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setForgotMsg(null)
    setForgotLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const result = forgotPassword(forgotEmail.trim())
    setForgotLoading(false)
    if (result.ok) {
      setForgotMsg({ type: 'success', text: 'Your password has been reset to the default password (dpo12345). An email notification will be sent once server deployment is complete.' })
    } else {
      setForgotMsg({ type: 'error', text: result.error })
    }
  }

  const inputBoxStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)', fontSize: 15, outline: 'none',
    background: '#f5f5f7', fontFamily: 'inherit', color: '#1d1d1f',
    boxSizing: 'border-box',
  }
  const labelBoxStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0048DC 0%, #002a83 55%, #001a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    }}>

      {/* Subtle background pattern */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(245,130,50,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-15%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={dpoLogo} alt="DPO International" style={{ height: 38, objectFit: 'contain' }} />
          <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(147,180,244,0.7)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Digital Name Card
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 22,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)',
        }}>

          {!showForgot ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', marginBottom: 6, letterSpacing: '-0.03em' }}>Sign In</h1>
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 28 }}>Access your Digital Name Card</p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelBoxStyle}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your.name@dpointernational.com" required
                    style={inputBoxStyle}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelBoxStyle}>Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={inputBoxStyle}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fff0f0', borderRadius: 10, padding: '11px 14px',
                    fontSize: 13, color: '#ff3b30', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="#ff3b30"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '15px 0',
                  background: loading ? '#93b4f4' : '#0048DC',
                  border: 'none', borderRadius: 13,
                  color: '#fff', fontSize: 16, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(0,72,220,0.4)',
                  transition: 'all 0.2s',
                }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button onClick={() => { setShowForgot(true); setError(''); setForgotMsg(null); setForgotEmail('') }}
                  style={{ fontSize: 14, color: '#0048DC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', marginBottom: 6, letterSpacing: '-0.03em' }}>Reset Password</h1>
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24, lineHeight: 1.5 }}>
                Enter your email address. Your password will be reset to the default password.
              </p>

              {forgotMsg && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.5,
                  background: forgotMsg.type === 'success' ? '#ecfdf5' : '#fff0f0',
                  color: forgotMsg.type === 'success' ? '#059669' : '#ff3b30',
                  border: forgotMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                }}>
                  {forgotMsg.text}
                </div>
              )}

              {!forgotMsg?.type === 'success' || !forgotMsg ? (
                <form onSubmit={handleForgotSubmit}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelBoxStyle}>Email</label>
                    <input
                      type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your.name@dpointernational.com" required
                      style={inputBoxStyle}
                    />
                  </div>

                  <button type="submit" disabled={forgotLoading} style={{
                    width: '100%', padding: '15px 0',
                    background: forgotLoading ? '#93b4f4' : '#0048DC',
                    border: 'none', borderRadius: 13,
                    color: '#fff', fontSize: 16, fontWeight: 600,
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    boxShadow: forgotLoading ? 'none' : '0 4px 16px rgba(0,72,220,0.4)',
                    transition: 'all 0.2s',
                  }}>
                    {forgotLoading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              ) : null}

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button onClick={() => { setShowForgot(false); setForgotMsg(null) }}
                  style={{ fontSize: 14, color: '#0048DC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(147,180,244,0.5)', marginTop: 24 }}>
          © {new Date().getFullYear()} DPO International. All rights reserved.
        </p>
      </div>
    </div>
  )
}
