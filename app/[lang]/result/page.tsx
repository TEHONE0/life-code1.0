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
import { IconLock, IconScan, NeonRing } from "@/components/neon";
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

// Bug 含量：必须从原始报告解析（cleanReport 会把含 N/100 的 ╔═ ASCII 框删掉）
function parseBugScore(raw: string): number | null {
  const m = raw.match(/Bug[\s\S]{0,200}?(\d{1,3})\s*\/\s*100/i)
  return m ? Math.min(100, parseInt(m[1], 10)) : null
}

// 健康等级：Bug指数反查 Riso-Hudson Lv.1–9（enneagram_analysis_guide §6.1 区间，共用区间内二分）
function bugToLevel(score: number): number {
  if (score <= 10) return 1
  if (score <= 23) return 2
  if (score <= 35) return 3
  if (score <= 50) return 4
  if (score <= 60) return 5
  if (score <= 70) return 6
  if (score <= 80) return 7
  if (score <= 90) return 8
  return 9
}

// 三带命名（Lv.1–3 / 4–6 / 7–9）
const BAND_LABELS: Record<string, [string, string, string]> = {
  zh: ["运行流畅", "高负载运行", "亟需修复"],
  en: ["Running smoothly", "High load", "Needs repair"],
  ko: ["원활 작동", "고부하 작동", "수리 필요"],
}

// 型号×层级注解 81 条（F导 2026-06-10 确认版，系统语言转译，禁病理标签），仅中文报告显示
const HEALTH_NOTES: Record<string, string[]> = {
  完美: ["智慧已上线，接纳世界本来的样子", "理性清明，对错之外看见全局", "原则成为榜样，以身作则不说教", "改革者模式启动，总觉得世界欠修", "秩序强迫加载，细节失控即焦虑", "评判进程满载，对人对己零容错", "偏狭循环锁死，愤怒在找出口", "言行断裂报警，请先放过自己", "惩罚指向一切，急需外部支援"],
  助人: ["爱不求回报，给予即自由", "真诚关怀，先照顾好自己再给", "扶持他人成长，不绑定不索取", "讨好模式启动，付出开始计数", "占有欲加载，“我对你最好”上线", "自我感动满载，回报未达即委屈", "付出变操控，先承认自己的需要", "控制循环锁死，放手是第一补丁", "身体在替你报警，请立即求助"],
  成就: ["真实自我上线，价值无需证明", "自信由内而生，不靠掌声供电", "成为典范，成就开始照亮别人", "好胜模式启动，人生变成竞赛", "形象包装加载，真实感持续流失", "自我推销满载，害怕停下被看穿", "捷径诱惑出现，诚实是唯一补丁", "面具与本体断连，请先停演", "为赢不计代价，急需外部支援"],
  独特: ["痛苦炼成作品，创造力全开", "直觉敏锐，情绪是导航不是风暴", "真实表达自我，独特变成礼物", "唯美滤镜加载，现实开始失焦", "幻想身份运行，等待被人发现", "“例外”特权启动，沉溺即放纵", "自我疏离循环，出口仍然存在", "情绪风暴满载，请抓住一个人", "自毁倾向报警，请立即寻求支援"],
  思考: ["洞见开先河，思想照进现实", "观察入微，世界在你眼里透明", "专注创新，知识开始产出价值", "专家模式启动，准备永远差一步", "理论囤积加载，行动持续延期", "挑衅模式满载，用观点筑墙", "断连警报响起，虚无不是真相", "现实接口失效，请重建一条连接", "系统深度隔离，急需外部支援"],
  警觉: ["勇气上线，恐惧成为前进燃料", "值得信赖，安全感由内生成", "忠诚可靠，成为他人的定海针", "尽责模式启动，开始向外找靠山", "悲观扫描加载，凡事先想最坏", "反叛与依赖打架，立场反复横跳", "焦虑过载报警，先找一个安全锚点", "怀疑指向一切，请先相信一个人", "自我攻击循环，请立即寻求支援"],
  体验: ["喜悦深入骨髓，当下即满足", "热情感染世界，快乐有了根", "多才落地，体验转化为产出", "选项囤积启动，承诺开始过敏", "日程塞满加载，安静即恐慌", "享乐过载满载，快感阈值飙升", "逃避进程失控，痛苦需要被看见", "冲动循环锁死，先停下一件事", "系统失速报警，请立即寻求支援"],
  力量: ["力量化为胸怀，强者懂得温柔", "自信笃定，不靠压人证明自己", "建设性挑战，为弱者撑起屋顶", "冒险模式启动，凡事必争主导", "控制欲加载，谈判变成博弈", "对抗模式满载，示弱等于死亡", "规则失去约束，先放下一件武器", "全能幻觉报警，世界不是敌人", "破坏指向一切，急需外部支援"],
  和平: ["平静而有力，在场即是力量", "感受力全开，温和中有自己", "缔造和平，冲突在你面前化解", "迁就模式启动，自己的事永远排后", "置身事外加载，麻痹当成平静", "宿命论满载，“算了”成为口头禅", "逃避循环锁死，你的声音还在", "抽离警报响起，请回到身体里", "存在感接近休眠，请立即寻求支援"],
}

