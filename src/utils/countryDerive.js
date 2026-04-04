// Derive country from Office field (the Google Sheet's Country column is broken)
export function deriveCountry(office) {
  if (!office) return 'Malaysia'
  const o = office.toLowerCase()
  if (o.includes('china') || o.includes('wfoe')) return 'China'
  if (o.includes('hong kong')) return 'Hong Kong'
  if (o.includes('indonesia')) return 'Indonesia'
  if (o.includes('philippines')) return 'Philippines'
  if (o.includes('thailand')) return 'Thailand'
  if (o.includes('vietnam') || o.includes('viet nam')) return 'Vietnam'
  if (o.includes('lanka')) return 'Sri Lanka'
  // "DPO International" or "Malaysia" in office → Malaysia
  return 'Malaysia'
}

// Default messaging toggle presets by country
export function getCountryToggles(country) {
  const whatsappCountries = ['Malaysia', 'Indonesia', 'Philippines', 'Sri Lanka', 'Vietnam', 'Hong Kong']
  return {
    whatsapp: whatsappCountries.includes(country),
    line: country === 'Thailand',
    wechat: country === 'China',
    linkedin: false,
  }
}
