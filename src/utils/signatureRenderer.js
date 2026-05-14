// Render a DPO e-signature on an HTML5 canvas at 3751x1042 (300 DPI).
// Returns a JPEG Blob ready to embed in a .docx file.
//
// This is a faithful port of the Python tool's render_signature.py — same
// coordinates, same fonts, same colours.

import {
  PAGE_SIZE, COLORS, FONTS, FONTS_CHINA, FIELDS, DEFAULTS,
  TEMPLATE_PATHS, FONT_FILES,
} from './esigConfig'

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
  // China employees use PingFang SC; all others use Gotham
  const fontMap = (employee.logo === 'china') ? FONTS_CHINA : FONTS

  ctx.textBaseline = 'top'  // matches Pillow anchor='lt'
  ctx.textAlign = 'left'

  for (const [fieldKey, field] of Object.entries(FIELDS)) {
    const text = field.text != null
      ? field.text
      : (employee[fieldKey] || DEFAULTS[fieldKey] || '')
    if (!text) continue

    ctx.font = `${field.size}px "${fontMap[field.font]}"`
    ctx.fillStyle = COLORS[field.color]
    ctx.fillText(String(text), field.x, field.y)
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
