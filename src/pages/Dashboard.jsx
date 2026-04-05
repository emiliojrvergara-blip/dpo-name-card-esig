import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'
import { resizePhoto } from '../utils/photoResize'

// ── Design tokens (Apple-inspired) ───────────────────────────────────────────
const C = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  surfaceSecondary: '#f5f5f7',
  blue: '#0048DC',
  darkBlue: '#002a83',
  orange: '#F58232',
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  textTertiary: '#aeaeb2',
  border: 'rgba(0,0,0,0.08)',
  divider: 'rgba(0,0,0,0.06)',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
  { id: 'social', label: 'Social', icon: SocialIcon },
  { id: 'card', label: 'Card & QR', icon: QRIcon },
]

// ── Tab icons ─────────────────────────────────────────────────────────────────
function ProfileIcon({ active }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx={12} cy={7} r={4} />
    </svg>
  )
}
function SocialIcon({ active }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={18} cy={5} r={3} /><circle cx={6} cy={12} r={3} /><circle cx={18} cy={19} r={3} />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  )
}
function QRIcon({ active }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} rx={1} /><rect x={14} y={3} width={7} height={7} rx={1} />
      <rect x={3} y={14} width={7} height={7} rx={1} />
      <path d="M14 14h3v3M17 14v4h4M14 21h3" />
    </svg>
  )
}

// ── iOS-style Toggle ──────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 51, height: 31, borderRadius: 16, border: 'none',
        background: on ? '#34C759' : '#e5e5ea',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0, padding: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2, left: on ? 22 : 2,
        width: 27, height: 27, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
        transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
      }} />
    </button>
  )
}

// ── Grouped section (iOS Settings style) ──────────────────────────────────────
function Section({ label, children, style }) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, paddingLeft: 4 }}>
          {label}
        </div>
      )}
      <div style={{ background: C.surface, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
        {children}
      </div>
    </div>
  )
}

