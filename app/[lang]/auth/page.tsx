"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getT, Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#050a05" }} />}>
      <AuthPage />
    </Suspense>
  );
}

function AuthPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const t = getT(lang);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || `/${lang}/survey`;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo);
    });
  }, [router, redirectTo]);

  const handleEmail = async () => {
    setError("");
    setInfo("");
    if (!email || !password) {
      setError(t.authErrorEmpty);
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          router.replace(redirectTo);
        }
      } else {
        const { data, error } = await supabaseBrowser.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/${lang}/auth` },
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          router.replace(redirectTo);
        } else {
          setInfo(t.authCheckEmail);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "radial-gradient(ellipse at center, #061206 0%, #050a05 70%)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs" style={{ color: "#2d5a2d" }}>
            // {mode === "login" ? "AUTH · LOGIN" : "AUTH · REGISTER"}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
            {mode === "login" ? t.authLoginTitle : t.authRegisterTitle}
          </h1>
          <p className="text-xs" style={{ color: "#2d5a2d" }}>
            {t.authSubtitle}
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            inputMode="email"
            autoComplete="new-password"
            placeholder={t.authEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              const match = text.match(/[\w.+\-]+@[\w.\-]+\.[a-zA-Z]{2,}/);
              setEmail(match ? match[0] : text.replace(/[﻿​-‍­\r\n]/g, "").trim());
            }}
            className="w-full p-3 text-sm"
            style={{
              background: "#0a150a",
              border: "1px solid #1a3a1a",
              color: "#e2e8f0",
              fontFamily: "Courier New, monospace",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#00ff8866")}
            onBlur={(e) => (e.target.style.borderColor = "#1a3a1a")}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.authPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEmail() }}
              className="w-full p-3 text-sm"
              style={{
                background: "#0a150a",
                border: "1px solid #1a3a1a",
                color: "#e2e8f0",
                fontFamily: "Courier New, monospace",
                outline: "none",
                paddingRight: "44px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00ff8866")}
              onBlur={(e) => (e.target.style.borderColor = "#1a3a1a")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: showPassword ? "#00ff88" : "#2d5a2d",
                cursor: "pointer",
                padding: "4px",
                fontSize: "16px",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")}
              onMouseLeave={(e) => (e.currentTarget.style.color = showPassword ? "#00ff88" : "#2d5a2d")}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: "#ff6b6b" }}>⚠ {error}</p>}
          {info && <p className="text-xs" style={{ color: "#00ff88" }}>✓ {info}</p>}

          <button
            onClick={handleEmail}
            disabled={loading}
            className="w-full py-4 text-base font-bold transition-all"
            style={{
              border: "1px solid #00ff88",
              color: loading ? "#050a05" : "#00ff88",
              background: loading ? "#00ff88" : "transparent",
              letterSpacing: "0.1em",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Courier New, monospace",
              borderRadius: "14px",
            }}
            onMouseEnter={(e) => {
              if (loading) return;
              e.currentTarget.style.background = "#00ff88";
              e.currentTarget.style.color = "#050a05";
            }}
            onMouseLeave={(e) => {
              if (loading) return;
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#00ff88";
            }}
          >
            {loading ? "..." : mode === "login" ? t.authLoginBtn : t.authRegisterBtn}
          </button>
        </div>

        <div className="text-center text-xs" style={{ color: "#2d5a2d" }}>
          {mode === "login" ? t.authNoAccount : t.authHasAccount}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setInfo("") }}
            style={{ color: "#00ff88", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Courier New, monospace", textDecoration: "underline" }}
          >
            {mode === "login" ? t.authToRegister : t.authToLogin}
          </button>
        </div>

        <button
          onClick={() => router.push(`/${lang}`)}
          className="w-full text-xs"
          style={{ color: "#2d5a2d", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Courier New, monospace" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4a7a4a")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}
        >
          ← {lang === "zh" ? "返回首页" : lang === "ko" ? "홈으로" : "Back to home"}
        </button>
      </div>
    </main>
  );
}
