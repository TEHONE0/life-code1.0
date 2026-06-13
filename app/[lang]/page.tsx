"use client";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Lang } from "@/lib/i18n";
import UserMenu from "@/components/UserMenu";
import NavEntries from "@/components/NavEntries";
import LangSwitch from "@/components/LangSwitch";
import { NeonRing, IconHeartPulse, IconHourglass, IconMismatch, IconBirthCode, IconEnneagram, IconAI, IconShield } from "@/components/neon";

function MatrixRain({ side }: { side: 'left' | 'right' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const FONT_SIZE = 11
    const CONTENT_W = 960
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿ'

    let raf: number
    let drops: number[] = []

    function init() {
      const available = Math.max(0, Math.floor((window.innerWidth - CONTENT_W) / 2))
      const sideW = Math.floor(available * 0.6)
      canvas!.width = sideW
      canvas!.height = window.innerHeight
      const cols = Math.floor(sideW / FONT_SIZE)
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
        ctx!.fillStyle = '#ccffdd'
        ctx!.fillText(char, i * FONT_SIZE, headY)
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
      style={{ position: 'fixed', top: 0, [side]: 0, height: '100vh', opacity: 0.4, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}


const mono = "Courier New, monospace";
const scifi = "Orbitron, Courier New, monospace";
const CARD = { border: "1px solid #1a3a1a", background: "#0a150a", borderRadius: "16px" } as const;

// 真实用户评价截图：把图片放进 public/reviews/ 并在此登记文件名即可显示
const REVIEW_IMAGES: string[] = [
  "/reviews/review-01.jpg",
  "/reviews/review-02.jpg",
  "/reviews/review-03.jpg",
  "/reviews/review-04.jpg",
  "/reviews/review-05.jpg",
  "/reviews/review-06.jpg",
];

// 主 CTA 按钮：鼠标悬浮放大 + 发光（内联样式，hover 状态独立）
function CtaButton({ big, onClick, label }: { big: boolean; onClick: () => void; label: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={big ? "w-full max-w-md px-10 py-4 text-base font-bold tracking-wider" : "px-5 py-2 text-xs font-bold tracking-wider"}
      style={{
        border: "none", color: "#04140a", cursor: "pointer", fontFamily: mono, borderRadius: "14px",
        background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
        transform: hover ? "scale(1.04)" : "scale(1)",
        boxShadow: hover
          ? "0 0 26px #00ff8866, 0 0 44px #00ff8833, 0 2px 10px #00000066"
          : "0 0 22px #00ff8855, 0 2px 10px #00000066",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {label}
    </button>
  )
}

export default function HomePage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const zh = lang === 'zh'
  const router = useRouter()
  const promoActive = new Date() <= new Date("2026-06-30T23:59:59+08:00")

  // Hero 代码块：逐字打字动画（打完后光标在结尾持续闪烁）
  const codeLines: [string, string][] = zh
    ? [
        ["// init", "这是用 AI 代码推演出的心理测试"],
        ["> scan", "看清人生中反复出现的卡点"],
        ["> debug", "找到生命系统里那些悄悄运行的 Bug"],
        ["> rebuild", "让你有机会重新选择怎么活"],
        ["> heal", "看见自己，疗愈自己"],
      ]
    : [
        ["// init", "A psychological assessment inferred by AI code"],
        ["> scan", "See the blocks that keep recurring in your life"],
        ["> debug", "Find the bugs quietly running in your system"],
        ["> rebuild", "Get a chance to choose how to live"],
        ["> heal", "See yourself, heal yourself"],
      ]
  const codeTotal = codeLines.reduce((n, [, t]) => n + t.length, 0)
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    setTyped(0)
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= codeTotal) { clearInterval(id); return n }
        return n + 1
      })
    }, 55)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const startBtn = (big = false) => (
    <CtaButton
      big={big}
      onClick={() => router.push(`/${lang}/survey`)}
      label={zh ? "解析我的生命代码 →" : "Generate my report →"}
    />
  )

  const ghostBtn = (label: string, href: string) => (
    <a
      href={href}
      className="px-8 py-4 text-base font-bold tracking-wider"
      style={{ border: "1px solid #2a5a2a", color: "#5aba7a", textDecoration: "none", fontFamily: mono, borderRadius: "14px", background: "#0a150a88" }}
    >
      {label}
    </a>
  )

  const sectionTitle = (text: string) => (
    <h2 className="text-xl md:text-2xl font-bold text-center" style={{ color: "#e2e8f0", fontFamily: mono }}>
      <span style={{ color: "#2d5a2d" }}>{"// "}</span>{text}
    </h2>
  )

  const painPoints = [
    { icon: IconHeartPulse, title: zh ? "关系里反复受伤" : "Repeating painful relationships", desc: zh ? "总是遇到相似的人，掉进相似的结局，换了对象却换不掉剧本" : "Different people, same script, same ending" },
    { icon: IconHourglass, title: zh ? "总在关键时刻犹豫" : "Hesitating at turning points", desc: zh ? "机会来了不敢接，接了又怀疑自己，事后反复回想" : "Doubting yourself before and after every decision" },
    { icon: IconMismatch, title: zh ? "努力却和内心不匹配" : "Effort that doesn't match your heart", desc: zh ? "看起来一直在向前，却越来越不确定这是不是自己想要的" : "Moving forward, but less sure it's your direction" },
  ]

  const steps = [
    { icon: IconAI, title: zh ? "AI算法" : "AI engine", desc: zh ? "AI 算法解析人格心理的底层逻辑，交叉比对模型，生成只属于你的系统解析报告" : "The AI algorithm decodes the underlying logic of your personality and psychology, cross-referencing models to generate a system analysis that's uniquely yours" },
    { icon: IconEnneagram, title: zh ? "九型人格" : "Enneagram", desc: zh ? "9道深度问题定位你的人格内核与防御模式，找到反复出现的那个循环" : "9 deep questions locate your personality core and repeating loop" },
    { icon: IconBirthCode, title: zh ? "生辰代码" : "Birth code", desc: zh ? "你的出生时间被转译成一组初始参数——能量结构、底层倾向、运行节律" : "Your birth time becomes initial parameters — energy structure, tendencies, rhythm" },
  ]

  const chapters = zh
    ? ["生命系统 Bug 指数", "第零章 · 初始参数 · 源代码", "第一章 · 内核审计（5 个核心 Bug）", "第二章 · 演化路径分析", "第三章 · 当下奇点", "第四章 · 命运渲染预测", "第五章 · 修复补丁", "第六章 · 命运公式", "第七章 · 总结 · 禅语 · 生命问答", "觉醒画像"]
    : ["Life-system Bug index", "Ch.0 Initial parameters · Source code", "Ch.1 Kernel audit (5 core bugs)", "Ch.2 Evolution path", "Ch.3 The present singularity", "Ch.4 Destiny rendering forecast", "Ch.5 Debug suggestions", "Ch.6 Destiny formula", "Ch.7 Summary · Zen · Life Q&A", "Awakening portrait"]

  const previews = [
    { src: "/preview/v2-readings.png", label: zh ? "报告核心读数" : "Core readings" },
    { src: "/preview/v2-opening.png", label: zh ? "破防开场" : "Opening insight" },
    { src: "/preview/v2-weight.png", label: zh ? "性格权重解读" : "Personality weight" },
    { src: "/preview/v2-health.png", label: zh ? "健康等级 · 运行状态" : "Health level · Runtime" },
    { src: "/preview/v2-audit.png", label: zh ? "内核审计 · Bug" : "Kernel audit · Bug" },
    { src: "/preview/v2-debug.png", label: zh ? "修复补丁" : "Patch fixes" },
    { src: "/preview/v2-forecast.png", label: zh ? "命运渲染预测" : "Destiny forecast" },
    { src: "/preview/v2-portrait.png", label: zh ? "觉醒画像" : "Awakening portrait" },
  ]

  const footChips = zh
    ? [["🔒", "传输加密"], ["👁", "仅本人可见"], ["♾", "报告永久保存"], ["⚡", "AI 实时生成"]]
    : [["🔒", "Encrypted"], ["👁", "Private to you"], ["♾", "Saved forever"], ["⚡", "Generated live"]]

  return (
    <main className="min-h-screen relative" style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}>
      <MatrixRain side="left" />
      <MatrixRain side="right" />

      {/* ───── 顶栏 ───── */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "#050a05ee", borderBottom: "1px solid #112811", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" style={{ fontFamily: mono }}>
            <img src="/dna-logo.png" alt="生命代码 LOGO" width={20} height={30} style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px #00ff8855)" }} />
            <span className="text-base font-bold" style={{ color: "#00ff88", textShadow: "0 0 12px #00ff8866" }}>生命代码</span>
            <span className="text-xs" style={{ color: "#2d5a2d", letterSpacing: "0.15em", fontFamily: scifi }}>LIFE CODE</span>
          </div>
          <LangSwitch lang={lang} onPick={(c) => router.push(`/${c}`)} />
        </div>
        <div className="hidden md:flex gap-6 text-xs" style={{ fontFamily: mono }}>
          {(zh ? [["#pain", "为什么测"], ["#how", "如何生成"], ["#preview", "报告示例"], ["#reviews", "用户体验"], ["#about", "关于创作者"]] : [["#pain", "Why"], ["#how", "How"], ["#preview", "Sample"], ["#reviews", "Reviews"], ["#about", "About"]]).map(([href, label]) => (
            <a key={href} href={href} className="nav-link" style={{ color: "#4a7a4a", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2"><NavEntries lang={lang} /></div>
          <UserMenu lang={lang} />
          <div className="hidden sm:block">{startBtn(false)}</div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">

        {/* ───── Hero（整体居中） ───── */}
        <section className="pt-5 pb-14 md:pt-7 md:pb-20 flex flex-col items-center text-center space-y-7">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#e2e8f0", ...(zh ? { fontFamily: "'Alibaba PuHuiTi 2.0', 'PingFang SC', sans-serif" } : {}) }}>
            {zh ? <>用 <span style={{ fontFamily: scifi }}>AI</span> 看见<br /><span style={{ color: "#00ff88", textShadow: "0 0 24px #00ff8855" }}>你生命里反复出现的 <span style={{ color: "#4db8ff", textShadow: "0 0 24px #4db8ff55", fontFamily: scifi }}>BUG</span></span></> : <>See the <span style={{ color: "#4db8ff", textShadow: "0 0 24px #4db8ff55", fontFamily: scifi }}>BUG</span><br /><span style={{ color: "#00ff88", textShadow: "0 0 24px #00ff8855" }}>that keeps recurring in your life</span></>}
          </h1>
          <div
            className="max-w-xl w-full px-6 py-5 text-left"
            style={{
              border: "1px solid #1f4a6b",
              background: "#081420",
              borderRadius: "14px",
              boxShadow: "0 0 24px #4db8ff22, inset 0 0 30px #4db8ff0a",
            }}
          >
            {/* 标题行：生命代码 + LIFE CODE，细线隔开 */}
            <div className="flex items-baseline gap-2 pb-2.5 mb-3" style={{ borderBottom: "1px solid #14304a" }}>
              <span className="text-sm font-bold" style={{ color: "#4db8ff", fontFamily: mono, textShadow: "0 0 12px #4db8ff55" }}>生命代码</span>
              <span className="text-xs" style={{ color: "#3a6a8a", fontFamily: scifi, letterSpacing: "0.15em" }}>LIFE CODE</span>
            </div>
            {codeLines.map(([tag, text], i) => {
              const before = codeLines.slice(0, i).reduce((n, [, t]) => n + t.length, 0)
              const shown = Math.max(0, Math.min(text.length, typed - before))
              const started = typed >= before
              // 当前正在打字的行（光标所在行）；全部打完后光标固定在最后一行结尾
              const active = (typed < before + text.length && typed >= before) || (typed >= codeTotal && i === codeLines.length - 1)
              return (
                <div key={tag} className="flex items-baseline gap-2.5 leading-relaxed py-0.5">
                  <span className="text-xs shrink-0" style={{ color: "#2a6a99", fontFamily: scifi, minWidth: "62px", visibility: started ? "visible" : "hidden" }}>{tag}</span>
                  <span className="text-sm md:text-base font-medium" style={{ color: "#4db8ff", textShadow: "0 0 12px #4db8ff33" }}>
                    {text.slice(0, shown)}
                    {active && <span style={{ animation: "blink 1s step-end infinite", color: "#4db8ff", marginLeft: "1px" }}>▌</span>}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="w-full flex flex-wrap gap-3 justify-center">
            {startBtn(true)}
          </div>
          {promoActive && (
            <div className="space-y-2">
              <div className="text-sm font-bold flex flex-wrap items-center justify-center gap-x-2 gap-y-1" style={{ color: "#FFC93C", textShadow: "0 0 10px #FFC93C55", fontFamily: mono }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC93C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, filter: "drop-shadow(0 0 5px #FFC93C88)" }}>
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M5 12 v8 a1 1 0 0 0 1 1 h12 a1 1 0 0 0 1 -1 v-8" />
                  <line x1="12" y1="8" x2="12" y2="21" />
                  <path d="M12 8 C 12 4.5, 8.5 4, 8 6 C 7.7 7.6, 10.5 8, 12 8 Z" />
                  <path d="M12 8 C 12 4.5, 15.5 4, 16 6 C 16.3 7.6, 13.5 8, 12 8 Z" />
                </svg>
                <span>{zh ? "首发活动（至6月30日）：" : "Launch offer (until Jun 30): "}</span>
                <span>{zh ? "买一赠一，送给你最想读懂的人" : "buy one, gift one to someone you most want to understand"}</span>
              </div>
              <div className="relative mx-auto" style={{ width: "80%", maxWidth: "420px", height: "2px" }}>
                <div className="absolute inset-0" style={{ borderRadius: "999px", background: "linear-gradient(90deg, transparent 0%, #FFC93C 50%, transparent 100%)" }} />
                <div className="absolute top-1/2 left-1/2" style={{ transform: "translate(-50%, -50%)", width: "48px", height: "10px", borderRadius: "999px", background: "#FFC93C", filter: "blur(8px)" }} />
              </div>
            </div>
          )}

        </section>

        {/* ───── 痛点 ───── */}
        <section id="pain" className="py-12 space-y-8">
          {sectionTitle(zh ? "你是否也反复卡在这些地方？" : "Do you keep getting stuck here?")}
          <div className="grid md:grid-cols-3 gap-4">
            {painPoints.map((p) => (
              <div key={p.title} className="p-6 space-y-4 text-center" style={CARD}>
                <NeonRing>{p.icon}</NeonRing>
                <div className="text-sm font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{p.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───── 如何生成 ───── */}
        <section id="how" className="py-12 space-y-8">
          {sectionTitle(zh ? "生命代码如何生成？" : "How is your Life Code generated?")}
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s) => (
              <div key={s.title} className="p-6 space-y-4" style={CARD}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #00ff88", boxShadow: "0 0 12px #00ff8833" }}>{React.cloneElement(s.icon, { width: 18, height: 18 })}</div>
                  <div className="text-sm font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{s.title}</div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm md:text-base text-center font-bold animate-glow-pulse" style={{ color: "#00ff88", fontFamily: mono }}>
            {zh ? "// 点击 " : "// Click "}
            <button
              onClick={() => router.push(`/${lang}/survey`)}
              className="px-3 py-1 mx-1 text-sm md:text-base font-bold align-middle"
              style={{ border: "1px solid #00ff88", borderRadius: "999px", background: "#00ff8822", color: "#00ff88", cursor: "pointer", fontFamily: mono }}
            >
              {zh ? "解析我的生命代码" : "Generate my report"}
            </button>
            <br />
            <span className="inline-block mt-2">{zh ? "回答几个问题，即可生成属于你的报告" : "answer a few questions, and get your own report"}</span>
          </p>
        </section>

        {/* ───── 报告预览 ───── */}
        <section id="preview" className="py-12 space-y-8">
          {sectionTitle(zh ? "你将得到怎样的报告？" : "What does the report look like?")}
          <div className="space-y-8">
            {/* 章节清单 */}
            <div className="grid sm:grid-cols-2 gap-2">
              {chapters.map((c, i) => (
                <div key={c} className="flex items-center gap-3 text-xs py-2 px-4" style={{ border: "1px solid #112811", background: "#0a150a", fontFamily: mono, color: i === 0 || i === chapters.length - 1 ? "#4db8ff" : "#4a8a4a", borderRadius: "10px" }}>
                  <span style={{ color: "#2d5a2d" }}>{String(i).padStart(2, "0")}</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            {/* 报告示例截图：2 张一排（01·02 / 03·04 …） */}
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {previews.map((p) => (
                <figure key={p.src} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.label} loading="lazy" className="w-full" style={{ border: "1px solid #1a3a1a", borderRadius: "12px" }} />
                  <figcaption className="text-xs text-center" style={{ color: "#4a8a4a", fontFamily: mono }}>{p.label}</figcaption>
                </figure>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: "#2d5a2d", fontFamily: mono }}>
              {zh ? "// 全文约 6000-9000 字，支持保存为 PDF" : "// ~6000-9000 words, exportable as PDF"}
            </p>
          </div>
        </section>

        {/* ───── 用户评价（真实截图，放入 public/reviews/ 后显示） ───── */}
        {REVIEW_IMAGES.length > 0 && (
          <section id="reviews" className="py-12 space-y-8">
            {sectionTitle(zh ? "真实用户体验" : "What readers say")}
            <div className="columns-2 md:columns-3 gap-3">
              {REVIEW_IMAGES.map((src) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={src} src={src} alt="user review" loading="lazy" className="w-full mb-3 break-inside-avoid" style={{ border: "1px solid #1a3a1a", borderRadius: "12px", display: "block" }} />
              ))}
            </div>
          </section>
        )}

        {/* ───── 不是算命 ───── */}
        <section className="py-12">
          <div className="p-6 md:p-10 grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center" style={{ ...CARD, boxShadow: "0 0 60px #00ff880d" }}>
            <div className="mx-auto"><NeonRing size={96}>{IconShield}</NeonRing></div>
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: "#00ff88", fontFamily: mono }}>
                {zh ? "这是一份来自你内心的自我理解报告" : "This is not fortune-telling — it's a self-understanding report"}
              </h2>
              <div className="grid md:grid-cols-3 gap-4 text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>
                <p>{zh ? "以AI算法、代码程序、心理学、九型人格为分析框架，不预测吉凶、不替你做任何决定" : "Built on psychology (Enneagram). No fortune predictions, no decisions made for you"}</p>
                <p>{zh ? "报告仅你本人登录可见，不会出现在任何公开页面，可随时申请删除" : "Your report is visible only to you, never public, deletable on request"}</p>
                <p>{zh ? "AI 实时生成，无模板套话——同一个问题，一万个人有一万份答案" : "Generated live by AI — no templates, no boilerplate"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── 创作者 + 价格 ───── */}
        <section id="about" className="py-12 grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="p-6 space-y-3" style={CARD}>
              <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>// {zh ? "关于创作者" : "About the creator"}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center text-lg font-bold" style={{ width: 52, height: 52, border: "1.5px solid #00ff88", color: "#00ff88", fontFamily: mono, borderRadius: "50%", boxShadow: "0 0 16px #00ff8833" }}>T1</div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#00ff88", fontFamily: mono }}>THEONE</div>
                  <div className="text-xs" style={{ color: "#4a7a4a" }}>{zh ? "AI架构师 · AI艺术家" : "AI architect · AI artist"}</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>
                {zh
                  ? "我喜欢研究心理学、九型人格、AI技术。当我用 AI 架构出 agent 员工之后，开始思考：AI 既然能模拟人的性格，那人的性格，是否也能被 AI 代码反过来模拟？于是研发了这款 AI 心理测试——生命代码。一开始只是为了看见自己，后来朋友们测完效果很好、也真的帮到了 TA 们，便想发布上线，帮助更多人。用代码理解内心潜意识的角落，看见自己，治愈众生。"
                  : "I'm fascinated by psychology, the Enneagram and AI. After architecting a team of AI agents, a question hit me: if AI can simulate a human personality, can a human personality be modeled back in AI code? That's how Life Code — this AI psychological test — was born. It started as a way to see myself; then friends took it, found it genuinely helpful, so I decided to launch it for more people. Reading the unconscious corners of the heart through code — to see yourself, and to heal all beings."}
              </p>
            </div>
            <div className="p-6 space-y-2" style={CARD}>
              <p className="text-base leading-relaxed" style={{ color: "#4db8ff", fontFamily: scifi, textShadow: "0 0 12px #4db8ff44" }}>
                &ldquo;There&rsquo;s a one in billions chance we&rsquo;re in base reality.&rdquo;
              </p>
              <p className="text-xs" style={{ color: "#4a7a4a", fontFamily: mono }}>— Elon Musk, Code Conference, 2016</p>
              {zh && (
                <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>「我们生活在真实世界中的概率，只有十亿分之一。」—埃隆·马斯克</p>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4 text-center flex flex-col justify-center" style={{ border: "1px solid #00ff8855", background: "#0a1f0a", borderRadius: "16px", boxShadow: "0 0 50px #00ff8814" }}>
            <div className="text-4xl font-bold" style={{ color: "#00ff88", textShadow: "0 0 24px #00ff8855", fontFamily: "'Alibaba PuHuiTi 2.0', 'Courier New', monospace" }}>¥18.80</div>
            <div className="space-y-1 text-xs" style={{ color: "#4a7a4a", fontFamily: mono }}>
              <div>✓ {zh ? "AI 逐字逐句实时生成" : "Generated live, word by word"}</div>
              <div>✓ {zh ? "约 15-30 分钟收到完整报告" : "Full report in 15-30 min"}</div>
              <div>✓ {zh ? "报告永久保存，随时回看" : "Saved forever, revisit anytime"}</div>
            </div>
            {promoActive && (
              <div className="text-xs flex items-center justify-center gap-1.5" style={{ color: "#4db8ff", fontFamily: mono }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC93C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px #FFC93C88)" }}>
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M5 12 v8 a1 1 0 0 0 1 1 h12 a1 1 0 0 0 1 -1 v-8" />
                  <line x1="12" y1="8" x2="12" y2="21" />
                  <path d="M12 8 C 12 4.5, 8.5 4, 8 6 C 7.7 7.6, 10.5 8, 12 8 Z" />
                  <path d="M12 8 C 12 4.5, 15.5 4, 16 6 C 16.3 7.6, 13.5 8, 12 8 Z" />
                </svg>
                {zh ? "活动期内付费即赠一份，送给你最想读懂的人" : "Buy one, gift one free during launch"}
              </div>
            )}
            <div className="w-full flex justify-center">{startBtn(true)}</div>
          </div>
        </section>

        {/* ───── 页脚 ───── */}
        <footer className="py-10 space-y-5 text-center" style={{ borderTop: "1px solid #112811" }}>
          <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
            {footChips.map(([icon, label]) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1 text-xs" style={{ border: "1px solid #112811", borderRadius: "999px", color: "#3d6a3d", fontFamily: mono, background: "#0a150a" }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-xs" style={{ fontFamily: mono }}>
            <a href={`/${lang}/privacy`} style={{ color: "#2d5a2d", textDecoration: "none" }}>{zh ? "隐私政策" : "Privacy"}</a>
            <a href={`/${lang}/terms`} style={{ color: "#2d5a2d", textDecoration: "none" }}>{zh ? "服务条款" : "Terms"}</a>
            <a href="mailto:theone@lifecode9.com" style={{ color: "#2d5a2d", textDecoration: "none" }}>theone@lifecode9.com</a>
          </div>
          <div className="text-xs" style={{ color: "#1e4a1e", fontFamily: mono }}>
            {zh ? "本服务为心理分析与自我探索工具，不构成医疗、法律或投资建议" : "A tool for psychological self-exploration. Not medical, legal or financial advice."}
          </div>
          <div className="text-xs" style={{ color: "#1e4a1e", fontFamily: mono }}>© {new Date().getFullYear()} Life Code</div>
        </footer>
      </div>
    </main>
  )
}
