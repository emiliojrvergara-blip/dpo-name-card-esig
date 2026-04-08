import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import dpoLogo from '../assets/dpo-logo.png'
import { resizePhoto } from '../utils/photoResize'
import * as XLSX from 'xlsx'
import { downloadEmployeeQR } from '../utils/qrDownload'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  blue: '#0048DC',
  orange: '#F58232',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const SIDEBAR_W = 240

const DIVISIONS = [
  'ADM - Administration', 'CSM - Consumer', 'FDS - Foodservice',
  'FNL - Finance & Legal', 'FPR - Food Processing', 'HRM - Human Resources Management',
  'ICT - Information & Communication Technology', 'IND - Industry', 'MKT - Marketing',
  'NBD - New Business Development', 'RTL - Retail', 'SCM - Supply Chain Management',
  'SCR - Scientific & Regulatory Affairs',
]

const NAV_ITEMS = [
  { id: 'employees', label: 'Employees' },
  { id: 'settings', label: 'Settings' },
  { id: 'stats', label: 'Stats' },
  { id: 'admins', label: 'Admins' },
]

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 6,
  border: `1px solid ${C.border}`, fontSize: 14, outline: 'none',
  background: '#fff', fontFamily: 'inherit', color: C.textPrimary,
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.textSecondary, marginBottom: 4,
}

