// Render a DPO e-signature on an HTML5 canvas at 3751x1042 (300 DPI).
// Returns a JPEG Blob ready to embed in a .docx file.
//
// This is a faithful port of the Python tool's render_signature.py — same
// coordinates, same fonts, same colours.

import {
  PAGE_SIZE, COLORS, FONTS, FIELDS, DEFAULTS,
  TEMPLATE_PATHS, FONT_FILES,
} from './esigConfig'

// ── Mixed-font helpers (China employees only) ─────────────────────────────────
// Chinese characters → PingFang SC; Latin / numbers / punctuation → Gotham.

// CJK Unified Ideographs + Extension A + CJK Symbols & Punctuation + Fullwidth forms
const CJK_RE = /[　-〿㐀-䶿一-鿿＀-￯]/

// Map field.font → PingFang variant (semibold for name, regular for body/label)
const PINGFANG = { name: 'PingFangSemibold', body: 'PingFangRegular', label: 'PingFangRegular' }

// Address fields use PingFang SC for ALL characters (including Latin/numbers)
const CHINA_PINGFANG_ONLY = new Set(['address_line1', 'address_line2', 'address_line3', 'address_line4'])

// Name field: scale Chinese chars so their visual height matches Gotham cap height,
// and shift y down so baselines align with the Latin text beside them.
// PingFang fills ~88% of its em; Gotham caps sit at ~71% → scale ≈ 0.71/0.88 ≈ 0.81
const CHINA_NAME_CN_SCALE   = 0.82   // Chinese size = nameSize × this  (tweak if needed)
const CHINA_NAME_CN_Y_OFFS  = 7      // px — nudge down to align baseline (tweak if needed)

/** Split a string into [{str, isChinese}, …] alternating CJK / non-CJK segments. */
function splitMixed(text) {
  const segs = []
  let cur = '', curCn = null
  for (const ch of String(text)) {
    const isCn = CJK_RE.test(ch)
    if (curCn === null) curCn = isCn
    if (isCn !== curCn) { segs.push({ str: cur, isChinese: curCn }); cur = ch; curCn = isCn }
    else cur += ch
  }
  if (cur) segs.push({ str: cur, isChinese: curCn ?? false })
  return segs
}

/**
 * Draw text with per-character font switching:
 * CJK chars → PingFang, everything else → Gotham.
 * cnSizeScale and cnYOffset let callers shrink Chinese chars and nudge their
 * baseline to match the Latin text alongside (used for the name field).
 */
function fillMixedText(ctx, text, x, y, fieldFont, size, cnSizeScale = 1, cnYOffset = 0) {
  const segs = splitMixed(text)
  let cx = x
  for (const { str, isChinese } of segs) {
    const family   = isChinese ? PINGFANG[fieldFont] : FONTS[fieldFont]
    const drawSize = isChinese ? Math.round(size * cnSizeScale) : size
    const drawY    = isChinese ? y + cnYOffset : y
    ctx.font = `${drawSize}px "${family}"`
    ctx.fillText(str, cx, drawY)
    // Always measure at the segment's actual rendered size for correct x advance
    cx += ctx.measureText(str).width
  }
}

// ── Resource caches (load each asset only once per session) ──────────────────

let fontsReadyPromise = null
const templateCache = {}  // { english: HTMLImageElement, china: ... }
let disclaimerImgCache = null

async function ensureFontsLoaded() {
  if (fontsReadyPromise) return fontsReadyPromise

  fontsReadyPromise = (async () => {
    for (const { family, url } of FONT_FILES) {
      // FontFace works with .otf in all modern browsers (Chrome, Edge, Safari, Firefox)
      const face = new FontFace(family, `url(${url})`)
      await face.load()
      document.fonts.add(face)
    }
    await document.fonts.ready
  })()

  return fontsReadyPromise
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function getTemplate(variant) {
  if (templateCache[variant]) return templateCache[variant]
  const img = await loadImage(TEMPLATE_PATHS[variant])
  templateCache[variant] = img
  return img
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render an employee's e-signature.
 *
 * @param {object} employee - keys: name, position, division, mobile, email,
 *   address_line1..4 (optional), tel (optional), website (optional), logo
 *   ('english' | 'china')
 * @returns {Promise<Blob>} JPEG blob (quality 0.95)
 */
export async function renderSignatureBlob(employee) {
  await ensureFontsLoaded()

  const variant = (employee.logo === 'china') ? 'china' : 'english'
  const template = await getTemplate(variant)

  const canvas = document.createElement('canvas')
  canvas.width  = PAGE_SIZE.width
  canvas.height = PAGE_SIZE.height
  const ctx = canvas.getContext('2d')

  // 1. Background template
  ctx.drawImage(template, 0, 0, PAGE_SIZE.width, PAGE_SIZE.height)

  // 2. Text fields
  const isChina = employee.logo === 'china'

  ctx.textBaseline = 'top'  // matches Pillow anchor='lt'
  ctx.textAlign = 'left'

  for (const [fieldKey, field] of Object.entries(FIELDS)) {
    const text = field.text != null
      ? field.text
      : (employee[fieldKey] || DEFAULTS[fieldKey] || '')
    if (!text) continue

    ctx.fillStyle = COLORS[field.color]

    if (isChina && fieldKey !== 'website') {
      if (CHINA_PINGFANG_ONLY.has(fieldKey)) {
        // Address lines: entire text in PingFang Regular (no Gotham switching)
        ctx.font = `${field.size}px "PingFangRegular"`
        ctx.fillText(String(text), field.x, field.y)
      } else {
        // All other fields: CJK → PingFang SC, Latin/numbers → Gotham
        // Name field: also scale Chinese size + offset y to match Latin cap height
        const cnScale  = fieldKey === 'name' ? CHINA_NAME_CN_SCALE  : 1
        const cnYOffs  = fieldKey === 'name' ? CHINA_NAME_CN_Y_OFFS : 0
        fillMixedText(ctx, String(text), field.x, field.y, field.font, field.size, cnScale, cnYOffs)
      }
    } else {
      // Non-China employees, or the website field: always pure Gotham
      ctx.font = `${field.size}px "${FONTS[field.font]}"`
      ctx.fillText(String(text), field.x, field.y)
    }
  }

  // 3. Canvas → JPEG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
      'image/jpeg',
      0.95,
    )
  })
}

/**
 * Fetch the disclaimer image as an ArrayBuffer (for embedding in docx).
 * Cached for the session.
 */
export async function getDisclaimerBytes() {
  if (disclaimerImgCache) return disclaimerImgCache
  const res = await fetch('/esig/disclaimer.jpg')
  if (!res.ok) throw new Error('Failed to load disclaimer.jpg')
  disclaimerImgCache = await res.arrayBuffer()
  return disclaimerImgCache
}