// W主权重 / b偏置：解析第零章参数表（非中文报告解析不到则显示"—"）
function parseMainWeight(md: string): string | null {
  const m = md.match(/(完美|助人|成就|独特|思考|警觉|体验|力量|和平)权重高/)
  return m ? m[1] : null
}
function parseBias(md: string): string | null {
  const m = md.match(/(自保|一对一|社交)偏置/)
  return m ? `${m[1]}偏置` : null
}

const LABELS = {
  en: { rescan: "Scan again", home: "Back to home", generated: "LIFE CODE REPORT GENERATED" },
  zh: { rescan: "重新扫描", home: "返回首页", generated: "生命代码解析报告已生成" },
  ko: { rescan: "다시 스캔", home: "홈으로", generated: "생명 코드 보고서 생성 완료" },
  ja: { rescan: "再スキャン", home: "ホームに戻る", generated: "ライフコードレポート生成完了" },
  th: { rescan: "สแกนใหม่", home: "กลับหน้าหลัก", generated: "รายงาน LIFE CODE ถูกสร้างแล้ว" },
  id: { rescan: "Scan ulang", home: "Kembali ke beranda", generated: "LAPORAN LIFE CODE TELAH DIBUAT" },
}

const mono = "Courier New, monospace";
const scifi = "Orbitron, Courier New, monospace";
const CARD = { border: "1px solid #1a3a1a", background: "#0a150a", borderRadius: "16px" } as const;

// 页面级 UI 文案（导航/侧边栏等界面文字）
const CHROME = {
  zh: {
    navLinks: [["", "首页"], ["#how", "如何生成"], ["#preview", "报告示例"], ["#about", "关于作者"]],
    navCta: "再测一位 →",
    sidebarTitle: "生命代码解析报告",
    sidebarSub: "LIFE CODE REPORT",
    metaName: "姓名",
    metaDate: "生成时间",
    metaId: "报告编号",
    metaStatus: "状态",
    statusDone: "已完成",
    statusGen: "生成中…",
    chapterNav: "章节导航",
    statsTitle: "报告核心读数",
    statBug: "BUG 指数",
    statHealth: "健康等级",
    statWeight: "权重",
    statBias: "偏置",
    security: "数据安全保护",
    securityNote: "报告仅你本人登录可见，不会出现在任何公开页面。",
  },
  en: {
    navLinks: [["", "Home"], ["#how", "How"], ["#preview", "Sample"], ["#about", "About"]],
    navCta: "Scan another →",
    sidebarTitle: "Life Code Report",
    sidebarSub: "LIFE CODE REPORT",
    metaName: "Name",
    metaDate: "Generated",
    metaId: "Report ID",
    metaStatus: "Status",
    statusDone: "Complete",
    statusGen: "Generating…",
    chapterNav: "Chapters",
    statsTitle: "Core readings",
    statBug: "BUG INDEX",
    statHealth: "Health level",
    statWeight: "Weight",
    statBias: "Bias",
    security: "Data protection",
    securityNote: "Your report is visible only to you and never appears on any public page.",
  },
  ko: {
    navLinks: [["", "홈"], ["#how", "생성 방식"], ["#preview", "리포트 예시"], ["#about", "제작자"]],
    navCta: "한 명 더 →",
    sidebarTitle: "라이프 코드 리포트",
    sidebarSub: "LIFE CODE REPORT",
    metaName: "이름",
    metaDate: "생성 시간",
    metaId: "리포트 번호",
    metaStatus: "상태",
    statusDone: "완료",
    statusGen: "생성 중…",
    chapterNav: "챕터",
    statsTitle: "핵심 수치",
    statBug: "BUG 지수",
    statHealth: "건강 레벨",
    statWeight: "가중치",
    statBias: "편향",
    security: "데이터 보호",
    securityNote: "리포트는 본인 로그인 시에만 볼 수 있으며 공개 페이지에 노출되지 않습니다.",
  },
};

