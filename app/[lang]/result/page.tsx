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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  ja: { rescan: "再スキャン", home: "ホームに戻る", generated: "ライフコードレポート生成完了" },
  th: { rescan: "สแกนใหม่", home: "กลับหน้าหลัก", generated: "รายงาน LIFE CODE ถูกสร้างแล้ว" },
  id: { rescan: "Scan ulang", home: "Kembali ke beranda", generated: "LAPORAN LIFE CODE TELAH DIBUAT" },
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
  const [exportingPdf, setExportingPdf] = useState(false)
  const [giftCodes, setGiftCodes] = useState<{ code: string; label: string | null; used_count: number; max_uses: number | null; expires_at: string | null }[]>([])
  const [giftBuying, setGiftBuying] = useState(false)
  const [copiedGift, setCopiedGift] = useState<string | null>(null)

  // 我的赠礼码（买一赠一所得/单独购买）
  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) return
      const res = await fetch("/api/my-gift-codes", { headers: { Authorization: `Bearer ${data.session.access_token}` } })
      const json = await res.json()
      setGiftCodes(json.codes || [])
    })()
  }, [])

  const handleBuyGift = async () => {
    if (giftBuying) return
    setGiftBuying(true)
    try {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) return
      const res = await fetch("/api/create-gift-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ lang }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } finally {
      setGiftBuying(false)
    }
  }

  const copyGiftCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopiedGift(code)
    setTimeout(() => setCopiedGift(null), 2000)
  }
  const reportRef = useRef<HTMLDivElement>(null)
  const reportInnerRef = useRef<HTMLDivElement>(null)
  // Prevents double execution (StrictMode guard + re-render guard)
  const effectRan = useRef(false)

  const shareUrl = `https://lifecode9.com/${lang}`

  const shareText = lang === 'zh'
    ? '找到人生系统里悄悄运行的Bug，重新选择怎么活 →'
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

  // 微信不开放网页直接拉起分享的接口（无法用URL跳转），唯一能"直接打到App"的办法
  // 是调用系统分享面板（Web Share API）——手机装了微信的话，面板里会直接出现微信选项
  const handleShareToWeChat = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: shareUrl })
        return
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return // 用户取消分享面板
      }
    }
    // 不支持系统分享面板（如桌面浏览器）时，退回复制链接
    handleCopyLink()
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

  const handleExportPdf = async () => {
    const node = reportRef.current
    const inner = reportInnerRef.current
    if (!node || !inner || exportingPdf) return
    setExportingPdf(true)

    // 整个报告一次性截成大canvas，html2canvas克隆超高DOM时会被截断（手机上只渲染到一半就停）
    // 改法：每次只让html2canvas克隆"一屏"高度的内容——把外层裁成固定高度窗口，
    // 内层用 translateY 把对应分段移到窗口里，逐段截图后拼成多页PDF
    const origNodeStyle = { height: node.style.height, overflow: node.style.overflow, width: node.style.width }
    const origInnerTransform = inner.style.transform
    try {
      // 宽内容（长ASCII画/宽表格）会横向溢出可视宽度，只按 clientWidth 截图右边会被切。
      // 导出前把窗口临时加宽到完整内容宽度，截完在 finally 里恢复
      if (node.scrollWidth > node.clientWidth) {
        node.style.width = `${node.scrollWidth}px`
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      }
      // +32px缓冲：避免最后一个区块（如画像边框）因取整误差被切掉底边
      const totalHeight = inner.scrollHeight + 32
      const totalWidth = Math.max(node.clientWidth, node.scrollWidth)
      const sliceHeight = 1000 // 窗口高度（px），保持较小，确保每次克隆的DOM体积可控
      const scale = 1.5
      let pdf: jsPDF | null = null

      node.style.overflow = "hidden"
      for (let top = 0; top < totalHeight; top += sliceHeight) {
        const sh = Math.min(sliceHeight, totalHeight - top)
        node.style.height = `${sh}px`
        inner.style.transform = `translateY(-${top}px)`
        // 等待重排完成再截图
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

        const canvas = await html2canvas(node, {
          backgroundColor: "#080e08",
          scale,
          useCORS: true,
          width: totalWidth,
          height: sh,
        })
        const imgData = canvas.toDataURL("image/jpeg", 0.92)
        if (!pdf) {
          pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] })
        } else {
          pdf.addPage([canvas.width, canvas.height])
        }
        pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height)
      }
      if (!pdf) return
      const fileName = `生命代码报告_${Date.now()}.pdf`
      const blob = pdf.output("blob")

      // 手机浏览器（尤其iOS Safari）对 a[download] 支持差，优先用系统分享面板，让用户选"存储到文件/保存图片"
      const file = new File([blob], fileName, { type: "application/pdf" })
      // 桌面端系统分享面板没有"保存到文件"，直接触发浏览器下载；移动端保留分享面板（可存到"文件"）
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName })
      } else {
        pdf.save(fileName)
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        // 用户取消了分享面板，不算错误
      } else {
        console.error("PDF export failed:", e)
      }
    } finally {
      node.style.height = origNodeStyle.height
      node.style.overflow = origNodeStyle.overflow
      node.style.width = origNodeStyle.width
      inner.style.transform = origInnerTransform
      setExportingPdf(false)
    }
  }

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
       try {
        const { data } = await supabaseBrowser.auth.getSession()
        if (!data.session) {
          router.replace(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/result?sid=${sidParam}`)}`)
          return
        }

        // 从支付页跳回时，异步回调可能还未到达，轮询等待 paid=true（最多30秒）
        const fromPayment = searchParams.get('source') === 'payment'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let submission: any = null

        const fetchSubmission = async () => {
          const res = await fetch(`/api/submission/${sidParam}`, {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          })
          if (!res.ok) { router.replace(`/${lang}/account`); return false }
          submission = (await res.json()).submission
          return true
        }

        if (fromPayment) {
          for (let i = 0; i < 15; i++) {
            const ok = await fetchSubmission()
            if (!ok) return
            if (submission.paid) break
            await new Promise(r => setTimeout(r, 2000))
          }
        } else {
          const ok = await fetchSubmission()
          if (!ok) return
        }

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
        const rescan = searchParams.get('rescan') === '1'
        // 完整报告固定以 DIMENSION_LEVEL 结尾；付费但报告残缺（卡断）时，自动免费重生成
        const reportComplete = submission.report && /DIMENSION_LEVEL/.test(submission.report)
        if (reportComplete && !rescan) {
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
       } catch (e) {
         console.error("Result page load failed:", e)
         router.replace(`/${lang}/account`)
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
    borderRadius: "12px",
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
              ? (lang === 'zh' ? '正在生成报告，由于算法复杂，要消耗大量token，请耐心等待...' : 'Generating report — this involves heavy computation and may take a while, please be patient...')
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
          ref={reportRef}
          className={`transition-opacity duration-700 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ background: "#080e08", border: "1px solid #0f2a0f", borderRadius: "4px", padding: "1.5rem" }}
        >
          <div ref={reportInnerRef}>
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
                code: ({ children }) => <code style={{ color: "#00ff88", background: "#0a1a0a", padding: "0 4px", borderRadius: "2px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</code>,
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

          {/* Dimension Portrait — only shown after stream completes. 放在 reportRef 容器内，导出PDF时才能截到 */}
          {portrait && streamDone && (
            <div className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`} style={{ marginTop: "1.5rem" }}>
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
          </div>
        </div>

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
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
                style={{ ...btnBase, border: "1px solid #3a6a3a", color: "#5a9a5a", opacity: exportingPdf ? 0.6 : 1, cursor: exportingPdf ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!exportingPdf) { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" } }}
                onMouseLeave={(e) => { if (!exportingPdf) { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" } }}
              >
                {exportingPdf
                  ? (lang === 'zh' ? '[ 生成中... ]' : lang === 'ko' ? '[ 생성 중... ]' : '[ Generating... ]')
                  : (lang === 'zh' ? '[ 保存为PDF ]' : lang === 'ko' ? '[ PDF로 저장 ]' : '[ Save as PDF ]')}
              </button>
            </div>

            {/* 赠礼码：买一赠一所得 + 单独购买 */}
            <div className="space-y-2 p-4" style={{ border: "1px solid #3a6a3a", fontFamily: "Courier New, monospace" }}>
              <div className="text-sm font-bold" style={{ color: "#fbbf24" }}>
                🎁 {lang === 'zh' ? '送一份给你最想读懂的人' : lang === 'ko' ? '소중한 사람에게 선물하세요' : 'Gift one to someone you care about'}
              </div>
              {giftCodes.map((g) => {
                const used = g.max_uses != null && g.used_count >= g.max_uses
                const expired = !used && g.expires_at != null && new Date(g.expires_at) < new Date()
                return (
                  <div key={g.code} className="flex items-center justify-between text-xs py-1" style={{ borderBottom: "1px solid #112811" }}>
                    <span style={{ color: used || expired ? "#2d5a2d" : "#00ff88", letterSpacing: "0.1em", textDecoration: used || expired ? "line-through" : "none" }}>{g.code}</span>
                    <span style={{ color: "#4a7a4a" }}>
                      {used
                        ? (lang === 'zh' ? '已使用' : 'used')
                        : expired
                        ? (lang === 'zh' ? '已过期' : 'expired')
                        : (
                          <button onClick={() => copyGiftCode(g.code)} style={{ border: "1px solid #3a6a3a", color: copiedGift === g.code ? "#00ff88" : "#5a9a5a", background: "transparent", cursor: "pointer", padding: "2px 8px", fontFamily: "inherit", borderRadius: "8px" }}>
                            {copiedGift === g.code ? (lang === 'zh' ? '✓ 已复制' : '✓ Copied') : (lang === 'zh' ? '复制' : 'Copy')}
                          </button>
                        )}
                    </span>
                  </div>
                )
              })}
              {giftCodes.some((g) => !(g.max_uses != null && g.used_count >= g.max_uses) && !(g.expires_at != null && new Date(g.expires_at) < new Date())) && (
                <div className="text-xs" style={{ color: "#4a7a4a" }}>
                  {lang === 'zh' ? '把上面的码发给朋友，TA在支付页输入即可免费解锁（30天内有效）' : lang === 'ko' ? '코드를 친구에게 보내면 무료로 이용할 수 있습니다 (30일 유효)' : 'Send the code to a friend — they enter it at checkout to unlock for free (valid 30 days)'}
                </div>
              )}
              <button
                onClick={handleBuyGift}
                disabled={giftBuying}
                className="btn-result w-full py-3 text-sm font-bold tracking-wider"
                style={{ ...btnBase, border: "1px solid #3a6a3a", color: "#5a9a5a", opacity: giftBuying ? 0.6 : 1, cursor: giftBuying ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!giftBuying) { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#7aba7a" } }}
                onMouseLeave={(e) => { if (!giftBuying) { e.currentTarget.style.borderColor = "#3a6a3a"; e.currentTarget.style.color = "#5a9a5a" } }}
              >
                {giftBuying
                  ? (lang === 'zh' ? '[ 跳转支付中... ]' : '[ ... ]')
                  : (lang === 'zh' ? '[ 再送一位朋友 ¥18.8 ]' : lang === 'ko' ? '[ 친구에게 선물 ¥18.8 ]' : '[ Gift a friend ¥18.8 ]')}
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

                  {/* WeChat: 系统分享面板，装了微信会直接出现微信选项；不支持时退回复制链接 */}
                  <button
                    onClick={handleShareToWeChat}
                    className="w-full py-3 text-sm font-bold"
                    style={{ border: `1px solid ${shared ? "#00ff88" : "#07C160"}`, color: shared ? "#00ff88" : "#07C160", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", letterSpacing: "0.05em" }}
                    onMouseEnter={(e) => { if (!shared) (e.currentTarget as HTMLElement).style.background = "#07C16022" }}
                    onMouseLeave={(e) => { if (!shared) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    {shared ? (lang === 'zh' ? '✓ 已复制链接' : '✓ Copied') : (lang === 'zh' ? '分享到微信' : lang === 'ko' ? 'WeChat으로 공유' : 'Share to WeChat')}
                  </button>

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
