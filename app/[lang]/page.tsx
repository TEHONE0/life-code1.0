"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Lang } from "@/lib/i18n";
import UserMenu from "@/components/UserMenu";

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

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
]

const mono = "Courier New, monospace";

// 真实用户评价截图：把图片放进 public/reviews/ 并在此登记文件名即可显示
const REVIEW_IMAGES: string[] = [];

export default function HomePage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const zh = lang === 'zh'
  const router = useRouter()
  const promoActive = new Date() <= new Date("2026-06-30T23:59:59+08:00")

  const startBtn = (big = false) => (
    <button
      onClick={() => router.push(`/${lang}/survey`)}
      className={big ? "px-8 py-4 text-base font-bold tracking-wider" : "px-4 py-2 text-xs font-bold tracking-wider"}
      style={{ border: "1px solid #00ff88", color: "#050a05", background: "#00ff88", cursor: "pointer", fontFamily: mono, boxShadow: "0 0 18px #00ff8844" }}
    >
      {zh ? "开始生成我的报告 →" : "Generate my report →"}
    </button>
  )

  const sectionTitle = (text: string) => (
    <h2 className="text-xl md:text-2xl font-bold text-center" style={{ color: "#00ff88", fontFamily: mono }}>{text}</h2>
  )

  const painPoints = zh
    ? [
        { icon: "💔", title: "关系里反复受伤", desc: "总是遇到相似的人，掉进相似的结局，换了对象却换不掉剧本" },
        { icon: "⏳", title: "总在关键时刻犹豫", desc: "机会来了不敢接，接了又怀疑自己，事后反复回想" },
        { icon: "🧭", title: "努力却和内心不匹配", desc: "看起来一直在向前，却越来越不确定这是不是自己想要的" },
      ]
    : [
        { icon: "💔", title: "Repeating painful relationships", desc: "Different people, same script, same ending" },
        { icon: "⏳", title: "Hesitating at every turning point", desc: "Doubting yourself before and after every decision" },
        { icon: "🧭", title: "Effort that doesn't match your heart", desc: "Moving forward, but less and less sure it's your direction" },
      ]

  const steps = zh
    ? [
        { num: "01", title: "生辰代码算法", desc: "你的出生时间被转译成一组初始参数——能量结构、底层倾向、运行节律" },
        { num: "02", title: "九型人格", desc: "9道深度问题定位你的人格内核与防御模式，找到反复出现的那个循环" },
        { num: "03", title: "AI 引擎", desc: "AI 交叉比对两套数据，逐章生成只属于你的系统解析报告" },
      ]
    : [
        { num: "01", title: "Birth-code algorithm", desc: "Your birth time is translated into initial parameters — energy structure, tendencies, rhythm" },
        { num: "02", title: "Enneagram", desc: "9 deep questions locate your personality core and the loop you keep repeating" },
        { num: "03", title: "AI engine", desc: "AI cross-references both datasets and writes your report chapter by chapter" },
      ]

  const chapters = zh
    ? ["生命系统 Bug 指数", "第零章 · 初始参数 · 源代码", "第一章 · 内核审计（5 个核心 Bug）", "第二章 · 演化路径分析", "第三章 · 当下奇点", "第四章 · 命运渲染预测", "第五章 · Debug 建议", "第六章 · 命运公式", "第七章 · 总结 · 禅语 · 生命问答", "觉醒画像"]
    : ["Life-system Bug index", "Ch.0 Initial parameters · Source code", "Ch.1 Kernel audit (5 core bugs)", "Ch.2 Evolution path", "Ch.3 The present singularity", "Ch.4 Destiny rendering forecast", "Ch.5 Debug suggestions", "Ch.6 Destiny formula", "Ch.7 Summary · Zen · Life Q&A", "Awakening portrait"]

  const previews = [
    { src: "/preview/origin.png", label: zh ? "初始参数 · 源代码" : "Initial parameters" },
    { src: "/preview/bug.png", label: zh ? "内核审计 · Bug" : "Kernel audit" },
    { src: "/preview/debug.png", label: zh ? "Debug 建议" : "Debug suggestions" },
    { src: "/preview/forecast.png", label: zh ? "命运渲染预测" : "Forecast" },
    { src: "/preview/portrait.png", label: zh ? "觉醒画像" : "Awakening portrait" },
  ]

  return (
    <main className="min-h-screen relative" style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}>
      <MatrixRain side="left" />
      <MatrixRain side="right" />

      {/* ───── 顶栏 ───── */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "#050a05ee", borderBottom: "1px solid #112811", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-2" style={{ fontFamily: mono }}>
          <span className="text-base font-bold" style={{ color: "#00ff88" }}>生命代码</span>
          <span className="text-xs" style={{ color: "#2d5a2d", letterSpacing: "0.15em" }}>LIFE CODE</span>
        </div>
        <div className="hidden md:flex gap-6 text-xs" style={{ fontFamily: mono }}>
          {(zh ? [["#pain", "为什么测"], ["#how", "如何生成"], ["#preview", "报告示例"], ["#about", "关于创作者"]] : [["#pain", "Why"], ["#how", "How"], ["#preview", "Sample"], ["#about", "About"]]).map(([href, label]) => (
            <a key={href} href={href} style={{ color: "#4a7a4a", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1.5">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => router.push(`/${l.code}`)} className="text-xs px-1.5 py-0.5" style={{ background: "transparent", border: "none", color: l.code === lang ? "#00ff88" : "#2d5a2d", cursor: "pointer", fontFamily: mono }}>
                {l.label}
              </button>
            ))}
          </div>
          <UserMenu lang={lang} />
          <div className="hidden sm:block">{startBtn(false)}</div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">

        {/* ───── Hero ───── */}
        <section className="py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#e2e8f0" }}>
              {zh ? <>用 AI 看见你<br /><span style={{ color: "#00ff88" }}>反复卡住的人生模式</span></> : <>See the life pattern<br /><span style={{ color: "#00ff88" }}>you keep getting stuck in</span></>}
            </h1>
            <div className="text-sm md:text-base" style={{ color: "#4a8a4a", fontFamily: mono }}>
              {zh ? "生辰代码算法 × 九型人格 × AI 引擎" : "Birth-code algorithm × Enneagram × AI engine"}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#5a7a5a" }}>
              {zh
                ? "不是星座，也不是你看腻了的标准化测试。生成一份关于你的性格内核、关系模式、事业卡点与人生方向的生命代码解析报告。"
                : "Not horoscopes, not another standardized test. A full report on your personality kernel, relationship patterns, career blocks and direction."}
            </p>
            <div className="flex flex-wrap gap-3">
              {startBtn(true)}
              <a href="#preview" className="px-8 py-4 text-base font-bold tracking-wider" style={{ border: "1px solid #1a3a1a", color: "#4a8a4a", textDecoration: "none", fontFamily: mono }}>
                {zh ? "查看报告示例" : "See a sample"}
              </a>
            </div>
            {promoActive && (
              <div className="text-xs" style={{ color: "#fbbf24", fontFamily: mono }}>
                🎁 {zh ? "首发活动（至6月30日）：买一赠一，多得一份送朋友" : "Launch offer (until Jun 30): buy one, gift one free"}
              </div>
            )}
          </div>
          <div className="p-6 space-y-2 text-sm" style={{ border: "1px solid #1a3a1a", background: "#0a150aee", fontFamily: mono, boxShadow: "0 0 60px #00ff8811" }}>
            <div style={{ color: "#2d5a2d" }}>// life_code.init</div>
            <div style={{ color: "#00ff88" }}>LIFE&nbsp;&nbsp;&nbsp;&nbsp;= JOURNEY</div>
            <div style={{ color: "#00ff88" }}>PATTERN&nbsp;= REPEATING</div>
            <div style={{ color: "#fbbf24" }}>CORE_BUG = &quot;I am not enough&quot;</div>
            <div style={{ color: "#7aba7a" }}>PATCH&nbsp;&nbsp;&nbsp;= &quot;Return to self&quot;</div>
            <div style={{ color: "#2d5a2d" }}>VERSION&nbsp;= 2.6.1</div>
            <div className="pt-2 text-xs" style={{ color: "#2d5a2d" }}>
              {zh ? "// 每份报告由 AI 实时生成，全网没有第二份相同的" : "// Generated live — no two reports are the same"}
            </div>
          </div>
        </section>

        {/* ───── 痛点 ───── */}
        <section id="pain" className="py-12 space-y-8">
          {sectionTitle(zh ? "你是否也反复卡在这些地方？" : "Do you keep getting stuck here?")}
          <div className="grid md:grid-cols-3 gap-4">
            {painPoints.map((p) => (
              <div key={p.title} className="p-5 space-y-3" style={{ border: "1px solid #1a3a1a", background: "#0a150a" }}>
                <div className="text-2xl">{p.icon}</div>
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
              <div key={s.num} className="p-5 space-y-3" style={{ border: "1px solid #1a3a1a", background: "#0a150a" }}>
                <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>STEP {s.num}</div>
                <div className="text-sm font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{s.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───── 报告预览 ───── */}
        <section id="preview" className="py-12 space-y-8">
          {sectionTitle(zh ? "你将得到怎样的报告？" : "What does the report look like?")}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              {chapters.map((c, i) => (
                <div key={c} className="flex items-center gap-3 text-xs py-1.5 px-3" style={{ border: "1px solid #112811", background: "#0a150a", fontFamily: mono, color: i === 0 || i === chapters.length - 1 ? "#fbbf24" : "#4a8a4a" }}>
                  <span style={{ color: "#2d5a2d" }}>{String(i).padStart(2, "0")}</span>
                  <span>{c}</span>
                </div>
              ))}
              <p className="text-xs pt-2" style={{ color: "#2d5a2d", fontFamily: mono }}>
                {zh ? "// 全文约 6000-9000 字，支持保存为 PDF" : "// ~6000-9000 words, exportable as PDF"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {previews.map((p) => (
                <figure key={p.src} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.label} loading="lazy" className="w-full" style={{ border: "1px solid #1a3a1a" }} />
                  <figcaption className="text-xs text-center" style={{ color: "#2d5a2d", fontFamily: mono }}>{p.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ───── 不是算命 ───── */}
        <section className="py-12">
          <div className="p-6 md:p-8 space-y-4 text-center" style={{ border: "1px solid #1a3a1a", background: "#0a150a" }}>
            <div className="text-3xl">🛡️</div>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: "#00ff88", fontFamily: mono }}>
              {zh ? "这不是算命，而是一份自我理解报告" : "This is not fortune-telling — it's a self-understanding report"}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-xs leading-relaxed pt-2" style={{ color: "#5a7a5a" }}>
              <p>{zh ? "以心理学（九型人格）为分析框架，不预测吉凶、不替你做任何决定" : "Built on psychology (Enneagram). No fortune predictions, no decisions made for you"}</p>
              <p>{zh ? "报告仅你本人登录可见，不会出现在任何公开页面，可随时申请删除" : "Your report is visible only to you, never public, deletable on request"}</p>
              <p>{zh ? "AI 实时生成，无模板套话——同一个问题，一万个人有一万份答案" : "Generated live by AI — no templates, no boilerplate"}</p>
            </div>
          </div>
        </section>

        {/* ───── 用户评价（真实截图，放入 public/reviews/ 后显示） ───── */}
        {REVIEW_IMAGES.length > 0 && (
          <section className="py-12 space-y-8">
            {sectionTitle(zh ? "他们读完之后说" : "What readers say")}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {REVIEW_IMAGES.map((src) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={src} src={src} alt="user review" loading="lazy" className="w-full" style={{ border: "1px solid #1a3a1a" }} />
              ))}
            </div>
          </section>
        )}

        {/* ───── 创作者 + 价格 ───── */}
        <section id="about" className="py-12 grid md:grid-cols-2 gap-4">
          <div className="p-6 space-y-3" style={{ border: "1px solid #1a3a1a", background: "#0a150a" }}>
            <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>// {zh ? "关于创作者" : "About the creator"}</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center text-lg font-bold" style={{ border: "1px solid #00ff88", color: "#00ff88", fontFamily: mono, borderRadius: "50%" }}>T1</div>
              <div>
                <div className="text-sm font-bold" style={{ color: "#00ff88", fontFamily: mono }}>THEONE</div>
                <div className="text-xs" style={{ color: "#4a7a4a" }}>{zh ? "导演 · AI 创作者" : "Film director · AI creator"}</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>
              {zh
                ? "十年影像叙事，习惯把镜头对准人。生命代码是另一种镜头——不预测命运，只帮你把自己的系统看清楚。"
                : "Ten years of visual storytelling, always pointing the camera at people. Life Code is another kind of lens — it doesn't predict fate, it helps you see your own system clearly."}
            </p>
          </div>
          <div className="p-6 space-y-4 text-center flex flex-col justify-center" style={{ border: "1px solid #00ff8855", background: "#0a1f0a" }}>
            <div className="text-4xl font-bold" style={{ color: "#00ff88" }}>¥18.8</div>
            <div className="text-xs" style={{ color: "#4a7a4a", fontFamily: mono }}>
              {zh ? "一份完整生命代码解析报告 · 约15-30分钟生成 · 永久可查看" : "One full report · 15-30 min · yours forever"}
            </div>
            {promoActive && (
              <div className="text-xs" style={{ color: "#fbbf24", fontFamily: mono }}>
                🎁 {zh ? "活动期内付费即赠一份，送给你最想读懂的人" : "Buy one, gift one free during launch"}
              </div>
            )}
            <div className="flex justify-center">{startBtn(true)}</div>
          </div>
        </section>

        {/* ───── 页脚 ───── */}
        <footer className="py-10 space-y-3 text-center" style={{ borderTop: "1px solid #112811" }}>
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
