import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'
import { resizePhoto } from '../utils/photoResize'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  blue: '#0048DC',
  orange: '#F58232',
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  textTertiary: '#aeaeb2',
  border: 'rgba(0,0,0,0.08)',
  divider: 'rgba(0,0,0,0.06)',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
}

const TABS = [
  { id: 'employees', label: 'Employees', icon: EmpIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'stats', label: 'Stats', icon: StatsIcon },
  { id: 'admins', label: 'Admins', icon: AdminIcon },
]

// ── Tab Icons ─────────────────────────────────────────────────────────────────
function EmpIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
}
function SettingsIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={3}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
}
function StatsIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
}
function AdminIcon({ active }) {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: 'none', fontSize: 14, outline: 'none',
  background: '#f5f5f7', fontFamily: 'inherit', color: C.textPrimary,
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
}

// ── Top Tab Bar ───────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 6,
      background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 12px 12px',
    }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, maxWidth: 110,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '10px 4px 10px',
            background: active ? 'rgba(0,72,220,0.08)' : 'transparent',
            border: active ? '1.5px solid rgba(0,72,220,0.25)' : '1.5px solid transparent',
            borderRadius: 14,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Icon active={active} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.blue : C.textTertiary }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Employee Edit Modal ───────────────────────────────────────────────────────
