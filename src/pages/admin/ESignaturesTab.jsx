import React, { useState, useMemo, useCallback } from 'react'
import JSZip from 'jszip'
import { deriveCountry } from '../../utils/countryDerive'
import { logoForCountry } from '../../utils/esigConfig'
import { renderSignatureBlob, getDisclaimerBytes } from '../../utils/signatureRenderer'
import { buildSignatureDocxBlob } from '../../utils/createSignatureDocx'

// ── Design tokens (matching Admin.jsx) ───────────────────────────────────────
const C = {
  bg: '#f5f5f7', surface: '#ffffff', blue: '#0048DC', orange: '#F58232',
  textPrimary: '#1d1d1f', textSecondary: '#6e6e73', textTertiary: '#aeaeb2',
  border: 'rgba(0,0,0,0.08)', divider: 'rgba(0,0,0,0.06)',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
  success: '#34c759', danger: '#ff3b30',
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, outline: 'none',
  background: '#f5f5f7', fontFamily: 'inherit', color: C.textPrimary,
  boxSizing: 'border-box',
}

// ── Filename helper ──────────────────────────────────────────────────────────
function slugify(name) {
  return (name || 'signature')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_') || 'signature'
}

// Strip Sdn./Bhd./Pte./Ltd. for shorter filter labels
function shortCompany(company) {
  if (!company) return '—'
  return company
}

// ── Build the payload sent to the renderer for one employee ─────────────────
function employeeToSignatureInput(emp) {
  const country = deriveCountry(emp.office)
  return {
    name:     emp.cardName,
    position: emp.position || '',
    division: emp.division || '',
    mobile:   emp.mobile || '',
    email:    emp.email || '',
    logo:     logoForCountry(country),
    // address_line1..4, tel, website all fall through to KL HQ defaults
    // (which is correct for every employee per the original Python tool).
    _country: country,
  }
}