// ── Lock indicator ────────────────────────────────────────────────────────────
function FieldLock({ locked }) {
  if (!locked) return null
  return <span title="Admin-locked: excluded from Excel sync" style={{ marginLeft: 4, fontSize: 10, color: C.blue }}>🔒</span>
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmStyle = {}, onClose, onConfirm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>{title}</div>
        <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff', background: '#ef4444', ...confirmStyle }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Employee Edit Modal ─────────────────────────────────────────────────
function AdminEmpModal({ emp, lockedFields = [], onClose, onSave }) {
  const [form, setForm] = useState({ ...emp })
  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function updateSocial(key, val) { setForm(f => ({ ...f, social: { ...f.social, [key]: val } })) }
  function updateToggle(key, val) { setForm(f => ({ ...f, toggles: { ...f.toggles, [key]: val } })) }
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

  const sectionHead = (text) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 20 }}>{text}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', marginBottom: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Edit Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary, marginTop: 2 }}>{emp.email}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, flexShrink: 0 }}>✕</button>
        </div>

        {lockedFields.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.blue, marginBottom: 16 }}>
            🔒 {lockedFields.length} field{lockedFields.length !== 1 ? 's are' : ' is'} admin-locked and excluded from Excel sync.
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 4 }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={28} height={28} viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '7px 14px', background: '#eff6ff', color: C.blue, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid #bfdbfe` }}>
                Upload Photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </label>
              {form.photo && <button type="button" onClick={() => update('photo', null)} style={{ marginLeft: 8, fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Remove</button>}
            </div>
          </div>

          {sectionHead('Identity')}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name on Card <FieldLock locked={lockedFields.includes('cardName')} /></label>
            <input style={inputStyle} value={form.cardName || ''} onChange={e => update('cardName', e.target.value)} />
          </div>

          {sectionHead('Professional')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Position <FieldLock locked={lockedFields.includes('position')} /></label>
              <input style={inputStyle} value={form.position || ''} onChange={e => update('position', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Division <FieldLock locked={lockedFields.includes('division')} /></label>
              <select style={inputStyle} value={form.division || ''} onChange={e => update('division', e.target.value)}>
                <option value="">Select…</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {sectionHead('Contact')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Mobile <FieldLock locked={lockedFields.includes('mobile')} /></label>
              <input style={inputStyle} value={form.mobile || ''} onChange={e => update('mobile', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email <FieldLock locked={lockedFields.includes('email')} /></label>
              <input style={inputStyle} value={form.email || ''} onChange={e => update('email', e.target.value)} type="email" />
            </div>
          </div>

          {/* Company Info — Admin section */}
          <div style={{ background: '#f0f7ff', borderRadius: 8, border: '1px solid #bfdbfe', padding: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Company Info — Admin Controlled</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Office <FieldLock locked={lockedFields.includes('office')} /></label>
                <input style={inputStyle} value={form.office || ''} onChange={e => update('office', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Company Name <FieldLock locked={lockedFields.includes('company')} /></label>
                <input style={inputStyle} value={form.company || ''} onChange={e => update('company', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Office Phone <FieldLock locked={lockedFields.includes('officePhone')} /></label>
                <input style={inputStyle} value={form.officePhone || ''} onChange={e => update('officePhone', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Website <FieldLock locked={lockedFields.includes('website')} /></label>
                <input style={inputStyle} value={form.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://…" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address <FieldLock locked={lockedFields.includes('address')} /></label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={form.address || ''} onChange={e => update('address', e.target.value)} />
              </div>
            </div>
          </div>

          {sectionHead('Social Links')}
          <div style={{ marginBottom: 20 }}>
            {['whatsapp', 'line', 'wechat', 'linkedin'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <label style={{ width: 70, fontSize: 13, textTransform: 'capitalize', color: C.textSecondary, flexShrink: 0 }}>{k}</label>
                <input type="checkbox" checked={form.toggles[k]} onChange={e => updateToggle(k, e.target.checked)} style={{ width: 15, height: 15, accentColor: C.blue, flexShrink: 0 }} />
                <input style={{ ...inputStyle }} value={form.social[k] || ''} onChange={e => updateSocial(k, e.target.value)} placeholder={k === 'linkedin' ? 'https://linkedin.com/in/…' : k + ' ID'} />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 14, textAlign: 'center' }}>
            All edited fields will be admin-locked and excluded from Excel sync.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 0', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '10px 0', background: C.blue, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
function AddEmpModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ cardName: '', email: '', position: '', division: '', mobile: '', office: '', company: '', address: '', officePhone: '' })
  const [error, setError] = useState('')
  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.cardName) { setError('Name and Email are required.'); return }
    if (!form.email.includes('@')) { setError('Invalid email address.'); return }
    setError(''); onAdd(form); onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Add Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Manually add a new employee</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.blue, marginBottom: 16 }}>
          Manually added employees won't be affected by spreadsheet syncs.
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
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
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 0', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '10px 0', background: C.blue, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Add Employee</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bulk Edit Modal ───────────────────────────────────────────────────────────
function BulkEditModal({ count, onClose, onSave }) {
  const [form, setForm] = useState({ address: '', officePhone: '', company: '', website: '', cb1Label: '', cb1Url: '', cb2Label: '', cb2Url: '' })
  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave(e) {
    e.preventDefault()
    const fields = {}
    if (form.address.trim()) fields.address = form.address.trim()
    if (form.officePhone.trim()) fields.officePhone = form.officePhone.trim()
    if (form.company.trim()) fields.company = form.company.trim()
    if (form.website.trim()) fields.website = form.website.trim()
    const cb1 = (form.cb1Label || form.cb1Url) ? { label: form.cb1Label, url: form.cb1Url } : null
    const cb2 = (form.cb2Label || form.cb2Url) ? { label: form.cb2Label, url: form.cb2Url } : null
    if (Object.keys(fields).length === 0 && !cb1 && !cb2) { onClose(); return }
    onSave({ fields, cb1, cb2 })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Bulk Edit</div>
            <div style={{ fontSize: 13, color: C.textTertiary, marginTop: 2 }}>{count} employee{count !== 1 ? 's' : ''} selected</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
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

          <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Custom Buttons (leave blank to keep each employee's existing setting)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Button 1 Label</label>
              <input style={inputStyle} value={form.cb1Label} onChange={e => update('cb1Label', e.target.value)} placeholder="e.g. Visit Website" />
            </div>
            <div>
              <label style={labelStyle}>Button 1 URL</label>
              <input style={inputStyle} value={form.cb1Url} onChange={e => update('cb1Url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label style={labelStyle}>Button 2 Label</label>
              <input style={inputStyle} value={form.cb2Label} onChange={e => update('cb2Label', e.target.value)} placeholder="e.g. Product Catalogue" />
            </div>
            <div>
              <label style={labelStyle}>Button 2 URL</label>
              <input style={inputStyle} value={form.cb2Url} onChange={e => update('cb2Url', e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 0', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '10px 0', background: C.blue, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Apply to Selected</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab({ employees, onEdit, onAddEmployee, adminLocks }) {
  const { saveEmployeeAdminOverride, deleteEmployee, fullReSync } = useApp()
  const [search, setSearch] = useState('')
  const [filterDiv, setFilterDiv] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterOffice, setFilterOffice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showResync, setShowResync] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [qrGenerating, setQrGenerating] = useState(false)

  const all = employees.filter(e => !e.adminOnly)
  const divisions = [...new Set(all.map(e => e.division).filter(Boolean))].sort()
  const countries = [...new Set(all.map(e => e.country).filter(Boolean))].sort()
  const offices = [...new Set(all.map(e => e.office).filter(Boolean))].sort()

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
        patch.customButtons = existing
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
        const safeName = (emp.cardName || emp.id).replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, '_')
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

  const statItems = [
    ['Employees', all.length],
    ['Countries', new Set(all.map(e => e.country)).size],
    ['Divisions', new Set(all.map(e => e.division)).size],
    ['Offices', new Set(all.map(e => e.office)).size],
  ]

  return (
    <div>
      {showAddModal && <AddEmpModal onClose={() => setShowAddModal(false)} onAdd={onAddEmployee} />}
      {showBulkModal && <BulkEditModal count={selected.size} onClose={() => setShowBulkModal(false)} onSave={handleBulkSave} />}
      {showResync && (
        <ConfirmModal
          title="Re-Sync from Excel"
          message="This will overwrite all admin-edited fields for all employees with data from the Excel file. This cannot be undone. Proceed?"
          confirmLabel="Re-Sync"
          confirmStyle={{ background: '#f59e0b' }}
          onClose={() => setShowResync(false)}
          onConfirm={() => { fullReSync(); setShowResync(false) }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Employee"
          message={`This will permanently delete ${deleteTarget.cardName}'s profile and cannot be undone. Proceed?`}
          confirmLabel="Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteEmployee(deleteTarget.id); setDeleteTarget(null) }}
        />
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {statItems.map(([lbl, val]) => (
          <div key={lbl} style={{ background: C.surface, borderRadius: 8, padding: '16px 12px', textAlign: 'center', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.blue, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: C.surface, border: `1px dashed ${C.blue}`,
          borderRadius: 8, color: C.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={8.5} cy={7} r={4}/><path d="M20 8v6M23 11h-6"/>
          </svg>
          Add Employee
        </button>
        <button onClick={handleDownloadAllQRs} disabled={qrGenerating} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, color: qrGenerating ? C.textTertiary : C.textSecondary, fontSize: 13, fontWeight: 500, cursor: qrGenerating ? 'not-allowed' : 'pointer',
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/>
            <path d="M14 14h3v3M17 21v-4M21 14v3M21 21h-4"/>
          </svg>
          {qrGenerating ? 'Generating…' : 'Download All QRs'}
        </button>
        <button onClick={() => setShowResync(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: '#fffbeb', border: `1px solid #fde68a`,
          borderRadius: 8, color: '#92400e', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Re-Sync from Excel
        </button>
      </div>

      {/* Bulk Edit banner */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>{selected.size} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 13, color: C.textTertiary, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            <button onClick={() => setShowBulkModal(true)} style={{ padding: '6px 16px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Bulk Edit</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx={11} cy={11} r={8}/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search by name, email, or position…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
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

      <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 10 }}>Showing {filtered.length} of {all.length} employees</div>

      {/* Select all header */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4, marginBottom: 6 }}>
          <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ width: 15, height: 15, accentColor: C.blue, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: C.textTertiary }}>Select all visible</span>
        </div>
      )}

      {/* Employee list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(emp => {
          const isSelected = selected.has(emp.id)
          const locked = adminLocks[emp.id] || []
          return (
            <div key={emp.id} style={{
              background: isSelected ? '#eff6ff' : C.surface,
              borderRadius: 8, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              border: isSelected ? `1px solid #bfdbfe` : `1px solid ${C.border}`,
              transition: 'all 0.1s',
            }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(emp.id)} style={{ width: 15, height: 15, accentColor: C.blue, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {emp.photo
                  ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width={18} height={18} viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</span>
                  {emp.source === 'manual' && <span style={{ fontSize: 10, padding: '1px 6px', background: '#fff7ed', color: C.orange, borderRadius: 4, fontWeight: 700, border: '1px solid #fed7aa' }}>MANUAL</span>}
                  {locked.length > 0 && <span style={{ fontSize: 10, padding: '1px 6px', background: '#eff6ff', color: C.blue, borderRadius: 4, fontWeight: 700, border: '1px solid #bfdbfe' }}>🔒 {locked.length}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>{emp.position}{emp.position && emp.country ? ' · ' : ''}{emp.country}</div>
              </div>
              {emp.division && (
                <span style={{ fontSize: 10, padding: '3px 8px', background: '#f1f5f9', color: C.textSecondary, borderRadius: 4, fontWeight: 600, flexShrink: 0, border: `1px solid ${C.border}` }}>{emp.division?.split(' ')[0]}</span>
              )}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => onEdit(emp)} style={{ padding: '5px 12px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => downloadEmployeeQR(emp)} style={{ padding: '5px 10px', background: '#eff6ff', color: C.blue, border: `1px solid #bfdbfe`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>QR</button>
                <button onClick={() => setDeleteTarget(emp)} style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: `1px solid #fecaca`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Del</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings }) {
  const [saved, setSaved] = useState(false)
  function handleFile(key, e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setSettings(s => ({ ...s, [key]: ev.target.result })); setSaved(true); setTimeout(() => setSaved(false), 2500) }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 16 }}>
          ✓ Settings saved
        </div>
      )}

      {/* Company Logo */}
      <div style={{ background: C.surface, borderRadius: 8, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.textPrimary }}>Company Logo</div>
        <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>Upload transparent PNG for regional branding.</p>
        <div style={{ background: `linear-gradient(135deg, ${C.blue}, #002a83)`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, minHeight: 72 }}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="" style={{ maxHeight: 40, objectFit: 'contain' }} />
            : <img src={dpoLogo} alt="DPO International" style={{ height: 32, objectFit: 'contain' }} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '9px 0', background: '#eff6ff', color: C.blue, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: `1px solid #bfdbfe` }}>
            Upload PNG<input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => handleFile('logoUrl', e)} />
          </label>
          {settings.logoUrl && (
            <button onClick={() => { setSettings(s => ({ ...s, logoUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2500) }}
              style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: `1px solid #fecaca`, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
          )}
        </div>
      </div>

      {/* Header Background */}
      <div style={{ background: C.surface, borderRadius: 8, padding: 20, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.textPrimary }}>Header Background</div>
        <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>Applies to all public cards globally.</p>
        {settings.backgroundUrl && (
          <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 14, height: 72, backgroundImage: `linear-gradient(rgba(0,40,131,0.75),rgba(0,40,131,0.75)),url(${settings.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '9px 0', background: '#eff6ff', color: C.blue, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: `1px solid #bfdbfe` }}>
            Upload Image<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile('backgroundUrl', e)} />
          </label>
          {settings.backgroundUrl && (
            <button onClick={() => { setSettings(s => ({ ...s, backgroundUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2500) }}
              style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: `1px solid #fecaca`, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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
      ...allEmp.map(emp => [emp.cardName || '', emp.division || '', emp.office || '', emp.country || '', 0, '']),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics')
    XLSX.writeFile(wb, `DPO_Analytics_${MONTHS[fromMonth]}${fromYear}_to_${MONTHS[toMonth]}${toYear}.xlsx`)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ background: C.surface, borderRadius: 8, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 14 }}>Date Range</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ ...inputStyle, flex: 1 }} value={fromMonth} onChange={e => setFromMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select style={{ ...inputStyle, flex: 1 }} value={fromYear} onChange={e => setFromYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 13, color: C.textTertiary, textAlign: 'center' }}>to</span>
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
          width: '100%', padding: '10px 0', background: C.blue, border: 'none',
          borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export to Excel ({allEmp.length} employees)
        </button>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
        Scan tracking requires server deployment (Phase 4). Export currently shows placeholder data.
      </div>

      {allEmp.slice(0, 8).map(emp => (
        <div key={emp.id} style={{ background: C.surface, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, border: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</div>
            <div style={{ fontSize: 11, color: C.textTertiary }}>{emp.position}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.textTertiary }}>—</div>
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
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: C.surface, borderRadius: 8, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.textPrimary }}>Add Admin</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={{ ...inputStyle, flex: 1 }} value={newAdmin} onChange={e => setNewAdmin(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.filter(e => !admins.includes(e.email.toLowerCase())).map(e => (
              <option key={e.id} value={e.email}>{e.cardName} ({e.email})</option>
            ))}
          </select>
          <button onClick={addAdmin} disabled={!newAdmin} style={{
            padding: '9px 18px', background: newAdmin ? C.blue : '#e2e8f0',
            color: newAdmin ? '#fff' : C.textTertiary, border: 'none', borderRadius: 6,
            fontSize: 14, fontWeight: 600, cursor: newAdmin ? 'pointer' : 'not-allowed', flexShrink: 0,
          }}>Add</button>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Current Admins</div>
      {admins.map(email => {
        const emp = employees.find(e => e.email.toLowerCase() === email)
        const isPrimary = email === 'info@dpointernational.com'
        return (
          <div key={email} style={{ background: C.surface, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, border: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp?.cardName || email}</div>
              <div style={{ fontSize: 12, color: C.textTertiary }}>{email}</div>
            </div>
            {isPrimary && <span style={{ fontSize: 10, padding: '3px 8px', background: '#fff7ed', color: C.orange, borderRadius: 4, fontWeight: 700, border: '1px solid #fed7aa' }}>Primary</span>}
            {!isPrimary && (
              <button onClick={() => { if (window.confirm(`Remove admin access for ${email}?`)) removeAdmin(email) }}
                style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: `1px solid #fecaca`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
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

  if (!user) { navigate('/login'); return null }
  if (!isAdmin(user.email)) { navigate('/dashboard'); return null }

  function handleLogout() { logout(); navigate('/login') }
  function handleSaveEmp(patch) { saveEmployeeAdminOverride(patch.id, patch) }

  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif" }}>

      {/* Hidden PNG logo for QR canvas rendering */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <img data-logo-png="true" src={dpoLogo} alt="" style={{ height: 36 }} />
      </div>

      {editingEmp && (
        <AdminEmpModal
          emp={editingEmp}
          lockedFields={adminLocks[editingEmp.id] || []}
          onClose={() => setEditingEmp(null)}
          onSave={handleSaveEmp}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: SIDEBAR_W, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ background: C.blue, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={dpoLogo} alt="DPO International" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        {/* User info */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.cardName || 'Admin'}</div>
          <div style={{ fontSize: 11, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user.email}</div>
          <div style={{ fontSize: 10, padding: '2px 8px', background: '#eff6ff', color: C.blue, borderRadius: 4, display: 'inline-block', marginTop: 6, fontWeight: 600, border: `1px solid #bfdbfe` }}>Administrator</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {!user.adminOnly && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px' }}>Account</div>
              <button onClick={() => navigate('/dashboard')} style={{
                width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
                background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
                color: C.textSecondary, fontSize: 14, fontWeight: 400, textAlign: 'left', marginBottom: 4,
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx={12} cy={7} r={4}/>
                </svg>
                My Dashboard
              </button>
            </>
          )}
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px', marginTop: user.adminOnly ? 0 : 4 }}>Management</div>
          {NAV_ITEMS.map(({ id, label }) => {
            const active = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center',
                background: active ? '#eff6ff' : 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                color: active ? C.blue : C.textSecondary,
                fontSize: 14, fontWeight: active ? 600 : 400, textAlign: 'left',
                marginBottom: 2, transition: 'all 0.1s',
              }}>
                {label}
              </button>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '8px 8px 16px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
            color: '#dc2626', fontSize: 14, fontWeight: 400, textAlign: 'left',
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 24px',
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{activeLabel}</h1>
        </div>

        {/* Content */}
        <div style={{ padding: 24, flex: 1 }}>
          {activeTab === 'employees' && <EmployeesTab employees={employees} onEdit={setEditingEmp} onAddEmployee={addManualEmployee} adminLocks={adminLocks} />}
          {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
          {activeTab === 'stats' && <StatsTab employees={employees} />}
          {activeTab === 'admins' && <AdminsTab admins={admins} setAdmins={setAdmins} employees={employees} />}
        </div>
      </div>
    </div>
  )
}
