"use client";
import { useRouter, useParams } from "next/navigation";
import { Lang } from "@/lib/i18n";
import SuggestionBox from "@/components/SuggestionBox";

const mono = "Courier New, monospace";

export default function AiHealerPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const zh = lang === "zh";
  const ko = lang === "ko";
  const router = useRouter();

  const t = {
    back: zh ? "← 返回报告" : ko ? "← 보고서로" : "← Back to report",
    badge: zh ? "研发中 · COMING SOON" : "COMING SOON",
    title: zh ? "AI 疗愈室" : ko ? "AI 힐링룸" : "AI Healing Room",
    sub: zh ? "AI 疗愈师" : "AI healing companion",
    intro: zh
      ? "一个可以随时倾诉的空间。把你心里的困惑、纠结、说不出口的事写下来，AI 疗愈室会陪你一起梳理、慢慢看见。"
      : ko
      ? "언제든 마음을 털어놓을 수 있는 공간. AI 힐링룸이 함께 정리하고 바라봐 드립니다."
      : "A space you can talk to anytime. Write down what weighs on you, and the AI Healing Room helps you untangle it and slowly see clearly.",
    devNote: zh
      ? "这项功能正在打磨中。先告诉我们：你最想问 TA 的第一个问题是什么？这会直接决定我们怎么把它做出来。"
      : ko
      ? "개발 중입니다. 가장 묻고 싶은 첫 질문을 알려주세요."
      : "We're still building it. Tell us: what's the very first thing you'd want to ask? It shapes how we build it.",
    placeholder: zh
      ? "把你最想问的问题写在这里…"
      : ko
      ? "가장 묻고 싶은 질문을 적어주세요…"
      : "Write the question you most want to ask…",
    disclaimer: zh
      ? "AI 疗愈室是陪伴式的自我探索，不替代专业心理咨询与医疗。如果此刻情绪难受，请拨打全国 24 小时心理援助热线 12356。"
      : ko
      ? "AI 힐링룸은 자기 탐색을 돕는 동반자이며 전문 상담·의료를 대체하지 않습니다. 지금 힘들다면 자살예방 상담전화 109."
      : "The AI Healing Room is companion-style self-exploration, not a substitute for professional counseling or medical care. If you're struggling right now, please reach out to a local crisis hotline.",
  };

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
          {/* 霓虹光环图标 */}
          <div className="flex justify-center pt-2">
            <div className="flex items-center justify-center" style={{ width: 72, height: 72, border: "1.5px solid #00ff88", borderRadius: "50%", boxShadow: "0 0 28px #00ff8844", background: "#0a150a" }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#00ff88" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 33 C8 25 6 16 12 12 C16 9.5 19 11.5 20 14 C21 11.5 24 9.5 28 12 C34 16 32 25 20 33 Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#00ff88", fontFamily: mono, textShadow: "0 0 20px #00ff8844" }}>{t.title}</h1>
          <div className="text-xs" style={{ color: "#4a7a4a", fontFamily: mono }}>{t.sub}</div>
        </div>

        <p className="text-sm leading-relaxed text-center" style={{ color: "#7aba7a" }}>{t.intro}</p>

        <div className="p-4 text-xs leading-relaxed" style={{ border: "1px dashed #1a3a1a", borderRadius: "12px", color: "#5a9a5a", background: "#0a150a66", fontFamily: mono }}>
          {t.devNote}
        </div>

        <SuggestionBox feature="ai_healer" lang={lang} placeholder={t.placeholder} />

        <p className="text-xs leading-relaxed text-center pt-2" style={{ color: "#3a6a3a", fontFamily: mono }}>{t.disclaimer}</p>
      </div>
    </main>
  );
}
