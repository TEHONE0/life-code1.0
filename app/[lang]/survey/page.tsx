"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getT, Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserMenu from "@/components/UserMenu";
import NavEntries from "@/components/NavEntries";
import LangSwitch from "@/components/LangSwitch";
import {
  NeonRing, IconEnneagram, IconPerson, IconHome, IconWarning, IconLoop,
  IconShieldSm, IconPulse, IconStar, IconCube, IconLock,
} from "@/components/neon";

const mono = "Courier New, monospace";
const scifi = "Orbitron, Courier New, monospace";
const CARD = { border: "1px solid #1a3a1a", background: "#0a150a", borderRadius: "16px" } as const;
const INPUT = {
  background: "#071007",
  border: "1px solid #1a3a1a",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontFamily: mono,
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
} as const;

const QUESTION_ICONS: Record<string, React.ReactNode> = {
  enneagram: IconEnneagram,
  basic_info: IconPerson,
  origin: IconHome,
  critical_error: IconWarning,
  core_loop: IconLoop,
  const: IconShieldSm,
  status: IconPulse,
  legacy: IconStar,
  dimension: IconCube,
};

// 页面级 UI 文案（导航/侧边栏等界面文字，题目内容一律来自 messages/）
const UI = {
  zh: {
    navLinks: [["", "首页"], ["#how", "如何生成"], ["#preview", "报告示例"], ["#reviews", "用户体验"], ["#about", "关于作者"]],
    navCta: "开始生成我的报告 →",
    sidebarTitle: "生命代码问卷",
    sidebarSub: "LIFE CODE SCANNER",
    progress: "进度",
    steps: ["基本信息", "变量采集中", "原生家庭环境", "核心信念", "主循环事件", "不可变常量", "当前状态", "程序终止前的愿望", "意识维度扫描", "提交完成"],
    security: "数据安全保护",
    author: "作者",
    authorRole: "AI 导演 ｜ 生命代码创造者",
    authorBio: "用代码看人，用故事理解命运。",
    next: "下一页",
    prev: "← 上一页",
    cal: ["阳历", "阴历"],
    unsure: "不确定",
    fuzzyPh: "例如：大概上午 / 不知道",
  },
  en: {
    navLinks: [["", "Home"], ["#how", "How"], ["#preview", "Sample"], ["#reviews", "Reviews"], ["#about", "About"]],
    navCta: "Generate my report →",
    sidebarTitle: "Life Code Survey",
    sidebarSub: "LIFE CODE SCANNER",
    progress: "Progress",
    steps: ["BASIC_INFO", "ENNEAGRAM_SCAN", "ORIGIN_ENVIRONMENT", "CRITICAL_ERROR", "CORE_LOOP", "UNDELETABLE_CONST", "CURRENT_STATUS", "LEGACY_DEFINE", "DIMENSION_SCAN", "SUBMIT"],
    security: "Data protection",
    author: "Creator",
    authorRole: "Film director | Creator of Life Code",
    authorBio: "Reading people through code, understanding fate through stories.",
    next: "Next page",
    prev: "← Previous",
    cal: ["Solar", "Lunar"],
    unsure: "Not sure",
    fuzzyPh: "e.g. around morning / unknown",
  },
  ko: {
    navLinks: [["", "홈"], ["#how", "생성 방식"], ["#preview", "리포트 예시"], ["#reviews", "리뷰"], ["#about", "제작자"]],
    navCta: "내 리포트 생성하기 →",
    sidebarTitle: "라이프 코드 설문",
    sidebarSub: "LIFE CODE SCANNER",
    progress: "진행",
    steps: ["BASIC_INFO", "ENNEAGRAM_SCAN", "ORIGIN_ENVIRONMENT", "CRITICAL_ERROR", "CORE_LOOP", "UNDELETABLE_CONST", "CURRENT_STATUS", "LEGACY_DEFINE", "DIMENSION_SCAN", "제출 완료"],
    security: "데이터 보호",
    author: "제작자",
    authorRole: "영화감독 | 라이프 코드 제작자",
    authorBio: "코드로 사람을 읽고, 이야기로 운명을 이해합니다.",
    next: "다음 페이지",
    prev: "← 이전",
    cal: ["양력", "음력"],
    unsure: "모름",
    fuzzyPh: "예: 오전쯤 / 모름",
  },
};

