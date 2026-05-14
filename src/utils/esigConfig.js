// E-signature layout config — ported from the Python tool's layout.json + defaults.yaml.
// Canvas is 3751x1042 (300 DPI). All field y-values are the TOP of the text box
// (Canvas `textBaseline = 'top'`, which matches Pillow's anchor='lt').

export const PAGE_SIZE = { width: 3751, height: 1042 }
export const DPI = 300

export const COLORS = {
  name: 'rgb(0, 71, 219)',
  body: 'rgb(0, 0, 0)',
}

// Font family names used here MUST match the @font-face declarations
// loaded by signatureRenderer.js
export const FONTS = {
  name:  'GothamBold',
  body:  'GothamMedium',
  label: 'GothamBold',
}

export const FIELDS = {
  name:          { x: 869,  y: 138, size: 90, font: 'name',  color: 'name' },
  position:      { x: 869,  y: 233, size: 50, font: 'body',  color: 'body' },
  division:      { x: 869,  y: 295, size: 50, font: 'body',  color: 'body' },
  mobile_label:  { x: 869,  y: 367, size: 50, font: 'label', color: 'body', text: 'M' },
  mobile:        { x: 924,  y: 367, size: 50, font: 'body',  color: 'body' },
  email_label:   { x: 1450, y: 367, size: 50, font: 'label', color: 'body', text: 'E' },
  email:         { x: 1506, y: 367, size: 50, font: 'body',  color: 'body' },
  address_line1: { x: 869,  y: 495, size: 50, font: 'body',  color: 'body' },
  address_line2: { x: 869,  y: 562, size: 50, font: 'body',  color: 'body' },
  address_line3: { x: 869,  y: 628, size: 50, font: 'body',  color: 'body' },
  address_line4: { x: 869,  y: 695, size: 50, font: 'body',  color: 'body' },
  tel_label:     { x: 869,  y: 763, size: 50, font: 'label', color: 'body', text: 'T' },
  tel:           { x: 906,  y: 763, size: 50, font: 'body',  color: 'body' },
  website:       { x: 869,  y: 916, size: 50, font: 'body',  color: 'body' },
}

// KL HQ defaults — used when an employee row doesn't specify these fields.
// (Mirrors the Python tool's defaults.yaml exactly.)
export const DEFAULTS = {
  address_line1: 'DPO International Sdn. Bhd. (Reg. No: 677120 – X)',
  address_line2: 'DPO House, B2-G, Lorong Selangor,',
  address_line3: 'Pusat Komersial Gaya, Pusat Bandar Melawati,',
  address_line4: '53100 Kuala Lumpur, Malaysia.',
  tel: '+603 4108 1282',
  website: 'www.dpointernational.com',
  logo: 'english',
}

// Public paths (served from /public)
export const TEMPLATE_PATHS = {
  english: '/esig/template_english.png',
  china:   '/esig/template_china.png',
}
export const DISCLAIMER_PATH = '/esig/disclaimer.jpg'

export const FONT_FILES = [
  { family: 'GothamBold',      url: '/fonts/Gotham-Bold.otf'      },
  { family: 'GothamMedium',    url: '/fonts/Gotham-Medium.otf'    },
  { family: 'PingFangHeavy',   url: '/fonts/PingFang-Heavy.ttf'   },
  { family: 'PingFangRegular', url: '/fonts/PingFang-Regular.ttf' },
]

// Font mapping for China employees — PingFang for name/body, Gotham for short labels (M/E/T)
export const FONTS_CHINA = {
  name:  'PingFangHeavy',
  body:  'PingFangRegular',
  label: 'GothamBold',
}

// Default registration numbers per company legal entity.
// Admin can override / add entries via the Settings tab (stored in localStorage).
export const COMPANY_REG_DEFAULTS = {
  'DPO International Sdn. Bhd.':    '677120-X',
  'DPO Malaysia Sdn. Bhd.':         '502497-U',
  'DPO Malaysia FMCG Sdn. Bhd.':    '1292160-A',
  'PT. DPO Indonesia':               '8120001850294',
  'DPO Philippines Inc.':            'A200116688',
  'DPO (Thailand) Ltd.':             '0105544001757',
  'DPO Lanka (Private) Limited':     'W/98797',
  'DPO Viet Nam Company Limited':    '0314666506',
  '北京德毕欧贸易有限公司':             '91110105322176535H',
}

/**
 * Format a registration number suffix for display.
 * Chinese company names use Chinese-style parentheses + 公司代码 label.
 * All others use "(Reg. No: XXXX)".
 */
export function formatRegNo(companyName, regNumbers) {
  const regNo = (regNumbers || {})[companyName]
  if (!regNo) return ''
  const isChinese = /[一-鿿]/.test(companyName)
  return isChinese ? ` （公司代码：${regNo}）` : ` (Reg. No: ${regNo})`
}

// Pick logo variant by country (China only = china logo, all else including HK = english)
export function logoForCountry(country) {
  return country === 'China' ? 'china' : 'english'
}
