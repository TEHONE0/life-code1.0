"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Lang } from "@/lib/i18n";

const mono = "Courier New, monospace";

export default function NavEntries({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const go = (view: "forms" | "reports") => {
    if (authed === false) { setShowLogin(true); return; }
    router.push(`/${lang}/account?view=${view}`);
  };

  const t = {
    forms: lang === "zh" ? "我的问卷" : lang === "ko" ? "내 설문" : "My questionnaires",
    reports: lang === "zh" ? "我的报告" : lang === "ko" ? "내 보고서" : "My reports",
    title: lang === "zh" ? "请先登录" : lang === "ko" ? "로그인이 필요합니다" : "Please sign in",
    desc: lang === "zh"
      ? "登录后即可查看您的测评问卷与解析报告。"
      : lang === "ko"
      ? "로그인하면 설문과 분석 보고서를 확인할 수 있습니다."
      : "Sign in to view your questionnaires and analysis reports.",
    login: lang === "zh" ? "去登录" : lang === "ko" ? "로그인" : "Sign in",
    cancel: lang === "zh" ? "取消" : lang === "ko" ? "취소" : "Cancel",
  };

  const boxStyle = { display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #1a3a1a", background: "#0a150a", color: "#5a9a5a", cursor: "pointer", fontFamily: mono, borderRadius: "14px", padding: "6px 12px", whiteSpace: "nowrap" } as const;

  const QuizIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
  const ReportIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 3h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><line x1="9" y1="13" x2="9" y2="17" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="15" y1="14" x2="15" y2="17" />
    </svg>
  );

  return (
    <>
      <button onClick={() => go("forms")} className="btn-lang-glow text-xs font-bold" style={boxStyle}><QuizIcon />{t.forms}</button>
      <button onClick={() => go("reports")} className="btn-lang-glow text-xs font-bold" style={boxStyle}><ReportIcon />{t.reports}</button>
      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ border: "1px solid #2a5a2a", borderRadius: "16px", background: "#080e08", fontFamily: mono, maxWidth: "340px", width: "90%", padding: "1.5rem 1.5rem 1.25rem", textAlign: "center", boxShadow: "0 0 40px #00ff8814" }}>
            <div className="text-base font-bold" style={{ color: "#00ff88", textShadow: "0 0 12px #00ff8855", marginBottom: "0.6rem" }}>{t.title}</div>
            <div className="text-xs" style={{ color: "#5a7a5a", lineHeight: 1.7, marginBottom: "1.25rem" }}>{t.desc}</div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-xs" style={{ border: "1px solid #1a3a1a", borderRadius: "12px", background: "transparent", color: "#4a7a4a", cursor: "pointer", fontFamily: mono }}>{t.cancel}</button>
              <button onClick={() => router.push(`/${lang}/auth`)} className="flex-1 py-2 text-xs font-bold" style={{ border: "none", borderRadius: "12px", background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)", color: "#04140a", cursor: "pointer", fontFamily: mono }}>{t.login}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