// iOS 风格暗色滚轮（scroll-snap 实现，无依赖）
const WHEEL_ITEM = 36;
const WHEEL_PAD = 72; // (180 - 36) / 2，让选中项居中
function Wheel({ options, index, onPick }: { options: string[]; index: number; onPick: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - index * WHEEL_ITEM) > 1) el.scrollTop = index * WHEEL_ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, options.length]);
  const onScroll = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / WHEEL_ITEM)));
      if (i !== index) onPick(i);
    }, 120);
  };
  return (
    <div className="relative flex-1 min-w-0" style={{ height: 180 }}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll no-scrollbar"
        style={{ scrollSnapType: "y mandatory", paddingTop: WHEEL_PAD, paddingBottom: WHEEL_PAD }}
      >
        {options.map((o, i) => (
          <div
            key={`${o}-${i}`}
            onClick={() => { ref.current?.scrollTo({ top: i * WHEEL_ITEM, behavior: "smooth" }); onPick(i); }}
            className="flex items-center justify-center text-sm"
            style={{ height: WHEEL_ITEM, scrollSnapAlign: "center", fontFamily: mono, cursor: "pointer", color: i === index ? "#00ff88" : "#4a7a4a", fontWeight: i === index ? 700 : 400, textShadow: i === index ? "0 0 10px #00ff8855" : "none" }}
          >
            {o}
          </div>
        ))}
      </div>
      <div className="absolute left-1 right-1 pointer-events-none" style={{ top: WHEEL_PAD, height: WHEEL_ITEM, borderTop: "1px solid #1a3a1a", borderBottom: "1px solid #1a3a1a" }} />
      <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: 60, background: "linear-gradient(#071007, transparent)" }} />
      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: 60, background: "linear-gradient(transparent, #071007)" }} />
    </div>
  );
}

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const pad2 = (n: number) => String(n).padStart(2, "0");
const YEARS: number[] = [];
for (let y = new Date().getFullYear(); y >= 1930; y--) YEARS.push(y);

type BirthState = {
  cal: number;        // 0=阳历 1=阴历
  y: number; m: number; d: number; dateTouched: boolean;
  h: number; min: number; timeTouched: boolean;
  unsure: boolean; fuzzy: string;
};
const BIRTH_DEFAULT: BirthState = { cal: 0, y: 1995, m: 1, d: 1, dateTouched: false, h: 9, min: 0, timeTouched: false, unsure: false, fuzzy: "" };

// Q01：从原题 label/placeholder 按 " / " 切分出子字段（文字内容不变，仅排版拆分）
function splitBasicFields(label: string, placeholder: string) {
  const lab = label.replace(/[（(][^）)]*[）)]\s*$/, "");
  const labels = lab.split(" / ").map((s) => s.trim()).filter(Boolean);
  const ph = placeholder.replace(/^(例如：|e\.g\.\s*|예:\s*|예시:\s*)/, "");
  const phs = ph.split(" / ").map((s) => s.trim());
  return labels.map((l, i) => ({ label: l, ph: phs[i] ?? "" }));
}

