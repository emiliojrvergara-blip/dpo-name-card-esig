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

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name) {
  return (name || 'signature')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_') || 'signature'
}

/**
 * "ADM - Administration"  →  "Administration Division"
 * "MKT - Marketing"       →  "Marketing Division"
 * If pattern doesn't match, return as-is.
 */
function formatDivision(division) {
  if (!division) return ''
  const match = division.match(/^[A-Z]+ - (.+)$/)
  return match ? `${match[1]} Division` : division
}

/**
 * Split a raw address string into [line2, line3, line4].
 *
 * The database uses ",," as an explicit line-break separator.
 * Any segment still longer than MAX_LINE_CHARS is further split on commas.
 * Final result is packed greedily into 3 lines.
 */
const MAX_LINE_CHARS = 48   // ~1200px at 50px Gotham — safely fits the grey panel

function splitAddressToLines(rawAddress) {
  const text = (rawAddress || '').trim()
  if (!text) return ['', '', '']

  // Step 1: primary split on ,, separators
  let coarseSegments
  if (text.includes(',,')) {
    coarseSegments = text.split(',,').map(s => s.trim()).filter(Boolean)
  } else {
    coarseSegments = [text]
  }

  // Step 2: further split any segment that is still too long
  const segments = []
  for (const seg of coarseSegments) {
    if (seg.length <= MAX_LINE_CHARS) {
      segments.push(seg)
    } else {
      const parts = seg.split(',').map(s => s.trim()).filter(Boolean)
      let current = ''
      for (const part of parts) {
        if (!current) {
          current = part
        } else if ((current + ', ' + part).length <= MAX_LINE_CHARS) {
          current += ', ' + part
        } else {
          segments.push(current)
          current = part
        }
      }
      if (current) segments.push(current)
    }
  }

  // Step 3: pack into exactly 3 lines (greedy, respecting MAX_LINE_CHARS)
  const lines = ['', '', '']
  let li = 0
  for (const seg of segments) {
    if (li >= 2) {
      lines[2] += (lines[2] ? ', ' : '') + seg
    } else if (!lines[li]) {
      lines[li] = seg
    } else if ((lines[li] + ', ' + seg).length <= MAX_LINE_CHARS) {
      lines[li] += ', ' + seg
    } else {
      li++
      lines[li] = seg
    }
  }
  return lines
}

/**
 * Strip the company name from the start of an address string,
 * because many database entries repeat the company as the first line.
 * e.g. "PT. DPO Indonesia,, Jl. MH. Thamrin…" → "Jl. MH. Thamrin…"
 */
function stripCompanyPrefix(address, company) {
  if (!address || !company) return address
  // Normalise both to compare (ignore punctuation, case, parenthesised suffixes)
  const norm = s => s.replace(/[().]/g, '').replace(/\s+/g, ' ').toLowerCase().trim()
  const compNorm = norm(company)
  const addrNorm = norm(address)
  if (compNorm.length > 5 && addrNorm.startsWith(compNorm)) {
    // Skip the same number of original chars as the company string is long
    return address.slice(company.length).replace(/^[\s,]+/, '')
  }
  return address
}

// ── Build the payload sent to the renderer for one employee ─────────────────
function employeeToSignatureInput(emp) {
  const country = deriveCountry(emp.office || '')

  // Parse address into 3 lines (address_line2..4).
  // Strip company prefix first to avoid duplication, since address_line1 = company.
  const cleanAddr = stripCompanyPrefix(emp.address || '', emp.company || '')
  const [addrLine2, addrLine3, addrLine4] = splitAddressToLines(cleanAddr)

  // When an employee has their own address data, unused address slots must be
  // set to a non-empty value so the renderer doesn't fall back to KL HQ defaults.
  // A non-breaking space ( ) is truthy but invisible on the canvas.
  const hasOwnAddress = !!(emp.address || emp.company)
  const blank = hasOwnAddress ? ' ' : ''

  return {
    name:          emp.cardName || emp.name || '',
    position:      emp.position || '',
    division:      formatDivision(emp.division),
    mobile:        emp.mobile || '',
    email:         emp.email || '',
    // Address block — line1 is the company name, lines 2-4 are the street address.
    // Unused lines get a non-breaking space to suppress KL HQ defaults.
    address_line1: emp.company       || blank,
    address_line2: addrLine2         || blank,
    address_line3: addrLine3         || blank,
    address_line4: addrLine4         || blank,
    // Tel: use employee's own number; blank suppresses KL default for non-KL staff
    tel:           emp.officePhone   || blank,
    // Website is always the global DPO site
    website:       'www.dpointernational.com',
    logo:          logoForCountry(country),
    _country:      country,
  }
}

