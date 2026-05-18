"use client";
import { useRouter, useParams } from "next/navigation";
import { getT, Lang } from "@/lib/i18n";

export default function AboutPage() {
  const params = useParams()
  const lang = (params.lang as Lang) ?? 'en'
  const t = getT(lang)
  const router = useRouter()

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: "radial-gradient(ellipse at center, #061206 0%, #050a05 70%)" }}
    >
      <div className="w-full max-w-lg space-y-8">
        <button
          onClick={() => router.back()}
          className="text-xs transition-colors"
          style={{ color: "#1e4a1e", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Courier New, monospace" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4a1e")}
        >
          {t.aboutBack}
        </button>

        <div className="space-y-6">
          <div
            className="inline-block px-3 py-1 text-xs border rounded-sm"
            style={{ borderColor: "#1a3a1a", color: "#00ff8877", background: "#0a1a0a" }}
          >
            LIFE_CODE_SCANNER · ABOUT
          </div>

          <h1 className="text-2xl font-bold" style={{ color: "#00ff88", fontFamily: "Courier New, monospace" }}>
            {t.aboutTitle}
          </h1>

          <div
            className="space-y-4 p-6 border"
            style={{ borderColor: "#1a3a1a", background: "#080e08" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              {t.aboutBody1}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              {t.aboutBody2}
            </p>
          </div>

          <p className="text-xs" style={{ color: "#1e4a1e", fontFamily: "Courier New, monospace" }}>
            // Life Code Architect · THEONE
          </p>
        </div>
      </div>
    </main>
  )
}