function FormRow({ label, last, children }) {
  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: last ? 'none' : `1px solid ${C.divider}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  )
}

function AppleInput({ value, onChange, placeholder, type = 'text', readOnly }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', border: 'none', outline: 'none',
        fontSize: 15, color: readOnly ? C.textTertiary : C.textPrimary,
        background: 'transparent', padding: 0, fontFamily: 'inherit',
      }}
    />
  )
}

// ── My Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ emp, onSave }) {
  const [form, setForm] = useState({
    cardName: emp.cardName, position: emp.position,
    division: emp.division, mobile: emp.mobile, photo: emp.photo,
  })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    update('photo', await resizePhoto(file))
  }

  function handleSave(e) {
    e.preventDefault()
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSave}>
      {/* Photo hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0 20px' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 24,
            background: 'linear-gradient(135deg, #e8eaf0, #d4d8e4)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            {form.photo
              ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width={44} height={44} viewBox="0 0 24 24" fill="#b0b8c8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            }
          </div>
          <button type="button" onClick={() => fileRef.current.click()} style={{
            position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, borderRadius: '50%',
            background: C.blue, border: '2.5px solid #f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,72,220,0.4)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx={12} cy={13} r={4} />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>{form.cardName}</div>
        <div style={{ fontSize: 14, color: C.textSecondary }}>{form.position}</div>
        {form.photo && (
          <button type="button" onClick={() => update('photo', null)} style={{ marginTop: 10, fontSize: 13, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Remove Photo
          </button>
        )}
      </div>

      <Section label="Personal Info">
        {['cardName', 'position', 'division', 'mobile'].map((key, i) => {
          const labels = { cardName: 'Name on Card', position: 'Position', division: 'Division', mobile: 'Mobile' }
          return (
            <FormRow key={key} label={labels[key]} last={i === 3}>
              <AppleInput value={form[key]} onChange={e => update(key, e.target.value)} type={key === 'mobile' ? 'tel' : 'text'} />
            </FormRow>
          )
        })}
      </Section>

      <Section label="Company Info">
        {[
          ['Email', emp.email], ['Office', emp.office], ['Company', emp.company],
          ['Country', emp.country], ['Office Phone', emp.officePhone], ['Address', emp.address],
        ].map(([label, val], i, arr) => (
          <FormRow key={label} label={label} last={i === arr.length - 1}>
            <div style={{ fontSize: 15, color: C.textTertiary, lineHeight: 1.5 }}>{val || '—'}</div>
          </FormRow>
        ))}
      </Section>

      <button type="submit" style={{
        width: '100%', padding: '16px 0', background: saved ? '#34C759' : C.blue,
        border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 600,
        cursor: 'pointer', marginBottom: 40, transition: 'background 0.3s',
        boxShadow: saved ? '0 4px 16px rgba(52,199,89,0.35)' : '0 4px 16px rgba(0,72,220,0.3)',
      }}>
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
    Object.keys(finalToggles).forEach(k => {
      if (finalToggles[k] && !social[k]?.trim()) finalToggles[k] = false
    })
    setToggles(finalToggles)
    onSave({ toggles: finalToggles, social, customButtons })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSave} style={{ paddingTop: 8 }}>
      <Section label="Messaging & Social">
        {SOCIAL_CONFIG.map(({ key, label, color, placeholder }, i, arr) => (
          <div key={key}>
            <div style={{
              padding: '14px 16px',
              borderBottom: (toggles[key] || i < arr.length - 1) ? `1px solid ${C.divider}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: C.textPrimary, fontWeight: 500 }}>{label}</span>
              </div>
              <Toggle on={toggles[key]} onChange={v => setToggles(t => ({ ...t, [key]: v }))} />
            </div>
            {toggles[key] && (
              <div style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none', background: '#fafafa' }}>
                <input
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: C.textPrimary, background: 'transparent', fontFamily: 'inherit' }}
                  value={social[key] || ''}
                  onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            )}
          </div>
        ))}
      </Section>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Custom Buttons <span style={{ textTransform: 'none', fontSize: 12, color: C.textTertiary, fontWeight: 400 }}>(max 2)</span>
          </div>
          {customButtons.length < 2 && (
            <button type="button" onClick={() => setCustomButtons(b => [...b, { title: '', type: 'url', value: '' }])} style={{ fontSize: 14, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + Add
            </button>
          )}
        </div>
        {customButtons.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: C.textTertiary, fontSize: 14, boxShadow: C.shadow }}>
            No custom buttons yet. Add up to 2.
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
            {customButtons.map((btn, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: i < customButtons.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                      Label <span style={{ color: btn.title.length >= 18 ? '#ff3b30' : C.textTertiary }}>{btn.title.length}/20</span>
                    </div>
                    <input style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: C.textPrimary, background: 'transparent', fontFamily: 'inherit' }}
                      value={btn.title} onChange={e => setCustomButtons(b => b.map((x, idx) => idx === i ? { ...x, title: e.target.value.slice(0, 20) } : x))}
                      placeholder="e.g. Brochure" maxLength={20} />
                  </div>
                  <button type="button" onClick={() => setCustomButtons(b => b.filter((_, idx) => idx !== i))} style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff3b30', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ height: 1, background: C.divider, margin: '0 0 10px' }} />
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>URL</div>
                <input style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: C.textPrimary, background: 'transparent', fontFamily: 'inherit' }}
                  value={btn.value} onChange={e => setCustomButtons(b => b.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                  placeholder="https://" type="url" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" style={{
        width: '100%', padding: '16px 0', background: saved ? '#34C759' : C.blue,
        border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
        marginBottom: 40, transition: 'background 0.3s',
        boxShadow: saved ? '0 4px 16px rgba(52,199,89,0.35)' : '0 4px 16px rgba(0,72,220,0.3)',
      }}>
        {saved ? '✓ Changes Saved' : 'Save Changes'}
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
    if ('NDEFReader' in window) {
      try { const w = new NDEFReader(); await w.write({ records: [{ recordType: 'url', data: cardUrl }] }); alert('Ready to tap!') }
      catch { alert('NFC write failed. Requires Android Chrome over HTTPS.') }
    } else { alert('NFC not supported on this device.') }
  }

  // ── Styled QR Card Download ─────────────────────────────────────────────────
  function downloadQR() {
    const svgEl = document.getElementById('qr-svg')
    if (!svgEl) return

    const cardW = 480
    const cardH = 640
    const margin = 40
    const borderRadius = 24
    const headerH = 100
    const qrSize = 240

    const canvas = document.createElement('canvas')
    canvas.width = cardW + margin * 2
    canvas.height = cardH + margin * 2
    const ctx = canvas.getContext('2d')

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = margin
    const y = margin

    // Card outline (rounded rect)
    ctx.strokeStyle = C.blue
    ctx.lineWidth = 2.5
    roundRect(ctx, x, y, cardW, cardH, borderRadius)
    ctx.stroke()

    // Clip inside card for blue header
    ctx.save()
    roundRect(ctx, x, y, cardW, cardH, borderRadius)
    ctx.clip()

    // Blue header
    ctx.fillStyle = C.blue
    ctx.fillRect(x, y, cardW, headerH)

    ctx.restore()

    // DPO logo on header (white text "dpo INTERNATIONAL")
    // Draw the SVG logo onto the header
    const logoSvg = document.querySelector('[data-logo-svg]')
    if (logoSvg) {
      const svgStr = new XMLSerializer().serializeToString(logoSvg)
      const logoImg = new Image()
      logoImg.onload = () => {
        const logoH = 36
        const logoW = logoImg.width * (logoH / logoImg.height)
        ctx.drawImage(logoImg, x + (cardW - logoW) / 2, y + (headerH - logoH) / 2, logoW, logoH)
        finishDraw()
      }
      logoImg.onerror = () => {
        drawLogoText()
        finishDraw()
      }
      logoImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
    } else {
      drawLogoText()
      finishDraw()
    }

    function drawLogoText() {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('dpo', x + cardW / 2, y + 50)
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.letterSpacing = '3px'
      ctx.fillText('INTERNATIONAL', x + cardW / 2, y + 70)
    }

    function finishDraw() {
      // "Scan for my" text
      ctx.fillStyle = C.textPrimary
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText('Scan for my', x + cardW / 2, y + headerH + 52)

      // "Digital Business Card" text
      ctx.fillText('Digital Business Card', x + cardW / 2, y + headerH + 82)

      // QR code
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const qrImg = new Image()
      qrImg.onload = () => {
        const qrX = x + (cardW - qrSize) / 2
        const qrY = y + headerH + 108
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

        // Employee name
        ctx.fillStyle = C.textPrimary
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(emp.cardName, x + cardW / 2, qrY + qrSize + 50)

        // Download
        const a = document.createElement('a')
        a.download = `${emp.cardName.replace(/\s+/g, '_')}_QR.png`
        a.href = canvas.toDataURL('image/png')
        a.click()
      }
      qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  // Rounded rect helper
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const shareActions = [
    { label: 'WhatsApp', color: '#25D366', onClick: shareWhatsApp,
      icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.858L.057 23.214a.75.75 0 00.93.93l5.356-1.475A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.967 0-3.81-.527-5.393-1.443l-.387-.232-4.014 1.107 1.106-4.013-.232-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
    { label: 'Email', color: C.blue, onClick: shareEmail,
      icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={4} width={20} height={16} rx={2}/><path d="M22 7l-10 7L2 7"/></svg> },
    { label: 'NFC Tap', color: '#5856D6', onClick: shareNFC,
      icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7a9 9 0 010 10M4 7a9 9 0 000 10M8 10a3 3 0 010 4M16 10a3 3 0 000 4"/><circle cx={12} cy={12} r={1} fill="#fff" stroke="none"/></svg> },
    { label: copied ? 'Copied!' : 'Copy Link', color: copied ? '#34C759' : '#636366', onClick: copyLink,
      icon: copied
        ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        : <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
  ]

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Hidden SVG for logo rendering on canvas */}
      <div style={{ position: 'absolute', left: -9999 }}>
        <DpoLogo height={36} dataAttr />
      </div>

      {/* QR Card */}
      <div style={{ background: C.surface, borderRadius: 20, padding: '28px 20px', textAlign: 'center', boxShadow: C.shadowMd, marginBottom: 20 }}>
        <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <QRCodeSVG id="qr-svg" value={cardUrl} size={160} fgColor={C.blue} bgColor="#ffffff" level="M" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{emp.cardName}</div>
        <div style={{ fontSize: 12, color: C.textTertiary, wordBreak: 'break-all' }}>{cardUrl}</div>
      </div>

      {/* Download QR */}
      <button onClick={downloadQR} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '15px 0', marginBottom: 12,
        background: C.blue, border: 'none', borderRadius: 14,
        color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,72,220,0.3)',
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Download QR Code
      </button>

      {/* Share grid */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, paddingLeft: 4 }}>
        Share via
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {shareActions.map(({ label, color, onClick, icon }) => (
          <button key={label} onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: C.surface,
            border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: C.shadow,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Preview card */}
      <a href={`#/card/${emp.id}`} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '15px 0', marginBottom: 40,
        background: C.surface, border: `1.5px solid ${C.blue}`, borderRadius: 14,
        color: C.blue, fontSize: 16, fontWeight: 600, textDecoration: 'none', boxShadow: C.shadow,
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx={12} cy={12} r={3}/>
        </svg>
        Preview My Card
      </a>
    </div>
  )
}

// ── Top Tab Bar ───────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 6,
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: '10px 16px 12px',
    }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, maxWidth: 130,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '10px 8px 10px',
              background: active ? 'rgba(0,72,220,0.08)' : 'transparent',
              border: active ? `1.5px solid rgba(0,72,220,0.25)` : '1.5px solid transparent',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Icon active={active} />
            <span style={{
              fontSize: 12, fontWeight: active ? 700 : 500,
              color: active ? C.blue : C.textTertiary,
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, saveEmployeeOverride, isAdmin, employees } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const emp = employees.find(e => e.id === user?.id)

  if (!user || user.adminOnly) { navigate('/admin'); return null }
  if (!emp) { navigate('/login'); return null }

  function handleLogout() { logout(); navigate('/login') }
  function handleSave(patch) { saveEmployeeOverride(emp.id, patch) }

  const showAdmin = isAdmin(emp.email)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Minimal sidebar (only for Admin Panel + Sign Out) */}
      <aside style={{
        width: 280, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -280, bottom: 0,
        zIndex: 50, transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header with logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 12, padding: '10px 14px', display: 'inline-flex', marginBottom: 14 }}>
            <DpoLogo height={28} />
          </div>
          <div style={{ fontSize: 12, color: C.textTertiary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Digital Name Card</div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          }}>
            {emp.photo
              ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width={22} height={22} viewBox="0 0 24 24" fill={C.blue} opacity={0.7}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</div>
            <div style={{ fontSize: 12, color: C.textTertiary }}>{emp.email}</div>
          </div>
        </div>

        {/* Sidebar actions */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {showAdmin && (
            <button
              onClick={() => { setSidebarOpen(false); navigate('/admin') }}
              style={{
                width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(0,72,220,0.06)', border: 'none', borderRadius: 12,
                color: C.blue, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Panel
            </button>
          )}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '10px 10px 24px', borderTop: `1px solid ${C.divider}` }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 'none', borderRadius: 12,
            color: '#ff3b30', fontSize: 15, cursor: 'pointer', textAlign: 'left',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}>
          <svg width={20} height={20} fill="none" stroke={C.textPrimary} strokeWidth={2} strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.02em' }}>My Dashboard</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div style={{ padding: '0 16px', maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {activeTab === 'profile' && <ProfileTab emp={emp} onSave={handleSave} />}
        {activeTab === 'social' && <SocialTab emp={emp} onSave={handleSave} />}
        {activeTab === 'card' && <CardQRTab emp={emp} />}
      </div>
    </div>
  )
}
