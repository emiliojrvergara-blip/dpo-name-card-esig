import React from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import DpoLogo from '../assets/DpoLogo'
import { downloadVCard } from '../utils/vcard'

// ── Icons ─────────────────────────────────────────────────────────────────────

function PhoneIcon({ color = '#0048DC' }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.1 12.82a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function EmailIcon({ color = '#0048DC' }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={4} width={20} height={16} rx={2} />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  )
}

function MapPinIcon({ color = '#0048DC' }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  )
}

function GlobeIcon({ color = '#0048DC' }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

function OfficePhoneIcon({ color = '#0048DC' }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={4} width={20} height={16} rx={2} />
      <path d="M2 8h20M12 4v16" />
      <rect x={14} y={10} width={4} height={3} rx={0.5} />
      <rect x={14} y={14.5} width={4} height={3} rx={0.5} />
      <path d="M6 10h4M6 13h4M6 16h4" />
    </svg>
  )
}

function LinkedInIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="10" fill="#0A66C2"/>
      <path fill="#fff" d="M17.5 27.2h9.3v29.7h-9.3V27.2zm4.65-14.9a5.4 5.4 0 110 10.8 5.4 5.4 0 010-10.8zm10.5 14.9h8.9v4.1h.1c1.2-2.3 4.2-4.8 8.7-4.8 9.3 0 11 6.1 11 14.1v16.2h-9.3V42.8c0-3.4-.1-7.8-4.8-7.8-4.8 0-5.5 3.7-5.5 7.6v14.3h-9.3V27.2z"/>
    </svg>
  )
}

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.858L.057 23.214a.75.75 0 00.93.93l5.356-1.475A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.967 0-3.81-.527-5.393-1.443l-.387-.232-4.014 1.107 1.106-4.013-.232-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

function LineIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.631.631 0 01-.629-.629V8.108c0-.345.281-.63.629-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 01-.63.63.624.624 0 01-.515-.268l-2.423-3.317v2.955a.63.63 0 01-.631.63.631.631 0 01-.63-.63V8.108a.63.63 0 01.63-.63.624.624 0 01.515.268l2.423 3.316V8.108a.63.63 0 01.631-.63.631.631 0 01.63.63v4.771zm-5.741 0a.631.631 0 01-.63.63.631.631 0 01-.629-.63V8.108a.63.63 0 01.629-.63.63.63 0 01.63.63v4.771zm-2.466.629H4.917a.631.631 0 01-.63-.629V8.108a.631.631 0 011.261 0v4.141h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

function WeChatIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 00.167-.054l1.903-1.113a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.601-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.137 0 .248-.114.248-.25 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.318 2.187c.537 0 .972.439.972.98a.976.976 0 01-.972.98.976.976 0 01-.972-.98c0-.541.435-.98.972-.98zm6.63 0c.537 0 .972.439.972.98a.976.976 0 01-.972.98.976.976 0 01-.972-.98c0-.541.434-.98.972-.98z" />
    </svg>
  )
}