// ── Tab component ────────────────────────────────────────────────────────────
export default function ESignaturesTab({ employees }) {
  const activeEmployees = useMemo(
    () => (employees || []).filter(e => !e.deleted),
    [employees]
  )

  // Enrich each row once with country (derived from office)
  const enriched = useMemo(
    () => activeEmployees.map(e => ({ ...e, _country: deriveCountry(e.office) })),
    [activeEmployees]
  )

  // ── Filter UI state ──────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [filterCountry,  setFilterCountry]  = useState('All')
  const [filterCompany,  setFilterCompany]  = useState('All')
  const [filterDivision, setFilterDivision] = useState('All')

  const countries  = useMemo(() => uniqueSorted(enriched.map(e => e._country)),  [enriched])
  const companies  = useMemo(() => uniqueSorted(enriched.map(e => e.company)),   [enriched])
  const divisions  = useMemo(() => uniqueSorted(enriched.map(e => e.division)),  [enriched])

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    return enriched.filter(e => {
      if (filterCountry  !== 'All' && e._country !== filterCountry)  return false
      if (filterCompany  !== 'All' && e.company  !== filterCompany)  return false
      if (filterDivision !== 'All' && e.division !== filterDivision) return false
      if (q) {
        const hay = `${e.cardName || ''} ${e.fullName || ''} ${e.email || ''} ${e.position || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [enriched, searchQ, filterCountry, filterCompany, filterDivision])

  // ── Selection state (Set of employee ids) ────────────────────────────────
  const [selected, setSelected] = useState(() => new Set())

  const filteredIds = useMemo(() => filtered.map(e => e.id || e.cardName), [filtered])
  const allFilteredSelected =
    filtered.length > 0 && filteredIds.every(id => selected.has(id))

  const toggleOne = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleAllVisible = useCallback(() => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) filteredIds.forEach(id => next.delete(id))
      else filteredIds.forEach(id => next.add(id))
      return next
    })
  }, [filteredIds, allFilteredSelected])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // ── Generation ────────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, current: '' })
  const [errors, setErrors] = useState([])
  const [doneMessage, setDoneMessage] = useState('')

  async function handleGenerate() {
    const toGenerate = filtered.filter(e => selected.has(e.id || e.cardName))
    if (toGenerate.length === 0) return

    // Skip rows missing required data
    const valid = toGenerate.filter(e => e.cardName && e.position && e.mobile && e.email)
    const skipped = toGenerate.length - valid.length

    if (valid.length === 0) {
      setErrors([`All ${toGenerate.length} selected rows are missing required fields (name, position, mobile, email).`])
      return
    }

    setGenerating(true)
    setErrors([])
    setDoneMessage('')
    setProgress({ done: 0, total: valid.length, current: '' })

    const zip = new JSZip()
    const errs = []

    // Pre-fetch disclaimer once
    let disclaimerBytes
    try {
      disclaimerBytes = await getDisclaimerBytes()
    } catch (err) {
      setErrors([`Failed to load disclaimer image: ${err.message}`])
      setGenerating(false)
      return
    }

    for (let i = 0; i < valid.length; i++) {
      const emp = valid[i]
      setProgress({ done: i, total: valid.length, current: emp.cardName })
      // Yield to the UI so the progress bar updates
      await new Promise(r => setTimeout(r, 0))

      try {
        const input = employeeToSignatureInput(emp)
        const sigBlob = await renderSignatureBlob(input)
        const docxBlob = await buildSignatureDocxBlob(sigBlob, disclaimerBytes)
        const arrBuf = await docxBlob.arrayBuffer()
        const folder = input._country || 'Other'
        const filename = `${folder}/${slugify(emp.cardName)}.docx`
        zip.file(filename, arrBuf)
      } catch (err) {
        errs.push(`${emp.cardName}: ${err.message || err}`)
      }
    }

    if (errs.length) zip.file('ERRORS.txt', errs.join('\n'))

    setProgress({ done: valid.length, total: valid.length, current: 'Packaging ZIP…' })

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'DPO_E-Signatures.zip'
    a.click()
    URL.revokeObjectURL(url)

    setGenerating(false)
    setErrors(errs)
    setDoneMessage(
      `Generated ${valid.length - errs.length} of ${valid.length} signature(s).` +
      (skipped ? ` Skipped ${skipped} row(s) with missing required fields.` : '')
    )
  }

  const selectedCount = selected.size
  const visibleSelectedCount = filteredIds.filter(id => selected.has(id)).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        E-Signatures
      </h2>
      <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 18px' }}>
        Select employees, then generate one Word document (.docx) per person — packaged as a ZIP organised by country.
      </p>

      {/* Filters */}
      <div style={{ background: C.surface, borderRadius: 14, boxShadow: C.shadow, padding: 14, marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Search by name, email, position…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <FilterSelect label="Country"  value={filterCountry}  onChange={setFilterCountry}  options={countries} />
          <FilterSelect label="Company"  value={filterCompany}  onChange={setFilterCompany}  options={companies} />
          <FilterSelect label="Division" value={filterDivision} onChange={setFilterDivision} options={divisions} />
        </div>
      </div>

      {/* Selection bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.surface, borderRadius: 12,
        boxShadow: C.shadow, marginBottom: 10, gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          <strong style={{ color: C.textPrimary }}>{selectedCount}</strong> of <strong style={{ color: C.textPrimary }}>{filtered.length}</strong> selected
          {filtered.length !== enriched.length && (
            <span style={{ color: C.textTertiary }}> (filtered from {enriched.length})</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={toggleAllVisible} style={smallBtnStyle}>
            {allFilteredSelected ? 'Clear visible' : 'Select all visible'}
          </button>
          {selectedCount > 0 && (
            <button onClick={clearSelection} style={{ ...smallBtnStyle, color: C.danger }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || selectedCount === 0}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
          background: generating || selectedCount === 0 ? '#c7c7cc' : C.blue,
          color: 'white', fontSize: 15, fontWeight: 600,
          cursor: generating || selectedCount === 0 ? 'not-allowed' : 'pointer',
          marginBottom: 14, fontFamily: 'inherit',
        }}
      >
        {generating
          ? `Generating ${progress.done} / ${progress.total}…`
          : `Generate ${selectedCount} e-signature${selectedCount === 1 ? '' : 's'}`}
      </button>

      {/* Progress bar */}
      {generating && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ width: '100%', height: 6, background: '#e5e5ea', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
              height: '100%', background: C.blue, transition: 'width 0.2s',
            }} />
          </div>
          {progress.current && (
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>
              {progress.current}
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {doneMessage && (
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 12,
          background: errors.length ? '#fff4e6' : '#e8f8ec',
          color: errors.length ? '#b25400' : '#0f6b2e', fontSize: 13,
        }}>
          {doneMessage}
        </div>
      )}
      {errors.length > 0 && (
        <details style={{ marginBottom: 14, fontSize: 12, color: C.textSecondary }}>
          <summary style={{ cursor: 'pointer', color: C.danger, fontWeight: 600 }}>
            {errors.length} error(s) — click to view
          </summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
      )}

      {/* Employee list */}
      <div style={{ background: C.surface, borderRadius: 14, boxShadow: C.shadow, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: C.textTertiary, fontSize: 14 }}>
            No employees match the current filters.
          </div>
        ) : (
          filtered.map((emp, idx) => {
            const id = emp.id || emp.cardName
            const isSel = selected.has(id)
            const missingData = !emp.cardName || !emp.position || !emp.mobile || !emp.email
            return (
              <div
                key={id}
                onClick={() => !missingData && toggleOne(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderTop: idx === 0 ? 'none' : `1px solid ${C.divider}`,
                  cursor: missingData ? 'not-allowed' : 'pointer',
                  opacity: missingData ? 0.45 : 1,
                  background: isSel ? 'rgba(0,72,220,0.04)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  disabled={missingData}
                  onChange={() => toggleOne(id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 18, height: 18, cursor: missingData ? 'not-allowed' : 'pointer', accentColor: C.blue }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.cardName || '(no name)'}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.position || '—'} · {emp.division || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp._country} · {shortCompany(emp.company)}
                  </div>
                  {missingData && (
                    <div style={{ fontSize: 11, color: C.danger, marginTop: 2 }}>
                      Missing required fields (name / position / mobile / email)
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort()
}

const smallBtnStyle = {
  padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
  background: '#f5f5f7', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', color: C.textPrimary, fontFamily: 'inherit',
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 600, color: C.textTertiary,
        textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3,
      }}>
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }}
      >
        <option value="All">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