// ── Empty manual form state ─────────────────────────────────────────────────
const EMPTY_MANUAL = {
  name: '', position: '', division: '', mobile: '', email: '', country: 'Malaysia',
}

const COUNTRIES = [
  'Malaysia', 'Indonesia', 'Philippines', 'Thailand',
  'China', 'Hong Kong', 'Sri Lanka', 'Vietnam',
]

// ── Tab component ────────────────────────────────────────────────────────────
export default function ESignaturesTab({ employees }) {
  const activeEmployees = useMemo(
    () => (employees || []).filter(e => !e.deleted),
    [employees]
  )

  // Enrich with country, then reverse so newest-added (last in JSON) appears first
  const enriched = useMemo(
    () => [...activeEmployees]
      .map(e => ({ ...e, _country: e.country || deriveCountry(e.office) }))
      .reverse(),
    [activeEmployees]
  )

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [filterCountry,  setFilterCountry]  = useState('All')
  const [filterCompany,  setFilterCompany]  = useState('All')
  const [filterDivision, setFilterDivision] = useState('All')

  const countries  = useMemo(() => uniqueSorted(enriched.map(e => e._country)), [enriched])
  const companies  = useMemo(() => uniqueSorted(enriched.map(e => e.company)),  [enriched])
  const divisions  = useMemo(() => uniqueSorted(enriched.map(e => e.division)), [enriched])

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

  // ── Selection state ───────────────────────────────────────────────────────
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

  // ── Manual entry form ─────────────────────────────────────────────────────
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState(EMPTY_MANUAL)
  const [manualGenerating, setManualGenerating] = useState(false)
  const [manualError, setManualError] = useState('')

  function setManualField(key, val) {
    setManual(prev => ({ ...prev, [key]: val }))
  }

  const manualValid = manual.name && manual.position && manual.mobile && manual.email

  async function handleManualGenerate() {
    if (!manualValid) return
    setManualGenerating(true)
    setManualError('')
    try {
      const disclaimerBytes = await getDisclaimerBytes()
      const input = {
        name:     manual.name.trim(),
        position: manual.position.trim(),
        division: formatDivision(manual.division.trim()),
        mobile:   manual.mobile.trim(),
        email:    manual.email.trim(),
        logo:     logoForCountry(manual.country),
        _country: manual.country,
      }
      const sigBlob = await renderSignatureBlob(input)
      const docxBlob = await buildSignatureDocxBlob(sigBlob, disclaimerBytes)
      const url = URL.createObjectURL(docxBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slugify(manual.name)}.docx`
      a.click()
      URL.revokeObjectURL(url)
      setManual(EMPTY_MANUAL)
      setShowManual(false)
    } catch (err) {
      setManualError(err.message || String(err))
    } finally {
      setManualGenerating(false)
    }
  }

  // ── Batch generation ──────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, current: '' })
  const [errors, setErrors] = useState([])
  const [doneMessage, setDoneMessage] = useState('')

  async function handleGenerate() {
    const toGenerate = filtered.filter(e => selected.has(e.id || e.cardName))
    if (toGenerate.length === 0) return

    const valid = toGenerate.filter(e => e.cardName && e.position && e.mobile && e.email)
    const skipped = toGenerate.length - valid.length

    if (valid.length === 0) {
      setErrors([`All selected rows are missing required fields (name, position, mobile, email).`])
      return
    }

    setGenerating(true)
    setErrors([])
    setDoneMessage('')
    setProgress({ done: 0, total: valid.length, current: '' })

    const zip = new JSZip()
    const errs = []

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
      await new Promise(r => setTimeout(r, 0))   // yield to UI

      try {
        const input = employeeToSignatureInput(emp)
        const sigBlob = await renderSignatureBlob(input)
        const docxBlob = await buildSignatureDocxBlob(sigBlob, disclaimerBytes)
        const arrBuf = await docxBlob.arrayBuffer()
        zip.file(`${input._country || 'Other'}/${slugify(emp.cardName)}.docx`, arrBuf)
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          E-Signatures
        </h2>
        {/* Manual entry toggle */}
        <button
          onClick={() => { setShowManual(v => !v); setManualError('') }}
          style={{
            padding: '7px 12px', borderRadius: 10, border: `1px solid ${C.border}`,
            background: showManual ? 'rgba(0,72,220,0.08)' : C.surface,
            color: showManual ? C.blue : C.textSecondary,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Manual entry
        </button>
      </div>
      <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 14px' }}>
        Select employees, then generate one Word document (.docx) per person — packaged as a ZIP organised by country.
      </p>

      {/* ── Manual entry form ─────────────────────────────────────────── */}
      {showManual && (
        <div style={{
          background: C.surface, borderRadius: 14, boxShadow: C.shadow,
          padding: 16, marginBottom: 14,
          border: `1.5px solid rgba(0,72,220,0.18)`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 12 }}>
            Generate for someone not in the database
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <LabeledInput label="Full name *"   value={manual.name}     onChange={v => setManualField('name', v)}     placeholder="e.g. Ahmad Razif" />
            <LabeledInput label="Position *"    value={manual.position} onChange={v => setManualField('position', v)} placeholder="e.g. Sales Manager" />
            <LabeledInput label="Division"      value={manual.division} onChange={v => setManualField('division', v)} placeholder="e.g. SCM - Supply Chain…" />
            <LabeledInput label="Mobile *"      value={manual.mobile}   onChange={v => setManualField('mobile', v)}   placeholder="+6012 345 6789" />
            <LabeledInput label="Email *"       value={manual.email}    onChange={v => setManualField('email', v)}    placeholder="name@dpointernational.com" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Country</div>
              <select value={manual.country} onChange={e => setManualField('country', e.target.value)} style={{ ...inputStyle, padding: '7px 8px', fontSize: 13 }}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {manualError && (
            <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{manualError}</div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleManualGenerate}
              disabled={!manualValid || manualGenerating}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: !manualValid || manualGenerating ? '#c7c7cc' : C.blue,
                color: 'white', fontSize: 13, fontWeight: 600,
                cursor: !manualValid || manualGenerating ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {manualGenerating ? 'Generating…' : 'Generate & Download'}
            </button>
            <button
              onClick={() => { setManual(EMPTY_MANUAL); setManualError('') }}
              style={{
                padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                background: '#f5f5f7', color: C.textSecondary,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────── */}
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

      {/* ── Selection bar ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: C.surface, borderRadius: 12,
        boxShadow: C.shadow, marginBottom: 10, gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          <strong style={{ color: C.textPrimary }}>{selectedCount}</strong> selected
          {' · '}
          <strong style={{ color: C.textPrimary }}>{filtered.length}</strong> shown
          {filtered.length !== enriched.length && (
            <span style={{ color: C.textTertiary }}> of {enriched.length}</span>
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

      {/* ── Generate button ───────────────────────────────────────────── */}
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
          : `Generate ${selectedCount > 0 ? selectedCount : ''} e-signature${selectedCount === 1 ? '' : 's'}`}
      </button>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      {generating && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ width: '100%', height: 6, background: '#e5e5ea', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
              height: '100%', background: C.blue, transition: 'width 0.2s',
            }} />
          </div>
          {progress.current && (
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>{progress.current}</div>
          )}
        </div>
      )}

      {/* ── Status messages ────────────────────────────────────────────── */}
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

      {/* ── Employee list (newest first) ───────────────────────────────── */}
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
                  style={{ width: 18, height: 18, cursor: missingData ? 'not-allowed' : 'pointer', accentColor: C.blue, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.cardName || '(no name)'}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.position || '—'} · {formatDivision(emp.division) || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp._country} · {emp.company || '—'}
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

// ── Sub-components ────────────────────────────────────────────────────────────
function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort()
}

const smallBtnStyle = {
  padding: '6px 10px', borderRadius: 8, border: `1px solid rgba(0,0,0,0.08)`,
  background: '#f5f5f7', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', color: '#1d1d1f', fontFamily: 'inherit',
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
        {label}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12, outline: 'none', background: '#f5f5f7', fontFamily: 'inherit', color: '#1d1d1f', boxSizing: 'border-box' }}>
        <option value="All">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, outline: 'none', background: '#f5f5f7', fontFamily: 'inherit', color: '#1d1d1f', boxSizing: 'border-box' }}
      />
    </div>
  )
}