const RESULT_LANGS = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

// 章节锚点：从 markdown 标题文本生成稳定 id（侧边栏与正文标题共用）
function chapterId(text: string): string {
  return "ch-" + text.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 50);
}
// ReactMarkdown children 拍平成纯文本
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatText(c: any): string {
  if (c == null) return "";
  if (Array.isArray(c)) return c.map(flatText).join("");
  if (typeof c === "object" && c.props?.children != null) return flatText(c.props.children);
  return String(c);
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
  const [userName, setUserName] = useState("")
  const [createdAt, setCreatedAt] = useState("")
  const [activeCh, setActiveCh] = useState("")
  const [bugScore, setBugScore] = useState<number | null>(null)

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
    setUserName(userName)
    setCreatedAt(new Date().toISOString().slice(0, 10))
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
        const b = parseBugScore(accumulated)
        if (b != null) setBugScore(b)
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
          setUserName(userName)
          setCreatedAt((submission.created_at || "").slice(0, 10))
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
          setBugScore(parseBugScore(submission.report))
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
      setUserName(savedUserName)
      setCreatedAt(new Date().toISOString().slice(0, 10))
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
      setBugScore(parseBugScore(legacy))
      setReport(cleanReport(legacy, savedUserName))
      setTimeout(() => setVisible(true), 300)
      setStreamDone(true)
      return
    }

    router.replace(`/${lang}`)
  }, [router, lang, sidParam])

  // 章节导航：从报告 markdown 的 h1/h2 标题提取（流式生成中会逐步增多）
  const chapters = report
    .split("\n")
    .filter((l) => /^#{1,2}\s+\S/.test(l))
    .map((l) => l.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())

  useEffect(() => {
    const ids = chapters.map(chapterId)
    const onScroll = () => {
      let cur = ids[0] || ""
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 180) cur = id
      }
      setActiveCh(cur)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters.join("|")])

  const goChapter = (title: string) => {
    document.getElementById(chapterId(title))?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // 破防句卡片：报告 h1 后的第一个引用块（> 开头的连续行）
  const strikeLines = (report.match(/^>\s?.*(?:\n>\s?.*)*/m)?.[0] || "")
    .split("\n")
    .map((l) => l.replace(/^>\s?/, "").replace(/`/g, "").trim())
    .filter(Boolean)
  const strikeFirst = strikeLines[0] || ""

  // 报告核心读数（全部从报告文本解析，与Bug指数同源）
  const healthLv = bugScore != null ? bugToLevel(bugScore) : null
  const healthBand = healthLv != null
    ? (BAND_LABELS[lang] ?? BAND_LABELS.en)[healthLv <= 3 ? 0 : healthLv <= 6 ? 1 : 2]
    : ""
  const mainWeight = parseMainWeight(report)
  const bias = parseBias(report)
  const healthNote = lang === "zh" && healthLv != null && mainWeight
    ? HEALTH_NOTES[mainWeight]?.[healthLv - 1] ?? ""
    : ""

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

  const chrome = CHROME[lang as keyof typeof CHROME] ?? CHROME.en

  return (
    <main
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}
    >
      {/* ───── 顶栏（与问卷页同构） ───── */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "#050a05ee", borderBottom: "1px solid #112811", backdropFilter: "blur(6px)" }}>
        <button onClick={() => router.push(`/${lang}`)} className="flex items-center gap-2" style={{ fontFamily: mono, background: "transparent", border: "none", cursor: "pointer" }}>
          <span className="text-base font-bold" style={{ color: "#00ff88", textShadow: "0 0 12px #00ff8866" }}>生命代码</span>
          <span className="text-xs" style={{ color: "#2d5a2d", letterSpacing: "0.15em", fontFamily: scifi }}>LIFE CODE</span>
        </button>
        <div className="hidden md:flex gap-6 text-xs" style={{ fontFamily: mono }}>
          {chrome.navLinks.map(([anchor, label]) => (
            <a key={label} href={`/${lang}${anchor}`} style={{ color: "#4a7a4a", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1.5">
            {RESULT_LANGS.map((l) => (
              <button key={l.code} onClick={() => router.push(`/${l.code}/result${sidParam ? `?sid=${sidParam}` : ""}`)} className="text-xs px-1.5 py-0.5" style={{ background: "transparent", border: "none", color: l.code === lang ? "#00ff88" : "#2d5a2d", cursor: "pointer", fontFamily: mono }}>
                {l.label}
              </button>
            ))}
          </div>
          <UserMenu lang={lang} />
          <button
            onClick={() => { sessionStorage.removeItem("life_code_result"); router.push(`/${lang}/survey`) }}
            className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider"
            style={{ border: "none", color: "#04140a", cursor: "pointer", fontFamily: mono, borderRadius: "14px", background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)", boxShadow: "0 0 22px #00ff8855, 0 2px 10px #00000066" }}
          >
            {chrome.navCta}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 grid gap-6 items-start lg:grid-cols-[260px_1fr]">

        {/* ───── 左侧边栏 ───── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
          <div className="p-5 space-y-4" style={CARD}>
            <div>
              <div className="text-sm font-bold" style={{ color: "#e2e8f0", fontFamily: mono }}>{chrome.sidebarTitle}</div>
              <div className="text-xs mt-1" style={{ color: "#2d5a2d", fontFamily: mono, letterSpacing: "0.12em" }}>{chrome.sidebarSub}</div>
            </div>
            <div className="space-y-2 text-xs" style={{ fontFamily: mono }}>
              {[
                [chrome.metaName, userName || "—"],
                [chrome.metaDate, createdAt || "—"],
                [chrome.metaId, sidParam ? sidParam.slice(0, 8).toUpperCase() : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: "#2d5a2d" }}>{k}</span>
                  <span className="truncate" style={{ color: "#6fae6f" }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between gap-2">
                <span style={{ color: "#2d5a2d" }}>{chrome.metaStatus}</span>
                <span style={{ color: streaming ? "#4db8ff" : "#00ff88" }}>{streaming ? chrome.statusGen : chrome.statusDone}</span>
              </div>
            </div>
          </div>

          {chapters.length > 0 && (
            <div className="p-2 space-y-1" style={CARD}>
              <div className="px-3 pt-2 pb-1 text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>{chrome.chapterNav}</div>
              {chapters.map((c) => {
                const isActive = chapterId(c) === activeCh
                return (
                  <button
                    key={c}
                    onClick={() => goChapter(c)}
                    className="w-full px-3 py-2 text-left text-xs truncate"
                    style={{
                      background: isActive ? "#00ff8814" : "transparent",
                      border: `1px solid ${isActive ? "#00ff8855" : "transparent"}`,
                      borderRadius: "10px", cursor: "pointer", fontFamily: mono,
                      color: isActive ? "#00ff88" : "#4a7a4a",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          )}

          <div className="p-5 space-y-2" style={CARD}>
            <div className="flex items-center gap-2">
              {IconLock}
              <span className="text-xs font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{chrome.security}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{chrome.securityNote}</p>
          </div>
        </aside>

        {/* ───── 主内容 ───── */}
        <div className="space-y-6 min-w-0">

        {/* Header */}
        <div className={`space-y-2 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="flex justify-between items-center text-xs" style={{ fontFamily: mono }}>
            <span style={{ color: "#2d5a2d", letterSpacing: "0.08em" }}>LIFE_CODE_SCANNER · {streaming ? "SCANNING..." : "REPORT GENERATED"}</span>
            <span style={{ color: streaming ? "#4db8ff" : "#00ff88" }}>{streaming ? "SCANNING..." : "✓ COMPLETE"}</span>
          </div>
          <div
            className="text-xs px-4 py-3"
            style={{ border: "1px solid #1a3a1a", background: "#0a150a88", borderRadius: "10px", color: "#6fae6f", fontFamily: mono }}
          >
            <span style={{ color: "#2d5a2d" }}>&gt; </span>
            {streaming
              ? (lang === 'zh' ? '正在生成报告，由于算法复杂，要消耗大量token，请耐心等待...' : 'Generating report — this involves heavy computation and may take a while, please be patient...')
              : `SCANNING COMPLETE · ${labels.generated}`}
          </div>
          {streaming && (
            <div className="text-xs animate-glow-pulse" style={{ color: "#00ff8855", fontFamily: mono }}>
              // WRITING YOUR LIFE CODE<span className="cursor" />
            </div>
          )}
        </div>

        {/* 报告核心读数 */}
        {(bugScore != null || mainWeight) && (
          <div className={`transition-opacity duration-700 delay-150 ${visible ? "opacity-100" : "opacity-0"}`}>
            <div className="text-xs mb-2" style={{ color: "#2d5a2d", fontFamily: mono, letterSpacing: "0.08em" }}>
              ◇ {chrome.statsTitle}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: chrome.statBug, value: bugScore != null ? `${bugScore}` : "—", suffix: bugScore != null ? " / 100" : "", color: "#4db8ff", note: "" },
                { label: chrome.statHealth, value: healthLv != null ? `Lv.${healthLv}` : "—", suffix: healthLv != null ? ` / 9 · ${healthBand}` : "", color: healthLv != null && healthLv >= 7 ? "#4db8ff" : "#00ff88", note: healthNote },
                { label: chrome.statWeight, value: mainWeight ? `${mainWeight}权重` : "—", suffix: mainWeight ? "高" : "", color: "#00ff88", note: "" },
                { label: chrome.statBias, value: bias ?? "—", suffix: "", color: "#00ff88", note: "" },
              ].map((s) => (
                <div key={s.label} className="p-4" style={CARD}>
                  <div className="text-xs mb-1.5" style={{ color: "#2d5a2d", fontFamily: mono }}>{s.label}</div>
                  <div className="truncate" style={{ color: s.color, fontFamily: scifi, fontSize: "1.15rem", fontWeight: 700, textShadow: `0 0 14px ${s.color}55` }}>
                    {s.value}
                    {s.suffix && <span style={{ fontSize: "0.7rem", color: "#4a7a4a", fontFamily: mono, fontWeight: 400 }}>{s.suffix}</span>}
                  </div>
                  {s.note && (
                    <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "#5a7a5a", fontFamily: mono }}>{s.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        <div
          ref={reportRef}
          className={`transition-opacity duration-700 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ background: "#080e08", border: "1px solid #1a3a1a", borderRadius: "16px", padding: "1.5rem" }}
        >
          <div ref={reportInnerRef}>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed" style={{ fontFamily: "Courier New, monospace" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => (
                  <h1 id={chapterId(flatText(children))} style={{ color: "#00ff88", fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "bold", textShadow: "0 0 20px #00ff8844", scrollMarginTop: 90 }}>{children}</h1>
                ),
                h2: ({ children }) => <h2 id={chapterId(flatText(children))} style={{ color: "#00ff88", fontSize: "1.1rem", marginTop: "2rem", marginBottom: "0.6rem", fontWeight: "bold", paddingBottom: "0.4rem", borderBottom: "1px solid #112811", scrollMarginTop: 90 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: "#00cc6a", fontSize: "0.95rem", marginTop: "1.2rem", marginBottom: "0.3rem", fontWeight: "bold" }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: "#94a3b8", marginBottom: "0.75rem", lineHeight: "1.9" }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: "#e2e8f0" }}>{children}</strong>,
                code: ({ children }) => <code style={{ color: "#00ff88", background: "#0a1a0a", padding: "0 4px", borderRadius: "4px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</code>,
                blockquote: ({ children }) => {
                  // 开头的破防句引用块 → 醒目卡片（图标 + 高亮首句）
                  const txt = flatText(children).replace(/\s+/g, " ").trim()
                  if (strikeFirst.length > 5 && txt.startsWith(strikeFirst.slice(0, 12))) {
                    return (
                      <>
                        <div className="flex items-center justify-center gap-3 px-5 py-2.5" style={{ background: "#0a1f0a", border: "1px solid #00ff8855", borderRadius: "14px", boxShadow: "0 0 35px #00ff8815", margin: "1rem 0 0.75rem" }}>
                          <div style={{ flexShrink: 0 }}><NeonRing size={36}>{IconScan}</NeonRing></div>
                          <div className="min-w-0 text-center" style={{ color: "#00ff88", fontWeight: 700, fontSize: "1.02rem", lineHeight: 1.7, textShadow: "0 0 16px #00ff8844" }}>{strikeLines[0]}</div>
                        </div>
                        {strikeLines.length > 1 && (
                          <div style={{ borderLeft: "3px solid #00ff8833", padding: "0.5rem 1rem", margin: "0 0 1rem" }}>
                            {strikeLines.slice(1).map((l, i) => (
                              <div key={i} style={{ color: "#5a7a5a", fontFamily: "Courier New, monospace", fontSize: "0.78rem", lineHeight: 1.8 }}>{l}</div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  }
                  return <blockquote style={{ borderLeft: "3px solid #00ff88", background: "#0a1f0a66", padding: "0.75rem 1rem", borderRadius: "0 10px 10px 0", color: "#8fbf8f", margin: "1rem 0" }}>{children}</blockquote>
                },
                hr: () => <hr style={{ borderColor: "#112811", margin: "1.5rem 0" }} />,
                li: ({ children }) => <li style={{ color: "#94a3b8", marginBottom: "0.25rem" }}>{children}</li>,
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", marginBottom: "1rem", border: "1px solid #1a3a1a", borderRadius: "10px" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead>{children}</thead>,
                th: ({ children }) => (
                  <th style={{ borderBottom: "1px solid #1a3a1a", padding: "8px 12px", color: "#00ff88", textAlign: "left", background: "#0a150a" }}>{children}</th>
                ),
                td: ({ children }) => (
                  <td style={{ borderBottom: "1px solid #0f2a0f", padding: "8px 12px", color: "#94a3b8" }}>{children}</td>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                pre: ({ children }) => (
                  <pre style={{
                    background: "#0a1a0a",
                    border: "1px solid #1a3a1a",
                    borderRadius: "10px",
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
                borderRadius: "12px",
                boxShadow: `0 0 30px ${portrait.color}15`,
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
            <div className="space-y-2 p-5" style={{ ...CARD, fontFamily: "Courier New, monospace" }}>
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
                  className="space-y-4 p-6"
                  style={{ border: "1px solid #2a5a2a", borderRadius: "16px", background: "#080e08", fontFamily: "Courier New, monospace", maxWidth: "360px", width: "90%" }}
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
      </div>

    </main>
  )
}
