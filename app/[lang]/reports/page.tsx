"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lang } from "@/lib/i18n";
import SuggestionBox from "@/components/SuggestionBox";

const mono = "Courier New, monospace";

export default function ReportsPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const zh = lang === "zh";
  const ko = lang === "ko";
  const router = useRouter();
  const [vote, setVote] = useState<string | null>(null);

  const t = {
    back: zh ? "← 返回报告" : ko ? "← 보고서로" : "← Back to report",
    badge: zh ? "研发中 · COMING SOON" : "COMING SOON",
    title: zh ? "专属领域深度报告" : ko ? "심층 분야별 리포트" : "In-Depth Reports",
    intro: zh
      ? "在你的生命代码总报告基础上展开，针对你最在意的人生维度，做更深一层的专属解析。"
      : ko
      ? "당신의 생명 코드 종합 리포트를 바탕으로, 가장 중요한 영역을 더 깊이 분석합니다."
      : "Built on your core Life Code report — a deeper, dedicated analysis for the dimension you care about most.",
    voteHint: zh ? "你最想先要哪一份？点一下投票 ↓" : ko ? "어떤 리포트를 먼저 원하나요? ↓" : "Which do you want first? Tap to vote ↓",
    placeholder: zh
      ? "你希望这些报告解答什么？或者你还想要哪个领域的报告…"
      : ko
      ? "어떤 내용을 다루길 원하나요?…"
      : "What would you want these reports to answer? Or which other domain?…",
  };

  const cards = zh
    ? [
        { id: "career", icon: "M4 8h16v11H4z M8 8V6h8v2", title: "职业报告", desc: "你的天赋赛道、能量消耗点、最适合的工作方式与协作角色" },
        { id: "love", icon: "M12 20 C4 14 3 8 7 6 C10 4.5 12 7 12 9 C12 7 14 4.5 17 6 C21 8 20 14 12 20Z", title: "婚恋报告", desc: "你的亲密模式、依恋类型、吸引与冲突根源、关系里的修复方向" },
        { id: "family", icon: "M5 20v-7l7-5 7 5v7 M9 20v-5h6v5", title: "家庭报告", desc: "原生家庭如何写进你的代码、与父母子女的相处模式与和解路径" },
        { id: "enneagram", icon: "M12 3l9 6-9 12-9-12z M12 3v18", title: "九型人格报告", desc: "你的主型副型、健康层级、压力与成长方向的完整人格地图" },
      ]
    : [
        { id: "career", icon: "M4 8h16v11H4z M8 8V6h8v2", title: ko ? "커리어" : "Career", desc: ko ? "재능·에너지·협업 역할" : "Your strengths, energy drains, ideal work style and collaboration role" },
        { id: "love", icon: "M12 20 C4 14 3 8 7 6 C10 4.5 12 7 12 9 C12 7 14 4.5 17 6 C21 8 20 14 12 20Z", title: ko ? "연애·결혼" : "Love & Marriage", desc: ko ? "애착 유형·갈등·회복" : "Your intimacy pattern, attachment type, sources of attraction and conflict" },
        { id: "family", icon: "M5 20v-7l7-5 7 5v7 M9 20v-5h6v5", title: ko ? "가족" : "Family", desc: ko ? "원가족·화해의 길" : "How your family of origin wrote your code, and the path to reconciliation" },
        { id: "enneagram", icon: "M12 3l9 6-9 12-9-12z M12 3v18", title: ko ? "에니어그램" : "Enneagram", desc: ko ? "유형·건강 수준·성장" : "Your type, wing, health levels, and full personality map for growth" },
      ];

  return (
    <main className="min-h-screen px-5 py-10" style={{ background: "radial-gradient(ellipse at top, #061206 0%, #050a05 70%)" }}>
      <div className="w-full max-w-lg mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="text-xs"
          style={{ color: "#2d5a2d", background: "transparent", border: "none", cursor: "pointer", fontFamily: mono }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#2d5a2d")}
        >
          {t.back}
        </button>

        <div className="space-y-3 text-center">
          <div className="inline-block px-3 py-1 text-xs" style={{ border: "1px solid #00ff8844", color: "#00ff88", background: "#0a1a0a", borderRadius: "999px", fontFamily: mono, letterSpacing: "0.1em" }}>
            {t.badge}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88", fontFamily: mono, textShadow: "0 0 20px #00ff8844" }}>{t.title}</h1>
        </div>

        <p className="text-sm leading-relaxed text-center" style={{ color: "#7aba7a" }}>{t.intro}</p>

        <div className="text-xs text-center" style={{ color: "#4a8a4a", fontFamily: mono }}>{t.voteHint}</div>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => {
            const active = vote === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setVote(active ? null : c.id)}
                className="p-4 text-left space-y-2 transition-all"
                style={{ border: `1px solid ${active ? "#00ff88" : "#1a3a1a"}`, background: active ? "#0a1f0a" : "#080e08", borderRadius: "14px", cursor: "pointer", boxShadow: active ? "0 0 22px #00ff8833" : "none" }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? "#00ff88" : "#4a8a4a"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.icon} />
                </svg>
                <div className="text-sm font-bold" style={{ color: active ? "#00ff88" : "#7aba7a", fontFamily: mono }}>{c.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#5a7a5a" }}>{c.desc}</div>
                <div className="text-xs pt-1" style={{ color: active ? "#00ff88" : "#2d5a2d", fontFamily: mono }}>
                  {active ? (zh ? "✓ 已投票" : "✓ Voted") : (zh ? "即将上线" : "Coming soon")}
                </div>
              </button>
            );
          })}
        </div>

        <SuggestionBox feature="vertical_reports" lang={lang} placeholder={t.placeholder} vote={vote} />
      </div>
    </main>
  );
}
