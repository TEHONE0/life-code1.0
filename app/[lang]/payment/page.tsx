"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getT, Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track } from "@/lib/track";
import { useTap } from "@/lib/useTap";

// ── 简报数据解析 ────────────────────────────────────────────────
interface PreviewData {
  bugScore: number;
  healthLevel: number;
  weight: string;
  bias: string;
  opening: string;
  bug01: string;
  bugTotal: number;
  jinjing: string;
}

function parsePreview(text: string): PreviewData | null {
  try {
    // 按 START 锚点切到下一段开头，不依赖 AI 精确闭合 END 标记
    // （AI 偶尔会把 OPENING_END 误写成 PREVIEW_META_END、或漏写 JINJING_END）
    const sliceFrom = (startMark: string, stopMarks: string[]) => {
      const si = text.indexOf(startMark);
      if (si === -1) return "";
      const from = si + startMark.length;
      let to = text.length;
      for (const m of stopMarks) {
        const ei = text.indexOf(m, from);
        if (ei !== -1 && ei < to) to = ei;
      }
      return text.slice(from, to);
    };
    // 清掉段内残留的任何标记行
    const clean = (s: string) =>
      s.split("\n")
        .filter((l) => !/^(PREVIEW_META_(START|END)|OPENING_(START|END)|BUG01_(START|END)|JINJING_(START|END)|BUG_TOTAL:)/.test(l.trim()))
        .join("\n").trim();

    const metaRaw = sliceFrom("PREVIEW_META_START", ["PREVIEW_META_END", "OPENING_START"]);
    const line = (key: string) =>
      metaRaw.match(new RegExp(key + ":(.+)"))?.[1]?.trim() || "";
    return {
      bugScore: parseInt(line("BUG_SCORE")) || 0,
      healthLevel: parseInt(line("HEALTH_LEVEL")) || 0,
      weight: line("WEIGHT"),
      bias: line("BIAS"),
      opening: clean(sliceFrom("OPENING_START", ["BUG01_START"])),
      bug01: clean(sliceFrom("BUG01_START", ["BUG01_END", "BUG_TOTAL:", "JINJING_START"])),
      bugTotal: parseInt(text.match(/BUG_TOTAL:(\d+)/)?.[1] || "5"),
      jinjing: clean(sliceFrom("JINJING_START", ["JINJING_END"])),
    };
  } catch {
    return null;
  }
}

// ── 简报渲染：将 markdown 开场白转为 JSX ────────────────────────
function OpeningBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let inQuote = false;
  let quoteLines: string[] = [];

  const flushCode = (key: number) => {
    nodes.push(
      <div key={`code-${key}`} style={{
        background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: "12px",
        padding: "14px 16px", margin: "12px 0", fontFamily: "Courier New, monospace",
        fontSize: "13px", color: "#00cc6a", lineHeight: "1.7",
        whiteSpace: "pre-wrap",
      }}>
        {codeLines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    );
    codeLines = [];
  };
  const flushQuote = (key: number) => {
    nodes.push(
      <div key={`quote-${key}`} style={{
        borderLeft: "3px solid #00ff8844", paddingLeft: "14px", margin: "12px 0",
        color: "#4a8a4a", fontFamily: "Courier New, monospace", fontSize: "13px", lineHeight: "1.7",
      }}>
        {quoteLines.map((l, i) => <div key={i}>{l.replace(/^>\s?/, "")}</div>)}
      </div>
    );
    quoteLines = [];
  };

  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith("```")) { inCode = !inCode; if (!inCode) flushCode(i); return; }
    if (inCode) { codeLines.push(raw); return; }
    if (l.startsWith(">")) {
      if (!inQuote) inQuote = true;
      quoteLines.push(l);
      // peek next
      const next = lines[i + 1]?.trim() || "";
      if (!next.startsWith(">")) { inQuote = false; flushQuote(i); }
      return;
    }
    if (l === "") { nodes.push(<div key={i} style={{ height: "8px" }} />); return; }
    nodes.push(
      <p key={i} style={{ color: "#c8d8c8", fontSize: "15px", lineHeight: "1.85", margin: "6px 0" }}>
        {l.replace(/\*\*(.*?)\*\*/g, "$1")}
      </p>
    );
  });

  return <div>{nodes}</div>;
}

