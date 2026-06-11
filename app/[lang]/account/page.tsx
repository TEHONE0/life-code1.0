"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserMenu from "@/components/UserMenu";
import NavEntries from "@/components/NavEntries";
import LangSwitch from "@/components/LangSwitch";

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

type BloggerData = {
  codes: { code: string; label: string | null; used_count: number; is_active: boolean; commission_usd: number | null }[];
  commissions: { invite_code: string; amount_usd: number; status: string; created_at: string }[];
  settlements: { invite_code: string | null; order_count: number; amount_usd: number; note: string | null; created_at: string }[];
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
  const viewParam = searchParams.get("view");
  const view = (viewParam === "forms" || viewParam === "reports" || viewParam === "admin" || viewParam === "blogger" ? viewParam : "reports") as "forms" | "reports" | "admin" | "blogger";

  const ADMIN_EMAIL = "theone208899@gmail.com";
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [list, setList] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bloggerData, setBloggerData] = useState<BloggerData | null>(null);
  const [giftCodes, setGiftCodes] = useState<{ code: string; used_count: number; max_uses: number | null; expires_at: string | null }[]>([]);

  const t = {
    titleForms: lang === "zh" ? "我的问卷" : lang === "ko" ? "내 설문" : "My Questionnaires",
    titleReports: lang === "zh" ? "我的报告" : lang === "ko" ? "내 보고서" : "My Reports",
    tabForms: lang === "zh" ? "问卷" : lang === "ko" ? "설문" : "Forms",
    tabReports: lang === "zh" ? "报告" : lang === "ko" ? "보고서" : "Reports",
    emptyForms: lang === "zh" ? "您还没有测评问卷记录，完成一次测评后将自动归档在此。" : lang === "ko" ? "아직 설문 기록이 없습니다. 검사를 완료하면 여기에 보관됩니다." : "You don't have any questionnaires yet — complete an assessment and it will be saved here.",
    emptyReports: lang === "zh" ? "您还没有解析报告，完成测评问卷并生成报告后即可在此查阅。" : lang === "ko" ? "아직 분석 보고서가 없습니다. 설문을 완료하고 보고서를 생성하면 여기에서 확인할 수 있습니다." : "You don't have any reports yet — complete a questionnaire and generate a report to view it here.",
    createOne: lang === "zh" ? "去填问卷 →" : lang === "ko" ? "설문 시작 →" : "Start a survey →",
    paid: lang === "zh" ? "已解锁" : lang === "ko" ? "잠금 해제됨" : "Unlocked",
    unpaid: lang === "zh" ? "未付款" : lang === "ko" ? "미결제" : "Unpaid",
    expand: lang === "zh" ? "▾ 展开查看" : lang === "ko" ? "▾ 펼치기" : "▾ Expand",
    collapse: lang === "zh" ? "▴ 收起" : lang === "ko" ? "▴ 접기" : "▴ Collapse",
    viewReport: lang === "zh" ? "查看报告 →" : lang === "ko" ? "보고서 보기 →" : "View report →",
    completeReport: lang === "zh" ? "继续生成报告 →" : lang === "ko" ? "보고서 생성 →" : "Continue →",
    payNow: lang === "zh" ? "去支付 →" : lang === "ko" ? "결제 →" : "Pay now →",
    rescan: lang === "zh" ? "↻ 重新扫描" : lang === "ko" ? "↻ 다시 스캔" : "↻ Rescan",
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
      // 博主视图：登录邮箱名下挂了邀请码才显示"我的邀请码"标签
      const inviteRes = await fetch("/api/my-invite", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const inviteJson = await inviteRes.json();
      if (inviteJson.codes?.length > 0) setBloggerData(inviteJson);
      // 我的赠礼码
      const giftRes = await fetch("/api/my-gift-codes", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const giftJson = await giftRes.json();
      setGiftCodes(giftJson.codes || []);
    })();
  }, [lang, router, view]);

  const handleReportClick = (s: Submission) => {
    if (s.paid) {
      // 已付款：一律走 ?sid= 路径，结果页自动判断有报告则加载、无报告则生成
      router.push(`/${lang}/result?sid=${s.id}`);
    } else {
      sessionStorage.setItem("survey_answers", JSON.stringify({
        enneagram: s.answers.enneagram, basic_info: s.answers.basic_info,
        origin: s.answers.origin, critical_error: s.answers.critical_error,
        core_loop: s.answers.core_loop, const: s.answers.const,
        status: s.answers.status, legacy: s.answers.legacy, dimension: s.answers.dimension,
      }));
      sessionStorage.setItem("survey_lang", s.lang);
      sessionStorage.setItem("existing_submission_id", s.id);
      router.push(`/${lang}/payment`);
    }
  };

  const switchView = (v: "forms" | "reports" | "admin" | "blogger") => {
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
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}
    >
      <style>{`@keyframes breathe { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.6} }`}</style>
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "#050a05ee", borderBottom: "1px solid #112811", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${lang}`)} className="flex items-center gap-2" style={{ fontFamily: "Courier New, monospace", background: "transparent", border: "none", cursor: "pointer" }}>
            <img src="/dna-logo.png" alt="生命代码 LOGO" width={20} height={30} style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px #00ff8855)" }} />
            <span className="text-base font-bold" style={{ color: "#00ff88", textShadow: "0 0 12px #00ff8866" }}>生命代码</span>
            <span className="text-xs" style={{ color: "#2d5a2d", letterSpacing: "0.15em", fontFamily: "Orbitron, Courier New, monospace" }}>LIFE CODE</span>
          </button>
          <LangSwitch lang={lang} onPick={(c) => router.push(`/${c}/account?view=${view}`)} />
        </div>
        <div className="hidden md:flex gap-6 text-xs" style={{ fontFamily: "Courier New, monospace" }}>
          {(lang === "zh"
            ? [["", "首页"], ["#how", "如何生成"], ["#preview", "报告示例"], ["#about", "关于作者"]]
            : lang === "ko"
            ? [["", "홈"], ["#how", "생성 방식"], ["#preview", "리포트 예시"], ["#about", "제작자"]]
            : [["", "Home"], ["#how", "How"], ["#preview", "Sample"], ["#about", "About"]]
          ).map(([anchor, label]) => (
            <a key={label} href={`/${lang}${anchor}`} className="nav-link" style={{ color: "#4a7a4a", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2"><NavEntries lang={lang} /></div>
          <UserMenu lang={lang} />
          <button onClick={() => router.push(`/${lang}/survey`)} className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider" style={{ border: "none", color: "#04140a", cursor: "pointer", fontFamily: "Courier New, monospace", borderRadius: "14px", background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)", boxShadow: "0 0 22px #00ff8855, 0 2px 10px #00000066" }}>
            {lang === "zh" ? "再测一位 →" : lang === "ko" ? "한 명 더 →" : "Scan another →"}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs" style={{ color: "#1e4a1e" }}>// ACCOUNT · {email}</div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
            {view === "forms" ? t.titleForms : view === "blogger" ? (lang === "zh" ? "我的邀请码" : lang === "ko" ? "내 초대 코드" : "My Invite Codes") : t.titleReports}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: "1px solid #1a3a1a" }}>
          {(["forms", "reports", ...(bloggerData ? ["blogger"] : []), ...(email === ADMIN_EMAIL ? ["admin"] : [])] as ("forms" | "reports" | "admin" | "blogger")[]).map((v, i) => (
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
                  animation: `breathe 2s ease-in-out infinite ${i * 0.5}s`,
                  flexShrink: 0,
                }} />
                {v === "forms" ? t.tabForms : v === "reports" ? t.tabReports : v === "blogger" ? (lang === "zh" ? "我的邀请码" : lang === "ko" ? "내 코드" : "My Codes") : (lang === "zh" ? "管理" : lang === "ko" ? "관리자" : "Admin")}
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: "Courier New, monospace" }}>
            // Loading...
          </div>
        )}

        {!loading && view === "reports" && giftCodes.length > 0 && (
          <div className="space-y-1 p-3" style={{ border: "1px solid #1a3a1a", borderRadius: "12px", fontFamily: "Courier New, monospace" }}>
            <div className="text-xs font-bold" style={{ color: "#fbbf24" }}>🎁 {lang === "zh" ? "我的赠礼码" : lang === "ko" ? "내 선물 코드" : "My gift codes"}</div>
            {giftCodes.map((g) => {
              const used = g.max_uses != null && g.used_count >= g.max_uses;
              const expired = !used && g.expires_at != null && new Date(g.expires_at) < new Date();
              return (
                <div key={g.code} className="flex justify-between text-xs py-1" style={{ borderBottom: "1px solid #112811" }}>
                  <span style={{ color: used || expired ? "#2d5a2d" : "#00ff88", letterSpacing: "0.1em", textDecoration: used || expired ? "line-through" : "none" }}>{g.code}</span>
                  <span style={{ color: "#4a7a4a" }}>
                    {used ? (lang === "zh" ? "已使用" : "used") : expired ? (lang === "zh" ? "已过期" : "expired") : g.expires_at ? `${lang === "zh" ? "有效至" : "until"} ${new Date(g.expires_at).toLocaleDateString()}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && list.length === 0 && view !== "admin" && view !== "blogger" && (
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

        {!loading && view !== "admin" && view !== "blogger" && list.map((s) => {
          const _dt = new Date(s.created_at);
          const date = `${_dt.toLocaleDateString()} ${_dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
                    {s.hasReport && email === ADMIN_EMAIL && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${lang}/result?sid=${s.id}&rescan=1`);
                        }}
                        className="text-xs px-3 py-1.5 border mt-1"
                        style={{ borderColor: "#00ff8866", color: "#00ff88", background: "#0a1f0a", cursor: "pointer", fontFamily: "Courier New, monospace" }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = "#00ff88" }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = "#00ff8866" }}
                      >
                        {t.rescan}
                      </button>
                    )}
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

        {view === "admin" && email === ADMIN_EMAIL && (
          <AdminInlinePanel lang={lang} />
        )}

        {view === "blogger" && bloggerData && (
          <BloggerInlinePanel lang={lang} data={bloggerData} />
        )}

        <div className="flex gap-3 pt-2" style={{ fontFamily: "Courier New, monospace" }}>
          <button
            onClick={() => router.push(`/${lang}/survey`)}
            className="flex-1 py-3 text-sm font-bold"
            style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", letterSpacing: "0.05em", borderRadius: "12px" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
          >
            {lang === "zh" ? "重新扫描" : lang === "ko" ? "다시 스캔" : "Scan again"}
          </button>
          <button
            onClick={() => router.push(`/${lang}`)}
            className="flex-1 py-3 text-sm font-bold"
            style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer", letterSpacing: "0.05em", borderRadius: "12px" }}
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

