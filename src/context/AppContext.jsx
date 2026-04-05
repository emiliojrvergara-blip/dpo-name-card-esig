import React, { createContext, useContext, useState, useEffect } from 'react'
import employeesRaw from '../data/employees.json'
import { deriveCountry, getCountryToggles } from '../utils/countryDerive'

// Seed initial employee records — merge sheet data with stored overrides from localStorage
function buildEmployees() {
  const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
  const fromSheet = employeesRaw.map((raw) => {
    const id = raw.email.split('@')[0].replace(/\./g, '_')
    const country = deriveCountry(raw.office)
    const defaults = {
      id,
      salutation: raw.salutation || '',
      callingName: raw.callingName || '',
      fullName: raw.fullName || '',
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
      photo: null,
      toggles: getCountryToggles(country),
      social: { whatsapp: '', line: '', wechat: '', linkedin: '' },
      customButtons: [],
      adminOnly: raw.email === 'info@dpointernational.com',
    }
    // Merge any user-saved overrides
    return { ...defaults, ...(stored[id] || {}) }
  })
  // Also load manually-added employees from localStorage
  const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
  const manualWithOverrides = manualList.map((emp) => ({ ...emp, ...(stored[emp.id] || {}) }))
  return [...fromSheet, ...manualWithOverrides]
}

const ADMINS_DEFAULT = [
  'info@dpointernational.com',
  'emilio.v@dpointernational.com',
  'batrisyia.b@dpointernational.com',
]

const BLANKET_PASSWORD = 'dpo12345'

const AppContext = createContext(null)

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
    return s ? JSON.parse(s) : { logoUrl: null, backgroundUrl: null, logoMap: {} }
  })

  // Persist settings
  useEffect(() => {
    localStorage.setItem('dpo_settings', JSON.stringify(settings))
  }, [settings])

  // Persist admins list
  useEffect(() => {
    localStorage.setItem('dpo_admins', JSON.stringify(admins))
  }, [admins])

  // Persist employee overrides (only user-editable fields)
  function saveEmployeeOverride(id, patch) {
    const stored = JSON.parse(localStorage.getItem('dpo_emp_overrides') || '{}')
    stored[id] = { ...stored[id], ...patch }
    localStorage.setItem('dpo_emp_overrides', JSON.stringify(stored))
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    )
  }

  // Add a manually-created employee (not from spreadsheet)
  function addManualEmployee(formData) {
    const id = formData.email.split('@')[0].replace(/\./g, '_')
    // Prevent duplicates
    if (employees.find((e) => e.id === id)) {
      alert('An employee with this email already exists.')
      return false
    }
    const country = deriveCountry(formData.office)
    const newEmp = {
      id,
      salutation: '',
      callingName: '',
      fullName: formData.fullName || formData.cardName || '',
      cardName: formData.cardName || formData.fullName || '',
      position: formData.position || '',
      division: formData.division || '',
      mobile: formData.mobile || '',
      email: formData.email,
      country,
      office: formData.office || '',
      company: formData.company || '',
      address: formData.address || '',
      officePhone: formData.officePhone || '',
      photo: null,
      toggles: getCountryToggles(country),
      social: { whatsapp: '', line: '', wechat: '', linkedin: '' },
      customButtons: [],
      adminOnly: false,
      source: 'manual',
    }
    // Persist to localStorage manual employees list
    const manualList = JSON.parse(localStorage.getItem('dpo_manual_employees') || '[]')
    manualList.push(newEmp)
    localStorage.setItem('dpo_manual_employees', JSON.stringify(manualList))
    setEmployees((prev) => [...prev, newEmp])
    return true
  }

  function login(email, password) {
    if (password !== BLANKET_PASSWORD) return false
    const emp = employees.find((e) => e.email.toLowerCase() === email.toLowerCase())
    if (!emp && email.toLowerCase() !== 'info@dpointernational.com') return false

    const sessionUser = emp || {
      id: 'info_admin',
      email: 'info@dpointernational.com',
      cardName: 'DPO Admin',
      adminOnly: true,
    }
    setUser(sessionUser)
    localStorage.setItem('dpo_session', JSON.stringify(sessionUser))
    return true
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('dpo_session')
  }

  function isAdmin(email) {
    return admins.includes((email || '').toLowerCase())
  }

  function getEmployee(id) {
    return employees.find((e) => e.id === id) || null
  }

  return (
    <AppContext.Provider
      value={{
        employees,
        user,
        admins,
        settings,
        setSettings,
        setAdmins,
        login,
        logout,
        isAdmin,
        getEmployee,
        saveEmployeeOverride,
        addManualEmployee,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
