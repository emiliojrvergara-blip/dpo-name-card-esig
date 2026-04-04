// Generate and download a vCard (.vcf) file for an employee
export function downloadVCard(emp) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']

  if (emp.cardName) {
    const parts = emp.cardName.trim().split(' ')
    const last = parts.length > 1 ? parts[parts.length - 1] : ''
    const first = parts.slice(0, parts.length > 1 ? -1 : 1).join(' ')
    lines.push(`N:${last};${first};;;`)
    lines.push(`FN:${emp.cardName}`)
  }

  if (emp.position) lines.push(`TITLE:${emp.position}`)
  if (emp.company) lines.push(`ORG:${emp.company}`)
  if (emp.mobile) lines.push(`TEL;TYPE=CELL:${emp.mobile}`)
  if (emp.officePhone) lines.push(`TEL;TYPE=WORK:${emp.officePhone}`)
  if (emp.email) lines.push(`EMAIL:${emp.email}`)

  if (emp.address) {
    // ADR format: PO box;extended;street;city;state;zip;country
    lines.push(`ADR;TYPE=WORK:;;${emp.address};;;;`)
  }

  lines.push('URL:https://www.dpointernational.com')
  lines.push('URL;TYPE=LinkedIn:https://www.linkedin.com/company/dpointernational/')

  if (emp.photo) {
    // photo is base64 JPEG
    const base64 = emp.photo.replace(/^data:image\/jpeg;base64,/, '')
    lines.push(`PHOTO;ENCODING=BASE64;TYPE=JPEG:${base64}`)
  }

  lines.push('END:VCARD')

  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (emp.cardName || 'contact').replace(/\s+/g, '_')
  a.download = `${safeName}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}
