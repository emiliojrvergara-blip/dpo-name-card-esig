import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'

export default function Login() {
  const { login, isAdmin } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

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
          <DpoLogo height={38} />
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', marginBottom: 6, letterSpacing: '-0.03em' }}>Sign In</h1>
          <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 28 }}>Access your Digital Name Card</p>

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div style={{
              marginBottom: 12,
              background: '#f5f5f7',
              borderRadius: 12,
              border: `1.5px solid ${focusedField === 'email' ? '#0048DC' : 'transparent'}`,
              transition: 'border-color 0.2s',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '13px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.name@dpointernational.com"
                  required
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 15, color: '#1d1d1f', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{
              marginBottom: 20,
              background: '#f5f5f7',
              borderRadius: 12,
              border: `1.5px solid ${focusedField === 'password' ? '#0048DC' : 'transparent'}`,
              transition: 'border-color 0.2s',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '13px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 15, color: '#1d1d1f', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Error */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px 0',
                background: loading ? '#93b4f4' : '#0048DC',
                border: 'none', borderRadius: 13,
                color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(0,72,220,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(147,180,244,0.5)', marginTop: 24 }}>
          © {new Date().getFullYear()} DPO International. All rights reserved.
        </p>
      </div>
    </div>
  )
}
