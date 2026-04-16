import React, { createContext, useContext, useState, useEffect } from 'react'
import employeesRaw from '../data/employees.json'
import { deriveCountry, getCountryToggles } from '../utils/countryDerive'
import dpoLogoDefault from '../assets/dpo-logo.png'

// Fields that can be synced from Excel — admin edits to these are lockable
const LOCKABLE_FIELDS = [
  'cardName', 'position', 'division', 'mobile', 'email',
  'office', 'company', 'address', 'officePhone', 'website',
]

function buildEmployees() {
  const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
  const deletedIds = JSON.parse(localStorage.getItem('dpo_deleted_ids') || '[]')

  const fromSheet = employeesRaw
    .filter(raw => {
      const id = raw.email.split('@')[0].replace(/\./g, '_')
      return !deletedIds.includes(id)
    })
    .map((raw) => {
      const id = raw.email.split('@')[0].replace(/\./g, '_')
      const country = deriveCountry(raw.office)
      const WA_COUNTRIES = ['Malaysia', 'Indonesia', 'Philippines', 'Sri Lanka', 'Vietnam']
      const waDefault = WA_COUNTRIES.includes(country) && raw.mobile
        ? `https://wa.me/${raw.mobile.replace(/[\s\-()]/g, '').replace(/^\+/, '')}`
        : ''
      const defaults = {
        id,
        cardName: raw.cardName || raw.fullName || '',
        position: raw.position || '',
        division: raw.division || '',
        mobile: raw.mobile || '',
        email: raw.email,
        country,
        office: raw.office || '',
        company: raw.company || '',
        address: raw.address || '',
        officePhone: raw.officePhone || '',
        website: raw.website || '',
        photo: null,
        toggles: getCountryToggles(country),
        social: { whatsapp: waDefault, line: '', wechat: '', linkedin: '' },
        customButtons: [],
        adminOnly: raw.email === 'info@dpointernational.com',
      }
      return { ...defaults, ...(stored[id] || {}) }
    })

  const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
    .filter(emp => !deletedIds.includes(emp.id))
  const manualWithOverrides = manualList.map((emp) => ({ ...emp, ...(stored[emp.id] || {}) }))

  return [...fromSheet, ...manualWithOverrides]
}

const ADMINS_DEFAULT = [
  'info@dpointernational.com',
  'emilio.v@dpointernational.com',
  'batrisyia.b@dpointernational.com',
]

const DEFAULT_PASSWORD = 'dpo12345'

const AppContext = createContext(null)

// Per-user passwords: { "email@lower": "password" }
// If a user has no entry, they use DEFAULT_PASSWORD
function getPasswords() {
  return JSON.parse(localStorage.getItem('dpo_passwords') || '{}')
}
function setPasswordForUser(email, newPassword) {
  const passwords = getPasswords()
  passwords[email.toLowerCase()] = newPassword
  localStorage.setItem('dpo_passwords', JSON.stringify(passwords))
}
function checkPassword(email, password) {
  const passwords = getPasswords()
  const stored = passwords[email.toLowerCase()]
  return password === (stored || DEFAULT_PASSWORD)
}
function resetPasswordToDefault(email) {
  const passwords = getPasswords()
  delete passwords[email.toLowerCase()]
  localStorage.setItem('dpo_passwords', JSON.stringify(passwords))
}

