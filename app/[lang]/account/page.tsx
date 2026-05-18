"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserMenu from "@/components/UserMenu";

type Submission = {
  id: string;
  name: string;
  lang: string;
  paid: boolean;
  created_at: string;
  hasReport: boolean;
  answers: {
    enneagram?: string;
    basic_info?: string;
    origin?: string;
    critical_error?: string;
    core_loop?: string;
    const?: string;
    status?: string;
    legacy?: string;
    dimension?: string;
  };
};

export default function AccountPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#050a05" }} />}>
      <AccountPage />
    </Suspense>
  );
}

function AccountPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") === "forms" ? "forms" : "reports") as "forms" | "reports";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [list, setList] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = {
    titleForms: lang === "zh" ? "我的问卷" : lang === "ko" ? "내 설문" : "My Questionnaires",
    titleReports: lang === "zh" ? "我的报告" : lang === "ko" ? "내 보고서" : "My Reports",
    tabForms: lang === "zh" ? "问卷" : lang === "ko" ? "설문" : "Forms",
    tabReports: lang === "zh" ? "报告" : lang === "ko" ? "보고서" : "Reports",
    emptyForms: lang === "zh" ? "暂无问卷记录" : lang === "ko" ? "설문 기록이 없습니다" : "No questionnaires yet",
    emptyReports: lang === "zh" ? "暂无报告记录" : lang === "ko" ? "보고서 기록이 없습니다" : "No reports yet",
    createOne: lang === "zh" ? "去填问卷 →" : lang === "ko" ? "설문 시작 →" : "Start a survey →",
    paid: lang === "zh" ? "已解锁" : lang === "ko" ? "잠금 해제됨" : "Unlocked",
    unpaid: lang === "zh" ? "未付款" : lang === "ko" ? "미결제" : "Unpaid",
    expand: lang === "zh" ? "▾ 展开查看" : lang === "ko" ? "▾ 펼치기" : "▾ Expand",
    collapse: lang === "zh" ? "▴ 收起" : lang === "ko" ? "▴ 접기" : "▴ Collapse",
    viewReport: lang === "zh" ? "查看报告 →" : lang === "ko" ? "보고서 보기 →" : "View report →",
    completeReport: lang === "zh" ? "继续生成报告 →" : lang === "ko" ? "보고서 생성 →" : "Continue →",
    payNow: lang === "zh" ? "去支付 →" : lang === "ko" ? "결제 →" : "Pay now →",
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/account?view=${view}`)}`);
        return;
      }
      setEmail(data.session.user.email ?? null);
      const res = await fetch("/api/my-submissions", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const json = await res.json();
      setList(json.submissions || []);
      setLoading(false);
    })();
  }, [lang, router, view]);

  const handleReportClick = (s: Submission) => {
    if (s.hasReport) {
      router.push(`/${lang}/result?sid=${s.id}`);
    } else if (s.paid) {
      sessionStorage.setItem("submission_id", s.id);
      sessionStorage.setItem("stream_mode", "true");
      router.push(`/${lang}/result`);
    } else {
      router.push(`/${lang}/result?sid=${s.id}`);
    }
  };

  const switchView = (v: "forms" | "reports") => {
    setExpandedId(null);
    router.push(`/${lang}/account?view=${v}`);
  };

  const QUESTION_LABELS = lang === "zh"
    ? [
        ["Q00 九型人格", "enneagram"], ["Q01 基本信息", "basic_info"], ["Q02 家庭环境", "origin"],
        ["Q03 最重打击", "critical_error"], ["Q04 核心循环", "core_loop"], ["Q05 不可失去", "const"],
        ["Q06 当前状态", "status"], ["Q07 人生遗产", "legacy"], ["Q08 维度扫描", "dimension"],
      ] as const
    : lang === "ko"
    ? [
        ["Q00 에니어그램", "enneagram"], ["Q01 기본 정보", "basic_info"], ["Q02 가정 환경", "origin"],
        ["Q03 가장 큰 충격", "critical_error"], ["Q04 핵심 반복", "core_loop"], ["Q05 잃을 수 없는 것", "const"],
        ["Q06 현재 상태", "status"], ["Q07 유산", "legacy"], ["Q08 차원 스캔", "dimension"],
      ] as const
    : [
        ["Q00 Enneagram", "enneagram"], ["Q01 Basic Info", "basic_info"], ["Q02 Family Environment", "origin"],
        ["Q03 Heaviest Blow", "critical_error"], ["Q04 Core Loop", "core_loop"], ["Q05 Undeletable", "const"],
        ["Q06 Current Status", "status"], ["Q07 Legacy", "legacy"], ["Q08 Dimension Scan", "dimension"],
      ] as const;

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}
    >
      <style>{`@keyframes breathe { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.6} }`}</style>
      <div className="fixed top-4 right-4 z-50">
        <UserMenu lang={lang} />
      </div>

      <div className="max-w-2xl mx-auto space-y-6 pt-10">
        <div className="space-y-2">
          <div className="text-xs" style={{ color: "#1e4a1e" }}>// ACCOUNT · {email}</div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
            {view === "forms" ? t.titleForms : t.titleReports}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: "1px solid #1a3a1a" }}>
          {(["forms", "reports"] as const).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className="px-4 py-2 text-sm font-bold"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: view === v ? "2px solid #00ff88" : "2px solid transparent",
                color: view === v ? "#00ff88" : "#2d5a2d",
                cursor: "pointer",
                fontFamily: "Courier New, monospace",
                marginBottom: "-1px",
              }}
              onMouseEnter={(e) => { if (view !== v) e.currentTarget.style.color = "#4a8a4a" }}
              onMouseLeave={(e) => { if (view !== v) e.currentTarget.style.color = "#2d5a2d" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  display: "inline-block",
                  width: "8px", height: "8px",
                  borderRadius: "50%",
                  background: view === v ? "#00ff88" : "#2d5a2d",
                  boxShadow: view === v ? "0 0 6px #00ff88, 0 0 12px #00ff8866" : "none",
                  animation: "breathe 2s ease-in-out infinite",
                  flexShrink: 0,
                }} />
                {v === "forms" ? t.tabForms : t.tabReports}
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace" }}>
            // Loading...
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="text-center space-y-4 py-12">
            <p className="text-sm" style={{ color: "#2d5a2d" }}>
              {view === "forms" ? t.emptyForms : t.emptyReports}
            </p>
            <button
              onClick={() => router.push(`/${lang}/survey`)}
              className="px-6 py-3 text-sm font-bold"
              style={{
                border: "1px solid #00ff88",
                color: "#00ff88",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "Courier New, monospace",
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#00ff88"; e.currentTarget.style.color = "#050a05" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#00ff88" }}
            >
              {t.createOne}
            </button>
          </div>
        )}

        {!loading && list.map((s) => {
          const date = new Date(s.created_at).toLocaleDateString();
          const statusColor = s.paid ? "#00ff88" : "#ff6b6b";
          const statusLabel = s.paid ? t.paid : t.unpaid;
          const isExpanded = expandedId === s.id;

          if (view === "forms") {
            return (
              <div
                key={s.id}
                className="p-4 border space-y-2 transition-all"
                style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: "Courier New, monospace" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.boxShadow = "0 0 12px #00ff8822" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.boxShadow = "none" }}
              >
                <div
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#00ff88" }}>{s.name}</div>
                    <div className="text-xs mt-1" style={{ color: "#5b9bd5" }}>{date} · {s.lang.toUpperCase()}</div>
                  </div>
                  <div className="text-xs" style={{ color: "#00ff8888" }}>
                    {isExpanded ? t.collapse : t.expand}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid #1a3a1a" }}>
                    {QUESTION_LABELS.map(([label, key]) => {
                      const v = (s.answers as Record<string, string | undefined>)[key];
                      if (!v) return null;
                      return (
                        <div key={key}>
                          <div className="text-xs font-bold" style={{ color: "#00ff88" }}>{label}</div>
                          <div className="text-xs mt-1" style={{ color: "#94a3b8", whiteSpace: "pre-wrap" }}>{v}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // reports view
          const actionLabel = s.hasReport ? t.viewReport : s.paid ? t.completeReport : t.payNow;
          return (
            <div
              key={s.id}
              className="p-4 border space-y-2 cursor-pointer transition-all"
              style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: "Courier New, monospace" }}
              onClick={() => handleReportClick(s)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00ff8866")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a3a1a")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold" style={{ color: "#00ff88" }}>{s.name}</div>
                  <div className="text-xs mt-1" style={{ color: "#5b9bd5" }}>{date} · {s.lang.toUpperCase()}</div>
                </div>
                <div className="text-xs" style={{ color: statusColor }}>● {statusLabel}</div>
              </div>
              <div className="text-xs" style={{ color: "#00ff8888" }}>{actionLabel}</div>
            </div>
          );
        })}

        <div className="flex gap-3 pt-2" style={{ fontFamily: "Courier New, monospace" }}>
          <button
            onClick={() => router.push(`/${lang}/survey`)}
            className="flex-1 py-3 text-sm font-bold"
            style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", letterSpacing: "0.05em" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {lang === "zh" ? "重新扫描" : lang === "ko" ? "다시 스캔" : "Scan again"}
          </button>
          <button
            onClick={() => router.push(`/${lang}`)}
            className="flex-1 py-3 text-sm font-bold"
            style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", letterSpacing: "0.05em" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {lang === "zh" ? "返回首页" : lang === "ko" ? "홈으로" : "Back to home"}
          </button>
        </div>
      </div>
    </main>
  );
}
