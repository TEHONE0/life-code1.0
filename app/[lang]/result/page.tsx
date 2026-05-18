"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserMenu from "@/components/UserMenu";

function cleanReport(text: string, userName?: string): string {
  let result = text
    // 结构标签行（整行删除：破防段落/觉醒画像 等章节标题，含冒号/空行等变体）
    .replace(/^#{1,4}\s*[【\[]?破防段落[】\]]?[：:！!]?\s*$/gm, '')
    .replace(/^[【\[]?破防段落[】\]]?[：:！!]?\s*$/gm, '')
    .replace(/^#{1,4}\s*[【\[]?觉醒画像[】\]]?[：:！!]?\s*$/gm, '')
    .replace(/^[【\[]?觉醒画像[】\]]?[：:！!]?\s*$/gm, '')
    // 行内结构标签前缀（带序号或不带，含「**代码块**：」整行）
    .replace(/^(\d+\.\s*)?\*\*破防句\*\*[：:]?\s*/gm, '')
    .replace(/^(\d+\.\s*)?\*\*展开句\*\*[：:]?\s*/gm, '')
    .replace(/^(\d+\.\s*)?\*\*意象句\*\*[：:]?\s*/gm, '')
    .replace(/^(\d+\.\s*)?\*\*收尾句\*\*[：:]?\s*/gm, '')
    .replace(/^(\d+\.\s*)?\*\*代码块\*\*[：:]?\s*\n?/gm, '')
    // "代码块：" 作为裸行（在围栏外面）单独出现时去掉
    .replace(/^代码块[：:]\s*$/gm, '')
    // 后台注释行
    .replace(/[^\n]*\/\/\s*性格放大器[^\n]*/g, '')
    .replace(/[^\n]*\/\/\s*出厂参数[^\n]*/g, '')
    .replace(/[^\n]*\/\/\s*基础偏移[^\n]*/g, '')
    .replace(/[^\n]*\/\/\s*Runtime版本[^\n]*/g, '')
    .replace(/[^\n]*\/\/\s*人生走向[^\n]*/g, '')
    // 去除 AI 输出的 ASCII 画像（必须 ╔═ 紧跟 ```text，避免误吃其他 text 代码块之间的章节）
    .replace(/```\w*\s*\n╔═[\s\S]*?```/g, '')
    // 兜底：裸 ╔═ 框（未包在代码块里）
    .replace(/╔═[^\n]*\n(║[^\n]*\n)*╚═[^\n]*/g, '')
    // 过滤「你目前为：X_KEYWORD」标记行
    .replace(/[^\n]*_(?:LOWER_DIMENSION|SAPIENT_ENTITY|AWAKENED|HIGH_DIMENSION)[^\n]*/g, '')
    // 过滤「你目前为：X」不含英文枚举词的中文行
    .replace(/[^\n]*你目前为[^\n]*/g, '')
    // 过滤 DIMENSION_LEVEL 系统标记行（所有形式）
    .replace(/[^\n]*DIMENSION_LEVEL[^\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (userName) {
    result = result
      .replace(/\[姓名\]/g, userName)
      .replace(/【姓名】/g, userName)
  }
  return result
}

function extractName(basicInfo: string): string {
  return (basicInfo || '').split(/[，,、\/\s]/)[0].trim() || ''
}

const LABELS = {
  en: { rescan: "Scan again", home: "Back to home", generated: "LIFE CODE REPORT GENERATED" },
  zh: { rescan: "重新扫描", home: "返回首页", generated: "生命代码解析报告已生成" },
  ko: { rescan: "다시 스캔", home: "홈으로", generated: "생명 코드 보고서 생성 완료" },
}

const PORTRAIT_DATA: Record<string, {
  color: string
  art: Record<string, string>
}> = {
  LOWER_DIMENSION: {
    color: "#888888",
    art: {
      zh: String.raw`╔══════════════════════════════════╗
║                                   ║
║          .-----------.            ║
║         /  ~       ~  \           ║
║        /   /\     /\   \          ║
║       |   / ×\   /× \   |         ║
║       |   \  /   \  /   |         ║
║       |    \/     \/    |         ║
║       |                 |         ║
║       |   ___________   |         ║
║       |  /           \  |         ║
║        \               /          ║
║         '.___________.'           ║
║                                   ║
╠══════════════════════════════════╣
║     ──────  低 维 生 物  ──────     ║
║     LOWER_DIMENSION  ·  Lv.1/4    ║
║     系统尚未自我觉察               ║
╚══════════════════════════════════╝`,
      en: String.raw`╔══════════════════════════════════╗
║                                   ║
║          .-----------.            ║
║         /  ~       ~  \           ║
║        /   /\     /\   \          ║
║       |   / ×\   /× \   |         ║
║       |   \  /   \  /   |         ║
║       |    \/     \/    |         ║
║       |                 |         ║
║       |   ___________   |         ║
║       |  /           \  |         ║
║        \               /          ║
║         '.___________.'           ║
║                                   ║
╠══════════════════════════════════╣
║     ──  LOWER DIMENSION  ──       ║
║     LOWER_DIMENSION  ·  Lv.1/4   ║
║     System has not yet self-aware ║
╚══════════════════════════════════╝`,
    },
  },
  SAPIENT_ENTITY: {
    color: "#4488ff",
    art: {
      zh: String.raw`╔══════════════════════════════════╗
║                                   ║
║     .-~~-._.-~~-._.-~~-.          ║
║    (   ~~  ~~  ~~  ~~   )         ║
║     (  ~ ( ) ( ) ( ) ~ )          ║
║     '-~~~~-\    /~~~-~~'          ║
║              ...                  ║
║           .---------.             ║
║          /           \            ║
║         |  ──      ──   |         ║
║         |      ∧       |          ║
║         |    '---'    |           ║
║          \           /            ║
║           '---------'             ║
╠══════════════════════════════════╣
║     ──────  智 慧 生 物  ──────     ║
║     SAPIENT_ENTITY  ·  Lv.2/4     ║
║     开始观察自身代码               ║
╚══════════════════════════════════╝`,
      en: String.raw`╔══════════════════════════════════╗
║                                   ║
║     .-~~-._.-~~-._.-~~-.          ║
║    (   ~~  ~~  ~~  ~~   )         ║
║     (  ~ ( ) ( ) ( ) ~ )          ║
║     '-~~~~-\    /~~~-~~'          ║
║              ...                  ║
║           .---------.             ║
║          /           \            ║
║         |  ──      ──   |         ║
║         |      ∧       |          ║
║         |    '---'    |           ║
║          \           /            ║
║           '---------'             ║
╠══════════════════════════════════╣
║     ────  SAPIENT ENTITY  ────    ║
║     SAPIENT_ENTITY  ·  Lv.2/4    ║
║     Beginning to read own code    ║
╚══════════════════════════════════╝`,
    },
  },
  AWAKENED: {
    color: "#00ff88",
    art: {
      zh: String.raw`╔══════════════════════════════════╗
║                  |                ║
║              ----+----            ║
║             /  · | ·  \           ║
║            / ·  |||  · \          ║
║             \  · | ·  /           ║
║              ----+----            ║
║                  |                ║
║   ) ) )    .-----------.   ( ( (  ║
║  ) ) )    |             |   ( ( ( ║
║ ) ) )     (  ◉        ◉   )   ( ( (║
║  ) ) )    |      △       |    ( ( (║
║   ) ) )   |    \___/    |   ( ( ( ║
║            \__________ /          ║
╠══════════════════════════════════╣
║     ──────  觉 醒 者  ──────       ║
║     AWAKENED  ·  Lv.3/4           ║
║     你看见了矩阵                   ║
╚══════════════════════════════════╝`,
      en: String.raw`╔══════════════════════════════════╗
║                  |                ║
║              ----+----            ║
║             /  · | ·  \           ║
║            / ·  |||  · \          ║
║             \  · | ·  /           ║
║              ----+----            ║
║                  |                ║
║   ) ) )    .-----------.   ( ( (  ║
║  ) ) )    |             |   ( ( ( ║
║ ) ) )     (  ◉        ◉   )   ( ( (║
║  ) ) )    |      △       |    ( ( (║
║   ) ) )   |    \___/    |   ( ( ( ║
║            \__________ /          ║
╠══════════════════════════════════╣
║     ─────────  AWAKENED  ───────  ║
║     AWAKENED  ·  Lv.3/4           ║
║     You have seen the matrix      ║
╚══════════════════════════════════╝`,
    },
  },
  HIGH_DIMENSION: {
    color: "#ffd700",
    art: {
      zh: String.raw`╔══════════════════════════════════╗
║                                  ║
║      ✦   ·  ✦     |   ✦   ·  ✦   ║
║     ✦   ·   \   |   /   ·  ✦     ║
║    ·  ·  \  ·  |  ·  /  ·  ·     ║
║    *  \  · -------- ·  /   *     ║
║     ─  ─  ( ✦         ✦  )  ─  ─  ║
║    *  /  · -------- ·  \   *     ║
║    ·  ·  /  ·  |  ·  \  ·  ·     ║
║     ✦   ·   /   |   \   ·  ✦     ║
║      ✦   ·  ✦   |   ✦   ·  ✦     ║
║                                  ║
╠══════════════════════════════════╣
║     ──────  高 维 生 物  ──────    ║
║     HIGH_DIMENSION  ·  Lv.4/4    ║
║     已脱离原始程序                 ║
╚══════════════════════════════════╝`,
      en: String.raw`╔══════════════════════════════════╗
║                                  ║
║      ✦   ·  ✦     |   ✦   ·  ✦   ║
║     ✦   ·   \   |   /   ·  ✦     ║
║    ·  ·  \  ·  |  ·  /  ·  ·     ║
║    *  \  · -------- ·  /   *     ║
║     ─  ─  ( ✦         ✦  )  ─  ─  ║
║    *  /  · -------- ·  \   *     ║
║    ·  ·  /  ·  |  ·  \  ·  ·     ║
║     ✦   ·   /   |   \   ·  ✦     ║
║      ✦   ·  ✦   |   ✦   ·  ✦     ║
║                                  ║
╠══════════════════════════════════╣
║     ───  HIGH DIMENSION  ───      ║
║     HIGH_DIMENSION  ·  Lv.4/4    ║
║     Beyond the original program   ║
╚══════════════════════════════════╝`,
    },
  },
}

function getPortrait(level: string, lang: string): { color: string; art: string } | null {
  const data = PORTRAIT_DATA[level]
  if (!data) return null
  const artLang = lang === 'zh' ? 'zh' : 'en'
  return { color: data.color, art: data.art[artLang] }
}

export default function ResultPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#050a05" }} />}>
      <ResultPage />
    </Suspense>
  );
}

function ResultPage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const labels = LABELS[lang] ?? LABELS.en
  const router = useRouter()
  const searchParams = useSearchParams()
  const sidParam = searchParams.get('sid')
  const [report, setReport] = useState("")
  const [dimensionLevel, setDimensionLevel] = useState("")
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamDone, setStreamDone] = useState(false)
  const [shared, setShared] = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [screenshotHint, setScreenshotHint] = useState(false)
  // Prevents double execution (StrictMode guard + re-render guard)
  const effectRan = useRef(false)

  const shareUrl = lang === 'zh'
    ? 'https://lifecode.theone.so/zh'
    : lang === 'ko'
    ? 'https://lifecode.theone.so/ko'
    : 'https://lifecode.theone.so/en'

  const shareText = lang === 'zh'
    ? '如果宇宙是代码，你是哪一行？测测你的生命代码 →'
    : lang === 'ko'
    ? '우주가 코드라면, 당신은 어떤 줄인가요? 생명 코드를 확인하세요 →'
    : 'If life is code — which line are you? Decode yours →'

  const handleShare = () => setShareModal(true)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement("textarea")
      el.value = report
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleScreenshotHint = () => setScreenshotHint(v => !v)

  const streamFromAnswers = async (answers: Record<string, string>, surveyLang: string, submissionId: string | null) => {
    const userName = extractName(answers.basic_info)
    let accumulated = ""
    setReport("")
    setDimensionLevel("")
    setStreamDone(false)
    setStreaming(true)
    setVisible(true)

    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ answers, lang: surveyLang, submission_id: submissionId }),
      })
      if (!res.ok) throw new Error("Stream failed")
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        const clean = cleanReport(accumulated, userName)
        setReport(clean)
      }
      const lvl = accumulated.match(/DIMENSION_LEVEL\s*[:：]\s*\[?(\w+)/)
      if (lvl && ['LOWER_DIMENSION','SAPIENT_ENTITY','AWAKENED','HIGH_DIMENSION'].includes(lvl[1])) {
        setDimensionLevel(lvl[1])
      } else {
        const MARKERS: [string, string][] = [
          ['高维生物_HIGH_DIMENSION', 'HIGH_DIMENSION'],
          ['觉醒者_AWAKENED', 'AWAKENED'],
          ['智慧生物_SAPIENT_ENTITY', 'SAPIENT_ENTITY'],
          ['低维生物_LOWER_DIMENSION', 'LOWER_DIMENSION'],
        ]
        const pair = MARKERS.find(([marker]) => accumulated.includes(marker))
        if (pair) setDimensionLevel(pair[1])
      }
      sessionStorage.setItem("life_code_result", accumulated)
    } catch (err) {
      console.error("Stream error:", err)
    } finally {
      setStreaming(false)
      setStreamDone(true)
    }
  }

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    if (sidParam) {
      (async () => {
        const { data } = await supabaseBrowser.auth.getSession()
        if (!data.session) {
          router.replace(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/result?sid=${sidParam}`)}`)
          return
        }
        const res = await fetch(`/api/submission/${sidParam}`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        })
        if (!res.ok) { router.replace(`/${lang}/account`); return }
        const { submission } = await res.json()
        if (!submission.paid) {
          sessionStorage.setItem("survey_answers", JSON.stringify({
            enneagram: submission.enneagram, basic_info: submission.basic_info, origin: submission.origin,
            critical_error: submission.critical_error, core_loop: submission.core_loop, const: submission.const_value,
            status: submission.status, legacy: submission.legacy, dimension: submission.dimension,
          }))
          sessionStorage.setItem("survey_lang", submission.lang)
          router.replace(`/${lang}/payment`)
          return
        }
        if (submission.report && submission.report.length > 0) {
          const userName = extractName(submission.basic_info)
          const lvl = submission.report.match(/DIMENSION_LEVEL\s*[:：]\s*\[?(\w+)/)
          if (lvl && ['LOWER_DIMENSION','SAPIENT_ENTITY','AWAKENED','HIGH_DIMENSION'].includes(lvl[1])) {
            setDimensionLevel(lvl[1])
          } else {
            const MARKERS: [string, string][] = [
              ['高维生物_HIGH_DIMENSION', 'HIGH_DIMENSION'],
              ['觉醒者_AWAKENED', 'AWAKENED'],
              ['智慧生物_SAPIENT_ENTITY', 'SAPIENT_ENTITY'],
              ['低维生物_LOWER_DIMENSION', 'LOWER_DIMENSION'],
            ]
            const pair = MARKERS.find(([marker]) => submission.report.includes(marker))
            if (pair) setDimensionLevel(pair[1])
          }
          setReport(cleanReport(submission.report, userName))
          setTimeout(() => setVisible(true), 300)
          setStreamDone(true)
        } else {
          const answers = {
            enneagram: submission.enneagram, basic_info: submission.basic_info, origin: submission.origin,
            critical_error: submission.critical_error, core_loop: submission.core_loop, const: submission.const_value,
            status: submission.status, legacy: submission.legacy, dimension: submission.dimension,
          }
          await streamFromAnswers(answers, submission.lang, submission.id)
        }
      })()
      return
    }

    const isStreamMode = sessionStorage.getItem("stream_mode") === "true"

    if (isStreamMode) {
      sessionStorage.removeItem("stream_mode")
      sessionStorage.removeItem("life_code_result")
      const answers = JSON.parse(sessionStorage.getItem("survey_answers") ?? "{}")
      const surveyLang = sessionStorage.getItem("survey_lang") ?? lang
      const submissionId = sessionStorage.getItem("submission_id")
      sessionStorage.removeItem("submission_id")
      streamFromAnswers(answers, surveyLang, submissionId)
      return
    }

    // Legacy path: no sid, no stream_mode, but loaded result in sessionStorage
    const legacy = sessionStorage.getItem("life_code_result")
    if (legacy) {
      const savedAnswers = JSON.parse(sessionStorage.getItem("survey_answers") ?? "{}")
      const savedUserName = extractName(savedAnswers.basic_info)
      const lvl = legacy.match(/DIMENSION_LEVEL\s*[:：]\s*\[?(\w+)/)
      if (lvl && ['LOWER_DIMENSION','SAPIENT_ENTITY','AWAKENED','HIGH_DIMENSION'].includes(lvl[1])) {
        setDimensionLevel(lvl[1])
      } else {
        const MARKERS: [string, string][] = [
          ['高维生物_HIGH_DIMENSION', 'HIGH_DIMENSION'],
          ['觉醒者_AWAKENED', 'AWAKENED'],
          ['智慧生物_SAPIENT_ENTITY', 'SAPIENT_ENTITY'],
          ['低维生物_LOWER_DIMENSION', 'LOWER_DIMENSION'],
        ]
        const pair = MARKERS.find(([marker]) => legacy.includes(marker))
        if (pair) setDimensionLevel(pair[1])
      }
      setReport(cleanReport(legacy, savedUserName))
      setTimeout(() => setVisible(true), 300)
      setStreamDone(true)
      return
    }

    router.replace(`/${lang}`)
  }, [router, lang, sidParam])

  if (!report && !streaming) return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}>
      <div className="w-full max-w-2xl px-4 space-y-4 animate-pulse">
        <div className="h-3 w-32 rounded" style={{ background: "#0f2a0f" }} />
        <div className="h-8 w-64 rounded" style={{ background: "#0f2a0f" }} />
        <div className="h-3 w-48 rounded" style={{ background: "#0a1a0a" }} />
        <div className="space-y-2 pt-4">
          {[100, 85, 90, 75, 88, 60].map((w, i) => (
            <div key={i} className="h-3 rounded" style={{ background: "#0a1a0a", width: `${w}%` }} />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[92, 70, 80].map((w, i) => (
            <div key={i} className="h-3 rounded" style={{ background: "#0a1a0a", width: `${w}%` }} />
          ))}
        </div>
        <div className="text-xs pt-4" style={{ color: "#1e4a1e", fontFamily: "Courier New, monospace" }}>
          // {lang === "zh" ? "加载中..." : lang === "ko" ? "로딩 중..." : "Loading..."}
        </div>
      </div>
    </main>
  )

  const portrait = getPortrait(dimensionLevel, lang)

  const btnBase: React.CSSProperties = {
    background: "transparent",
    cursor: "pointer",
    fontFamily: "Courier New, monospace",
    transition: "all 0.2s",
  }

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}
    >
      {/* Top-right user menu */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu lang={lang} />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className={`space-y-2 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="text-xs" style={{ color: "#1e4a1e" }}>
            LIFE_CODE_SCANNER · {streaming ? "SCANNING..." : "REPORT GENERATED"}
          </div>
          <div
            className="text-xs px-3 py-2 border"
            style={{ borderColor: "#1a3a1a", background: "#0a150a", color: "#00ff8877" }}
          >
            <span style={{ color: "#1e4a1e" }}>&gt; </span>
            {streaming
              ? (lang === 'zh' ? '正在生成报告，请稍候...' : 'Generating report...')
              : `SCANNING COMPLETE · ${labels.generated}`}
          </div>
          {streaming && (
            <div className="text-xs animate-glow-pulse" style={{ color: "#00ff8855", fontFamily: "Courier New, monospace" }}>
              // WRITING YOUR LIFE CODE<span className="cursor" />
            </div>
          )}
        </div>

        {/* Report */}
        <div
          className={`transition-opacity duration-700 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ background: "#080e08", border: "1px solid #0f2a0f", borderRadius: "4px", padding: "1.5rem" }}
        >
          <div className="prose prose-invert max-w-none text-sm leading-relaxed" style={{ fontFamily: "Courier New, monospace" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => <h1 style={{ color: "#00ff88", fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: "bold" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ color: "#00ff88", fontSize: "1rem", marginTop: "1.5rem", marginBottom: "0.5rem", fontWeight: "bold" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: "#00cc6a", fontSize: "0.9rem", marginTop: "1rem", marginBottom: "0.25rem" }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: "#94a3b8", marginBottom: "0.75rem", lineHeight: "1.8" }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: "#e2e8f0" }}>{children}</strong>,
                code: ({ children }) => <code style={{ color: "#00ff88", background: "#0a1a0a", padding: "0 4px", borderRadius: "2px" }}>{children}</code>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: "2px solid #00ff8833", paddingLeft: "1rem", color: "#4a7a4a", fontStyle: "italic" }}>{children}</blockquote>,
                hr: () => <hr style={{ borderColor: "#0f2a0f", margin: "1.5rem 0" }} />,
                li: ({ children }) => <li style={{ color: "#94a3b8", marginBottom: "0.25rem" }}>{children}</li>,
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead>{children}</thead>,
                th: ({ children }) => (
                  <th style={{ border: "1px solid #1a3a1a", padding: "6px 12px", color: "#00ff88", textAlign: "left", background: "#0a150a" }}>{children}</th>
                ),
                td: ({ children }) => (
                  <td style={{ border: "1px solid #0f2a0f", padding: "6px 12px", color: "#94a3b8" }}>{children}</td>
                ),
                tr: ({ children }) => <tr style={{ borderBottom: "1px solid #0f2a0f" }}>{children}</tr>,
                pre: ({ children }) => (
                  <pre style={{
                    background: "#0a1a0a",
                    border: "1px solid #1a3a1a",
                    borderRadius: "4px",
                    padding: "0.75rem 1rem",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: "1.7",
                    margin: "0.75rem 0",
                    color: "#00ff88",
                    fontSize: "0.8rem",
                  }}>{children}</pre>
                ),
              }}
            >
              {report}
            </ReactMarkdown>
          </div>
        </div>

        {/* Dimension Portrait — only shown after stream completes */}
        {portrait && streamDone && (
          <div className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
            <pre style={{
              color: portrait.color,
              fontFamily: "Courier New, monospace",
              fontSize: "0.7rem",
              lineHeight: "1.45",
              background: "#080e08",
              border: `1px solid ${portrait.color}33`,
              borderRadius: "4px",
              padding: "1rem",
              overflowX: "auto",
              margin: 0,
              textAlign: "left",
            }}>
              {portrait.art}
            </pre>
          </div>
        )}

        {/* Share / Save section */}
        {streamDone && (
          <div className={`space-y-3 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>

            {/* Section label */}
            <div className="text-xs" style={{ color: "#1e4a1e", fontFamily: "Courier New, monospace" }}>
              // {lang === 'zh' ? '保存 · 分享' : 'SAVE · SHARE'}
            </div>

            {/* 3-button row */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShare}
                className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
                style={{ ...btnBase, border: `1px solid ${shared ? "#00ff88" : "#3a6a3a"}`, color: shared ? "#00ff88" : "#5a9a5a" }}
                onMouseEnter={(e) => { if (!shared) { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" } }}
                onMouseLeave={(e) => { if (!shared) { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" } }}
              >
                {shared ? (lang === 'zh' ? '✓ 链接已复制' : lang === 'ko' ? '✓ 복사됨' : '✓ Copied') : (lang === 'zh' ? '[ 分享给朋友 ]' : lang === 'ko' ? '[ 친구에게 공유 ]' : '[ Share ]')}
              </button>
              <button
                onClick={handleCopy}
                className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
                style={{ ...btnBase, border: `1px solid ${copied ? "#00ff88" : "#3a6a3a"}`, color: copied ? "#00ff88" : "#5a9a5a" }}
                onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" } }}
                onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" } }}
              >
                {copied ? (lang === 'zh' ? '✓ 已复制' : lang === 'ko' ? '✓ 복사됨' : '✓ Copied') : (lang === 'zh' ? '[ 复制报告 ]' : lang === 'ko' ? '[ 보고서 복사 ]' : '[ Copy ]')}
              </button>
              <button
                onClick={handleScreenshotHint}
                className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
                style={{ ...btnBase, border: "1px solid #3a6a3a", color: "#5a9a5a" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" }}
              >
                {lang === 'zh' ? '[ 保存截图 ]' : lang === 'ko' ? '[ 스크린샷 ]' : '[ Screenshot ]'}
              </button>
            </div>

            {/* My Archive */}
            <button
              onClick={() => router.push(`/${lang}/account`)}
              className="btn-result w-full py-3 text-sm font-bold tracking-wider"
              style={{ ...btnBase, border: "1px solid #3a6a3a", color: "#5a9a5a" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" }}
            >
              {lang === 'zh' ? '[ 我的档案 ]' : lang === 'ko' ? '[ 내 보관함 ]' : '[ My Archive ]'}
            </button>

            {/* Share modal */}
            {shareModal && (
              <div
                style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setShareModal(false)}
              >
                <div
                  className="space-y-4 p-6 border"
                  style={{ borderColor: "#2a5a2a", background: "#080e08", fontFamily: "Courier New, monospace", maxWidth: "360px", width: "90%" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
                    {lang === 'zh' ? '// 分享给朋友' : lang === 'ko' ? '// 친구에게 공유' : '// Share'}
                  </div>

                  {/* Platform buttons */}
                  {[
                    {
                      label: "WhatsApp",
                      color: "#25D366",
                      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
                    },
                    {
                      label: "X (Twitter)",
                      color: "#1DA1F2",
                      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                    },
                    {
                      label: lang === 'zh' ? '微博' : 'Weibo',
                      color: "#E6162D",
                      href: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
                    },
                  ].map(({ label, color, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 text-sm font-bold text-center"
                      style={{ border: `1px solid ${color}44`, color, background: "transparent", textDecoration: "none", letterSpacing: "0.05em" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}22` }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      {label}
                    </a>
                  ))}

                  {/* WeChat: copy link */}
                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: "#4a7a4a" }}>
                      {lang === 'zh' ? '微信：复制链接后在微信中粘贴分享' : lang === 'ko' ? 'WeChat: 링크를 복사해서 WeChat에 붙여넣기' : 'WeChat: Copy link and paste in WeChat'}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-3 text-sm font-bold"
                      style={{ border: `1px solid ${shared ? "#00ff88" : "#07C160"}`, color: shared ? "#00ff88" : "#07C160", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", letterSpacing: "0.05em" }}
                      onMouseEnter={(e) => { if (!shared) (e.currentTarget as HTMLElement).style.background = "#07C16022" }}
                      onMouseLeave={(e) => { if (!shared) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      {shared ? (lang === 'zh' ? '✓ 已复制' : '✓ Copied') : (lang === 'zh' ? '微信 — 复制链接' : lang === 'ko' ? 'WeChat — 링크 복사' : 'WeChat — Copy Link')}
                    </button>
                  </div>

                  <button
                    onClick={() => setShareModal(false)}
                    className="w-full py-2 text-sm"
                    style={{ border: "1px solid #2a5a2a", color: "#4a8a4a", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#00ff8866"; (e.currentTarget as HTMLElement).style.color = "#7aba7a" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a5a2a"; (e.currentTarget as HTMLElement).style.color = "#4a8a4a" }}
                  >
                    {lang === 'zh' ? '关闭' : lang === 'ko' ? '닫기' : 'Close'}
                  </button>
                </div>
              </div>
            )}

            {/* Screenshot modal */}
            {screenshotHint && (
              <div
                style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={handleScreenshotHint}
              >
                <div
                  className="text-xs space-y-3 p-6 border"
                  style={{ borderColor: "#2a5a2a", background: "#080e08", color: "#5a9a5a", fontFamily: "Courier New, monospace", maxWidth: "380px", width: "90%" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
                    {lang === 'zh' ? '// 保存截图 / 导出 PDF' : lang === 'ko' ? '// 스크린샷 저장 / PDF 내보내기' : '// Save Screenshot / Export PDF'}
                  </div>
                  {lang === 'zh' ? (
                    <>
                      <div>Mac：Command + Shift + 4 框选报告区域</div>
                      <div>Windows：Win + Shift + S 截取报告区域</div>
                      <div>导出 PDF：右键页面 → 打印 → 另存为 PDF</div>
                      <div>手机：使用系统截屏功能</div>
                    </>
                  ) : lang === 'ko' ? (
                    <>
                      <div>Mac: Command + Shift + 4 로 영역 선택</div>
                      <div>Windows: Win + Shift + S 로 캡처</div>
                      <div>PDF 내보내기: 우클릭 → 인쇄 → PDF로 저장</div>
                      <div>모바일: 시스템 스크린샷 기능 사용</div>
                    </>
                  ) : (
                    <>
                      <div>Mac: Command + Shift + 4 to select area</div>
                      <div>Windows: Win + Shift + S to capture</div>
                      <div>Export PDF: Right-click → Print → Save as PDF</div>
                      <div>Mobile: Use system screenshot</div>
                    </>
                  )}
                  <button
                    onClick={handleScreenshotHint}
                    className="w-full py-2 text-sm font-bold"
                    style={{ border: "1px solid #3a6a3a", color: "#5a9a5a", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", marginTop: "8px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" }}
                  >
                    {lang === 'zh' ? '关闭' : lang === 'ko' ? '닫기' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className={`flex gap-4 pb-16 transition-opacity duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => { sessionStorage.removeItem("life_code_result"); router.push(`/${lang}/survey`) }}
            className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
            style={{ ...btnBase, border: "1px solid #1a3a1a", color: "#2d5a2d" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {labels.rescan}
          </button>
          <button
            onClick={() => router.push(`/${lang}`)}
            className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
            style={{ ...btnBase, border: "1px solid #1a3a1a", color: "#2d5a2d" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {labels.home}
          </button>
        </div>
      </div>

    </main>
  )
}