function AnimatedDots() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDots(d => d === 3 ? 1 : d + 1), 500)
    return () => clearInterval(id)
  }, [])
  return <span style={{ display: "inline-block", width: "1.5em", textAlign: "left" }}>{"·".repeat(dots)}</span>
}

export default function PaymentPage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const t = getT(lang)
  const router = useRouter()
  const tap = useTap()
  const [loading, setLoading] = useState(false)
  const [hasAnswers, setHasAnswers] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [inviteLabel, setInviteLabel] = useState("")
  const [inviteFreeAccess, setInviteFreeAccess] = useState(false)
  const [tradeType] = useState<"ALIPAY">("ALIPAY")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(true)

  useEffect(() => {
    const answersRaw = sessionStorage.getItem("survey_answers")
    if (!answersRaw) {
      router.push(`/${lang}/survey?restore=1`)
      return
    }
    setHasAnswers(true)
    track("payment_view", { once: true, lang })
    // 先用问卷页缓存的邮箱立即渲染界面，不必干等下面的 getSession 网络回来（手机黑屏根因）
    const cachedEmail = sessionStorage.getItem("user_email")
    if (cachedEmail) setUserEmail(cachedEmail)

    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/payment`)}`)
        return
      }
      setUserEmail(data.session.user.email ?? null)

      // Claim anonymous draft (or create new draft) now that user is logged in
      const existingId = sessionStorage.getItem("existing_submission_id") || undefined
      try {
        const res = await fetch("/api/save-draft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            answers: JSON.parse(answersRaw),
            lang,
            existingSubmissionId: existingId,
          }),
        })
        const json = await res.json()
        if (json.submissionId) {
          sessionStorage.setItem("existing_submission_id", json.submissionId)
          // 触发简报生成（不阻塞页面）
          generatePreview(json.submissionId, data.session.access_token)
        }
      } catch {
        // Non-fatal: answers still in sessionStorage as fallback
      }
    })
  }, [lang, router])

  const generatePreview = async (submissionId: string, accessToken: string) => {
    setPreviewLoading(true)
    try {
      const res = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ submissionId }),
      })
      const json = await res.json()
      if (json.preview) {
        const parsed = parsePreview(json.preview)
        if (parsed) setPreview(parsed)
      }
    } catch { /* 静默失败 */ } finally {
      setPreviewLoading(false)
    }
  }

  const handleInviteCheck = async () => {
    if (!inviteCode.trim()) return
    const res = await fetch("/api/validate-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim() }),
    })
    const json = await res.json()
    if (json.valid) {
      setInviteStatus("valid")
      setInviteLabel(json.label || "")
      setInviteFreeAccess(!!json.freeAccess)
    } else {
      setInviteStatus("invalid")
      setInviteFreeAccess(false)
    }
  }

  // 自动识别邀请码：输入停顿后自动验证，不用再手动点"验证"
  useEffect(() => {
    if (!inviteCode.trim()) { setInviteStatus("idle"); return }
    const timer = setTimeout(() => { handleInviteCheck() }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode])

  const handlePayment = async () => {
    setError("")
    setLoading(true)
    try {
      const answers = JSON.parse(sessionStorage.getItem("survey_answers") || "{}")
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ lang, answers, tradeType, inviteCode: inviteStatus === "valid" ? inviteCode.trim().toUpperCase() : undefined, existingSubmissionId: sessionStorage.getItem("existing_submission_id") || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Checkout failed")
        setLoading(false)
        return
      }
      if (json.testMode) {
        sessionStorage.setItem("submission_id", json.submissionId)
        sessionStorage.setItem("stream_mode", "true")
        router.push(`/${lang}/result`)
        return
      }
      // 虎皮椒返回跳转URL，直接跳到支付页
      if (json.url) {
        window.location.href = json.url
        return
      }
      setError(lang === 'zh' ? '支付创建失败，请重试' : 'Payment failed, please retry')
      setLoading(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error")
      setLoading(false)
    }
  }

  // 兜底加载态（无缓存邮箱时短暂出现）：给暗底 loading 提示，不再黑屏
  if (!hasAnswers || !userEmail) return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ background: "radial-gradient(ellipse at center, #061206 0%, #050a05 70%)" }}>
      <div className="text-sm" style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace" }}>
        {lang === 'zh' ? '// 正在进入支付' : lang === 'ko' ? '// 결제 페이지로 이동 중' : '// Entering checkout'}<AnimatedDots />
      </div>
    </main>
  )

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "radial-gradient(ellipse at center, #061206 0%, #050a05 70%)" }}
    >
      <div className="w-full max-w-md text-center space-y-8">
        <div className="text-xs" style={{ color: "#1e4a1e" }}>
          // {lang === 'zh' ? '已登录' : lang === 'ko' ? '로그인됨' : 'Logged in'}: {userEmail}
        </div>

        <div
          className="inline-block px-3 py-1 text-xs border rounded-sm"
          style={{ borderColor: "#1a3a1a", color: "#00ff8877", background: "#0a1a0a" }}
        >
          LIFE_CODE_SCANNER · READY
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
            {t.paymentTitle}
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {t.paymentSubtitle}
          </p>
        </div>

        <div
          className="text-left p-4 border space-y-2"
          style={{ borderColor: "#0f2a0f", background: "#080e08", fontFamily: "Courier New, monospace", borderRadius: "16px" }}
        >
          <div className="text-xs" style={{ color: "#2d5a2d" }}>
            {lang === 'zh' ? '// 扫描完成 · 检测到以下信号' : '// Scan complete · Signals detected'}
          </div>
          <div className="text-xs" style={{ color: "#1a3a1a" }}>
            {lang === 'zh' ? 'Bug 密度：' : 'Bug density: '}
            <span style={{ color: "#00ff8855" }}>{'█'.repeat(7)}{'░'.repeat(5)} {lang === 'zh' ? '已检出' : 'detected'}</span>
          </div>
          <div className="text-xs" style={{ color: "#1a3a1a" }}>
            {lang === 'zh' ? '主权重：' : 'Primary weight: '}
            <span style={{ color: "#00ff8855" }}>{lang === 'zh' ? '已识别 · 待解锁' : 'identified · locked'}</span>
          </div>
          <div className="text-xs" style={{ color: "#1a3a1a" }}>
            {lang === 'zh' ? '完整报告：' : 'Full report: '}
            <span style={{ color: "#00ff8855" }}>{'█'.repeat(12)}{'░'.repeat(8)} {lang === 'zh' ? '待解锁' : 'pending unlock'}</span>
          </div>
        </div>

        {/* ── 系统速读简报 ── */}
        {(previewLoading || preview) && (
          <div style={{ border: "1px solid #1a3a1a", borderRadius: "16px", overflow: "hidden" }}>
            {/* 标题栏 */}
            <button
              onClick={() => setPreviewExpanded(e => !e)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: "#080e08", cursor: "pointer", border: "none" }}
            >
              <span style={{ color: "#00ff88", fontFamily: "Courier New, monospace", fontSize: "13px" }}>
                // 系统速读 · 先看一眼你的报告
              </span>
              <span style={{ color: "#2d5a2d", fontSize: "12px" }}>{previewExpanded ? "▲" : "▼"}</span>
            </button>

            {previewExpanded && (
              <div style={{ padding: "0 16px 16px", background: "#060c06" }}>
                {previewLoading && !preview && (
                  <div style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace", fontSize: "12px", padding: "16px 0" }}>
                    // 系统正在扫描你的生命代码<AnimatedDots />
                  </div>
                )}

                {preview && (
                  <>
                    {/* 四张核心读数卡 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "12px 0 16px" }}>
                      {[
                        { label: "▲ BUG 指数", value: `${preview.bugScore} / 100`, accent: "#00ff88" },
                        { label: "♥ 健康等级", value: `Lv.${preview.healthLevel} / 9`, accent: "#4db8ff" },
                        { label: "⊗ 权重", value: preview.weight, accent: "#00ff88" },
                        { label: "⬡ 偏置", value: preview.bias, accent: "#00ff88" },
                      ].map(({ label, value, accent }) => (
                        <div key={label} style={{
                          background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px",
                          padding: "12px", fontFamily: "Courier New, monospace",
                        }}>
                          <div style={{ color: "#2d5a2d", fontSize: "11px", marginBottom: "4px" }}>{label}</div>
                          <div style={{ color: accent, fontSize: "16px", fontWeight: "bold" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* 开场白 */}
                    <OpeningBlock text={preview.opening} />

                    {/* Bug 01 */}
                    <div style={{ margin: "16px 0 8px", padding: "12px 14px", background: "#0a150a", borderRadius: "12px", border: "1px solid #1a3a1a" }}>
                      <div style={{ color: "#00cc6a", fontFamily: "Courier New, monospace", fontSize: "13px", lineHeight: "1.7" }}>
                        {preview.bug01.split("\n").map((l, i) => (
                          <div key={i}>{l.replace(/\*\*/g, "").replace(/`/g, "")}</div>
                        ))}
                      </div>
                    </div>
                    {/* Bug 数量提示 */}
                    <div style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace", fontSize: "12px", marginBottom: "16px" }}>
                      🔒 还有 {preview.bugTotal - 1} 个 Bug 待解析
                    </div>

                    {/* 近景 */}
                    <div style={{ borderTop: "1px solid #1a3a1a", paddingTop: "14px", marginBottom: "8px" }}>
                      <div style={{ color: "#4db8ff", fontFamily: "Courier New, monospace", fontSize: "12px", marginBottom: "8px" }}>
                        // 近景 · 当前阶段
                      </div>
                      <p style={{ color: "#c8d8c8", fontSize: "14px", lineHeight: "1.85", margin: 0 }}>
                        {preview.jinjing}
                      </p>
                    </div>
                    {/* 远景锁定提示 */}
                    <div style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace", fontSize: "12px", marginTop: "10px" }}>
                      🔒 远景·命运渲染预测（2032–2042）等待解锁
                    </div>

                    {/* 锁定目录 */}
                    <div style={{ marginTop: "16px", padding: "12px 14px", background: "#080e08", borderRadius: "12px", border: "1px solid #1a3a1a" }}>
                      <div style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace", fontSize: "11px", marginBottom: "8px" }}>
                        🔒 完整报告还包含：
                      </div>
                      {["第零章 · 初始参数·源代码", "第一章 · 内核审计（全部 Bug）", "第二章 · 演化路径分析", "第三章 · 当下奇点", "第四章 · 命运渲染预测（近期+爆发期+远景）", "第五章 · 修复补丁", "第六章 · 命运公式", "第七章 · 总结·禅语·生命问答", "觉醒画像"].map(ch => (
                        <div key={ch} style={{ color: "#1a3a1a", fontFamily: "Courier New, monospace", fontSize: "11px", lineHeight: "1.8" }}>
                          {ch}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Invite code */}
        <div className="space-y-2">
          <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace" }}>
            {lang === 'zh' ? '// 输入邀请码享优惠' : lang === 'ko' ? '// 초대 코드가 있나요?' : '// Have an invite code? Get 20% off'}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={lang === 'zh' ? '输入邀请码' : lang === 'ko' ? '초대 코드 입력' : 'Enter invite code'}
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setInviteStatus("idle") }}
              onKeyDown={(e) => e.key === "Enter" && handleInviteCheck()}
              className="flex-1 px-3 py-2 text-sm"
              style={{
                background: "#0a150a",
                border: `1px solid ${inviteStatus === "valid" ? "#00ff88" : inviteStatus === "invalid" ? "#ff6b6b" : "#1a3a1a"}`,
                color: "#e2e8f0",
                fontFamily: "Courier New, monospace",
                outline: "none",
                letterSpacing: "0.1em",
                borderRadius: "10px",
              }}
            />
            <button
              onClick={handleInviteCheck}
              className="px-4 py-2 text-xs font-bold"
              style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", borderRadius: "10px" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
            >
              {lang === 'zh' ? '验证' : lang === 'ko' ? '확인' : 'Apply'}
            </button>
          </div>
          {inviteStatus === "valid" && (
            <div className="text-xs" style={{ color: "#00ff88", fontFamily: "Courier New, monospace" }}>
              ✓ {inviteLabel ? `[${inviteLabel}] ` : ''}
              {inviteFreeAccess
                ? (lang === 'zh' ? '内测邀请码有效 · 免费解锁' : lang === 'ko' ? '베타 코드 유효 · 무료 이용' : 'Beta code valid · Free access')
                : (lang === 'zh' ? '邀请码有效 · 优惠价 ¥16.80 已激活' : lang === 'ko' ? '초대 코드 유효 · 할인가 ¥16.80 적용' : 'Code valid · discounted price ¥16.80 applied')
              }
            </div>
          )}
          {inviteStatus === "invalid" && (
            <div className="text-xs" style={{ color: "#ff6b6b", fontFamily: "Courier New, monospace" }}>
              ✗ {lang === 'zh' ? '邀请码无效或已过期' : lang === 'ko' ? '유효하지 않은 코드' : 'Invalid or expired code'}
            </div>
          )}
        </div>

        <div
          className="py-8 px-6 border space-y-3"
          style={{ borderColor: "#1a3a1a", background: "#0a150a", borderRadius: "16px" }}
        >
          <div className="text-4xl font-bold" style={{ color: "#00ff88", fontFamily: "'Alibaba PuHuiTi 2.0', 'Courier New', monospace" }}>
            {inviteStatus === "valid" && inviteFreeAccess ? (
              <span>免费 <span className="text-lg line-through" style={{ color: "#2d5a2d" }}>¥18.80</span></span>
            ) : inviteStatus === "valid" ? (
              <span>¥16.80 <span className="text-lg line-through" style={{ color: "#2d5a2d" }}>¥18.80</span></span>
            ) : (
              <span>¥18.80</span>
            )}
          </div>
          {new Date() <= new Date("2026-06-30T23:59:59+08:00") && (
            <div className="text-sm space-y-2" style={{ fontFamily: "Courier New, monospace" }}>
              <div className="flex items-center justify-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px #FFC93Caa)" }}>
                  <defs>
                    <linearGradient id="giftGoldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFF3C4" />
                      <stop offset="50%" stopColor="#FFC93C" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                  </defs>
                  <g stroke="url(#giftGoldGrad)">
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <path d="M5 12 v8 a1 1 0 0 0 1 1 h12 a1 1 0 0 0 1 -1 v-8" />
                    <line x1="12" y1="8" x2="12" y2="21" />
                    <path d="M12 8 C 12 4.5, 8.5 4, 8 6 C 7.7 7.6, 10.5 8, 12 8 Z" />
                    <path d="M12 8 C 12 4.5, 15.5 4, 16 6 C 16.3 7.6, 13.5 8, 12 8 Z" />
                  </g>
                </svg>
                <span className="font-bold" style={{ color: "#FFC93C" }}>
                  {lang === "zh" ? "首发活动（至6月30日）：" : lang === "ko" ? "런칭 이벤트 (6/30까지):" : "Launch offer (until Jun 30):"}
                </span>
              </div>
              <div className="font-bold" style={{ color: "#FFC93C" }}>
                {lang === "zh" ? "买一赠一，获得一个免费码送给你想读懂的人" : lang === "ko" ? "1+1, 결제 시 친구에게 선물할 무료 코드 증정" : "Buy one gift one — get a free code for a friend after payment"}
              </div>
              <div className="relative mx-auto" style={{ width: "80%", height: "2px" }}>
                <div className="absolute inset-0" style={{ borderRadius: "999px", background: "linear-gradient(90deg, transparent 0%, #FFC93C 50%, transparent 100%)" }} />
                <div className="absolute top-1/2 left-1/2" style={{ transform: "translate(-50%, -50%)", width: "48px", height: "10px", borderRadius: "999px", background: "#FFC93C", filter: "blur(8px)" }} />
              </div>
            </div>
          )}
          <p className="text-xs" style={{ color: "#00ff88" }}>
            {t.paymentDesc}
          </p>
        </div>

        {/* 支付方式（目前仅支持支付宝） */}
        <div
          className="py-3 text-sm font-bold text-center"
          style={{
            border: '1px solid #00ff88',
            color: '#00ff88',
            background: '#0a1f0a',
            fontFamily: 'Courier New, monospace',
            borderRadius: '14px',
          }}
        >
          支付宝
        </div>

        {error && (
          <p className="text-xs" style={{ color: "#ff6b6b" }}>
            ⚠ {error}
            <span style={{ color: "#5a7a5a" }}>
              {lang === 'zh' ? ' · 如已扣款未解锁，请联系 ' : ' · If charged but not unlocked, contact '}
              <a href="mailto:theone@lifecode9.com" style={{ color: "#7aba7a", textDecoration: "underline" }}>theone@lifecode9.com</a>
            </span>
          </p>
        )}

        <button
          {...tap(handlePayment)}
          disabled={loading}
          className="w-full py-5 text-base font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
          style={{
            touchAction: "manipulation",
            border: "1px solid #00ff88",
            color: loading ? "#050a05" : "#00ff88",
            background: loading ? "#00ff88" : "transparent",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
            WebkitTapHighlightColor: "transparent",
            borderRadius: "14px",
          }}
          onMouseEnter={(e) => {
            if (loading) return
            e.currentTarget.style.background = "#00ff88"
            e.currentTarget.style.color = "#050a05"
            e.currentTarget.style.boxShadow = "0 0 30px #00ff8844"
          }}
          onMouseLeave={(e) => {
            if (loading) return
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "#00ff88"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          {loading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050a05" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {lang === 'zh' ? '处理中' : lang === 'ko' ? '처리 중' : 'Processing'}<AnimatedDots />
            </>
          ) : t.paymentBtn}
        </button>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/${lang}/survey?restore=1`)}
            className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
            style={{ background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", transition: "all 0.2s", borderRadius: "12px", border: "1px solid #1a3a1a", color: "#2d5a2d" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {lang === 'zh' ? '重新填写' : lang === 'ko' ? '다시 작성' : 'Restart survey'}
          </button>
          <button
            onClick={() => router.push(`/${lang}`)}
            className="btn-result flex-1 py-3 text-sm font-bold tracking-wider"
            style={{ background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace", transition: "all 0.2s", borderRadius: "12px", border: "1px solid #1a3a1a", color: "#2d5a2d" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {lang === 'zh' ? '返回首页' : lang === 'ko' ? '홈으로' : 'Back to home'}
          </button>
        </div>

        <p className="text-xs" style={{ color: "#1a3a1a" }}>
          {t.paymentNote}
        </p>

        <p
          className="text-xs leading-relaxed"
          style={{ color: "#1a3a1a", maxWidth: "360px", margin: "0 auto" }}
        >
          {t.disclaimer}
        </p>

        <div className="flex gap-4 justify-center pb-6" style={{ fontFamily: "Courier New, monospace" }}>
          <a href={`/${lang}/privacy`} className="text-xs" style={{ color: "#2d5a2d" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4a8a4a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}
          >
            {lang === 'zh' ? '隐私政策' : lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          </a>
          <span style={{ color: "#1a3a1a" }}>·</span>
          <a href={`/${lang}/terms`} className="text-xs" style={{ color: "#2d5a2d" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4a8a4a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}
          >
            {lang === 'zh' ? '服务条款' : lang === 'ko' ? '이용약관' : 'Terms of Service'}
          </a>
        </div>
      </div>
    </main>
  )
}