function EmpModal({ emp, onClose, onSave }) {
  const [form, setForm] = useState({ ...emp })
  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function updateSocial(key, val) { setForm(f => ({ ...f, social: { ...f.social, [key]: val } })) }
  function updateToggle(key, val) { setForm(f => ({ ...f, toggles: { ...f.toggles, [key]: val } })) }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    update('photo', await resizePhoto(file))
  }

  function handleSave(e) {
    e.preventDefault()
    const finalToggles = { ...form.toggles }
    Object.keys(finalToggles).forEach(k => {
      if (finalToggles[k] && !form.social[k]?.trim()) finalToggles[k] = false
    })
    onSave({ ...form, toggles: finalToggles })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Edit Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary }}>{emp.email}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, overflow: 'hidden', background: '#f1f3f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.photo
                ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={30} height={30} viewBox="0 0 24 24" fill="#c0c8d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              }
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '7px 14px', background: '#EFF2FF', color: C.blue, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </label>
              {form.photo && <button type="button" onClick={() => update('photo', null)} style={{ marginLeft: 8, fontSize: 12, color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[['cardName','Name on Card'],['position','Position'],['division','Division'],['mobile','Mobile']].map(([k,lbl]) => (
              <div key={k}>
                <label style={labelStyle}>{lbl}</label>
                <input style={inputStyle} value={form[k]||''} onChange={e => update(k, e.target.value)} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Social Toggles</div>
            {['whatsapp','line','wechat','linkedin'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ width: 72, fontSize: 12, textTransform: 'capitalize', color: C.textSecondary }}>{k}</label>
                <input type="checkbox" checked={form.toggles[k]} onChange={e => updateToggle(k, e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.social[k]||''} onChange={e => updateSocial(k, e.target.value)} placeholder={k === 'linkedin' ? 'https://linkedin.com/in/...' : k + ' ID'} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', background: '#f5f5f7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textSecondary }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '12px 0', background: C.blue, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
function AddEmpModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    fullName: '', cardName: '', email: '', position: '', division: '',
    mobile: '', office: '', company: '', address: '', officePhone: '',
  })
  const [error, setError] = useState('')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.cardName) { setError('Name and Email are required.'); return }
    if (!form.email.includes('@')) { setError('Invalid email address.'); return }
    setError('')
    onAdd(form)
    onClose()
  }

  const DIVISIONS = ['ADM - Administration','CSM - Customer Service','FDS - Food Service','FNL - Food & Nutrition Lab','FPR - Food Processing','HRM - Human Resources','ICT - Information & Communications Technology','IND - Industry','MKT - Marketing','NBD - New Business Development','RTL - Retail','SCM - Supply Chain Management','SCR - Sourcing']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Add Employee</div>
            <div style={{ fontSize: 13, color: C.textTertiary }}>Manually add a new employee</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary }}>✕</button>
        </div>

        <div style={{ background: '#f0f7ff', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: C.blue, marginBottom: 16 }}>
          Manually added employees won't be affected by spreadsheet syncs. They can be managed independently.
        </div>

        {error && <div style={{ background: '#fff0f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff3b30', marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.fullName} onChange={e => { update('fullName', e.target.value); if (!form.cardName) update('cardName', e.target.value) }} placeholder="John Doe" required />
            </div>
            <div>
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

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab({ employees, onEdit, onAddEmployee }) {
  const [search, setSearch] = useState('')
  const [filterDiv, setFilterDiv] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterOffice, setFilterOffice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const divisions = [...new Set(employees.map(e => e.division).filter(Boolean))].sort()
  const countries = [...new Set(employees.map(e => e.country).filter(Boolean))].sort()
  const offices = [...new Set(employees.map(e => e.office).filter(Boolean))].sort()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees.filter(e => !e.adminOnly)
      .filter(e => !q || e.cardName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q))
      .filter(e => !filterDiv || e.division === filterDiv)
      .filter(e => !filterCountry || e.country === filterCountry)
      .filter(e => !filterOffice || e.office === filterOffice)
      .slice(0, 100)
  }, [employees, search, filterDiv, filterCountry, filterOffice])

  const all = employees.filter(e => !e.adminOnly)

  return (
    <div style={{ paddingTop: 12 }}>
      {showAddModal && <AddEmpModal onClose={() => setShowAddModal(false)} onAdd={onAddEmployee} />}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[['Employees', all.length], ['Countries', new Set(all.map(e => e.country)).size], ['Divisions', new Set(all.map(e => e.division)).size], ['Offices', new Set(all.map(e => e.office)).size]]
          .map(([lbl, val]) => (
            <div key={lbl} style={{ background: C.surface, borderRadius: 14, padding: '12px 8px', textAlign: 'center', boxShadow: C.shadow }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{val}</div>
              <div style={{ fontSize: 9, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
            </div>
          ))}
      </div>

      {/* Add Employee button */}
      <button onClick={() => setShowAddModal(true)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', padding: '12px 0', marginBottom: 12,
        background: C.surface, border: `1.5px dashed rgba(0,72,220,0.3)`, borderRadius: 14,
        color: C.blue, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={8.5} cy={7} r={4}/><path d="M20 8v6M23 11h-6"/>
        </svg>
        Add Employee Manually
      </button>

      {/* Search — full width */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx={11} cy={11} r={8}/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Search by name, email, or position…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* 3 filters in one row */}
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
      <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 12 }}>Showing {filtered.length} of {all.length}</div>

      {/* Employee list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(emp => (
          <div key={emp.id} style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: C.shadow }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {emp.photo
                ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={20} height={20} viewBox="0 0 24 24" fill={C.blue} opacity={0.5}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</span>
                {emp.source === 'manual' && <span style={{ fontSize: 9, padding: '1px 6px', background: '#FDE6D6', color: C.orange, borderRadius: 10, fontWeight: 700 }}>MANUAL</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textTertiary }}>{emp.position} · {emp.country}</div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 8px', background: '#EFF2FF', color: C.blue, borderRadius: 20, fontWeight: 600 }}>{emp.division?.split(' ')[0]}</span>
            <button onClick={() => onEdit(emp)} style={{ padding: '7px 14px', background: C.blue, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings }) {
  const [saved, setSaved] = useState(false)

  function handleFile(key, e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setSettings(s => ({ ...s, [key]: ev.target.result })); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {saved && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#059669', marginBottom: 16 }}>✓ Settings saved</div>}

      <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Company Logo</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 14 }}>Upload transparent PNG for regional branding.</p>
        <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, minHeight: 80 }}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt="" style={{ maxHeight: 44, objectFit: 'contain' }} /> : <DpoLogo height={44} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '10px 0', background: '#EFF2FF', color: C.blue, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Upload PNG<input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => handleFile('logoUrl', e)} />
          </label>
          {settings.logoUrl && <button onClick={() => { setSettings(s => ({ ...s, logoUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ padding: '10px 14px', background: '#fff0f0', color: '#ff3b30', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>}
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: 20, boxShadow: C.shadow }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.textPrimary }}>Header Background</div>
        <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 14 }}>Applies to all cards globally. Dark overlay added for readability.</p>
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
    </div>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ employees }) {
  const topEmps = employees.filter(e => !e.adminOnly).slice(0, 8)
    .map(e => ({ ...e, scans: Math.floor(Math.random() * 120) + 5 })).sort((a, b) => b.scans - a.scans)

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ background: '#fff8ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
        Tracking requires server deployment. Showing placeholder data.
      </div>
      {topEmps.map(emp => (
        <div key={emp.id} style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, boxShadow: C.shadow }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{emp.cardName}</div>
            <div style={{ fontSize: 11, color: C.textTertiary }}>{emp.position}</div>
          </div>
          <div style={{ textAlign: 'right', marginRight: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{emp.scans}</div>
            <div style={{ fontSize: 10, color: C.textTertiary }}>scans</div>
          </div>
          <div style={{ width: 60, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, emp.scans)}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.orange})`, borderRadius: 3 }} />
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
    setAdmins(a => [...a, em])
    setNewAdmin('')
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
        <button onClick={addAdmin} disabled={!newAdmin} style={{
          padding: '10px 20px', background: newAdmin ? C.blue : '#e5e5ea',
          color: newAdmin ? '#fff' : C.textTertiary, border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 600, cursor: newAdmin ? 'pointer' : 'not-allowed',
        }}>Add Admin</button>
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
  const { user, employees, logout, isAdmin, admins, setAdmins, settings, setSettings, saveEmployeeOverride, addManualEmployee } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('employees')
  const [editingEmp, setEditingEmp] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) { navigate('/login'); return null }
  if (!isAdmin(user.email)) { navigate('/dashboard'); return null }

  function handleLogout() { logout(); navigate('/login') }
  function handleSaveEmp(patch) { saveEmployeeOverride(patch.id, patch) }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>

      {editingEmp && <EmpModal emp={editingEmp} onClose={() => setEditingEmp(null)} onSave={handleSaveEmp} />}

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Minimal sidebar */}
      <aside style={{
        width: 280, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -280, bottom: 0,
        zIndex: 50, transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 12, padding: '10px 14px', display: 'inline-flex', marginBottom: 14 }}>
            <DpoLogo height={28} />
          </div>
          <div style={{ fontSize: 12, color: C.textTertiary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill={C.blue} opacity={0.7}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{user.cardName || 'Admin'}</div>
            <div style={{ fontSize: 12, color: C.textTertiary }}>{user.email}</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {!user.adminOnly && (
            <button onClick={() => { setSidebarOpen(false); navigate('/dashboard') }} style={{
              width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(0,72,220,0.06)', border: 'none', borderRadius: 12,
              color: C.blue, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx={12} cy={7} r={4}/>
              </svg>
              My Dashboard
            </button>
          )}
        </nav>

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
        padding: '0 16px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}>
          <svg width={20} height={20} fill="none" stroke={C.textPrimary} strokeWidth={2} strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.02em' }}>Admin Panel</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div style={{ padding: '0 16px 40px', maxWidth: 700, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {activeTab === 'employees' && <EmployeesTab employees={employees} onEdit={setEditingEmp} onAddEmployee={addManualEmployee} />}
        {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'stats' && <StatsTab employees={employees} />}
        {activeTab === 'admins' && <AdminsTab admins={admins} setAdmins={setAdmins} employees={employees} />}
      </div>
    </div>
  )
}
