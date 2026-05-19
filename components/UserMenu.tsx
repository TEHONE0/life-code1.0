"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Lang } from "@/lib/i18n";

const ADMIN_EMAIL = "theone208899@gmail.com";

export default function UserMenu({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const labelMyForms = lang === "zh" ? "我的问卷" : lang === "ko" ? "내 설문" : "My Questionnaires";
  const labelMyReports = lang === "zh" ? "我的报告" : lang === "ko" ? "내 보고서" : "My Reports";
  const labelLogout = lang === "zh" ? "退出登录" : lang === "ko" ? "로그아웃" : "Logout";
  const labelLogin = lang === "zh" ? "登录" : lang === "ko" ? "로그인" : "Login";

  if (!email) {
    return (
      <button
        onClick={() => router.push(`/${lang}/auth`)}
        className="btn-lang-glow text-xs px-2 py-1 sm:text-sm sm:px-4 sm:py-2 font-bold"
        style={{
          border: "1px solid #1a3a1a",
          color: "#2d5a2d",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "Courier New, monospace",
        }}
      >
        {labelLogin}
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-lang-glow text-xs px-2 py-1 sm:text-sm sm:px-4 sm:py-2 font-bold"
        style={{
          border: "1px solid #1a3a1a",
          color: "#00ff88",
          background: "#0a150a",
          cursor: "pointer",
          fontFamily: "Courier New, monospace",
          maxWidth: "180px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        ▾ {email}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "160px",
            border: "1px solid #1e5a1e",
            background: "#080e08",
            fontFamily: "Courier New, monospace",
            zIndex: 100,
          }}
        >
          <style>{`@keyframes breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.6}}`}</style>
          <button
            onClick={() => { setOpen(false); router.push(`/${lang}/account?view=forms`) }}
            className="w-full text-xs px-3 py-2 text-left"
            style={{ color: "#00ff88", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid #1a3a1a", display: "flex", alignItems: "center", gap: "8px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88, 0 0 12px #00ff8866", animation: "breathe 2s ease-in-out infinite", flexShrink: 0, display: "inline-block" }} />
            {labelMyForms}
          </button>
          <button
            onClick={() => { setOpen(false); router.push(`/${lang}/account?view=reports`) }}
            className="w-full text-xs px-3 py-2 text-left"
            style={{ color: "#00ff88", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid #1a3a1a", display: "flex", alignItems: "center", gap: "8px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88, 0 0 12px #00ff8866", animation: "breathe 2s ease-in-out infinite 0.5s", flexShrink: 0, display: "inline-block" }} />
            {labelMyReports}
          </button>
          {email === ADMIN_EMAIL && (
            <button
              onClick={() => { setOpen(false); router.push(`/${lang}/account?view=admin`) }}
              className="w-full text-xs px-3 py-2 text-left"
              style={{ color: "#00ff88", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid #1a3a1a", display: "flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88, 0 0 12px #00ff8866", animation: "breathe 2s ease-in-out infinite 1s", flexShrink: 0, display: "inline-block" }} />
              {lang === "zh" ? "管理后台" : lang === "ko" ? "관리자" : "Admin"}
            </button>
          )}
          <button
            onClick={async () => { setOpen(false); await supabaseBrowser.auth.signOut(); router.push(`/${lang}`) }}
            className="w-full text-xs px-3 py-2 text-left"
            style={{ color: "#ff6b6b", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {labelLogout}
          </button>
        </div>
      )}
    </div>
  );
}