// 博主只读视图：自己的邀请码使用/待结算/已结算/结算流水，无任何操作按钮
function BloggerInlinePanel({ lang, data }: { lang: Lang; data: BloggerData }) {
  const mono = "Courier New, monospace";
  const zh = lang === "zh";
  const pending = data.commissions.filter((c) => c.status === "pending");
  const settled = data.commissions.filter((c) => c.status === "settled");
  const pendingTotal = pending.reduce((s, c) => s + Number(c.amount_usd || 0), 0);
  const settledTotal = settled.reduce((s, c) => s + Number(c.amount_usd || 0), 0);

  return (
    <div className="space-y-4" style={{ fontFamily: mono }}>
      {data.codes.map((c) => (
        <div key={c.code} className="p-3" style={{ border: "1px solid #1a3a1a", borderRadius: "12px" }}>
          <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
            {c.code}{c.label ? ` · ${c.label}` : ""}{!c.is_active && <span style={{ color: "#8a2d2d" }}> · {zh ? "已停用" : "inactive"}</span>}
          </div>
          <div className="text-xs" style={{ color: "#4a7a4a", marginTop: "4px" }}>
            {zh ? "已使用" : "Used"} {c.used_count} {zh ? "次" : "times"}
            {c.commission_usd ? <span> · {zh ? "每单分成" : "per order"} ¥{Number(c.commission_usd).toFixed(2)}</span> : null}
          </div>
        </div>
      ))}

      <div className="text-xs" style={{ color: "#fbbf24" }}>
        // {zh ? "待结算" : "Pending"}: ¥{pendingTotal.toFixed(2)} ({pending.length}{zh ? "单" : ""})
      </div>
      <div className="text-xs" style={{ color: "#4a7a4a" }}>
        // {zh ? "已结算" : "Settled"}: ¥{settledTotal.toFixed(2)} ({settled.length}{zh ? "单" : ""})
      </div>

      <div className="text-xs font-bold" style={{ color: "#2d5a2d", marginTop: "14px" }}>// {zh ? "结算流水" : "Settlement records"}</div>
      {data.settlements.map((s, i) => (
        <div key={i} className="flex justify-between text-xs py-1" style={{ borderBottom: "1px solid #112811", color: "#4a7a4a" }}>
          <span>{new Date(s.created_at).toLocaleDateString()} · {s.order_count}{zh ? "单" : " orders"}{s.note ? ` · ${s.note}` : ""}</span>
          <span style={{ color: "#00ff88" }}>¥{Number(s.amount_usd).toFixed(2)}</span>
        </div>
      ))}
      {data.settlements.length === 0 && <div className="text-xs py-2" style={{ color: "#2d5a2d" }}>// {zh ? "暂无结算记录" : "No settlements yet"}</div>}

      <div className="text-xs font-bold" style={{ color: "#2d5a2d", marginTop: "14px" }}>// {zh ? "佣金明细" : "Commission details"}</div>
      {data.commissions.map((c, i) => (
        <div key={i} className="flex justify-between text-xs py-1" style={{ borderBottom: "1px solid #112811", color: "#4a7a4a" }}>
          <span>{new Date(c.created_at).toLocaleDateString()} · {c.invite_code}</span>
          <span style={{ color: c.status === "pending" ? "#fbbf24" : "#4a7a4a" }}>
            ¥{Number(c.amount_usd).toFixed(2)} · {zh ? (c.status === "pending" ? "待结算" : "已结算") : c.status}
          </span>
        </div>
      ))}
      {data.commissions.length === 0 && <div className="text-xs py-2" style={{ color: "#2d5a2d" }}>// {zh ? "暂无佣金记录" : "No commissions yet"}</div>}
    </div>
  );
}

function AdminInlinePanel({ lang }: { lang: Lang }) {
  const [codes, setCodes] = useState<{id:string;code:string;label:string|null;blogger_email:string|null;used_count:number;is_active:boolean}[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [tab, setTab] = useState<"blogger"|"free"|"commissions">("blogger");
  const [commissions, setCommissions] = useState<{id:string;invite_code:string;blogger_email:string;user_email:string;amount_usd:number;status:string;created_at:string}[]>([]);
  const [total, setTotal] = useState(0);
  const [settlements, setSettlements] = useState<{id:string;invite_code:string|null;order_count:number;amount_usd:number;note:string|null;created_at:string}[]>([]);
  const [settlingFor, setSettlingFor] = useState<string | null>(null);
  const [settleCount, setSettleCount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<Record<string, {id:string;email:string|null;name:string|null;lang:string;paid:boolean;created_at:string}[]>>({});

  const getToken = async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? "";
  };

  useEffect(() => { fetchCodes(); fetchCommissions(); fetchSettlements(); }, []);

  const fetchCodes = async () => {
    const token = await getToken();
    const res = await fetch("/api/admin/invite-codes", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setCodes(json.codes || []);
  };

  const fetchCommissions = async () => {
    const token = await getToken();
    const res = await fetch("/api/admin/commissions", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setCommissions(json.commissions || []);
    setTotal(json.total || 0);
  };

  const fetchSettlements = async () => {
    const token = await getToken();
    const res = await fetch("/api/admin/settlements", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setSettlements(json.settlements || []);
  };

  // 某邀请码待结算/已结算单数
  const pendingCountFor = (code: string) =>
    commissions.filter((c) => c.invite_code === code && c.status === "pending").length;
  const settledCountFor = (code: string) =>
    commissions.filter((c) => c.invite_code === code && c.status === "settled").length;

  const handleSettle = async (invite_code: string) => {
    const n = parseInt(settleCount, 10);
    if (!Number.isInteger(n) || n <= 0) return;
    setError("");
    const token = await getToken();
    const res = await fetch("/api/admin/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invite_code, order_count: n, note: settleNote.trim() || null }),
    });
    const json = await res.json();
    if (json.error) { setError(json.error); return; }
    setSettlingFor(null); setSettleCount(""); setSettleNote("");
    fetchCommissions(); fetchSettlements();
  };

  const handleUnsettle = async (id: string) => {
    const token = await getToken();
    await fetch(`/api/admin/settlements?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchCommissions(); fetchSettlements();
  };

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    setCreating(true); setError("");
    const token = await getToken();
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: newCode.trim(), label: newLabel.trim() || null, blogger_email: newEmail.trim() || null }),
    });
    const json = await res.json();
    if (json.error) { setError(json.error); setCreating(false); return; }
    setNewCode(""); setNewLabel(""); setNewEmail("");
    setCreating(false); fetchCodes();
  };

  const handleEdit = (c: {code:string;label:string|null;blogger_email:string|null}) => {
    setEditingCode(c.code);
    setEditLabel(c.label || "");
    setEditEmail(c.blogger_email || "");
  };

  const handleSaveEdit = async () => {
    if (!editingCode) return;
    const token = await getToken();
    await fetch("/api/admin/invite-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: editingCode, label: editLabel.trim() || null, blogger_email: editEmail.trim() || null }),
    });
    setEditingCode(null);
    fetchCodes();
  };

  // 常驻用户名输入框：本地即时更新（保住焦点），失焦时写库 label
  const handleNameChange = (code: string, name: string) => {
    setCodes(prev => prev.map(c => c.code === code ? { ...c, label: name } : c));
  };

  const handleSaveName = async (code: string, name: string) => {
    const token = await getToken();
    await fetch("/api/admin/invite-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, label: name.trim() || null }),
    });
  };

  const handleExpandUsage = async (code: string) => {
    if (expandedCode === code) { setExpandedCode(null); return; }
    setExpandedCode(code);
    if (usageMap[code]) return; // already fetched
    const token = await getToken();
    const res = await fetch(`/api/admin/invite-usage?code=${code}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setUsageMap(prev => ({ ...prev, [code]: json.users || [] }));
  };

  const handleToggle = async (code: string, is_active: boolean) => {
    const token = await getToken();
    await fetch("/api/admin/invite-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, is_active: !is_active }),
    });
    fetchCodes();
  };

  const mono = "Courier New, monospace";

  return (
    <div className="space-y-4">
      <div className="flex gap-2" style={{ borderBottom: "1px solid #1a3a1a" }}>
        {(["blogger", "free", "commissions"] as const).map((v) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-3 py-2 text-xs font-bold"
            style={{ background: "transparent", border: "none", borderBottom: tab === v ? "2px solid #00ff88" : "2px solid transparent", color: tab === v ? "#00ff88" : "#2d5a2d", cursor: "pointer", fontFamily: mono, marginBottom: "-1px" }}
          >
            {v === "blogger" ? (lang === "zh" ? "博主邀请码" : "Blogger") : v === "free" ? (lang === "zh" ? "免费码" : "Free") : `${lang === "zh" ? "佣金" : "Commissions"} (¥${total.toFixed(2)})`}
          </button>
        ))}
      </div>

      {(tab === "blogger" || tab === "free") && (
        <div className="space-y-3">
          <div className="p-3 border space-y-2" style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: mono }}>
            <div className="text-xs" style={{ color: "#2d5a2d" }}>// {lang === "zh" ? "生成邀请码" : "Create code"}</div>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="CODE" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "100px", letterSpacing: "0.1em" }} />
              <input placeholder={lang === "zh" ? "博主名" : "Label"} value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "80px" }} />
              <input placeholder={lang === "zh" ? "博主邮箱" : "Email"} value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "120px" }} />
              <button onClick={handleCreate} disabled={creating || !newCode.trim()}
                className="px-4 py-1 text-xs font-bold"
                style={{ border: "1px solid #00ff88", color: "#00ff88", background: "transparent", cursor: "pointer", fontFamily: mono, opacity: creating ? 0.5 : 1 }}>
                {creating ? "..." : "+ 生成"}
              </button>
            </div>
            {error && <div className="text-xs" style={{ color: "#ff6b6b" }}>⚠ {error}</div>}
          </div>
          {(() => {
            const prefix = tab === "blogger" ? "LIFECODE" : "LCFREE";
            const filtered = codes.filter((c) => c.code.startsWith(prefix)).sort((a, b) => a.code.localeCompare(b.code));
            return filtered.map((c) => {
              return (
            <div key={c.id}>
            <div className="border"
              style={{ borderColor: c.is_active ? "#1a3a1a" : "#111", background: "#080e08", fontFamily: mono }}>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: c.is_active ? "#00ff88" : "#2d5a2d", letterSpacing: "0.1em" }}>{c.code}</div>
                  <div className="text-xs mt-1 flex items-center gap-1 flex-wrap" style={{ color: "#4a7a4a" }}>
                    <input
                      placeholder={lang === "zh" ? "用户名" : "User"}
                      value={c.label || ""}
                      onChange={(e) => handleNameChange(c.code, e.target.value)}
                      onBlur={(e) => handleSaveName(c.code, e.target.value)}
                      className="px-1.5 py-0.5 text-xs"
                      style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", width: "100px" }}
                    />
                    <span>· {c.blogger_email || (lang === "zh" ? "未填邮箱" : "no email")} · {lang === "zh" ? "已用" : "used"} {c.used_count} {lang === "zh" ? "次" : "times"}</span>
                    {tab === "blogger" && (
                      <span style={{ color: "#fbbf24" }}>· {lang === "zh" ? "待结算" : "pending"} {pendingCountFor(c.code)}{lang === "zh" ? "单" : ""} / {lang === "zh" ? "已结" : "settled"} {settledCountFor(c.code)}{lang === "zh" ? "单" : ""}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: c.is_active ? "#00ff88" : "#ff6b6b" }}>{c.is_active ? "● 有效" : "○ 停用"}</span>
                  <button onClick={() => editingCode === c.code ? setEditingCode(null) : handleEdit(c)} className="text-xs px-2 py-1"
                    style={{ border: "1px solid #1a3a1a", borderRadius: "12px", color: "#2d5a2d", background: "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}>
                    {editingCode === c.code ? (lang === "zh" ? "取消" : "Cancel") : (lang === "zh" ? "编辑" : "Edit")}
                  </button>
                  <button onClick={() => handleToggle(c.code, c.is_active)} className="text-xs px-2 py-1"
                    style={{ border: "1px solid #1a3a1a", borderRadius: "12px", color: "#2d5a2d", background: "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}>
                    {c.is_active ? (lang === "zh" ? "停用" : "Disable") : (lang === "zh" ? "启用" : "Enable")}
                  </button>
                  <button onClick={() => handleExpandUsage(c.code)} className="text-xs px-2 py-1"
                    style={{ border: "1px solid #1a3a1a", borderRadius: "12px", color: expandedCode === c.code ? "#00ff88" : "#2d5a2d", background: "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#00ff88" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = expandedCode === c.code ? "#00ff88" : "#2d5a2d" }}>
                    {expandedCode === c.code ? "▲" : "▼"} {lang === "zh" ? "用户" : "Users"}
                  </button>
                  {tab === "blogger" && (() => {
                    const pend = pendingCountFor(c.code);
                    const open = settlingFor === c.code;
                    return (
                    <button onClick={() => { if (pend === 0) return; setSettlingFor(open ? null : c.code); setSettleCount(""); setSettleNote(""); setError(""); }} disabled={pend === 0} className="text-xs px-2 py-1"
                      style={{ border: `1px solid ${pend === 0 ? "#1a3a1a" : "#fbbf2466"}`, color: pend === 0 ? "#2d5a2d" : open ? "#fbbf24" : "#8a7a2d", background: "transparent", cursor: pend === 0 ? "not-allowed" : "pointer" }}>
                      {open ? (lang === "zh" ? "取消" : "Cancel") : (lang === "zh" ? "结算" : "Settle")}
                    </button>
                    );
                  })()}
                </div>
              </div>
              {expandedCode === c.code && (
                <div className="px-3 pb-3" style={{ borderTop: "1px solid #1a3a1a", paddingTop: "10px" }}>
                  {!usageMap[c.code] && <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>// 加载中...</div>}
                  {usageMap[c.code]?.length === 0 && <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>// {lang === "zh" ? "暂无使用记录" : "No usage yet"}</div>}
                  {usageMap[c.code]?.map((u) => (
                    <div key={u.id} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #0d1f0d" }}>
                      <div>
                        <span className="text-xs" style={{ color: u.paid ? "#00ff88" : "#fbbf24", fontFamily: mono }}>{u.email || "—"}</span>
                        {u.name && <span className="text-xs ml-2" style={{ color: "#4a7a4a", fontFamily: mono }}>{u.name}</span>}
                      </div>
                      <div className="flex gap-3 text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>
                        <span style={{ color: u.paid ? "#00ff88" : "#fbbf24" }}>{u.paid ? "● 已付款" : "○ 未付款"}</span>
                        <span>{new Date(u.created_at).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editingCode === c.code && (
                <div className="px-3 pb-3 flex gap-2 flex-wrap" style={{ borderTop: "1px solid #1a3a1a", paddingTop: "10px" }}>
                  <input placeholder={lang === "zh" ? "博主名" : "Label"} value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                    className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "80px" }} />
                  <input placeholder={lang === "zh" ? "博主邮箱" : "Email"} value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                    className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "150px" }} />
                  <button onClick={handleSaveEdit} className="px-4 py-1 text-xs font-bold"
                    style={{ border: "1px solid #00ff88", color: "#00ff88", background: "transparent", cursor: "pointer", fontFamily: mono }}>
                    {lang === "zh" ? "保存" : "Save"}
                  </button>
                </div>
              )}
              {tab === "blogger" && settlingFor === c.code && (
                <div className="px-3 pb-3 flex gap-2 flex-wrap items-center" style={{ borderTop: "1px solid #1a3a1a", paddingTop: "10px" }}>
                  <span className="text-xs" style={{ color: "#8a7a2d", fontFamily: mono }}>{lang === "zh" ? `结算单数（待结算 ${pendingCountFor(c.code)} 单）` : `Orders to settle (pending ${pendingCountFor(c.code)})`}</span>
                  <input type="number" min="1" max={pendingCountFor(c.code)} placeholder={lang === "zh" ? "单数" : "count"} value={settleCount} onChange={(e) => setSettleCount(e.target.value)}
                    className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", width: "80px" }} />
                  {(() => {
                    const unit = Number(commissions.find((x) => x.invite_code === c.code && x.status === "pending")?.amount_usd ?? 3);
                    const amt = (parseInt(settleCount, 10) || 0) * unit;
                    return (
                      <input readOnly tabIndex={-1} value={`${lang === "zh" ? "金额 " : ""}¥${amt.toFixed(2)}`}
                        title={lang === "zh" ? `每笔 ¥${unit} × 单数` : `¥${unit} per order × count`}
                        className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #fbbf2466", color: "#fbbf24", fontFamily: mono, outline: "none", width: "110px", textAlign: "center" }} />
                    );
                  })()}
                  <input placeholder={lang === "zh" ? "打款备注（选填）" : "note"} value={settleNote} onChange={(e) => setSettleNote(e.target.value)}
                    className="px-2 py-1 text-xs" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#e2e8f0", fontFamily: mono, outline: "none", flex: "1", minWidth: "120px" }} />
                  <button onClick={() => handleSettle(c.code)} className="px-4 py-1 text-xs font-bold"
                    style={{ border: "1px solid #fbbf24", color: "#fbbf24", background: "transparent", cursor: "pointer", fontFamily: mono }}>
                    {lang === "zh" ? "确认结算" : "Confirm"}
                  </button>
                  {error && <span className="text-xs" style={{ color: "#ff6b6b" }}>⚠ {error}</span>}
                </div>
              )}
            </div>
            </div>
              );
            });
          })()}
          {codes.filter((c) => c.code.startsWith(tab === "blogger" ? "LIFECODE" : "LCFREE")).length === 0 &&<div className="text-xs text-center py-6" style={{ color: "#2d5a2d", fontFamily: mono }}>// {lang === "zh" ? "暂无邀请码" : "No codes yet"}</div>}
        </div>
      )}

      {tab === "commissions" && (() => {
        const pendingList = commissions.filter((c) => c.status === "pending");
        const pendingTotal = pendingList.reduce((s, c) => s + Number(c.amount_usd), 0);
        const settledTotal = settlements.reduce((s, x) => s + Number(x.amount_usd), 0);
        const statusLabel = (s: string) => lang !== "zh" ? s : s === "pending" ? "待结算" : s === "settled" ? "已结算" : s;
        return (
        <div className="space-y-2">
          <div className="flex gap-2 text-xs">
            <div className="flex-1 p-2 border" style={{ borderColor: "#1a3a1a", background: "#080e08", color: "#fbbf24", fontFamily: mono }}>
              // {lang === "zh" ? "待结算" : "Pending"}: ¥{pendingTotal.toFixed(2)} ({pendingList.length}{lang === "zh" ? "单" : ""})
            </div>
            <div className="flex-1 p-2 border" style={{ borderColor: "#1a3a1a", background: "#080e08", color: "#00ff88", fontFamily: mono }}>
              // {lang === "zh" ? "已结算" : "Settled"}: ¥{settledTotal.toFixed(2)}
            </div>
          </div>

          <div className="text-xs font-bold" style={{ color: "#2d5a2d", fontFamily: mono, marginTop: "14px" }}>// {lang === "zh" ? "结算流水" : "Settlement records"}</div>
          {settlements.map((s) => (
            <div key={s.id} className="p-3 border flex items-center justify-between gap-2" style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: mono }}>
              <div className="min-w-0">
                <div className="text-xs" style={{ color: "#00ff88" }}>¥{Number(s.amount_usd).toFixed(2)} · {s.order_count}{lang === "zh" ? "单" : ""}</div>
                <div className="text-xs mt-1" style={{ color: "#4a7a4a" }}>{s.invite_code || "—"}{s.note ? ` · ${s.note}` : ""}</div>
                <div className="text-xs" style={{ color: "#2d5a2d" }}>{new Date(s.created_at).toLocaleString(lang === "zh" ? "zh-CN" : undefined)}</div>
              </div>
              <button onClick={() => handleUnsettle(s.id)} className="text-xs px-2 py-1 flex-shrink-0"
                style={{ border: "1px solid #1a3a1a", borderRadius: "12px", color: "#2d5a2d", background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b6b66"; e.currentTarget.style.color = "#ff6b6b" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}>
                {lang === "zh" ? "撤销" : "Undo"}
              </button>
            </div>
          ))}
          {settlements.length === 0 && <div className="text-xs text-center py-3" style={{ color: "#2d5a2d", fontFamily: mono }}>// {lang === "zh" ? "暂无结算记录" : "No settlements yet"}</div>}

          <div className="text-xs font-bold" style={{ color: "#2d5a2d", fontFamily: mono, marginTop: "14px" }}>// {lang === "zh" ? "佣金明细" : "Commission details"}</div>
          {commissions.map((c) => (
            <div key={c.id} className="p-3 border space-y-1" style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: mono }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#00ff88" }}>¥{Number(c.amount_usd).toFixed(2)}</span>
                <span style={{ color: c.status === "pending" ? "#fbbf24" : "#00ff88" }}>● {statusLabel(c.status)}</span>
              </div>
              <div className="text-xs" style={{ color: "#4a7a4a" }}>{c.invite_code} · {c.blogger_email || "—"}</div>
              <div className="text-xs" style={{ color: "#2d5a2d" }}>{c.user_email} · {new Date(c.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {commissions.length === 0 && <div className="text-xs text-center py-6" style={{ color: "#2d5a2d", fontFamily: mono }}>// {lang === "zh" ? "暂无佣金记录" : "No commissions yet"}</div>}
        </div>
        );
      })()}
    </div>
  );
}
