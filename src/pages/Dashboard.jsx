import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp } from '../context/AppContext'
import dpoLogo from '../assets/dpo-logo.png'
import { resizePhoto } from '../utils/photoResize'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  blue: '#0048DC',
  orange: '#F58232',
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  divider: '#f1f5f9',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const TABS = [
  { id: 'profile', label: 'My Profile' },
  { id: 'social', label: 'Social & Links' },
  { id: 'card', label: 'My Card & QR' },
]

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 14, outline: 'none',
  background: '#fff', fontFamily: 'inherit', color: '#1e293b',
  boxSizing: 'border-box',
}
const readOnlyStyle = { ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'default' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }

// ── Simple toggle ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 40, height: 22, borderRadius: 11,
      background: on ? C.blue : '#cbd5e1',
      border: 'none', position: 'relative',
      cursor: 'pointer', transition: 'background 0.2s',
      flexShrink: 0, padding: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
      {tabs.map(({ id, label }) => {
        const active = activeTab === id
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            padding: '13px 20px', border: 'none',
            borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent',
            background: 'transparent',
            color: active ? C.blue : C.textSecondary,
            fontSize: 14, fontWeight: active ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16, ...style }}>
      {title && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ emp, onSave }) {
  const [form, setForm] = useState({ cardName: emp.cardName, position: emp.position, division: emp.division, mobile: emp.mobile, photo: emp.photo })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handlePhoto(e) {
    const file = e.target.files[0]; if (!file) return
    update('photo', await resizePhoto(file))
  }

  function handleSave(e) {
    e.preventDefault()
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSave} style={{ padding: '20px 16px' }}>
      {/* Photo row */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
            {form.photo
              ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width={32} height={32} viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{form.cardName}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => fileRef.current.click()} style={{ padding: '5px 12px', border: `1px solid ${C.blue}`, borderRadius: 5, background: '#fff', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change Photo</button>
              {form.photo && <button type="button" onClick={() => update('photo', null)} style={{ padding: '5px 12px', border: '1px solid #fca5a5', borderRadius: 5, background: '#fff', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Remove</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          </div>
        </div>
      </Card>

      {/* Editable fields */}
      <Card title="Personal Info">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Name on Card</label>
            <input style={inputStyle} value={form.cardName || ''} onChange={e => update('cardName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Position</label>
            <input style={inputStyle} value={form.position || ''} onChange={e => update('position', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Division</label>
            <input style={readOnlyStyle} value={form.division || ''} readOnly />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Mobile</label>
            <input style={inputStyle} value={form.mobile || ''} onChange={e => update('mobile', e.target.value)} type="tel" />
          </div>
        </div>
      </Card>

      {/* Read-only company info */}
      <Card title="Company Info">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Email', emp.email, true], ['Office', emp.office, false], ['Company', emp.company, false], ['Country', emp.country, false], ['Office Phone', emp.officePhone, false], ['Address', emp.address, true]].map(([lbl, val, full]) => (
            <div key={lbl} style={full ? { gridColumn: '1 / -1' } : {}}>
              <label style={labelStyle}>{lbl}</label>
              <input style={readOnlyStyle} value={val || '—'} readOnly />
            </div>
          ))}
        </div>
      </Card>

      <button type="submit" style={{ width: '100%', padding: '11px 0', background: saved ? '#22c55e' : C.blue, border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s', marginBottom: 40 }}>
        {saved ? '✓ Changes Saved' : 'Save Changes'}
      </button>
    </form>
  )
}

// ── Social & Links Tab ────────────────────────────────────────────────────────
const SOCIAL_CONFIG = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', placeholder: '+60142275101' },
  { key: 'line', label: 'Line', color: '#06C755', placeholder: 'Line ID' },
  { key: 'wechat', label: 'WeChat', color: '#07C160', placeholder: 'WeChat ID' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', placeholder: 'https://linkedin.com/in/yourprofile' },
]

function SocialTab({ emp, onSave }) {
  const [toggles, setToggles] = useState({ ...emp.toggles })
  const [social, setSocial] = useState({ ...emp.social })
  const [customButtons, setCustomButtons] = useState([...emp.customButtons])
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    const finalToggles = { ...toggles }
    Object.keys(finalToggles).forEach(k => { if (finalToggles[k] && !social[k]?.trim()) finalToggles[k] = false })
    setToggles(finalToggles)
    onSave({ toggles: finalToggles, social, customButtons })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSave} style={{ padding: '20px 16px' }}>
      <Card title="Messaging & Social">
        {SOCIAL_CONFIG.map(({ key, label, color, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: toggles[key] ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{label}</span>
              </div>
              <Toggle on={toggles[key]} onChange={v => setToggles(t => ({ ...t, [key]: v }))} />
            </div>
            {toggles[key] && (
              <input style={inputStyle} value={social[key] || ''} onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))} placeholder={placeholder} />
            )}
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Buttons <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: C.textTertiary }}>(max 2)</span></span>
          {customButtons.length < 2 && (
            <button type="button" onClick={() => setCustomButtons(b => [...b, { title: '', type: 'url', value: '' }])} style={{ fontSize: 13, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
          )}
        </div>
        {customButtons.length === 0
          ? <div style={{ textAlign: 'center', color: C.textTertiary, fontSize: 14, padding: '8px 0' }}>No custom buttons yet.</div>
          : customButtons.map((btn, i) => (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Label ({btn.title.length}/20)</label>
                  <input style={inputStyle} value={btn.title} onChange={e => setCustomButtons(b => b.map((x, idx) => idx === i ? { ...x, title: e.target.value.slice(0, 20) } : x))} placeholder="e.g. Brochure" maxLength={20} />
                </div>
                <button type="button" onClick={() => setCustomButtons(b => b.filter((_, idx) => idx !== i))} style={{ marginTop: 20, width: 30, height: 30, borderRadius: 5, background: '#fff0f0', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
              </div>
              <label style={labelStyle}>URL</label>
              <input style={inputStyle} value={btn.value} onChange={e => setCustomButtons(b => b.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="https://" type="url" />
            </div>
          ))
        }
      </Card>

      <button type="submit" style={{ width: '100%', padding: '11px 0', background: saved ? '#22c55e' : C.blue, border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s', marginBottom: 40 }}>
        {saved ? '✓ Changes Saved' : 'Save Changes'}
      </button>
    </form>
  )
}

// ── My Card & QR Tab ──────────────────────────────────────────────────────────
function CardQRTab({ emp }) {
  const [copied, setCopied] = useState(false)
  const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${emp.id}`

  function copyLink() { navigator.clipboard.writeText(cardUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }
  function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent('Here is my Digital Name Card: ' + cardUrl)}`, '_blank') }
  function shareEmail() { window.open(`mailto:?subject=My Digital Name Card&body=${encodeURIComponent('Here is my Digital Name Card: ' + cardUrl)}`, '_blank') }
  async function shareNFC() {
    if ('NDEFReader' in window) {
      try { const w = new NDEFReader(); await w.write({ records: [{ recordType: 'url', data: cardUrl }] }); alert('Ready to tap!') }
      catch { alert('NFC write failed. Requires Android Chrome over HTTPS.') }
    } else { alert('NFC not supported on this device.') }
  }

  function downloadQR() {
    const svgEl = document.getElementById('qr-svg')
    if (!svgEl) return
    const cardW = 480, cardH = 640, margin = 40, borderRadius = 24, headerH = 100, qrSize = 240
    const canvas = document.createElement('canvas')
    canvas.width = cardW + margin * 2; canvas.height = cardH + margin * 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    const x = margin, y = margin
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5
    roundRect(ctx, x, y, cardW, cardH, borderRadius); ctx.stroke()
    ctx.save(); roundRect(ctx, x, y, cardW, cardH, borderRadius); ctx.clip()
    ctx.fillStyle = C.blue; ctx.fillRect(x, y, cardW, headerH); ctx.restore()
    const logoSvg = document.querySelector('[data-logo-svg]')
    if (logoSvg) {
      const svgStr = new XMLSerializer().serializeToString(logoSvg)
      const logoImg = new Image()
      logoImg.onload = () => { const lh = 36, lw = logoImg.width * (lh / logoImg.height); ctx.drawImage(logoImg, x + (cardW - lw) / 2, y + (headerH - lh) / 2, lw, lh); finishDraw() }
      logoImg.onerror = () => { drawLogoText(); finishDraw() }
      logoImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
    } else { drawLogoText(); finishDraw() }

    function drawLogoText() {
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('dpo', x + cardW / 2, y + 50)
      ctx.font = '10px sans-serif'; ctx.fillText('INTERNATIONAL', x + cardW / 2, y + 70)
    }
    function finishDraw() {
      ctx.fillStyle = C.textPrimary; ctx.textAlign = 'center'; ctx.font = 'bold 22px sans-serif'
      ctx.fillText('Scan for my', x + cardW / 2, y + headerH + 52)
      ctx.fillText('Digital Business Card', x + cardW / 2, y + headerH + 82)
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const qrImg = new Image()
      qrImg.onload = () => {
        const qrX = x + (cardW - qrSize) / 2, qrY = y + headerH + 108
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
        ctx.fillStyle = C.textPrimary; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(emp.cardName, x + cardW / 2, qrY + qrSize + 50)
        const a = document.createElement('a')
        a.download = `${emp.cardName.replace(/\s+/g, '_')}_QR.png`; a.href = canvas.toDataURL('image/png'); a.click()
      }
      qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
  }

  const shareActions = [
    { label: 'WhatsApp', color: '#25D366', onClick: shareWhatsApp, icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.858L.057 23.214a.75.75 0 00.93.93l5.356-1.475A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.967 0-3.81-.527-5.393-1.443l-.387-.232-4.014 1.107 1.106-4.013-.232-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
    { label: 'Email', color: C.blue, onClick: shareEmail, icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={4} width={20} height={16} rx={2}/><path d="M22 7l-10 7L2 7"/></svg> },
    { label: 'NFC', color: '#5856D6', onClick: shareNFC, icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7a9 9 0 010 10M4 7a9 9 0 000 10M8 10a3 3 0 010 4M16 10a3 3 0 000 4"/><circle cx={12} cy={12} r={1} fill="#fff" stroke="none"/></svg> },
    { label: copied ? 'Copied!' : 'Copy Link', color: copied ? '#22c55e' : '#64748b', onClick: copyLink, icon: copied ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
  ]

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ position: 'absolute', left: -9999 }}><svg xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 0 348 235" fill="none" data-logo-svg="true"><path d="M53.5 195.5c-29.5 0-53.5-23.5-53.5-52.5v-90c0-29 24-53 53.5-53h35c29.5 0 53.5 24 53.5 53v90c0 29-24 52.5-53.5 52.5h-35zm0-171.5c-16 0-29 13-29 29v90c0 16 13 29 29 29h35c16 0 29-13 29-29v-90c0-16-13-29-29-29h-35z" fill="#fff"/><path d="M157 195.5v-195h68c29.5 0 53.5 24 53.5 53.5s-24 53.5-53.5 53.5h-43v88h-25zm25-112h43c15.5 0 28.5-12.5 28.5-29.5s-13-29.5-28.5-29.5h-43v59z" fill="#fff"/><path d="M297 0h25v195.5h-25z" fill="#fff"/><path d="M0 212h348v5H0z" fill="#F58232"/><path d="M0 225h348v5H0z" fill="#F58232" opacity=".4"/></svg></div>

      <Card>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <QRCodeSVG id="qr-svg" value={cardUrl} size={160} fgColor={C.blue} bgColor="#ffffff" level="M" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{emp.cardName}</div>
          <div style={{ fontSize: 12, color: C.textTertiary, wordBreak: 'break-all', marginBottom: 16 }}>{cardUrl}</div>
          <button onClick={downloadQR} style={{ width: '100%', padding: '10px 0', background: C.blue, border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download QR Code
          </button>
        </div>
      </Card>

      <Card title="Share">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {shareActions.map(({ label, color, onClick, icon }) => (
            <button key={label} onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', background: color, border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ marginBottom: 40 }} />
    </div>
  )
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, saveEmployeeOverride, isAdmin, employees } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  const emp = employees.find(e => e.id === user?.id)

  if (!user || user.adminOnly) { navigate('/admin'); return null }
  if (!emp) { navigate('/login'); return null }

  function handleLogout() { logout(); navigate('/login') }
  function handleSave(patch) { saveEmployeeOverride(emp.id, patch) }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Top header */}
      <div style={{ background: C.blue, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <img src={dpoLogo} alt="DPO International" style={{ height: 32, objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin(emp.email) && (
            <button onClick={() => navigate('/admin')} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 5, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Admin
            </button>
          )}
          <button onClick={handleLogout} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 5, color: '#fff', fontSize: 12, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div style={{ maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {activeTab === 'profile' && <ProfileTab emp={emp} onSave={handleSave} />}
        {activeTab === 'social' && <SocialTab emp={emp} onSave={handleSave} />}
        {activeTab === 'card' && <CardQRTab emp={emp} />}
      </div>
    </div>
  )
}
