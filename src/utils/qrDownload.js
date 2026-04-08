import QRCode from 'qrcode'

const BLUE = '#0048DC'
const CARD_W = 480
const CARD_H = 640
const MARGIN = 40
const BORDER_RADIUS = 24
const HEADER_H = 100
const QR_SIZE = 240

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawLogoFallback(ctx, x, y) {
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('dpo', x + CARD_W / 2, y + 52)
  ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('INTERNATIONAL', x + CARD_W / 2, y + 70)
}

export async function downloadEmployeeQR(emp) {
  const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${emp.id}`

  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    width: QR_SIZE, margin: 1,
    color: { dark: BLUE, light: '#FFFFFF' },
  })

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W + MARGIN * 2
  canvas.height = CARD_H + MARGIN * 2
  const ctx = canvas.getContext('2d')
  const x = MARGIN, y = MARGIN

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Card border
  ctx.strokeStyle = BLUE
  ctx.lineWidth = 2.5
  roundRect(ctx, x, y, CARD_W, CARD_H, BORDER_RADIUS)
  ctx.stroke()

  // Blue header (clipped to card shape)
  ctx.save()
  roundRect(ctx, x, y, CARD_W, CARD_H, BORDER_RADIUS)
  ctx.clip()
  ctx.fillStyle = BLUE
  ctx.fillRect(x, y, CARD_W, HEADER_H)
  ctx.restore()

  // Logo — try hidden PNG element first, fall back to text
  const logoPngEl = document.querySelector('[data-logo-png]')
  if (logoPngEl) {
    await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const logoH = 36
        const logoW = img.naturalWidth * (logoH / img.naturalHeight)
        ctx.drawImage(img, x + (CARD_W - logoW) / 2, y + (HEADER_H - logoH) / 2, logoW, logoH)
        resolve()
      }
      img.onerror = () => { drawLogoFallback(ctx, x, y); resolve() }
      img.src = logoPngEl.src
    })
  } else {
    drawLogoFallback(ctx, x, y)
  }

  // "Scan for my Digital Business Card"
  ctx.fillStyle = '#1d1d1f'
  ctx.textAlign = 'center'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('Scan for my', x + CARD_W / 2, y + HEADER_H + 52)
  ctx.fillText('Digital Business Card', x + CARD_W / 2, y + HEADER_H + 82)

  // QR code + name
  await new Promise((resolve) => {
    const qrImg = new Image()
    qrImg.onload = () => {
      const qrX = x + (CARD_W - QR_SIZE) / 2
      const qrY = y + HEADER_H + 108
      ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE)

      ctx.fillStyle = '#1d1d1f'
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(emp.cardName || '', x + CARD_W / 2, qrY + QR_SIZE + 50)

      const a = document.createElement('a')
      a.download = `${(emp.cardName || emp.id).replace(/\s+/g, '_')}_QR.png`
      a.href = canvas.toDataURL('image/png')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      resolve()
    }
    qrImg.src = qrDataUrl
  })
}