export function AppProvider({ children }) {
  const [employees, setEmployees] = useState(buildEmployees)
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('dpo_session')
    return s ? JSON.parse(s) : null
  })
  const [admins, setAdmins] = useState(() => {
    const s = localStorage.getItem('dpo_admins')
    return s ? JSON.parse(s) : ADMINS_DEFAULT
  })
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('dpo_settings')
    const parsed = s ? JSON.parse(s) : {}
    return {
      logoUrl: parsed.logoUrl ?? dpoLogoDefault,
      backgroundUrl: parsed.backgroundUrl ?? null,
      logoMap: parsed.logoMap ?? {},
    }
  })
  const [adminLocks, setAdminLocks] = useState(() =>
    JSON.parse(localStorage.getItem('dpo_admin_locks') || '{}')
  )

  useEffect(() => { localStorage.setItem('dpo_settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem('dpo_admins', JSON.stringify(admins)) }, [admins])
  useEffect(() => { localStorage.setItem('dpo_admin_locks', JSON.stringify(adminLocks)) }, [adminLocks])

  function saveEmployeeOverride(id, patch) {
    const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
    stored[id] = { ...stored[id], ...patch }
    localStorage.setItem('dpo_emp_overrides', JSON.stringify(stored))
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function saveEmployeeAdminOverride(id, patch) {
    const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
    stored[id] = { ...stored[id], ...patch }
    localStorage.setItem('dpo_emp_overrides', JSON.stringify(stored))
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    // Lock any lockable fields that were edited
    const newLocked = Object.keys(patch).filter(k => LOCKABLE_FIELDS.includes(k))
    if (newLocked.length > 0) {
      setAdminLocks(prev => ({
        ...prev,
        [id]: [...new Set([...(prev[id] || []), ...newLocked])],
      }))
    }
  }

  function deleteEmployee(id) {
    const emp = employees.find(e => e.id === id)
    if (!emp) return
    if (emp.source === 'manual') {
      const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
      localStorage.setItem('dpo_manual_employees', JSON.stringify(manualList.filter(e => e.id !== id)))
    }
    const deletedIds = JSON.parse(localStorage.getItem('dpo_deleted_ids') || '[]')
    const updated = [...deletedIds, id]
    localStorage.setItem('dpo_deleted_ids', JSON.stringify(updated))
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  // ── Light Re-Sync ────────────────────────────────────────────────────────────
  // Adds new employees, fills only empty/null fields from Excel, removes employees
  // no longer in Excel. Never overwrites a field that already has a value.
  function lightReSync() {
    const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
    const deletedIds = JSON.parse(localStorage.getItem('dpo_deleted_ids') || '[]')
    const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
    const manualIds = new Set(manualList.map(e => e.id))
    const excelIds = new Set(employeesRaw.map(raw => raw.email.split('@')[0].replace(/\./g, '_')))

    // Remove Excel employees that are no longer in the Excel file
    const newDeletedIds = [
      ...deletedIds,
      ...Object.keys(stored).filter(id => !manualIds.has(id) && !excelIds.has(id)),
    ]
    const uniqueDeletedIds = [...new Set(newDeletedIds)]
    localStorage.setItem('dpo_deleted_ids', JSON.stringify(uniqueDeletedIds))

    // For each Excel employee, add if new OR fill in only empty fields
    employeesRaw.forEach(raw => {
      const id = raw.email.split('@')[0].replace(/\./g, '_')
      if (uniqueDeletedIds.includes(id)) return // skip explicitly deleted
      const country = deriveCountry(raw.office)
      const WA_COUNTRIES = ['Malaysia', 'Indonesia', 'Philippines', 'Sri Lanka', 'Vietnam']
      const excelValues = {
        cardName: raw.cardName || raw.fullName || '',
        position: raw.position || '',
        division: raw.division || '',
        mobile: raw.mobile || '',
        email: raw.email,
        office: raw.office || '',
        company: raw.company || '',
        address: raw.address || '',
        officePhone: raw.officePhone || '',
        website: raw.website || '',
      }
      const existing = stored[id] || {}
      const updated = { ...existing }
      LOCKABLE_FIELDS.forEach(f => {
        if (!updated[f]) updated[f] = excelValues[f]
      })
      stored[id] = updated
    })

    localStorage.setItem('dpo_emp_overrides', JSON.stringify(stored))
    setEmployees(buildEmployees())
  }

  // ── Hard Re-Sync ─────────────────────────────────────────────────────────────
  // Overwrites all Excel-sourced fields for all employees regardless of edits.
  // Employee-only data (photo, social, toggles, customButtons) is preserved.
  // Adds new employees, removes employees no longer in Excel, clears admin locks.
  function hardReSync() {
    const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
    const deletedIds = JSON.parse(localStorage.getItem('dpo_deleted_ids') || '[]')
    const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
    const manualIds = new Set(manualList.map(e => e.id))
    const excelIds = new Set(employeesRaw.map(raw => raw.email.split('@')[0].replace(/\./g, '_')))

    // Rebuild deleted list: keep manual-employee deletions, remove Excel employees
    // that are no longer in Excel, restore previously deleted Excel employees
    const newDeletedIds = [
      ...deletedIds.filter(id => manualIds.has(id)), // keep manually-deleted manual employees
      ...Object.keys(stored).filter(id => !manualIds.has(id) && !excelIds.has(id)), // remove from Excel
    ]
    const uniqueDeletedIds = [...new Set(newDeletedIds)]
    localStorage.setItem('dpo_deleted_ids', JSON.stringify(uniqueDeletedIds))

    // Overwrite all Excel-sourced fields; preserve employee-only data
    employeesRaw.forEach(raw => {
      const id = raw.email.split('@')[0].replace(/\./g, '_')
      const existing = stored[id] || {}
      stored[id] = {
        // Preserve employee-owned data not in the Excel
        photo: existing.photo || null,
        social: existing.social || { whatsapp: '', line: '', wechat: '', linkedin: '' },
        toggles: existing.toggles || null,
        customButtons: existing.customButtons || [],
        // Overwrite all Excel-sourced fields unconditionally
        cardName: raw.cardName || raw.fullName || '',
        position: raw.position || '',
        division: raw.division || '',
        mobile: raw.mobile || '',
        email: raw.email,
        office: raw.office || '',
        company: raw.company || '',
        address: raw.address || '',
        officePhone: raw.officePhone || '',
        website: raw.website || '',
      }
    })

    localStorage.setItem('dpo_emp_overrides', JSON.stringify(stored))
    localStorage.removeItem('dpo_admin_locks')
    setAdminLocks({})
    setEmployees(buildEmployees())
  }

  function addManualEmployee(formData) {
    const id = formData.email.split('@')[0].replace(/\./g, '_')
    if (employees.find((e) => e.id === id)) {
      alert('An employee with this email already exists.')
      return false
    }
    const country = deriveCountry(formData.office)
    const newEmp = {
      id,
      cardName: formData.cardName || '',
      position: formData.position || '',
      division: formData.division || '',
      mobile: formData.mobile || '',
      email: formData.email,
      country,
      office: formData.office || '',
      company: formData.company || '',
      address: formData.address || '',
      officePhone: formData.officePhone || '',
      website: '',
      photo: null,
      toggles: getCountryToggles(country),
      social: { whatsapp: '', line: '', wechat: '', linkedin: '' },
      customButtons: [],
      adminOnly: false,
      source: 'manual',
    }
    const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
    manualList.push(newEmp)
    localStorage.setItem('dpo_manual_employees', JSON.stringify(manualList))
    setEmployees((prev) => [...prev, newEmp])
    return true
  }

  function login(email, password) {
    if (!checkPassword(email, password)) return false
    const emp = employees.find((e) => e.email.toLowerCase() === email.toLowerCase())
    if (!emp && email.toLowerCase() !== 'info@dpointernational.com') return false
    const sessionUser = emp || { id: 'info_admin', email: 'info@dpointernational.com', cardName: 'DPO Admin', adminOnly: true }
    setUser(sessionUser)
    localStorage.setItem('dpo_session', JSON.stringify(sessionUser))
    return true
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('dpo_session')
  }

  function changePassword(email, currentPass, newPass) {
    if (!checkPassword(email, currentPass)) return { ok: false, error: 'Current password is incorrect.' }
    if (newPass.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    setPasswordForUser(email, newPass)
    return { ok: true }
  }

  function forgotPassword(email) {
    const emp = employees.find(e => e.email.toLowerCase() === email.toLowerCase())
    if (!emp && email.toLowerCase() !== 'info@dpointernational.com') return { ok: false, error: 'Email not found.' }
    resetPasswordToDefault(email)
    // Phase 4: send actual email notification via backend
    return { ok: true }
  }

  function isAdmin(email) {
    return admins.includes((email || '').toLowerCase())
  }

  function getEmployee(id) {
    return employees.find((e) => e.id === id) || null
  }

  return (
    <AppContext.Provider value={{
      employees, user, admins, settings, adminLocks,
      setSettings, setAdmins,
      login, logout, isAdmin, getEmployee,
      changePassword, forgotPassword,
      saveEmployeeOverride, saveEmployeeAdminOverride,
      addManualEmployee, deleteEmployee, lightReSync, hardReSync,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
