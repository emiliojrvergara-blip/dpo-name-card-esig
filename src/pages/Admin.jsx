import React, { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import dpoLogo from '../assets/dpo-logo.png'
import dpoLogoEnglishWhite from '../assets/dpo-logo-english-white.png'
import dpoLogoChinaWhite from '../assets/dpo-logo-china-white.png'
import { resizePhoto } from '../utils/photoResize'
import * as XLSX from 'xlsx'
import { downloadEmployeeQR } from '../utils/qrDownload'
import ESignaturesTab from './admin/ESignaturesTab'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#f5f5f7', surface: '#ffffff', blue: '#0048DC', orange: '#F58232',
  textPrimary: '#1d1d1f', textSecondary: '#6e6e73', textTertiary: '#aeaeb2',
  border: 'rgba(0,0,0,0.08)', divider: 'rgba(0,0,0,0.06)',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
}


const TABS = [
  { id: 'employees', label: 'Employees', icon: EmpIcon },
  { id: 'esignatures', label: 'E-Signatures', icon: SignatureIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'stats', label: 'Stats', icon: StatsIcon },
  { id: 'admins', label: 'Admins', icon: AdminIcon },
]

// ── Icons ─────────────────────────────────────────────────────────────────────
function EmpIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : '#6e6e73'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
}
function SettingsIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : '#6e6e73'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={3}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
}
function StatsIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : '#6e6e73'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
}
function AdminIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : '#6e6e73'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
}
function SignatureIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : '#6e6e73'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17.5c2 .5 4-1 5-3s2-5 4-5 2 3 1 5-3 4-3 4 2 .5 4 0 4-2 5-3"/>
    <path d="M14 19l2 2 4-4"/>
  </svg>
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none',
  background: '#f5f5f7', fontFamily: 'inherit', color: C.textPrimary,
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 12px 12px' }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, maxWidth: 110,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '10px 4px',
            background: active ? 'rgba(0,72,220,0.08)' : 'transparent',
            border: active ? '1.5px solid rgba(0,72,220,0.25)' : '1.5px solid transparent',
            borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Icon active={active} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.blue : '#6e6e73' }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Lock indicator ────────────────────────────────────────────────────────────
function FieldLock({ locked }) {
  if (!locked) return null
  return <span title="Admin-locked: excluded from Excel sync" style={{ marginLeft: 4, fontSize: 10, color: C.blue }}>🔒</span>
}

// ── Confirmation Modal (shared) ───────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmStyle = {}, onClose, onConfirm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 12 }}>{title}</div>
        <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: '#f5f5f7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '12px 0', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', background: '#ff3b30', ...confirmStyle }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Employee Edit Modal ─────────────────────────────────────────────────