export default function SurveyPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const t = getT(lang);
  const ui = UI[lang as keyof typeof UI] ?? UI.en;
  const router = useRouter();
  const DRAFT_KEY = `survey_draft_${lang}`;
  const FIELDS_KEY = `survey_draft_fields_${lang}`;

  const QUESTIONS = t.questions;
  const basicQ = QUESTIONS.find((q) => q.id === "basic_info");
  const basicFieldDefs = basicQ ? splitBasicFields(basicQ.label, basicQ.placeholder) : [];

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; }
  });
  const [basicFields, setBasicFields] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = JSON.parse(localStorage.getItem(FIELDS_KEY) || "null");
      if (Array.isArray(saved)) return saved;
    } catch { /* ignore */ }
    return [];
  });
  const [page, setPage] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState("");
  const [missingModal, setMissingModal] = useState<string[]>([]);
  const qRefs = useRef<(HTMLDivElement | null)[]>([]);
  const submitRef = useRef<HTMLDivElement | null>(null);

  const allFilled = QUESTIONS.every((q) => (answers[q.id] || "").trim().length > 0);
  const filled = QUESTIONS.filter((q) => (answers[q.id] || "").trim()).length;
  const percent = Math.round((filled / QUESTIONS.length) * 100);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const setBasicField = (i: number, value: string) => {
    setBasicFields((prev) => {
      const next = [...prev];
      next[i] = value;
      localStorage.setItem(FIELDS_KEY, JSON.stringify(next));
      const composed = basicFieldDefs
        .map((f, j) => ((next[j] || "").trim() ? `${f.label}: ${next[j].trim()}` : ""))
        .filter(Boolean)
        .join(" / ");
      setAnswer("basic_info", composed);
      return next;
    });
  };

  // 生日/出生时间选择器状态（写入 Q01 第 2、3 个字段）
  const BIRTH_KEY = `survey_draft_birth_${lang}`;
  const [birth, setBirth] = useState<BirthState>(() => {
    if (typeof window === "undefined") return BIRTH_DEFAULT;
    try {
      const saved = JSON.parse(localStorage.getItem(BIRTH_KEY) || "null");
      if (saved && typeof saved === "object") return { ...BIRTH_DEFAULT, ...saved };
    } catch { /* ignore */ }
    return BIRTH_DEFAULT;
  });

  const updateBirth = (patch: Partial<BirthState>) => {
    const next = { ...birth, ...patch };
    next.d = Math.min(next.d, daysInMonth(next.y, next.m));
    setBirth(next);
    localStorage.setItem(BIRTH_KEY, JSON.stringify(next));
    const calLabel = ui.cal[next.cal];
    const dateStr = next.dateTouched
      ? lang === "zh" ? `${calLabel}，${next.y}年${next.m}月${next.d}日`
      : lang === "ko" ? `${calLabel}, ${next.y}년 ${next.m}월 ${next.d}일`
      : `${calLabel}, ${next.y}-${pad2(next.m)}-${pad2(next.d)}`
      : "";
    const timeStr = next.unsure
      ? (next.fuzzy.trim() || ui.unsure)
      : next.timeTouched ? `${pad2(next.h)}:${pad2(next.min)}` : "";
    setBasicField(2, dateStr);
    setBasicField(3, timeStr);
  };

  // Q00 多选（1-2 项）与文本框双向同步
  const ennSelected = (answers["enneagram"] || "").match(/\d/g)?.map(Number) ?? [];
  const toggleEnn = (n: number) => {
    let next: number[];
    if (ennSelected.includes(n)) next = ennSelected.filter((x) => x !== n);
    else if (ennSelected.length < 2) next = [...ennSelected, n];
    else next = [ennSelected[0], n];
    next.sort((a, b) => a - b);
    setAnswer("enneagram", next.join(lang === "zh" ? "、" : ", "));
  };

  // 滚动监听：侧边栏高亮当前题
  useEffect(() => {
    const onScroll = () => {
      let current = page === 0 ? 0 : 1;
      qRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= 180) current = i;
      });
      setActiveIdx(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  const goStep = (i: number) => {
    const targetPage = i >= 9 ? 1 : i < 1 ? 0 : 1;
    const jump = () => {
      if (i >= 9) submitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      else qRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (targetPage !== page) {
      setPage(targetPage);
      setTimeout(jump, 80);
    } else jump();
  };

  const switchPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const missing = QUESTIONS.filter((q) => !(answers[q.id] || "").trim());
    if (missing.length > 0) {
      setMissingModal(missing.map((q) => q.code));
      return;
    }
    setError("");
    sessionStorage.setItem("survey_answers", JSON.stringify(answers));
    sessionStorage.setItem("survey_lang", lang);
    // 不清草稿：用户在支付页点「重新填写」回到问卷时，能完整恢复刚填的答案，避免白填

    // Save to DB immediately — with auth token if logged in, anonymous if not
    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData.session?.access_token;
    const existingId = sessionStorage.getItem("existing_submission_id") || undefined;
    try {
      const res = await fetch("/api/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers, lang, existingSubmissionId: existingId }),
      });
      const json = await res.json();
      if (json.submissionId) {
        sessionStorage.setItem("existing_submission_id", json.submissionId);
      }
    } catch {
      // Non-fatal: sessionStorage is still the fallback
    }

    if (!sessionData.session) {
      router.push(`/${lang}/auth?next=${encodeURIComponent(`/${lang}/payment`)}`);
      return;
    }
    router.push(`/${lang}/payment`);
  };

  const focusGlow = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = "#00ff88";
      e.target.style.boxShadow = "0 0 14px #00ff8855";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = "#1a3a1a";
      e.target.style.boxShadow = "none";
    },
  };

  const qCardHeader = (q: { id: string; code: string; comment: string }) => (
    <div className="flex items-start gap-4">
      <NeonRing size={52}>{QUESTION_ICONS[q.id]}</NeonRing>
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="text-sm font-bold tracking-wider" style={{ color: "#00ff88", fontFamily: mono }}>{q.code}</div>
        <div className="text-sm leading-relaxed" style={{ color: "#8fbf8f", fontFamily: mono, whiteSpace: "pre-wrap" }}>{q.comment}</div>
      </div>
    </div>
  );

  const charCounter = (id: string) => (
    <div className="absolute bottom-2.5 right-3 text-xs pointer-events-none" style={{ color: "#2d5a2d", fontFamily: mono }}>
      {(answers[id] || "").length} / 500
    </div>
  );

  const renderQuestion = (q: typeof QUESTIONS[number], idx: number) => {
    // Q00：选项行 + 答案输入框
    if (q.id === "enneagram") {
      const options = q.label.split("\n").filter((l) => l.trim());
      return (
        <div key={q.id} ref={(el) => { qRefs.current[idx] = el; }} className="p-5 md:p-6 space-y-4" style={{ ...CARD, scrollMarginTop: 90 }}>
          {qCardHeader(q)}
          <div className="space-y-2">
            {options.map((line) => {
              const m = line.match(/^(\d+)[.、]\s*(.*)$/);
              const n = m ? Number(m[1]) : 0;
              const text = m ? m[2] : line;
              const sel = ennSelected.includes(n);
              return (
                <button
                  key={line}
                  onClick={() => toggleEnn(n)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{
                    background: sel ? "#0a1f0a" : "#071007",
                    border: `1px solid ${sel ? "#00ff88" : "#1a3a1a"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxShadow: sel ? "0 0 14px #00ff8833" : "none",
                    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{String(n).padStart(2, "0")}</span>
                  <span className="flex-1 text-sm leading-relaxed" style={{ color: "#4db8ff", textShadow: sel ? "0 0 16px #4db8ff66" : "none", fontWeight: sel ? 700 : 400 }}>{text}</span>
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${sel ? "#00ff88" : "#2d5a2d"}`, flexShrink: 0 }}
                  >
                    {sel && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder={q.placeholder}
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            className="w-full p-3 text-sm"
            style={INPUT}
            {...focusGlow}
          />
        </div>
      );
    }

    // Q01：子字段表单（标签 + 输入框逐行排列；生日/出生时间用滚轮选择器）
    if (q.id === "basic_info") {
      const pillBtn = (label: string, active: boolean, onClick: () => void) => (
        <button
          key={label}
          onClick={onClick}
          className="px-4 py-2 text-xs font-bold"
          style={{
            background: active ? "#0a1f0a" : "#071007",
            border: `1px solid ${active ? "#00ff88" : "#1a3a1a"}`,
            borderRadius: "10px", cursor: "pointer", fontFamily: mono,
            color: active ? "#00ff88" : "#4a7a4a",
            boxShadow: active ? "0 0 12px #00ff8833" : "none",
            transition: "border-color 0.15s, color 0.15s, box-shadow 0.15s",
          }}
        >
          {label}
        </button>
      );
      const wheelBox = (children: React.ReactNode) => (
        <div className="flex" style={{ background: "#071007", border: "1px solid #1a3a1a", borderRadius: "10px", overflow: "hidden" }}>
          {children}
        </div>
      );
      const dayCount = daysInMonth(birth.y, birth.m);
      return (
        <div key={q.id} ref={(el) => { qRefs.current[idx] = el; }} className="p-5 md:p-6 space-y-4" style={{ ...CARD, scrollMarginTop: 90 }}>
          {qCardHeader(q)}
          <div className="space-y-2.5">
            {basicFieldDefs.map((f, i) => {
              // 第3行：阳历/阴历切换 + 年月日滚轮
              if (i === 2) {
                return (
                  <div key={f.label} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3">
                    <div className="text-xs font-bold sm:w-48 flex-shrink-0 sm:pt-2.5" style={{ color: "#6fae6f", fontFamily: mono }}>{f.label}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        {ui.cal.map((c, ci) => pillBtn(c, birth.cal === ci, () => updateBirth({ cal: ci })))}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {[1960, 1970, 1980, 1990, 2000, 2010].map((decade) => (
                          <button
                            key={decade}
                            onClick={() => updateBirth({ y: decade, dateTouched: true })}
                            className="px-2.5 py-1 text-xs"
                            style={{
                              background: birth.y >= decade && birth.y < decade + 10 ? "#0a1f0a" : "transparent",
                              border: `1px solid ${birth.y >= decade && birth.y < decade + 10 ? "#00ff8855" : "#1a3a1a"}`,
                              borderRadius: "999px", cursor: "pointer", fontFamily: mono,
                              color: birth.y >= decade && birth.y < decade + 10 ? "#00ff88" : "#4a7a4a",
                              transition: "border-color 0.15s, color 0.15s",
                            }}
                          >
                            {lang === "zh" ? `${String(decade).slice(2)}后` : `${decade}s`}
                          </button>
                        ))}
                      </div>
                      {wheelBox(
                        <>
                          <Wheel
                            options={YEARS.map((y) => lang === "zh" ? `${y}年` : lang === "ko" ? `${y}년` : `${y}`)}
                            index={Math.max(0, YEARS.indexOf(birth.y))}
                            onPick={(yi) => updateBirth({ y: YEARS[yi], dateTouched: true })}
                          />
                          <Wheel
                            options={Array.from({ length: 12 }, (_, mi) => lang === "zh" ? `${mi + 1}月` : lang === "ko" ? `${mi + 1}월` : pad2(mi + 1))}
                            index={birth.m - 1}
                            onPick={(mi) => updateBirth({ m: mi + 1, dateTouched: true })}
                          />
                          <Wheel
                            options={Array.from({ length: dayCount }, (_, di) => lang === "zh" ? `${di + 1}日` : lang === "ko" ? `${di + 1}일` : pad2(di + 1))}
                            index={Math.min(birth.d, dayCount) - 1}
                            onPick={(di) => updateBirth({ d: di + 1, dateTouched: true })}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              // 第4行：时/分滚轮 + 「不确定」→ 模糊输入
              if (i === 3) {
                return (
                  <div key={f.label} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3">
                    <div className="text-xs font-bold sm:w-48 flex-shrink-0 sm:pt-2.5" style={{ color: "#6fae6f", fontFamily: mono }}>{f.label}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        {pillBtn(ui.unsure, birth.unsure, () => updateBirth({ unsure: !birth.unsure }))}
                      </div>
                      {birth.unsure ? (
                        <input
                          type="text"
                          placeholder={ui.fuzzyPh}
                          value={birth.fuzzy}
                          onChange={(e) => updateBirth({ fuzzy: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm"
                          style={INPUT}
                          {...focusGlow}
                        />
                      ) : (
                        wheelBox(
                          <>
                            <Wheel
                              options={Array.from({ length: 24 }, (_, hi) => lang === "zh" ? `${hi}点` : lang === "ko" ? `${hi}시` : pad2(hi))}
                              index={birth.h}
                              onPick={(hi) => updateBirth({ h: hi, timeTouched: true })}
                            />
                            <Wheel
                              options={Array.from({ length: 60 }, (_, mi) => lang === "zh" ? `${mi}分` : lang === "ko" ? `${mi}분` : pad2(mi))}
                              index={birth.min}
                              onPick={(mi) => updateBirth({ min: mi, timeTouched: true })}
                            />
                          </>
                        )
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <div className="text-xs font-bold sm:w-48 flex-shrink-0" style={{ color: "#6fae6f", fontFamily: mono }}>{f.label}</div>
                  <input
                    type="text"
                    placeholder={`${lang === "zh" ? "例如：" : "e.g. "}${f.ph}`}
                    value={basicFields[i] || ""}
                    onChange={(e) => setBasicField(i, e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm"
                    style={INPUT}
                    {...focusGlow}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Q08：单选卡片（2×2 网格）
    if (q.id === "dimension") {
      const lines = q.label.split("\n").filter((l) => l.trim());
      const question = lines[0];
      const options = lines.slice(1);
      return (
        <div key={q.id} ref={(el) => { qRefs.current[idx] = el; }} className="p-5 md:p-6 space-y-4" style={{ ...CARD, scrollMarginTop: 90 }}>
          {qCardHeader(q)}
          <div className="text-base font-bold leading-relaxed" style={{ color: "#4db8ff", textShadow: "0 0 18px #4db8ff44" }}>{question}</div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {options.map((line) => {
              const m = line.match(/^(\d+)[.、]\s*/);
              const n = m ? m[1] : line;
              const sel = (answers[q.id] || "").trim() === n;
              return (
                <button
                  key={line}
                  onClick={() => setAnswer(q.id, n)}
                  className="flex items-start gap-2.5 px-4 py-3 text-left"
                  style={{
                    background: sel ? "#0a1f0a" : "#071007",
                    border: `1px solid ${sel ? "#00ff88" : "#1a3a1a"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxShadow: sel ? "0 0 14px #00ff8833" : "none",
                    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  }}
                >
                  <span
                    className="flex items-center justify-center mt-0.5"
                    style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${sel ? "#00ff88" : "#2d5a2d"}`, flexShrink: 0 }}
                  >
                    {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: sel ? "#e2e8f0" : "#9fbf9f" }}>{line}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 其余：问题 + 多行输入 + 字数统计
    return (
      <div key={q.id} ref={(el) => { qRefs.current[idx] = el; }} className="p-5 md:p-6 space-y-4" style={{ ...CARD, scrollMarginTop: 90 }}>
        {qCardHeader(q)}
        <div className="text-base font-bold leading-relaxed" style={{ color: "#4db8ff", textShadow: "0 0 18px #4db8ff44", whiteSpace: "pre-wrap" }}>{q.label}</div>
        <div className="relative">
          <textarea
            rows={3}
            maxLength={500}
            placeholder={q.placeholder}
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            className="w-full p-3 pb-7 text-sm"
            style={{ ...INPUT, resize: "vertical" }}
            {...focusGlow}
          />
          {charCounter(q.id)}
        </div>
      </div>
    );
  };

  const pageQuestions = page === 0 ? QUESTIONS.slice(0, 1) : QUESTIONS.slice(1);
  const pageOffset = page === 0 ? 0 : 1;

  return (
    <main className="min-h-screen" style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)" }}>
      {/* ───── 顶栏 ───── */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "#050a05ee", borderBottom: "1px solid #112811", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${lang}`)} className="flex items-center gap-2" style={{ fontFamily: mono, background: "transparent", border: "none", cursor: "pointer" }}>
            <span className="text-base font-bold" style={{ color: "#00ff88", textShadow: "0 0 12px #00ff8866" }}>生命代码</span>
            <span className="text-xs" style={{ color: "#2d5a2d", letterSpacing: "0.15em", fontFamily: scifi }}>LIFE CODE</span>
          </button>
          <LangSwitch lang={lang} onPick={(c) => router.push(`/${c}/survey`)} />
        </div>
        <div className="hidden md:flex gap-6 text-xs" style={{ fontFamily: mono }}>
          {ui.navLinks.map(([anchor, label]) => (
            <a key={label} href={`/${lang}${anchor}`} className="nav-link" style={{ color: "#4a7a4a", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2"><NavEntries lang={lang} /></div>
          <UserMenu lang={lang} />
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider"
            style={{ border: "none", color: "#04140a", cursor: "pointer", fontFamily: mono, borderRadius: "14px", background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)", boxShadow: "0 0 22px #00ff8855, 0 2px 10px #00000066" }}
          >
            {ui.navCta}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 grid gap-6 items-start lg:grid-cols-[260px_1fr]">

        {/* ───── 左侧边栏 ───── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
          <div className="p-5 space-y-4" style={CARD}>
            <div>
              <div className="text-sm font-bold" style={{ color: "#e2e8f0", fontFamily: mono }}>{ui.sidebarTitle}</div>
              <div className="text-xs mt-1" style={{ color: "#2d5a2d", fontFamily: mono, letterSpacing: "0.12em" }}>{ui.sidebarSub}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs" style={{ fontFamily: mono }}>
                <span style={{ color: "#4a7a4a" }}>{ui.progress} {String(filled).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}</span>
                <span className="font-bold" style={{ color: "#00ff88" }}>{percent}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "#0f1f0f", overflow: "hidden" }}>
                <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #00cc6a, #00ff88)", boxShadow: "0 0 8px #00ff8866", transition: "width 0.3s" }} />
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1" style={CARD}>
            {ui.steps.map((label, i) => {
              const isActive = i === activeIdx;
              const isDone = i < 9 && !!(answers[QUESTIONS[i]?.id] || "").trim();
              return (
                <button
                  key={label}
                  onClick={() => goStep(i)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs"
                  style={{
                    background: isActive ? "#00ff8814" : "transparent",
                    border: `1px solid ${isActive ? "#00ff8855" : "transparent"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: mono,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <span className="font-bold" style={{ color: isActive ? "#00ff88" : isDone ? "#00cc6a" : "#2d5a2d" }}>{String(i).padStart(2, "0")}</span>
                  <span style={{ color: isActive ? "#00ff88" : isDone ? "#6fae6f" : "#4a7a4a" }}>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-2" style={CARD}>
            <div className="flex items-center gap-2">
              {IconLock}
              <span className="text-xs font-bold" style={{ color: "#00ff88", fontFamily: mono }}>{ui.security}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{t.securityNote.replace(/^🔒\s*/, "")}</p>
          </div>

          <div className="p-5 space-y-2" style={CARD}>
            <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>{ui.author}</div>
            <div className="text-lg font-bold" style={{ color: "#00ff88", fontFamily: scifi, textShadow: "0 0 14px #00ff8855" }}>THEONE</div>
            <div className="text-xs" style={{ color: "#4a7a4a" }}>{ui.authorRole}</div>
            <p className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{ui.authorBio}</p>
          </div>
        </aside>

        {/* ───── 主内容 ───── */}
        <div className="space-y-5 min-w-0">
          {/* 头部 */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs" style={{ fontFamily: mono }}>
              <span style={{ color: "#2d5a2d", letterSpacing: "0.08em" }}>{t.surveyHeader}</span>
              <span style={{ color: allFilled ? "#00ff88" : "#2d5a2d" }}>{allFilled ? t.progressReady : t.progressCollecting}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#00ff88", textShadow: "0 0 24px #00ff8855" }}>
              {t.surveyTitle}
            </h1>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <p className="text-xs" style={{ color: "#5a7a5a", fontFamily: mono }}>{t.surveySubtitle}</p>
              <span className="text-xs" style={{ color: "#4a7a4a", fontFamily: mono }}>
                {String(filled).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")} {t.progressFilled}
              </span>
            </div>
            <div className="px-4 py-3 text-xs" style={{ border: "1px solid #1a3a1a", background: "#0a150a88", borderRadius: "10px", color: "#6fae6f" }}>
              {t.securityNote}
            </div>
          </div>

          {/* 题目卡片 */}
          {pageQuestions.map((q, i) => renderQuestion(q, pageOffset + i))}

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}

          {/* 翻页 / 提交 */}
          {page === 0 ? (
            <button
              onClick={() => switchPage(1)}
              className="w-full py-4 text-sm font-bold tracking-wider"
              style={{ border: "1px solid #2a5a2a", color: "#9fbf9f", background: "#0a150a88", cursor: "pointer", fontFamily: mono, borderRadius: "14px" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#00ff88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a5a2a"; e.currentTarget.style.color = "#9fbf9f"; }}
            >
              {ui.next}　↓
            </button>
          ) : (
            <div ref={submitRef} className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => switchPage(0)}
                className="px-8 py-4 text-sm font-bold tracking-wider"
                style={{ border: "1px solid #2a5a2a", color: "#9fbf9f", background: "#0a150a88", cursor: "pointer", fontFamily: mono, borderRadius: "14px" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#00ff88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a5a2a"; e.currentTarget.style.color = "#9fbf9f"; }}
              >
                {ui.prev}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-4 text-base font-bold tracking-wider transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  border: "none", color: "#04140a", cursor: "pointer", fontFamily: mono, borderRadius: "14px",
                  background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                  boxShadow: "0 0 28px #00ff8855, 0 2px 10px #00000066",
                  fontSize: "clamp(0.85rem, 4vw, 1rem)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#04140a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
                {t.submitBtn.replace(/^\/\/\s*/, "")}
              </button>
            </div>
          )}

          <div className="text-center text-xs pt-2" style={{ color: "#3a6a3a", fontFamily: mono }}>
            {lang === 'zh' ? '如果此刻情绪难受，可拨打全国 24 小时心理援助热线 12356' : lang === 'ko' ? '지금 마음이 힘들다면, 자살예방 상담전화 109' : "If you're struggling right now, please reach out to a local crisis hotline."}
          </div>

          <div className="text-center pb-8 text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>
            <button onClick={() => router.push(`/${lang}/privacy`)} style={{ background: "transparent", border: "none", color: "#2d5a2d", cursor: "pointer", textDecoration: "underline" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")} onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}>
              {lang === 'zh' ? '隐私政策' : lang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
            </button>
            <span className="mx-2">·</span>
            <button onClick={() => router.push(`/${lang}/terms`)} style={{ background: "transparent", border: "none", color: "#2d5a2d", cursor: "pointer", textDecoration: "underline" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")} onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}>
              {lang === 'zh' ? '服务条款' : lang === 'ko' ? '서비스 이용약관' : 'Terms of Service'}
            </button>
          </div>
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
            style={{ background: "#080e08", border: "1px solid #00ff8844", borderRadius: "16px", fontFamily: mono }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
              {lang === 'zh' ? '// 以下题目未填写' : '// Missing answers'}
            </div>
            <div className="space-y-2">
              {missingModal.map((code) => (
                <div key={code} className="text-xs px-3 py-2" style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "10px", color: "#ff6b6b" }}>
                  ⚠ {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => setMissingModal([])}
              className="w-full py-2 text-sm font-bold"
              style={{ border: "1px solid #00ff8844", color: "#00ff88", background: "transparent", cursor: "pointer", borderRadius: "10px" }}
            >
              {lang === 'zh' ? '返回填写' : 'Go back'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
