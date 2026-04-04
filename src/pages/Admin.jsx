import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'
import { resizePhoto } from '../utils/photoResize'

const TABS = [
  { id: 'employees', label: 'Employees' },
  { id: 'settings', label: 'Card Settings' },
  { id: 'stats', label: 'View Stats' },
  { id: 'admins', label: 'Admin Accounts' },
]

const inputStyle = {
  width: '100%', padding: '9px 11px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#fff',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
}

// ── Employee Edit Modal ───────────────────────────────────────────────────────
function EmpModal({ emp, onClose, onSave }) {
  const [form, setForm] = useState({ ...emp })

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })) }
  function updateSocial(key, val) { setForm((f) => ({ ...f, social: { ...f.social, [key]: val } })) }
  function updateToggle(key, val) { setForm((f) => ({ ...f, toggles: { ...f.toggles, [key]: val } })) }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await resizePhoto(file)
    update('photo', dataUrl)
  }

  function handleSave(e) {
    e.preventDefault()
    // Validate toggles
    const finalToggles = { ...form.toggles }
    Object.keys(finalToggles).forEach((k) => {
      if (finalToggles[k] && !form.social[k]?.trim()) finalToggles[k] = false
    })
    onSave({ ...form, toggles: finalToggles })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Edit Employee</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{emp.email}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: '#f1f3f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.photo
                ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={30} height={30} viewBox="0 0 24 24" fill="#c0c8d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              }
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '6px 12px', background: '#EFF2FF', color: '#0048DC', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </label>
              {form.photo && <button type="button" onClick={() => update('photo', null)} style={{ marginLeft: 8, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['cardName', 'Name on Card'],
              ['position', 'Position'],
              ['division', 'Division'],
              ['mobile', 'Mobile'],
            ].map(([k, lbl]) => (
              <div key={k}>
                <label style={labelStyle}>{lbl}</label>
                <input style={inputStyle} value={form[k] || ''} onChange={(e) => update(k, e.target.value)} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Social Toggles</div>
            {['whatsapp', 'line', 'wechat', 'linkedin'].map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ width: 72, fontSize: 12, textTransform: 'capitalize', color: '#374151' }}>{k}</label>
                <input
                  type="checkbox"
                  checked={form.toggles[k]}
                  onChange={(e) => updateToggle(k, e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.social[k] || ''}
                  onChange={(e) => updateSocial(k, e.target.value)}
                  placeholder={k === 'linkedin' ? 'https://linkedin.com/in/...' : k + ' ID'}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 0', background: '#f3f4f6', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '10px 0', background: 'linear-gradient(135deg, #0048DC, #002a83)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab({ employees, onEdit }) {
  const [search, setSearch] = useState('')
  const [filterDiv, setFilterDiv] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterOffice, setFilterOffice] = useState('')

  const divisions = [...new Set(employees.map((e) => e.division).filter(Boolean))].sort()
  const countries = [...new Set(employees.map((e) => e.country).filter(Boolean))].sort()
  const offices = [...new Set(employees.map((e) => e.office).filter(Boolean))].sort()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees
      .filter((e) => !e.adminOnly)
      .filter((e) =>
        !q || e.cardName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q)
      )
      .filter((e) => !filterDiv || e.division === filterDiv)
      .filter((e) => !filterCountry || e.country === filterCountry)
      .filter((e) => !filterOffice || e.office === filterOffice)
      .slice(0, 100)
  }, [employees, search, filterDiv, filterCountry, filterOffice])

  const all = employees.filter((e) => !e.adminOnly)

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Employees', all.length],
          ['Countries', new Set(all.map((e) => e.country)).size],
          ['Divisions', new Set(all.map((e) => e.division)).size],
          ['Offices', new Set(all.map((e) => e.office)).size],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid #f0f1f5' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0048DC' }}>{val}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <input style={inputStyle} placeholder="Search name, email, position…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={inputStyle} value={filterDiv} onChange={(e) => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={inputStyle} value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={inputStyle} value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)}>
          <option value="">All Offices</option>
          {offices.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Showing {filtered.length} of {all.length}</div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((emp) => (
          <div key={emp.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #f0f1f5' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg, #EFF2FF, #dce3ff)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {emp.photo
                ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width={20} height={20} viewBox="0 0 24 24" fill="#0048DC" opacity={0.5}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{emp.cardName}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{emp.position} · {emp.country}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', background: '#EFF2FF', color: '#0048DC', borderRadius: 20, fontWeight: 600 }}>
                {emp.division?.split(' ')[0]}
              </span>
              <button
                onClick={() => onEdit(emp)}
                style={{ padding: '6px 12px', background: '#0048DC', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings }) {
  const logoRef = React.useRef()
  const bgRef = React.useRef()
  const [saved, setSaved] = useState(false)

  async function handleLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setSettings((s) => ({ ...s, logoUrl: ev.target.result }))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    }
    reader.readAsDataURL(file)
  }

  async function handleBg(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setSettings((s) => ({ ...s, backgroundUrl: ev.target.result }))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {saved && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#059669', marginBottom: 16 }}>
          ✓ Settings saved
        </div>
      )}

      {/* Company Logo */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid #f0f1f5' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Company Logo</div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
          Upload a transparent PNG. You can assign different logos per office/entity for regional branding (e.g. China).
        </p>
        {/* Preview */}
        <div style={{ background: 'linear-gradient(135deg, #0048DC, #002a83)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, minHeight: 80 }}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: 44, objectFit: 'contain' }} />
            : <DpoLogo height={44} />
          }
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '9px 0', background: '#EFF2FF', color: '#0048DC', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Upload PNG
            <input ref={logoRef} type="file" accept="image/png" style={{ display: 'none' }} onChange={handleLogo} />
          </label>
          {settings.logoUrl && (
            <button
              onClick={() => { setSettings((s) => ({ ...s, logoUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
              style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Background Image */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #f0f1f5' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Header Background Image</div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
          Applies to ALL cards globally. A dark blue overlay is applied automatically for text readability.
        </p>
        {settings.backgroundUrl && (
          <div style={{
            borderRadius: 12, overflow: 'hidden', marginBottom: 14, height: 80,
            backgroundImage: `linear-gradient(rgba(0,40,131,0.75),rgba(0,40,131,0.75)),url(${settings.backgroundUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, padding: '9px 0', background: '#EFF2FF', color: '#0048DC', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Upload Image
            <input ref={bgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBg} />
          </label>
          {settings.backgroundUrl && (
            <button
              onClick={() => { setSettings((s) => ({ ...s, backgroundUrl: null })); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
              style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stats Tab (placeholder) ───────────────────────────────────────────────────
function StatsTab({ employees }) {
  const topEmps = employees
    .filter((e) => !e.adminOnly)
    .slice(0, 8)
    .map((e) => ({ ...e, scans: Math.floor(Math.random() * 120) + 5 }))
    .sort((a, b) => b.scans - a.scans)

  return (
    <div>
      <div style={{ background: '#fff8ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
        Tracking requires server deployment. Showing placeholder data.
      </div>
      {topEmps.map((emp) => (
        <div key={emp.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #f0f1f5' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{emp.cardName}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{emp.position}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0048DC' }}>{emp.scans}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>scans</div>
          </div>
          <div style={{ width: 80, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, emp.scans)}%`, height: '100%', background: 'linear-gradient(90deg, #0048DC, #F58232)', borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Admin Accounts Tab ────────────────────────────────────────────────────────
function AdminsTab({ admins, setAdmins, employees }) {
  const [newAdmin, setNewAdmin] = useState('')

  function addAdmin() {
    const em = newAdmin.trim().toLowerCase()
    if (!em || admins.includes(em)) return
    const exists = employees.find((e) => e.email.toLowerCase() === em) || em === 'info@dpointernational.com'
    if (!exists) { alert('Employee not found.'); return }
    setAdmins((a) => [...a, em])
    setNewAdmin('')
  }

  function removeAdmin(email) {
    if (email === 'info@dpointernational.com') return
    setAdmins((a) => a.filter((e) => e !== email))
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Add Admin</div>
        <select
          style={{ ...inputStyle, marginBottom: 8 }}
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
        >
          <option value="">Select employee…</option>
          {employees
            .filter((e) => !admins.includes(e.email.toLowerCase()))
            .map((e) => (
              <option key={e.id} value={e.email}>{e.cardName} ({e.email})</option>
            ))
          }
        </select>
        <button
          onClick={addAdmin}
          disabled={!newAdmin}
          style={{ padding: '9px 20px', background: newAdmin ? '#0048DC' : '#e5e7eb', color: newAdmin ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: newAdmin ? 'pointer' : 'not-allowed' }}
        >
          Add Admin
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Current Admins</div>
      {admins.map((email) => {
        const emp = employees.find((e) => e.email.toLowerCase() === email)
        const isPrimary = email === 'info@dpointernational.com'
        return (
          <div key={email} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, border: '1px solid #f0f1f5' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{emp?.cardName || email}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{email}</div>
            </div>
            {isPrimary && <span style={{ fontSize: 10, padding: '2px 8px', background: '#FDE6D6', color: '#F58232', borderRadius: 20, fontWeight: 700 }}>Primary</span>}
            {!isPrimary && (
              <button
                onClick={() => { if (window.confirm(`Remove admin access for ${email}?`)) removeAdmin(email) }}
                style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Admin Shell ───────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, employees, logout, isAdmin, admins, setAdmins, settings, setSettings, saveEmployeeOverride } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('employees')
  const [editingEmp, setEditingEmp] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) { navigate('/login'); return null }
  if (!isAdmin(user.email)) { navigate('/dashboard'); return null }

  function handleLogout() { logout(); navigate('/login') }

  function handleSaveEmp(patch) {
    saveEmployeeOverride(patch.id, patch)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f3f9', display: 'flex' }}>

      {editingEmp && (
        <EmpModal emp={editingEmp} onClose={() => setEditingEmp(null)} onSave={handleSaveEmp} />
      )}

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'linear-gradient(160deg, #0048DC 0%, #002a83 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -240, bottom: 0,
        zIndex: 50, transition: 'left 0.25s ease',
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <DpoLogo height={34} />
          <p style={{ color: 'rgba(147,180,244,0.8)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>Admin Panel</p>
        </div>
        <div style={{ padding: '10px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.cardName || user.email}</div>
          <div style={{ fontSize: 11, color: 'rgba(147,180,244,0.8)', marginTop: 2 }}>{user.email}</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              style={{
                width: '100%', padding: '12px 20px', textAlign: 'left',
                background: activeTab === id ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', color: activeTab === id ? '#fff' : 'rgba(147,180,244,0.8)',
                fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                cursor: 'pointer', borderLeft: activeTab === id ? '3px solid #F58232' : '3px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
          {!user.adminOnly && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'rgba(147,180,244,0.8)', fontSize: 14, cursor: 'pointer', borderLeft: '3px solid transparent' }}
            >
              My Dashboard
            </button>
          )}
        </nav>
        <button onClick={handleLogout} style={{ margin: '0 12px 20px', padding: '10px 0', background: 'transparent', border: 'none', color: 'rgba(147,180,244,0.8)', fontSize: 13, cursor: 'pointer' }}>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f1f5', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width={22} height={22} fill="none" stroke="#333" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </span>
          <div style={{ width: 30 }} />
        </div>

        <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
          {activeTab === 'employees' && <EmployeesTab employees={employees} onEdit={setEditingEmp} />}
          {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
          {activeTab === 'stats' && <StatsTab employees={employees} />}
          {activeTab === 'admins' && <AdminsTab admins={admins} setAdmins={setAdmins} employees={employees} />}
        </div>
      </main>
    </div>
  )
}