function AdminEmpModal({ emp, lockedFields = [], divisions = [], onClose, onSave }) {
  const [form, setForm] = useState({ ...emp })
  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function updateSocial(key, val) { setForm(f => ({ ...f, social: { ...f.social, [key]: val } })) }
  function updateToggle(key, val) { setForm(f => ({ ...f, toggles: { ...f.toggles, [key]: val } })) }
  function handleWhatsAppToggle(checked) {
    setForm(f => {
      const newSocial = { ...f.social }
      if (checked && !f.social.whatsapp && f.mobile) {
        const clean = f.mobile.replace(/[\s\-()]/g, '').replace(/^\+/, '')
        if (clean) newSocial.whatsapp = `https://wa.me/${clean}`
      }
      return { ...f, toggles: { ...f.toggles, whatsapp: checked }, social: newSocial }
    })
  }
  async function handlePhoto(e) {
    const file = e.target.files[0]; if (!file) return
    update('photo', await resizePhoto(file))
  }
  function handleSave(e) {
    e.preventDefault()
    const finalToggles = { ...form.toggles }
    Object.keys(finalToggles).forEach(k => { if (finalToggles[k] && !form.social[k]?.trim()) finalToggles[k] = false })
    onSave({ ...form, toggles: finalToggles })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Edit Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary }}>{emp.email}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}>✕</button>
        </div>

        {lockedFields.length > 0 && (
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: C.blue, marginBottom: 14 }}>
            🔒 {lockedFields.length} field{lockedFields.length !== 1 ? 's are' : ' is'} currently admin-locked and excluded from Excel sync.
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, overflow: 'hidden', background: '#f1f3f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={30} height={30} viewBox="0 0 24 24" fill="#c0c8d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '7px 14px', background: '#EFF2FF', color: C.blue, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Upload Photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </label>
              {form.photo && <button type="button" onClick={() => update('photo', null)} style={{ marginLeft: 8, fontSize: 12, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
            </div>
          </div>

          {/* Identity */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Identity</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name on Card<FieldLock locked={lockedFields.includes('cardName')} /></label>
            <input style={inputStyle} value={form.cardName||''} onChange={e => update('cardName', e.target.value)} />
          </div>

          {/* Professional */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Professional</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Position<FieldLock locked={lockedFields.includes('position')} /></label>
              <input style={inputStyle} value={form.position||''} onChange={e => update('position', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Division<FieldLock locked={lockedFields.includes('division')} /></label>
              <select style={inputStyle} value={form.division||''} onChange={e => update('division', e.target.value)}>
                <option value="">Select…</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Contact */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Mobile<FieldLock locked={lockedFields.includes('mobile')} /></label>
              <input style={inputStyle} value={form.mobile||''} onChange={e => update('mobile', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email<FieldLock locked={lockedFields.includes('email')} /></label>
              <input style={inputStyle} value={form.email||''} onChange={e => update('email', e.target.value)} type="email" />
            </div>
          </div>

          {/* Company Info — Admin-controlled */}
          <div style={{ background: '#f0f7ff', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Company Info — Admin Controlled</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Office<FieldLock locked={lockedFields.includes('office')} /></label>
                <input style={inputStyle} value={form.office||''} onChange={e => update('office', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Company Name<FieldLock locked={lockedFields.includes('company')} /></label>
                <input style={inputStyle} value={form.company||''} onChange={e => update('company', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Office Phone<FieldLock locked={lockedFields.includes('officePhone')} /></label>
                <input style={inputStyle} value={form.officePhone||''} onChange={e => update('officePhone', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Website<FieldLock locked={lockedFields.includes('website')} /></label>
                <input style={inputStyle} value={form.website||''} onChange={e => update('website', e.target.value)} placeholder="https://…" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address<FieldLock locked={lockedFields.includes('address')} /></label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={form.address||''} onChange={e => update('address', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Social */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Social Links</div>
          <div style={{ marginBottom: 20 }}>
            {['whatsapp','line','linkedin'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ width: 72, fontSize: 12, textTransform: 'capitalize', color: C.textSecondary }}>{k}</label>
                <input type="checkbox" checked={form.toggles[k]} onChange={e => k === 'whatsapp' ? handleWhatsAppToggle(e.target.checked) : updateToggle(k, e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.social[k]||''} onChange={e => updateSocial(k, e.target.value)} placeholder={k === 'linkedin' ? 'https://linkedin.com/in/…' : k + ' ID'} />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 12, textAlign: 'center' }}>
            All edited fields will be admin-locked and excluded from Excel sync.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', background: '#f5f5f7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '12px 0', background: C.blue, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>

        <a
          href={`${window.location.pathname}#/card/${emp.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 10, width: '100%', padding: '12px 0',
            background: C.surface, border: `1.5px solid ${C.blue}`,
            borderRadius: 12, color: C.blue, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx={12} cy={12} r={3}/>
          </svg>
          Preview Public Card
        </a>
      </div>
    </div>
  )
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
function AddEmpModal({ onClose, onAdd, divisions = [] }) {
  const [form, setForm] = useState({ cardName:'', email:'', position:'', division:'', mobile:'', office:'', company:'', address:'', officePhone:'' })
  const [error, setError] = useState('')
  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.cardName) { setError('Name and Email are required.'); return }
    if (!form.email.includes('@')) { setError('Invalid email address.'); return }
    setError(''); onAdd(form); onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Add Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary }}>Manually add a new employee</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}>✕</button>
        </div>
        <div style={{ background: '#f0f7ff', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: C.blue, marginBottom: 16 }}>
          Manually added employees won't be affected by spreadsheet syncs.
        </div>
        {error && <div style={{ background: '#fff0f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff3b30', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Name on Card *</label>
              <input style={inputStyle} value={form.cardName} onChange={e => update('cardName', e.target.value)} placeholder="John Doe" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="john.d@dpointernational.com" type="email" required />
            </div>
            <div>
              <label style={labelStyle}>Position</label>
              <input style={inputStyle} value={form.position} onChange={e => update('position', e.target.value)} placeholder="Manager" />
            </div>
            <div>
              <label style={labelStyle}>Division</label>
              <select style={inputStyle} value={form.division} onChange={e => update('division', e.target.value)}>
                <option value="">Select…</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mobile</label>
              <input style={inputStyle} value={form.mobile} onChange={e => update('mobile', e.target.value)} placeholder="+60…" type="tel" />
            </div>
            <div>
              <label style={labelStyle}>Office</label>
              <input style={inputStyle} value={form.office} onChange={e => update('office', e.target.value)} placeholder="DPO International" />
            </div>
            <div>
              <label style={labelStyle}>Company / Entity</label>
              <input style={inputStyle} value={form.company} onChange={e => update('company', e.target.value)} placeholder="DPO International Sdn. Bhd." />
            </div>
            <div>
              <label style={labelStyle}>Office Phone</label>
              <input style={inputStyle} value={form.officePhone} onChange={e => update('officePhone', e.target.value)} placeholder="+603…" type="tel" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full office address" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', background: '#f5f5f7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '12px 0', background: C.blue, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add Employee</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bulk Edit Modal ───────────────────────────────────────────────────────────
const MAX_PDF_SIZE = 2 * 1024 * 1024

function BulkCbField({ num, btn, onChange }) {
  function handlePdf(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_PDF_SIZE) { alert('PDF must be under 2MB.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = ev => onChange({ ...btn, type: 'pdf', value: ev.target.result, fileName: file.name })
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  return (
    <div style={{ background: '#f9f9fb', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Button {num}</div>
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Label</label>
        <input style={inputStyle} value={btn.label} onChange={e => onChange({ ...btn, label: e.target.value.slice(0, 20) })} placeholder={`e.g. Button ${num}`} maxLength={20} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {['url', 'pdf'].map(t => (
          <button key={t} type="button" onClick={() => onChange({ ...btn, type: t, value: '', fileName: '' })}
            style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: btn.type === t ? C.blue : '#ebebed', color: btn.type === t ? '#fff' : C.textSecondary }}>
            {t === 'url' ? 'Link' : 'PDF'}
          </button>
        ))}
      </div>
      {btn.type === 'url' ? (
        <>
          <label style={labelStyle}>URL</label>
          <input style={inputStyle} value={btn.value} onChange={e => onChange({ ...btn, value: e.target.value })} placeholder="https://…" type="url" />
        </>
      ) : (
        <>
          <label style={labelStyle}>PDF File <span style={{ fontWeight: 400, textTransform: 'none', color: C.textTertiary }}>(max 2MB)</span></label>
          {btn.value ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ fontSize: 12, color: C.textPrimary, flex: 1 }}>{btn.fileName || 'Uploaded PDF'}</span>
              <button type="button" onClick={() => onChange({ ...btn, value: '', fileName: '' })} style={{ fontSize: 12, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Remove</button>
            </div>
          ) : (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#EFF2FF', color: C.blue, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Upload PDF
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdf} />
            </label>
          )}
        </>
      )}
    </div>
  )
}

function BulkEditModal({ count, onClose, onSave }) {
  const [form, setForm] = useState({ address:'', officePhone:'', company:'', website:'' })
  const [cb1, setCb1] = useState({ label:'', type:'url', value:'', fileName:'' })
  const [cb2, setCb2] = useState({ label:'', type:'url', value:'', fileName:'' })
  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave(e) {
    e.preventDefault()
    const fields = {}
    if (form.address.trim()) fields.address = form.address.trim()
    if (form.officePhone.trim()) fields.officePhone = form.officePhone.trim()
    if (form.company.trim()) fields.company = form.company.trim()
    if (form.website.trim()) fields.website = form.website.trim()
    const btn1 = (cb1.label || cb1.value) ? { title: cb1.label, type: cb1.type, value: cb1.value, fileName: cb1.fileName } : null
    const btn2 = (cb2.label || cb2.value) ? { title: cb2.label, type: cb2.type, value: cb2.value, fileName: cb2.fileName } : null
    if (Object.keys(fields).length === 0 && !btn1 && !btn2) { onClose(); return }
    onSave({ fields, cb1: btn1, cb2: btn2 })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Bulk Edit</div>
            <div style={{ fontSize: 13, color: C.textTertiary }}>{count} employee{count !== 1 ? 's' : ''} selected</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}>✕</button>
        </div>
        <div style={{ background: '#fff8ed', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
          Only filled fields will be applied. Blank fields are left as-is for each employee.
        </div>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input style={inputStyle} value={form.company} onChange={e => update('company', e.target.value)} placeholder="Leave blank to keep existing" />
            </div>
            <div>
              <label style={labelStyle}>Office Phone</label>
              <input style={inputStyle} value={form.officePhone} onChange={e => update('officePhone', e.target.value)} placeholder="Leave blank to keep existing" />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://…" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Office Address</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Leave blank to keep existing" />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Custom Buttons (leave blank to keep each employee's existing setting)</div>
          <BulkCbField num={1} btn={cb1} onChange={setCb1} />
          <BulkCbField num={2} btn={cb2} onChange={setCb2} />

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', background: '#f5f5f7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '12px 0', background: C.blue, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply to Selected</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab({ employees, onEdit, onAddEmployee, adminLocks }) {
  const { saveEmployeeAdminOverride, deleteEmployee, lightReSync, hardReSync } = useApp()

  const divisions = [...new Set(employees.map(e => e.division).filter(Boolean))].sort()
  const countries = [...new Set(employees.map(e => e.country).filter(Boolean))].sort()
  const offices = [...new Set(employees.map(e => e.office).filter(Boolean))].sort()
  const all = employees.filter(e => !e.adminOnly)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all
      .filter(e => !q || e.cardName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q))
      .filter(e => !filterDiv || e.division === filterDiv)
      .filter(e => !filterCountry || e.country === filterCountry)
      .filter(e => !filterOffice || e.office === filterOffice)
      .slice(0, 100)
  }, [employees, search, filterDiv, filterCountry, filterOffice])

  const filteredIds = filtered.map(e => e.id)
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(prev => { const n = new Set(prev); filteredIds.forEach(id => n.delete(id)); return n })
    } else {
      setSelected(prev => new Set([...prev, ...filteredIds]))
    }
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleBulkSave({ fields, cb1, cb2 }) {
    [...selected].forEach(id => {
      const emp = employees.find(e => e.id === id)
      if (!emp) return
      const patch = { ...fields }
      if (cb1 || cb2) {
        const existing = [...(emp.customButtons || [])]
        if (cb1) existing[0] = cb1
        if (cb2) existing[1] = cb2
        patch.customButtons = existing.slice(0, 2)
      }
      if (Object.keys(patch).length > 0) saveEmployeeAdminOverride(id, patch)
    })
    setSelected(new Set())
  }

  async function handleDownloadAllQRs() {
    setQrGenerating(true)
    try {
      const [{ default: JSZip }, { default: QRCode }] = await Promise.all([
        import('jszip'), import('qrcode'),
      ])
      const zip = new JSZip()
      const baseUrl = window.location.href.split('#')[0]

      for (const emp of all) {
        const url = `${baseUrl}#/card/${emp.id}`
        const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0048DC', light: '#FFFFFF' } })
        const jpegDataUrl = await new Promise(resolve => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width; canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/jpeg', 0.95))
          }
          img.src = dataUrl
        })
        const base64 = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, '')
        const country = emp.country || 'Unknown'
        const safeName = (emp.cardName || emp.fullName || emp.id)
          .replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, '_')
        zip.folder(country).file(`${safeName}_QR.jpg`, base64, { base64: true })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'QR_Codes.zip'
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(a.href)
    } catch (err) {
      alert('QR generation failed: ' + err.message)
    } finally {
      setQrGenerating(false)
    }
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {showAddModal && <AddEmpModal onClose={() => setShowAddModal(false)} onAdd={onAddEmployee} divisions={divisions} />}
      {showBulkModal && <BulkEditModal count={selected.size} onClose={() => setShowBulkModal(false)} onSave={handleBulkSave} />}
      {showHardResync && (
        <ConfirmModal
          title="⚠️ Hard Re-Sync"
          message="Warning: This will overwrite all employee data with the latest information from the Excel file. All edits made by admins and employees will be permanently lost. Employees no longer in the Excel file will be removed. This cannot be undone. Are you sure you want to proceed?"
          confirmLabel="Yes, Hard Re-Sync"
          confirmStyle={{ background: '#ff3b30' }}
          onClose={() => setShowHardResync(false)}
          onConfirm={() => { hardReSync(); setShowHardResync(false) }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Employee"
          message={`This will permanently delete ${deleteTarget.cardName}'s profile. They can be restored by running a Re-Sync if they still exist in the Excel file. Proceed?`}
          confirmLabel="Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteEmployee(deleteTarget.id); setDeleteTarget(null) }}
        />
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[['Employees', all.length], ['Countries', new Set(all.map(e => e.country)).size], ['Divisions', new Set(all.map(e => e.division)).size], ['Offices', new Set(all.map(e => e.office)).size]].map(([lbl, val]) => (
          <div key={lbl} style={{ background: C.surface, borderRadius: 14, padding: '12px 8px', textAlign: 'center', boxShadow: C.shadow }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{val}</div>
            <div style={{ fontSize: 9, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Action buttons row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setShowAddModal(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '11px 0', background: C.surface, border: `1.5px dashed rgba(0,72,220,0.3)`,
          borderRadius: 12, color: C.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={8.5} cy={7} r={4}/><path d="M20 8v6M23 11h-6"/>
          </svg>
          Add Employee
        </button>
        <button onClick={handleDownloadAllQRs} disabled={qrGenerating} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '11px 0', background: C.surface, border: `1.5px solid ${C.border}`,
          borderRadius: 12, color: qrGenerating ? C.textTertiary : C.textSecondary, fontSize: 13, fontWeight: 600, cursor: qrGenerating ? 'not-allowed' : 'pointer',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/>
            <path d="M14 14h3v3M17 21v-4M21 14v3M21 21h-4"/>
          </svg>
          {qrGenerating ? 'Generating…' : 'Download All QRs'}
        </button>
      </div>

      {/* Export card links */}
      <button onClick={() => {
        const base = `${window.location.origin}${window.location.pathname}`
        const rows = [['Name', 'Public Card Link'], ...all.map(e => [e.cardName || e.id, `${base}#/card/${e.id}`])]
        const ws = XLSX.utils.aoa_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Card Links')
        XLSX.writeFile(wb, 'DPO_Card_Links.xlsx')
      }} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 0', marginBottom: 10,
        background: '#f0f7ff', border: `1px solid #bfdbfe`,
        borderRadius: 12, color: '#1e40af', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Export Card Links
      </button>

      {/* Sync buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { lightReSync() }} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '10px 8px',
          background: '#f0fdf4', border: `1px solid #86efac`,
          borderRadius: 12, color: '#166534', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Light Re-Sync
          </div>
          <span style={{ fontSize: 10, fontWeight: 400, color: '#4ade80', lineHeight: 1.3, textAlign: 'center' }}>
            Fills empty fields only, keeps your edits
          </span>
        </button>
        <button onClick={() => setShowHardResync(true)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '10px 8px',
          background: '#fff1f2', border: `1px solid #fca5a5`,
          borderRadius: 12, color: '#991b1b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Hard Re-Sync
          </div>
          <span style={{ fontSize: 10, fontWeight: 400, color: '#f87171', lineHeight: 1.3, textAlign: 'center' }}>
            Overwrites all Excel fields, clears edits
          </span>
        </button>
      </div>

      {/* Bulk Edit banner */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF2FF', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>{selected.size} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 13, color: C.textTertiary, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            <button onClick={() => setShowBulkModal(true)} style={{ padding: '7px 16px', background: C.blue, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Bulk Edit</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx={11} cy={11} r={8}/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Search by name, email, or position…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <select style={inputStyle} value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={inputStyle} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={inputStyle} value={filterOffice} onChange={e => setFilterOffice(e.target.value)}>
          <option value="">All Offices</option>
          {offices.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 10 }}>Showing {filtered.length} of {all.length}</div>

      {/* Employee list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Select all header */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4, marginBottom: 2 }}>
            <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: C.blue, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: C.textTertiary }}>Select all visible</span>
          </div>
        )}
        {filtered.map(emp => {
          const isSelected = selected.has(emp.id)
          const locked = adminLocks[emp.id] || []
          return (
            <div key={emp.id} style={{
              background: isSelected ? '#f0f4ff' : C.surface,
              borderRadius: 14, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10, boxShadow: C.shadow,
              border: isSelected ? `1.5px solid rgba(0,72,220,0.2)` : '1.5px solid transparent',
            }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(emp.id)} style={{ width: 16, height: 16, accentColor: C.blue, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {emp.photo ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width={18} height={18} viewBox="0 0 24 24" fill={C.blue} opacity={0.5}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</span>
                  {emp.source === 'manual' && <span style={{ fontSize: 9, padding: '1px 6px', background: '#FDE6D6', color: C.orange, borderRadius: 10, fontWeight: 700 }}>MANUAL</span>}
                  {locked.length > 0 && <span style={{ fontSize: 9, padding: '1px 6px', background: '#EFF2FF', color: C.blue, borderRadius: 10, fontWeight: 700 }}>🔒 {locked.length}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textTertiary }}>{emp.position} · {emp.country}</div>
              </div>
              <span style={{ fontSize: 10, padding: '3px 7px', background: '#EFF2FF', color: C.blue, borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{emp.division?.split(' ')[0]}</span>
              <button onClick={() => onEdit(emp)} style={{ padding: '6px 12px', background: C.blue, color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Edit</button>
              <button onClick={() => downloadEmployeeQR(emp)} style={{ padding: '6px 10px', background: '#EFF2FF', color: C.blue, border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>QR</button>
              <button onClick={() => setDeleteTarget(emp)} style={{ padding: '6px 10px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Delete</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Registration Numbers Editor ───────────────────────────────────────────────
function RegNumbersEditor({ settings, setSettings, onSaved }) {
  const regNums = settings.companyRegNumbers || {}
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newRegNo, setNewRegNo] = useState('')

  function save(updated) {
    setSettings(s => ({ ...s, companyRegNumbers: updated }))
    onSaved()
  }
  function startEdit(key) { setEditingKey(key); setEditValue(regNums[key]) }
  function commitEdit() {
    if (!editValue.trim()) return
    save({ ...regNums, [editingKey]: editValue.trim() })
    setEditingKey(null)
  }
  function deleteEntry(key) {
    const updated = { ...regNums }
    delete updated[key]
    save(updated)
  }
  function addNew() {
    if (!newCompany.trim() || !newRegNo.trim()) return
    save({ ...regNums, [newCompany.trim()]: newRegNo.trim() })
    setNewCompany(''); setNewRegNo('')
  }

  return (
    <div>
      {Object.entries(regNums).map(([company, regNo]) => (
        <div key={company} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,0.06)`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>{company}</div>
            {editingKey === company ? (
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingKey(null) }}
                autoFocus
                style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, marginTop: 4, width: '100%' }}
              />
            ) : (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 1 }}>{regNo}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {editingKey === company ? (
              <>
                <button onClick={commitEdit} style={{ padding: '5px 10px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingKey(null)} style={{ padding: '5px 10px', background: '#f5f5f7', color: C.textSecondary, border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(company)} style={{ padding: '5px 10px', background: '#EFF2FF', color: C.blue, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => { if (window.confirm(`Remove registration number for "${company}"?`)) deleteEntry(company) }} style={{ padding: '5px 10px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Delete</button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Add new entry */}
      <div style={{ marginTop: 14, background: '#f9f9fb', borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Add New Company</div>
        <input
          value={newCompany}
          onChange={e => setNewCompany(e.target.value)}
          placeholder="Company name (exact match)"
          style={{ ...inputStyle, fontSize: 13, marginBottom: 6 }}
        />
        <input
          value={newRegNo}
          onChange={e => setNewRegNo(e.target.value)}
          placeholder="Registration number"
          style={{ ...inputStyle, fontSize: 13, marginBottom: 8 }}
        />
        <button
          onClick={addNew}
          disabled={!newCompany.trim() || !newRegNo.trim()}
          style={{
            width: '100%', padding: '9px 0', background: newCompany.trim() && newRegNo.trim() ? C.blue : '#c7c7cc',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: newCompany.trim() && newRegNo.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Add Company
        </button>
      </div>
    </div>
  )
}

// ── Card Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings }) {
  const { uploadExcelDatabase, clearUploadedExcel, uploadedExcelMeta } = useApp()
  const [saved, setSaved] = useState(false)
  const [uploadParsed, setUploadParsed] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [uploadFilename, setUploadFilename] = useState(null)

  async function handleExcelFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFilename(file.name)
    setUploadError(null)
    setUploadParsed(null)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['Listing']
      if (!ws) throw new Error('Sheet named "Listing" not found. Please use the standard Employee Database file.')
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const parsed = data
        .filter(row => row['Email'] && String(row['Email']).includes('@'))
        .map(row => ({
          salutation:  String(row['Salutation'] || '').trim(),
          callingName: String(row['Calling Name'] || '').trim(),
          fullName:    String(row['Full Name'] || '').trim(),
          cardName:    String(row['Name to Appear on Card'] || row['Full Name'] || '').trim(),
          position:    String(row['Position'] || '').trim(),
          division:    String(row['Division'] || '').trim(),
          mobile:      String(row['Mobile Tel'] || '').trim(),
          email:       String(row['Email'] || '').trim().toLowerCase(),
          office:      String(row['Office'] || '').trim(),
          company:     String(row['Company Name/ Legal Entity'] || '').trim(),
          address:     String(row['Address'] || '').replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim(),
          officePhone: String(row['Office Phone Number'] || '').trim(),
        }))
      if (parsed.length === 0) throw new Error('No valid employees found. Check that the file has an "Email" column in the Listing sheet.')
      setUploadParsed(parsed)
    } catch (err) {
      setUploadError(err.message)
    }
    e.target.value = ''
  }

  function handleConfirmUpload() {
    if (!uploadParsed) return
    uploadExcelDatabase(uploadParsed)
    setUploadParsed(null)
    setUploadFilename(null)
  }

  function handleCancelUpload() {
    setUploadParsed(null)
    setUploadError(null)
    setUploadFilename(null)
  }

  function handleFile(key, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setSettings(s => ({ ...s, [key]: ev.target.result })); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    reader.readAsDataURL(file)
  }
  return (
    <div style={{ paddingTop: 12 }}>
      {saved && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#059669', marginBottom: 16 }}>✓ Settings saved</div>}

      {/* Employee Database Upload */}
      <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Employee Database</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 14 }}>Upload a new Employee Database Excel file to refresh all name cards and e-signatures without rebuilding the app.</p>
        {uploadedExcelMeta && !uploadParsed && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Uploaded file active</div>
              <div style={{ fontSize: 12, color: '#4ade80' }}>{uploadedExcelMeta.count} employees · uploaded {new Date(uploadedExcelMeta.uploadedAt).toLocaleDateString()}</div>
            </div>
            <button onClick={clearUploadedExcel} style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              Revert to bundled
            </button>
          </div>
        )}
        {uploadParsed && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
              Ready to apply: {uploadParsed.length} employees found in "{uploadFilename}"
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleConfirmUpload} style={{ flex: 1, padding: '9px 0', background: C.blue, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Apply Upload
              </button>
              <button onClick={handleCancelUpload} style={{ padding: '9px 16px', background: 'none', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 13, color: '#6e6e73', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {uploadError && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#be123c' }}>
            {uploadError}
          </div>
        )}
        <label style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: '#EFF2FF', color: C.blue, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          {uploadedExcelMeta ? 'Replace with new Excel file' : 'Upload Excel (.xlsx)'}
          <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleExcelFileChange} />
        </label>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Company Logo</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>Upload a transparent PNG to override the default logo per region. Reset restores the built-in default.</p>

        {/* English logo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>English (all employees except China)</div>
          <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, minHeight: 80 }}>
            <img src={settings.logoUrlEnglish || dpoLogoEnglishWhite} alt="" style={{ maxHeight: 44, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1, padding: '10px 0', background: '#EFF2FF', color: C.blue, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
              Upload PNG<input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => handleFile('logoUrlEnglish', e)} />
            </label>
            {settings.logoUrlEnglish && <button onClick={() => { setSettings(s => ({ ...s, logoUrlEnglish: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ padding: '10px 14px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>}
          </div>
        </div>

        {/* China logo */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>China</div>
          <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, minHeight: 80 }}>
            {settings.logoUrlChina
              ? <img src={settings.logoUrlChina} alt="" style={{ maxHeight: 44, objectFit: 'contain' }} />
              : <img src={dpoLogoChinaWhite} alt="DPO International" style={{ height: 44, objectFit: 'contain' }} />}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1, padding: '10px 0', background: '#EFF2FF', color: C.blue, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
              Upload PNG<input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => handleFile('logoUrlChina', e)} />
            </label>
            {settings.logoUrlChina && <button onClick={() => { setSettings(s => ({ ...s, logoUrlChina: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ padding: '10px 14px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>}
          </div>
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Header Background</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 14 }}>Applies to all cards globally.</p>
        {settings.backgroundUrl && (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, height: 80, backgroundImage: `linear-gradient(rgba(0,40,131,0.75),rgba(0,40,131,0.75)),url(${settings.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '10px 0', background: '#EFF2FF', color: C.blue, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Upload Image<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile('backgroundUrl', e)} />
          </label>
          {settings.backgroundUrl && <button onClick={() => { setSettings(s => ({ ...s, backgroundUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ padding: '10px 14px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>}
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: 20, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Company Registration Numbers</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 14 }}>
          Shown in parentheses after the company name on e-signatures. Chinese companies use 公司代码 format; all others use Reg. No.
        </p>
        <RegNumbersEditor settings={settings} setSettings={setSettings} onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
      </div>
    </div>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = [2024, 2025, 2026]

function StatsTab({ employees }) {
  const now = new Date()
  const [fromMonth, setFromMonth] = useState(0)
  const [fromYear, setFromYear] = useState(now.getFullYear())
  const [toMonth, setToMonth] = useState(now.getMonth())
  const [toYear, setToYear] = useState(now.getFullYear())

  const allEmp = employees.filter(e => !e.adminOnly)

  function handleExport() {
    const rows = [
      ['Employee Name', 'Division', 'Office', 'Country', 'Total Scans', 'Last Scanned Date'],
      ...allEmp.map(emp => [
        emp.cardName || emp.fullName || '',
        emp.division || '',
        emp.office || '',
        emp.country || '',
        0,
        '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics')
    XLSX.writeFile(wb, `DPO_Analytics_${MONTHS[fromMonth]}${fromYear}_to_${MONTHS[toMonth]}${toYear}.xlsx`)
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Date range filter */}
      <div style={{ background: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 12 }}>Date Range</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ ...inputStyle, flex: 1 }} value={fromMonth} onChange={e => setFromMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select style={{ ...inputStyle, flex: 1 }} value={fromYear} onChange={e => setFromYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 12, color: C.textTertiary, textAlign: 'center' }}>to</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ ...inputStyle, flex: 1 }} value={toMonth} onChange={e => setToMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select style={{ ...inputStyle, flex: 1 }} value={toYear} onChange={e => setToYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleExport} style={{
          width: '100%', padding: '11px 0', background: C.blue, border: 'none',
          borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export to Excel ({allEmp.length} employees)
        </button>
      </div>

      <div style={{ background: '#fff8ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
        Tracking requires server deployment. Export shows all employees with placeholder scan data.
      </div>

      {allEmp.slice(0, 8).map(emp => (
        <div key={emp.id} style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, boxShadow: C.shadow }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</div>
            <div style={{ fontSize: 11, color: C.textTertiary }}>{emp.position}</div>
          </div>
          <div style={{ textAlign: 'right', marginRight: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>—</div>
            <div style={{ fontSize: 10, color: C.textTertiary }}>scans</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Admins Tab ────────────────────────────────────────────────────────────────
function AdminsTab({ admins, setAdmins, employees }) {
  const [newAdmin, setNewAdmin] = useState('')
  function addAdmin() {
    const em = newAdmin.trim().toLowerCase()
    if (!em || admins.includes(em)) return
    if (!employees.find(e => e.email.toLowerCase() === em) && em !== 'info@dpointernational.com') { alert('Employee not found.'); return }
    setAdmins(a => [...a, em]); setNewAdmin('')
  }
  function removeAdmin(email) {
    if (email === 'info@dpointernational.com') return
    setAdmins(a => a.filter(e => e !== email))
  }
  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: C.shadow }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.textPrimary }}>Add Admin</div>
        <select style={{ ...inputStyle, marginBottom: 10 }} value={newAdmin} onChange={e => setNewAdmin(e.target.value)}>
          <option value="">Select employee…</option>
          {employees.filter(e => !admins.includes(e.email.toLowerCase())).map(e => (
            <option key={e.id} value={e.email}>{e.cardName} ({e.email})</option>
          ))}
        </select>
        <button onClick={addAdmin} disabled={!newAdmin} style={{ padding: '10px 20px', background: newAdmin ? C.blue : '#e5e5ea', color: newAdmin ? '#fff' : C.textTertiary, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: newAdmin ? 'pointer' : 'not-allowed' }}>Add Admin</button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, paddingLeft: 4 }}>Current Admins</div>
      {admins.map(email => {
        const emp = employees.find(e => e.email.toLowerCase() === email)
        const isPrimary = email === 'info@dpointernational.com'
        return (
          <div key={email} style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, boxShadow: C.shadow }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp?.cardName || email}</div>
              <div style={{ fontSize: 11, color: C.textTertiary }}>{email}</div>
            </div>
            {isPrimary && <span style={{ fontSize: 10, padding: '3px 10px', background: '#FDE6D6', color: C.orange, borderRadius: 20, fontWeight: 700 }}>Primary</span>}
            {!isPrimary && (
              <button onClick={() => { if (window.confirm(`Remove admin access for ${email}?`)) removeAdmin(email) }}
                style={{ padding: '7px 14px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Admin Shell ───────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, employees, logout, isAdmin, admins, setAdmins, settings, setSettings, saveEmployeeAdminOverride, addManualEmployee, adminLocks } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('employees')
  const [editingEmp, setEditingEmp] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) { navigate('/login'); return null }
  if (!isAdmin(user.email)) { navigate('/dashboard'); return null }

  const divisions = useMemo(
    () => [...new Set(employees.map(e => e.division).filter(Boolean))].sort(),
    [employees]
  )

  function handleLogout() { logout(); navigate('/login') }
  function handleSaveEmp(patch) { saveEmployeeAdminOverride(patch.id, patch) }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>

      {/* Hidden logo SVG for QR canvas rendering */}
      <div style={{ position: 'absolute', left: -9999 }}>
        <img data-logo-png="true" src={dpoLogo} alt="" style={{ height: 36 }} />
      </div>

      {editingEmp && (
        <AdminEmpModal
          emp={editingEmp}
          lockedFields={adminLocks[editingEmp.id] || []}
          divisions={divisions}
          onClose={() => setEditingEmp(null)}
          onSave={handleSaveEmp}
        />
      )}

      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40, backdropFilter: 'blur(2px)' }} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside style={{ width: 280, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: sidebarOpen ? 0 : -280, bottom: 0, zIndex: 50, transition: 'left 0.28s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 12, padding: '10px 14px', display: 'inline-flex', marginBottom: 10 }}>
            <img src={dpoLogo} alt="DPO International" style={{ height: 28, objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.01em', marginBottom: 2 }}>DPO CardShare</div>
          <div style={{ fontSize: 11, color: C.textTertiary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill={C.blue} opacity={0.7}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{user.cardName || 'Admin'}</div>
            <div style={{ fontSize: 12, color: C.textTertiary }}>{user.email}</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {!user.adminOnly && (
            <button onClick={() => { setSidebarOpen(false); navigate('/dashboard') }} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,72,220,0.06)', border: 'none', borderRadius: 12, color: C.blue, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx={12} cy={7} r={4}/>
              </svg>
              My Dashboard
            </button>
          )}
        </nav>
        <div style={{ padding: '10px 10px 24px', borderTop: `1px solid ${C.divider}` }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: 12, color: '#ff3b30', fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 30 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}>
          <svg width={20} height={20} fill="none" stroke={C.textPrimary} strokeWidth={2} strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.02em' }}>Admin Panel</span>
        <div style={{ width: 32 }} />
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div style={{ padding: '0 16px 40px', maxWidth: 700, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {activeTab === 'employees' && <EmployeesTab employees={employees} onEdit={setEditingEmp} onAddEmployee={addManualEmployee} adminLocks={adminLocks} />}
        {activeTab === 'esignatures' && <ESignaturesTab employees={employees} />}
        {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'stats' && <StatsTab employees={employees} />}
        {activeTab === 'admins' && <AdminsTab admins={admins} setAdmins={setAdmins} employees={employees} />}
      </div>
    </div>
  )
}
