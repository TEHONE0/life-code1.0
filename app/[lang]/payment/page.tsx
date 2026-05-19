"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getT, Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";

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
  const [loading, setLoading] = useState(false)
  const [hasAnswers, setHasAnswers] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [inviteLabel, setInviteLabel] = useState("")

  useEffect(() => {
    const answers = sessionStorage.getItem("survey_answers")
    if (!answers) {
      router.push(`/${lang}/survey`)
      return
    }
    setHasAnswers(true)

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/payment`)}`)
        return
      }
      setUserEmail(data.session.user.email ?? null)
    })
  }, [lang, router])

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
    } else {
      setInviteStatus("invalid")
    }
  }

  const handlePayment = async () => {
    setError("")
    setLoading(true)
    try {
      const answers = JSON.parse(sessionStorage.getItem("survey_answers") || "{}")
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const res = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ lang, answers, inviteCode: inviteStatus === "valid" ? inviteCode.trim().toUpperCase() : undefined, existingSubmissionId: sessionStorage.getItem("existing_submission_id") || undefined }),
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
      window.location.href = json.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error")
      setLoading(false)
    }
  }

  if (!hasAnswers || !userEmail) return null

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
          <div className="text-xs" style={{ color: "#2d5a2d" }}>
            // SCAN_STATUS: COMPLETE · REPORT: PENDING_UNLOCK
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
            {t.paymentTitle}
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {t.paymentSubtitle}
          </p>
        </div>

        <div
          className="text-left p-4 border space-y-2"
          style={{ borderColor: "#0f2a0f", background: "#080e08", fontFamily: "Courier New, monospace" }}
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

        {/* Invite code */}
        <div className="space-y-2">
          <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace" }}>
            {lang === 'zh' ? '// 有邀请码？输入享88折' : lang === 'ko' ? '// 초대 코드가 있나요?' : '// Have an invite code? Get 12% off'}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={lang === 'zh' ? '输入邀请码' : lang === 'ko' ? '초대 코드 입력' : 'Enter invite code'}
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteStatus("idle") }}
              onKeyDown={(e) => e.key === "Enter" && handleInviteCheck()}
              className="flex-1 px-3 py-2 text-sm"
              style={{
                background: "#0a150a",
                border: `1px solid ${inviteStatus === "valid" ? "#00ff88" : inviteStatus === "invalid" ? "#ff6b6b" : "#1a3a1a"}`,
                color: "#e2e8f0",
                fontFamily: "Courier New, monospace",
                outline: "none",
                letterSpacing: "0.1em",
              }}
            />
            <button
              onClick={handleInviteCheck}
              className="px-4 py-2 text-xs font-bold"
              style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
            >
              {lang === 'zh' ? '验证' : lang === 'ko' ? '확인' : 'Apply'}
            </button>
          </div>
          {inviteStatus === "valid" && (
            <div className="text-xs" style={{ color: "#00ff88", fontFamily: "Courier New, monospace" }}>
              ✓ {inviteLabel ? `[${inviteLabel}] ` : ''}{lang === 'zh' ? '邀请码有效 · 88折已激活' : lang === 'ko' ? '초대 코드 유효 · 12% 할인 적용' : 'Code valid · 12% discount applied'}
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
          style={{ borderColor: "#1a3a1a", background: "#0a150a" }}
        >
          <div className="text-4xl font-bold" style={{ color: "#00ff88" }}>
            {inviteStatus === "valid" ? (
              <span>$7.83 <span className="text-lg line-through" style={{ color: "#2d5a2d" }}>$8.90</span></span>
            ) : t.paymentPrice}
          </div>
          <p className="text-xs" style={{ color: "#2d5a2d" }}>
            {t.paymentDesc}
          </p>
        </div>

        {error && <p className="text-xs" style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-5 text-base font-bold transition-all duration-300 active:scale-95"
          style={{
            border: "1px solid #00ff88",
            color: loading ? "#050a05" : "#00ff88",
            background: loading ? "#00ff88" : "transparent",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
            WebkitTapHighlightColor: "transparent",
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
          {loading ? <>{lang === 'zh' ? '处理中' : lang === 'ko' ? '처리 중' : 'Processing'}<AnimatedDots /></> : t.paymentBtn}
        </button>

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
