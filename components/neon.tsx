/* 全站统一霓虹视觉组件：发光圆框 + 线条图标
   设计规范：卡片圆角16px · 输入框10px · 大按钮14px · 中按钮12px · 小按钮8px */

export const GLOW = "drop-shadow(0 0 5px #00ff8899)";

export function NeonRing({ children, size = 64 }: { children: React.ReactNode; size?: number }) {
  return (
    <div
      className="flex items-center justify-center mx-auto"
      style={{ width: size, height: size, borderRadius: "50%", border: "1.5px solid #00ff8866", background: "#00ff880d", boxShadow: "0 0 18px #00ff8822, inset 0 0 12px #00ff8811", flexShrink: 0 }}
    >
      {children}
    </div>
  )
}

const svgProps = { fill: "none", stroke: "#00ff88", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: { filter: GLOW } };

export const IconHeartPulse = (
  <svg width="30" height="30" viewBox="0 0 24 24" {...svgProps}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.3a5 5 0 1 1 7.5 6.3Z" />
    <path d="M4 13h3l1.5-3 2.5 5 2-4 1.5 2H21" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconHourglass = (
  <svg width="30" height="30" viewBox="0 0 24 24" {...svgProps}>
    <path d="M6 3h12M6 21h12M7 3v3.5L12 12 7 17.5V21M17 3v3.5L12 12l5 5.5V21" />
  </svg>
)
export const IconMismatch = (
  <svg width="30" height="30" viewBox="0 0 24 24" {...svgProps}>
    <path d="M4 8h12M16 8l-3-3M16 8l-3 3" />
    <path d="M20 16H8M8 16l3-3M8 16l3 3" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconBirthCode = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <circle cx="12" cy="12" r="2.5" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconEnneagram = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3l5.5 15.5L4.5 9h15L6.5 18.5 12 3Z" strokeWidth="1.1" />
  </svg>
)
export const IconAI = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    <circle cx="12" cy="12" r="2" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconShield = (
  <svg width="44" height="44" viewBox="0 0 24 24" {...svgProps}>
    <path d="M12 2 4 5.5v5.2c0 5 3.4 9.2 8 10.8 4.6-1.6 8-5.8 8-10.8V5.5L12 2Z" />
    <path d="M8.5 12l2.3 2.3 4.7-4.8" stroke="#ccffdd" strokeWidth="1.5" />
  </svg>
)
export const IconLock = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...svgProps}>
    <rect x="5" y="10" width="14" height="10" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15" r="1.6" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconScan = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M7 12h10" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconReport = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
    <path d="M14 2v6h6M9 13h6M9 17h4" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconGiftBox = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <rect x="4" y="9" width="16" height="12" rx="2" />
    <path d="M4 12h16M12 9v12" />
    <path d="M12 9c-1.5-3.5-6-3.5-6-1s4 2 6 1Zm0 0c1.5-3.5 6-3.5 6-1s-4 2-6 1Z" stroke="#ccffdd" strokeWidth="1.2" />
  </svg>
)
export const IconPerson = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconHome = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M3 11 12 3l9 8" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M10 21v-6h4v6" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconWarning = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 10v4.5M12 17.5v.5" stroke="#ccffdd" strokeWidth="1.5" />
  </svg>
)
export const IconLoop = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7" />
    <path d="M17.5 2.5v4h-4M6.5 21.5v-4h4" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconPulse = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M6 13h3l1.5-4 2.5 7 1.5-4.5L16 13h2" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconStar = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3Z" />
  </svg>
)
export const IconCube = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
    <path d="M3 7l9 5 9-5M12 12v10" stroke="#ccffdd" strokeWidth="1.3" />
  </svg>
)
export const IconShieldSm = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...svgProps}>
    <path d="M12 2 4 5.5v5.2c0 5 3.4 9.2 8 10.8 4.6-1.6 8-5.8 8-10.8V5.5L12 2Z" />
    <path d="M8.5 12l2.3 2.3 4.7-4.8" stroke="#ccffdd" strokeWidth="1.5" />
  </svg>
)
