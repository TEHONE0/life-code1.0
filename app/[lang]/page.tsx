"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getT, Lang } from "@/lib/i18n";
import UserMenu from "@/components/UserMenu";

function MatrixRain({ side }: { side: 'left' | 'right' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const FONT_SIZE = 11
    const CONTENT_W = 672 // max-w-2xl
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿ'

    let raf: number
    let drops: number[] = []

    function init() {
      // 只占侧边空间的 60%，留出内容区附近的间隙
      const available = Math.max(0, Math.floor((window.innerWidth - CONTENT_W) / 2))
      const sideW = Math.floor(available * 0.6)
      canvas!.width = sideW
      canvas!.height = window.innerHeight
      const cols = Math.floor(sideW / FONT_SIZE)
      // 只激活约 35% 的列，其余永远不落
      drops = Array(cols).fill(1).map(() => Math.random() < 0.35 ? Math.random() * -80 : Infinity)
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      ctx!.fillStyle = 'rgba(5, 10, 5, 0.06)'
      ctx!.fillRect(0, 0, W, H)
      ctx!.font = `${FONT_SIZE}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const headY = drops[i] * FONT_SIZE
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        // bright head
        ctx!.fillStyle = '#ccffdd'
        ctx!.fillText(char, i * FONT_SIZE, headY)
        // second row slightly dimmer
        ctx!.fillStyle = '#00ff8866'
        ctx!.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FONT_SIZE, headY - FONT_SIZE)

        if (headY > H && Math.random() > 0.972) drops[i] = 0
        drops[i] += 0.45
      }
      raf = requestAnimationFrame(draw)
    }

    init()
    draw()

    const onResize = () => { cancelAnimationFrame(raf); init(); draw() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="hidden lg:block"
      style={{
        position: 'fixed',
        top: 0,
        [side]: 0,
        height: '100vh',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
]

export default function HomePage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const t = getT(lang)
  const router = useRouter()
  const [lines, setLines] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [hoveredLang, setHoveredLang] = useState<string | null>(null)

  useEffect(() => {
    setLines([])
    setReady(false)
    let i = 0
    const interval = setInterval(() => {
      if (i < t.bootLines.length) {
        setLines((prev) => [...prev, t.bootLines[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setReady(true), 400)
      }
    }, 340)
    return () => clearInterval(interval)
  }, [lang])

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative"
      style={{ background: "radial-gradient(ellipse at center, #061206 0%, #050a05 70%)" }}
    >
      <MatrixRain side="left" />
      <MatrixRain side="right" />


      {/* Boot log — 动画结束后隐藏，保证主内容上下居中 */}
      {!ready && (
        <div className="w-full max-w-xl mb-8 space-y-1 min-h-[120px]">
          {lines.map((line, i) => (
            <div
              key={i}
              className="text-xs leading-relaxed"
              style={{ color: i === lines.length - 1 ? "#00ff88" : "#1e4a1e" }}
            >
              <span style={{ color: "#0f2a0f" }}>&gt; </span>{line}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      {ready && (
        <div className="text-center space-y-6 max-w-lg w-full px-2">
          <div
            className="inline-block px-3 py-1 text-xs border rounded-sm"
            style={{ borderColor: "#1a3a1a", color: "#00ff8877", background: "#0a1a0a" }}
          >
            {t.badge}
          </div>

          {/* Language switcher + user menu */}
          <div className="flex gap-1.5 justify-center items-center flex-wrap">
            <UserMenu lang={lang} />
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => router.push(`/${l.code}`)}
                onMouseEnter={() => setHoveredLang(l.code)}
                onMouseLeave={() => setHoveredLang(null)}
                className="text-xs px-2 py-1 sm:text-sm sm:px-4 sm:py-2 font-bold"
                style={{
                  color: hoveredLang === l.code ? '#00ff88' : l.code === lang ? '#00ff88' : '#4a8a4a',
                  border: '1px solid transparent',
                  borderColor: hoveredLang === l.code ? '#00ff88cc' : l.code === lang ? '#00ff8866' : '#1a4a1a',
                  background: l.code === lang ? '#00ff8811' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Courier New, monospace',
                  letterSpacing: '0.05em',
                  boxShadow: hoveredLang === l.code ? '0 0 12px #00ff8888, 0 0 24px #00ff8844, 0 0 40px #00ff8822' : 'none',
                  animation: hoveredLang === l.code ? 'btnGlow 1.2s ease-in-out infinite' : 'none',
                  transition: hoveredLang === l.code ? 'none' : 'all 0.2s',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Quote */}
          <div className="space-y-1 px-2">
            <p className="text-sm italic" style={{ color: "#00ff88" }}>
              {t.quote}
            </p>
            <p className="text-xs" style={{ color: "#00cc6a" }}>
              {t.quoteAuthor}
            </p>
            {t.quoteTranslation && (
              <>
                <p className="text-xs mt-2" style={{ color: "#00ff88" }}>
                  {t.quoteTranslation}
                </p>
                <p className="text-xs" style={{ color: "#00cc6a" }}>
                  {t.quoteAuthorLocal}
                </p>
              </>
            )}
          </div>

          {/* Body copy — mobile */}
          <div className="sm:hidden px-2 text-left mx-auto w-fit" style={{ lineHeight: "2.2" }}>
            {t.bodyLines.map((line, i) => (
              <p key={i} className="text-sm" style={{ color: "#4db8ff", textShadow: "0 0 8px #4db8ff66" }}>{line}</p>
            ))}
          </div>

          {/* Body copy — desktop */}
          <div className="hidden sm:block px-2 text-left mx-auto w-fit" style={{ letterSpacing: "0.04em" }}>
            {t.bodyLinesDesktop.map((line, i) => (
              <p key={i} className="text-sm" style={{ color: "#4db8ff", textShadow: "0 0 8px #4db8ff66", lineHeight: "1.8", marginBottom: "1.4em" }}>{line}</p>
            ))}
          </div>

          {/* Tagline */}
          <h1
            className="text-xl sm:text-2xl font-bold leading-snug animate-breathe-glow"
            style={{ color: "#00ff88", letterSpacing: "0.02em" }}
          >
            {t.tagline}
          </h1>

          {/* CTA */}
          <div className="pt-2 px-4">
            <button
              onClick={() => router.push(`/${lang}/survey`)}
              className="w-full sm:w-auto px-10 py-4 text-base font-bold transition-all duration-300 active:scale-95"
              style={{
                border: "1px solid #00ff88",
                color: "#00ff88",
                background: "transparent",
                letterSpacing: "0.1em",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.background = "#00ff88"
                e.currentTarget.style.color = "#050a05"
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#00ff88"
                }, 150)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#00ff88"
                e.currentTarget.style.color = "#050a05"
                e.currentTarget.style.boxShadow = "0 0 30px #00ff8844"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#00ff88"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              [ {t.cta} ]
            </button>
          </div>

          <p className="text-xs pb-2" style={{ color: "#2d5a2d" }}>
            {t.footer}
          </p>
          <p className="text-xs pb-4" style={{ color: "#4a7a4a", fontFamily: "Courier New, monospace" }}>
            // Life Code Architect · THEONE
          </p>

          <button
            onClick={() => router.push(`/${lang}/about`)}
            className="text-xs pb-4 transition-colors"
            style={{ color: "#1e4a1e", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Courier New, monospace" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4a7a4a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4a1e")}
          >
            {t.aboutLink}
          </button>

          <p
            className="text-xs px-2 pb-6 leading-relaxed"
            style={{ color: "#0f2a0f", maxWidth: "380px", margin: "0 auto" }}
          >
            {t.disclaimer}
          </p>
        </div>
      )}
    </main>
  )
}
