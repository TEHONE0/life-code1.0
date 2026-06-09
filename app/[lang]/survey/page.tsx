"use client";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { getT, Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserMenu from "@/components/UserMenu";

export default function SurveyPage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const t = getT(lang)
  const router = useRouter()
  const DRAFT_KEY = `survey_draft_${lang}`
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") } catch { return {} }
  })
  const [error, setError] = useState("")
  const [missingModal, setMissingModal] = useState<string[]>([])

  const QUESTIONS = t.questions
  const allFilled = QUESTIONS.every((q) => (answers[q.id] || "").trim().length > 0)

  const handleSubmit = async () => {
    const missing = QUESTIONS.filter((q) => !(answers[q.id] || "").trim())
    if (missing.length > 0) {
      setMissingModal(missing.map((q) => q.code))
      return
    }
    setError("")
    sessionStorage.setItem("survey_answers", JSON.stringify(answers))
    sessionStorage.setItem("survey_lang", lang)
    localStorage.removeItem(DRAFT_KEY)

    // Save to DB immediately — with auth token if logged in, anonymous if not
    const { data: sessionData } = await supabaseBrowser.auth.getSession()
    const token = sessionData.session?.access_token
    const existingId = sessionStorage.getItem("existing_submission_id") || undefined
    try {
      const res = await fetch("/api/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers, lang, existingSubmissionId: existingId }),
      })
      const json = await res.json()
      if (json.submissionId) {
        sessionStorage.setItem("existing_submission_id", json.submissionId)
      }
    } catch {
      // Non-fatal: sessionStorage is still the fallback
    }

    if (!sessionData.session) {
      router.push(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/payment`)}`)
      return
    }
    router.push(`/${lang}/payment`)
  }

  return (
    <main
      className="min-h-screen px-4 py-8 pb-24"
      style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}
    >
      <div className="fixed top-4 right-4 z-50">
        <UserMenu lang={lang} />
      </div>
      <div className="max-w-2xl mx-auto space-y-7">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex gap-2">
              <button
                onClick={() => router.push(`/${lang}`)}
                className="text-xs px-3 py-1"
                style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8844"; e.currentTarget.style.color = "#00ff8877" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
              >
                {lang === 'zh' ? '← 首页' : lang === 'ko' ? '← 홈' : '← Home'}
              </button>
              <button
                onClick={() => {
                  const next = lang === 'zh' ? 'en' : lang === 'en' ? 'ko' : 'zh'
                  router.push(`/${next}/survey`)
                }}
                className="text-xs px-3 py-1"
                style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", fontFamily: "Courier New, monospace" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8844"; e.currentTarget.style.color = "#00ff8877" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
              >
                {lang === 'zh' ? 'EN / KO' : lang === 'en' ? 'KO / 中文' : '中文 / EN'}
              </button>
          </div>
          <div className="text-xs" style={{ color: "#1e4a1e" }}>{t.surveyHeader}</div>
          <h1 className="text-xl font-bold" style={{ color: "#00ff88" }}>
            {t.surveyTitle}
          </h1>
          <p className="text-xs" style={{ color: "#2d5a2d" }}>
            {t.surveySubtitle}
          </p>
        </div>

        {/* Progress */}
        <div className="text-xs flex justify-between" style={{ color: "#1e4a1e" }}>
          <span>
            {Object.values(answers).filter((v) => v.trim()).length} / {QUESTIONS.length} {t.progressFilled}
          </span>
          <span style={{ color: allFilled ? "#00ff88" : "#1e4a1e" }}>
            {allFilled ? t.progressReady : t.progressCollecting}
          </span>
        </div>

        {/* Security note */}
        <div className="text-xs" style={{ color: "#2d6a2d" }}>{t.securityNote}</div>

        {/* Questions */}
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className="space-y-2 animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="text-lg font-bold" style={{ color: "#00ff88" }}>{q.code}</div>
            <div className="text-sm" style={{ color: "#6fae6f", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{q.comment}</div>
            <div className="text-base" style={{ color: "#4db8ff", textShadow: "0 0 8px #4db8ff88", whiteSpace: "pre-wrap", lineHeight: "1.7" }}>{q.label}</div>

            {q.multiline ? (
              <textarea
                rows={3}
                placeholder={q.placeholder}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => { const next = { ...prev, [q.id]: e.target.value }; localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); return next; })}
                className="w-full p-3 text-sm rounded-sm"
                style={{
                  background: "#0a150a",
                  border: `1px solid ${answers[q.id]?.trim() ? "#1e5a1e" : "#0f2a0f"}`,
                  color: "#e2e8f0",
                  fontFamily: "Courier New, monospace",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00ff8866")}
                onBlur={(e) => (e.target.style.borderColor = answers[q.id]?.trim() ? "#1e5a1e" : "#0f2a0f")}
              />
            ) : (
              <input
                type="text"
                placeholder={q.placeholder}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => { const next = { ...prev, [q.id]: e.target.value }; localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); return next; })}
                className="w-full p-3 text-sm rounded-sm"
                style={{
                  background: "#0a150a",
                  border: `1px solid ${answers[q.id]?.trim() ? "#1e5a1e" : "#0f2a0f"}`,
                  color: "#e2e8f0",
                  fontFamily: "Courier New, monospace",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00ff8866")}
                onBlur={(e) => (e.target.style.borderColor = answers[q.id]?.trim() ? "#1e5a1e" : "#0f2a0f")}
              />
            )}
          </div>
        ))}

        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        <div className="pt-2 pb-8">
          <button
            onClick={handleSubmit}
            className="w-full py-5 text-base font-bold transition-all duration-300 active:scale-95"
            style={{
              border: "1px solid #00ff88",
              color: "#00ff88",
              background: "transparent",
              letterSpacing: "0.1em",
              cursor: "pointer",
              fontSize: "clamp(0.85rem, 4vw, 1rem)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00ff88"
              e.currentTarget.style.color = "#050a05"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#00ff88"
            }}
          >
            {t.submitBtn}
          </button>
        </div>
      </div>

      {/* Missing fields modal */}
      {missingModal.length > 0 && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setMissingModal([])}
        >
          <div
            className="max-w-sm w-full mx-4 p-6 space-y-4"
            style={{ background: "#080e08", border: "1px solid #00ff8844", fontFamily: "Courier New, monospace" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
              {lang === 'zh' ? '// 以下题目未填写' : '// Missing answers'}
            </div>
            <div className="space-y-2">
              {missingModal.map((code) => (
                <div key={code} className="text-xs px-3 py-2" style={{ background: "#0a150a", border: "1px solid #1a3a1a", color: "#ff6b6b" }}>
                  ⚠ {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => setMissingModal([])}
              className="w-full py-2 text-sm font-bold"
              style={{ border: "1px solid #00ff8844", color: "#00ff88", background: "transparent", cursor: "pointer" }}
            >
              {lang === 'zh' ? '返回填写' : 'Go back'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
