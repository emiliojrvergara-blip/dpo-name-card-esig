import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'
import { resizePhoto } from '../utils/photoResize'

const NAV = [
  { id: 'profile', label: 'My Profile' },
  { id: 'social', label: 'Social & Links' },
  { id: 'card', label: 'My Card & QR' },
]

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  background: '#fff',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 5,
}
const readonlyStyle = {
  ...inputStyle, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed',
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? '#0048DC' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── My Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ emp, onSave }) {
  const [form, setForm] = useState({
    cardName: emp.cardName,
    position: emp.position,
    division: emp.division,
    mobile: emp.mobile,
    photo: emp.photo,
  })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await resizePhoto(file)
    update('photo', dataUrl)
  }

  function handleSave(e) {
    e.preventDefault()
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave}>
      {/* Photo upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'linear-gradient(135deg, #f1f3f9, #e4e8f0)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #e5e7eb',
          }}>
            {form.photo
              ? <img src={form.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width={36} height={36} viewBox="0 0 24 24" fill="#c0c8d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 26, height: 26, borderRadius: '50%',
              background: '#0048DC', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx={12} cy={13} r={4} />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>Profile Photo</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Max 300×300px · JPEG · 300KB</div>
          {form.photo && (
            <button type="button" onClick={() => update('photo', null)} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Name on Card</label>
          <input style={inputStyle} value={form.cardName} onChange={(e) => update('cardName', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Position</label>
          <input style={inputStyle} value={form.position} onChange={(e) => update('position', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Division</label>
          <input style={inputStyle} value={form.division} onChange={(e) => update('division', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Mobile</label>
          <input style={inputStyle} value={form.mobile} onChange={(e) => update('mobile', e.target.value)} type="tel" />
        </div>
      </div>

      {/* Read-only fields */}
      <div style={{ borderTop: '1px solid #f0f1f5', paddingTop: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Company Info (read-only)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Email', emp.email],
            ['Office', emp.office],
            ['Company', emp.company],
            ['Country', emp.country],
            ['Office Phone', emp.officePhone],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <label style={labelStyle}>{lbl}</label>
              <input style={readonlyStyle} value={val || ''} readOnly />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Address</label>
            <textarea style={{ ...readonlyStyle, resize: 'none', minHeight: 60 }} value={emp.address || ''} readOnly />
          </div>
        </div>
      </div>

      <button
        type="submit"
        style={{
          width: '100%', padding: '12px 0',
          background: 'linear-gradient(135deg, #0048DC, #002a83)',
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </form>
  )
}

// ── Social & Links Tab ────────────────────────────────────────────────────────
const SOCIAL_CONFIG = [
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+60142275101', color: '#25D366' },
  { key: 'line', label: 'Line', placeholder: 'Line ID', color: '#06C755' },
  { key: 'wechat', label: 'WeChat', placeholder: 'WeChat ID', color: '#07C160' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile', color: '#0A66C2' },
]

function SocialTab({ emp, onSave }) {
  const [toggles, setToggles] = useState({ ...emp.toggles })
  const [social, setSocial] = useState({ ...emp.social })
  const [customButtons, setCustomButtons] = useState([...emp.customButtons])
  const [saved, setSaved] = useState(false)

  function setToggle(key, val) {
    // If turning on with empty field, keep value but set toggle
    setToggles((t) => ({ ...t, [key]: val }))
  }

  function setSocialVal(key, val) {
    setSocial((s) => ({ ...s, [key]: val }))
  }

  function addCustomBtn() {
    if (customButtons.length >= 2) return
    setCustomButtons((b) => [...b, { title: '', type: 'url', value: '' }])
  }

  function removeCustomBtn(i) {
    setCustomButtons((b) => b.filter((_, idx) => idx !== i))
  }

  function updateCustomBtn(i, field, val) {
    setCustomButtons((b) => b.map((btn, idx) => idx === i ? { ...btn, [field]: val } : btn))
  }

  function handleSave(e) {
    e.preventDefault()
    // Auto-revert toggles to OFF if corresponding field is empty
    const finalToggles = { ...toggles }
    Object.keys(finalToggles).forEach((k) => {
      if (finalToggles[k] && !social[k]?.trim()) finalToggles[k] = false
    })
    setToggles(finalToggles)
    onSave({ toggles: finalToggles, social, customButtons })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave}>
      {/* Messaging toggles */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Messaging & Social</div>
        {SOCIAL_CONFIG.map(({ key, label, placeholder, color }) => (
          <div key={key} style={{ marginBottom: 14, padding: 14, borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f1f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: toggles[key] ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{label}</span>
              </div>
              <Toggle on={toggles[key]} onChange={(v) => setToggle(key, v)} />
            </div>
            {toggles[key] && (
              <input
                style={{ ...inputStyle, background: '#fff' }}
                value={social[key]}
                onChange={(e) => setSocialVal(key, e.target.value)}
                placeholder={placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Custom buttons */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Custom Buttons <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 400 }}>(max 2)</span></div>
          {customButtons.length < 2 && (
            <button type="button" onClick={addCustomBtn} style={{ fontSize: 12, color: '#0048DC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + Add
            </button>
          )}
        </div>
        {customButtons.map((btn, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f1f5', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Title <span style={{ color: btn.title.length > 20 ? '#dc2626' : '#9ca3af' }}>{btn.title.length}/20</span></label>
                <input
                  style={{ ...inputStyle, borderColor: btn.title.length > 20 ? '#fca5a5' : '#e5e7eb' }}
                  value={btn.title}
                  onChange={(e) => updateCustomBtn(i, 'title', e.target.value.slice(0, 20))}
                  placeholder="e.g. Brochure"
                  maxLength={20}
                />
              </div>
              <button type="button" onClick={() => removeCustomBtn(i)} style={{ alignSelf: 'flex-end', padding: '10px 12px', background: '#fef2f2', border: 'none', borderRadius: 8, color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
                ✕
              </button>
            </div>
            <div>
              <label style={labelStyle}>URL</label>
              <input style={inputStyle} value={btn.value} onChange={(e) => updateCustomBtn(i, 'value', e.target.value)} placeholder="https://" type="url" />
            </div>
          </div>
        ))}
        {customButtons.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
            No custom buttons. Add up to 2.
          </div>
        )}
      </div>

      <button
        type="submit"
        style={{
          width: '100%', padding: '12px 0',
          background: 'linear-gradient(135deg, #0048DC, #002a83)',
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </form>
  )
}

// ── My Card & QR Tab ──────────────────────────────────────────────────────────
function CardQRTab({ emp }) {
  const [copied, setCopied] = useState(false)
  const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${emp.id}`

  function copyLink() {
    navigator.clipboard.writeText(cardUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent('Here is my Digital Name Card: ' + cardUrl)}`, '_blank')
  }

  function shareEmail() {
    window.open(`mailto:?subject=My Digital Name Card&body=${encodeURIComponent('Here is my Digital Name Card: ' + cardUrl)}`, '_blank')
  }

  async function shareNFC() {
    if ('NDEFWriter' in window || 'NDEFReader' in window) {
      try {
        const writer = new NDEFReader()
        await writer.write({ records: [{ recordType: 'url', data: cardUrl }] })
        alert('Ready to tap! Hold your phone near an NFC tag.')
      } catch {
        alert('NFC write failed. Make sure NFC is enabled and you are on HTTPS.')
      }
    } else {
      alert('NFC is not supported on this device or browser. Works on Android Chrome over HTTPS.')
    }
  }

  function downloadQR() {
    const svg = document.getElementById('qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a = document.createElement('a')
      a.download = `${emp.id}_qr.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const btnStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '12px 8px', borderRadius: 12, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', flex: 1, minWidth: 64,
  }

  return (
    <div>
      {/* QR Code */}
      <div style={{ textAlign: 'center', marginBottom: 24, padding: 20, background: '#f9fafb', borderRadius: 16, border: '1px solid #f0f1f5' }}>
        <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <QRCodeSVG
            id="qr-svg"
            value={cardUrl}
            size={180}
            fgColor="#0048DC"
            bgColor="#ffffff"
            level="M"
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', wordBreak: 'break-all' }}>{cardUrl}</div>
      </div>

      {/* Download QR */}
      <button
        onClick={downloadQR}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '12px 0', marginBottom: 16,
          background: 'linear-gradient(135deg, #0048DC, #002a83)',
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download QR Code
      </button>

      {/* Share buttons */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Share via</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={btnStyle} onClick={shareWhatsApp}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.858L.057 23.214a.75.75 0 00.93.93l5.356-1.475A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.967 0-3.81-.527-5.393-1.443l-.387-.232-4.014 1.107 1.106-4.013-.232-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          <span style={{ fontSize: 11, color: '#374151' }}>WhatsApp</span>
        </button>
        <button style={btnStyle} onClick={shareEmail}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0048DC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={2} y={4} width={20} height={16} rx={2} />
            <path d="M22 7l-10 7L2 7" />
          </svg>
          <span style={{ fontSize: 11, color: '#374151' }}>Email</span>
        </button>
        <button style={btnStyle} onClick={shareNFC}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0048DC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7a9 9 0 010 10M4 7a9 9 0 000 10M8 10a3 3 0 010 4M16 10a3 3 0 000 4" />
            <circle cx={12} cy={12} r={1} fill="#0048DC" stroke="none" />
          </svg>
          <span style={{ fontSize: 11, color: '#374151' }}>NFC Tap</span>
        </button>
        <button style={btnStyle} onClick={copyLink}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={copied ? '#059669' : '#0048DC'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {copied
              ? <path d="M20 6L9 17l-5-5" />
              : <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>
            }
          </svg>
          <span style={{ fontSize: 11, color: copied ? '#059669' : '#374151' }}>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>

      {/* Preview card button */}
      <a
        href={`#/card/${emp.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '12px 0',
          background: '#EFF2FF', border: '1.5px solid #c7d2fe', borderRadius: 12,
          color: '#0048DC', fontSize: 14, fontWeight: 600, textDecoration: 'none',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0048DC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx={12} cy={12} r={3} />
        </svg>
        Preview My Card
      </a>
    </div>
  )
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, saveEmployeeOverride, isAdmin, employees } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch fresh emp from employees array (to reflect saves)
  const emp = employees.find((e) => e.id === user?.id)

  if (!user || user.adminOnly) {
    navigate('/admin')
    return null
  }
  if (!emp) {
    navigate('/login')
    return null
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleSaveProfile(patch) {
    saveEmployeeOverride(emp.id, patch)
  }

  function handleSaveSocial(patch) {
    saveEmployeeOverride(emp.id, patch)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f3f9', display: 'flex' }}>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'linear-gradient(160deg, #0048DC 0%, #002a83 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -240, bottom: 0,
        zIndex: 50, transition: 'left 0.25s ease',
        '@media (min-width: 768px)': { left: 0 },
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px' }}>
          <DpoLogo height={34} />
          <p style={{ color: 'rgba(147,180,244,0.8)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>
            Digital Name Card
          </p>
        </div>

        {/* User info */}
        <div style={{ padding: '12px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{emp.cardName}</div>
          <div style={{ fontSize: 11, color: 'rgba(147,180,244,0.8)', marginTop: 2 }}>{emp.email}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              style={{
                width: '100%', padding: '12px 20px', textAlign: 'left',
                background: activeTab === id ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', color: activeTab === id ? '#fff' : 'rgba(147,180,244,0.8)',
                fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                cursor: 'pointer', borderLeft: activeTab === id ? '3px solid #F58232' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
          {isAdmin(emp.email) && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                width: '100%', padding: '12px 20px', textAlign: 'left',
                background: 'transparent', border: 'none',
                color: 'rgba(147,180,244,0.8)', fontSize: 14, cursor: 'pointer',
                borderLeft: '3px solid transparent',
              }}
            >
              Admin Panel
            </button>
          )}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            margin: '0 12px 20px', padding: '10px 0', borderRadius: 10,
            background: 'transparent', border: 'none',
            color: 'rgba(147,180,244,0.8)', fontSize: 13, cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 0, padding: 0, minHeight: '100vh' }}>
        {/* Top bar (mobile) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f1f5',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width={22} height={22} fill="none" stroke="#333" strokeWidth={2}>
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
            {NAV.find((n) => n.id === activeTab)?.label}
          </span>
          <div style={{ width: 30 }} />
        </div>

        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
          {activeTab === 'profile' && <ProfileTab emp={emp} onSave={handleSaveProfile} />}
          {activeTab === 'social' && <SocialTab emp={emp} onSave={handleSaveSocial} />}
          {activeTab === 'card' && <CardQRTab emp={emp} />}
        </div>
      </main>
    </div>
  )
}