function DownloadIcon({ color = '#fff', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function LinkIcon({ color = '#fff', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function DocIcon({ color = '#fff', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function SilhouetteIcon() {
  return (
    <svg width={52} height={52} viewBox="0 0 24 24" fill="#c0c8d4">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  )
}

// ── Contact Row ───────────────────────────────────────────────────────────────

function ContactRow({ icon, label, value, href, children }) {
  if (!value && !children) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid #f0f1f5' }}>
      <a
        href={href}
        target={href && !href.startsWith('tel:') && !href.startsWith('mailto:') ? '_blank' : undefined}
        rel="noopener noreferrer"
        style={{
          width: 40, height: 40, borderRadius: 10, background: '#EFF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: href ? 'pointer' : 'default',
        }}
      >
        {icon}
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 2 }}>{label}</div>
        {children || <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', wordBreak: 'break-word' }}>{value}</div>}
      </div>
    </div>
  )
}

// ── Quick Action Button ───────────────────────────────────────────────────────

function QuickBtn({ href, bg, icon, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', maxWidth: 52 }}>{label}</span>
    </a>
  )
}

// ── Geometric accent circles ──────────────────────────────────────────────────

function AccentCircles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,130,50,0.15)' }} />
      <div style={{ position: 'absolute', top: 20, right: 50, width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,130,50,0.10)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,130,50,0.08)' }} />
    </div>
  )
}

// ── Main PublicCard ───────────────────────────────────────────────────────────

export default function PublicCard() {
  const { userId } = useParams()
  const { getEmployee, settings } = useApp()
  const emp = getEmployee(userId)

  if (!emp) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>404</div>
          <div>Card not found</div>
        </div>
      </div>
    )
  }

  // Logo: use logoMap per office/entity, then global logoUrl, then default SVG
  const logoUrl = (settings.logoMap && settings.logoMap[emp.office]) || settings.logoUrl || null

  // Header background
  const headerStyle = settings.backgroundUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,40,131,0.75), rgba(0,40,131,0.75)), url(${settings.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: 'linear-gradient(135deg, #0048DC 0%, #002a83 100%)' }

  // Build quick action buttons
  const quickBtns = []
  if (emp.toggles.whatsapp && emp.social.whatsapp) {
    quickBtns.push(
      <QuickBtn key="wa" href={`https://wa.me/${emp.social.whatsapp.replace(/\D/g, '')}`} bg="#25D366" icon={<WhatsAppIcon />} label="WhatsApp" />
    )
  }
  if (emp.toggles.line && emp.social.line) {
    quickBtns.push(
      <QuickBtn key="line" href={`https://line.me/ti/p/~${emp.social.line}`} bg="#06C755" icon={<LineIcon />} label="Line" />
    )
  }
  if (emp.toggles.wechat && emp.social.wechat) {
    quickBtns.push(
      <QuickBtn key="wc" href={`weixin://dl/chat?${emp.social.wechat}`} bg="#07C160" icon={<WeChatIcon />} label="WeChat" />
    )
  }
  if (emp.toggles.linkedin && emp.social.linkedin) {
    quickBtns.push(
      <QuickBtn key="li" href={emp.social.linkedin} bg="#0A66C2" icon={<LinkedInIcon size={26} />} label="LinkedIn" />
    )
  }
  emp.customButtons.forEach((btn, i) => {
    quickBtns.push(
      <QuickBtn
        key={`cb${i}`}
        href={btn.value}
        bg="#0048DC"
        icon={btn.type === 'file' ? <DocIcon /> : <LinkIcon />}
        label={btn.title}
      />
    )
  })

  // Google Maps link for address
  const mapsHref = emp.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emp.company + ' ' + emp.address)}`
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f1f3f9', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '0 0 40px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <div style={{ position: 'relative', padding: '24px 24px 48px', ...headerStyle }}>
          <AccentCircles />
          <div style={{ position: 'relative', zIndex: 2 }}>
            {logoUrl
              ? <img src={logoUrl} alt="DPO International" style={{ height: 44, objectFit: 'contain', marginBottom: 20 }} />
              : <div style={{ marginBottom: 20 }}><DpoLogo height={44} /></div>
            }
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>{emp.cardName}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)', marginBottom: 3 }}>{emp.position}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{emp.division}</div>
          </div>
        </div>

        {/* ── Photo overlapping header ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -42, marginBottom: 12, position: 'relative', zIndex: 3 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 20,
            border: '3px solid #fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f1f3f9, #e4e8f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {emp.photo
              ? <img src={emp.photo} alt={emp.cardName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <SilhouetteIcon />
            }
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, padding: '0 20px 24px' }}>

          {/* Quick action buttons */}
          {quickBtns.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 20, paddingTop: 4 }}>
              {quickBtns}
            </div>
          )}

          {/* Save Contact button */}
          <button
            onClick={() => downloadVCard(emp)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 0',
              background: 'linear-gradient(135deg, #F58232, #e06b18)',
              border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', marginBottom: 20,
              boxShadow: '0 2px 12px rgba(245,130,50,0.35)',
            }}
          >
            <DownloadIcon />
            Save Contact
          </button>

          {/* Contact rows */}
          <div>
            {emp.mobile && (
              <ContactRow
                icon={<PhoneIcon />}
                label="Mobile"
                value={emp.mobile}
                href={`tel:${emp.mobile.replace(/\s/g, '')}`}
              />
            )}
            {emp.email && (
              <ContactRow
                icon={<EmailIcon />}
                label="Email"
                value={emp.email}
                href={`mailto:${emp.email}`}
              />
            )}
            {emp.address && (
              <ContactRow icon={<MapPinIcon />} label="Office Address" href={mapsHref}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{emp.company}</div>
                  <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2, lineHeight: 1.5 }}>{emp.address}</div>
                </div>
              </ContactRow>
            )}
            {emp.officePhone && (
              <ContactRow
                icon={<PhoneIcon />}
                label="Office Phone"
                value={emp.officePhone}
                href={`tel:${emp.officePhone.replace(/\s/g, '')}`}
              />
            )}
            <ContactRow
              icon={<LinkedInIcon size={22} />}
              label="LinkedIn"
              value="DPO International"
              href="https://www.linkedin.com/company/dpointernational/"
            />
            <ContactRow
              icon={<GlobeIcon />}
              label="Website"
              value="www.dpointernational.com"
              href="https://www.dpointernational.com"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div>
          <div style={{ height: 5, background: 'linear-gradient(90deg, #0048DC, #F58232)' }} />
          <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
            DPO International — A Full-suite Market Enabler for Every Food Business
          </div>
        </div>

      </div>
    </div>
  )
}
