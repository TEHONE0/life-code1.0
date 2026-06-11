"use client";

const LANGS = [
  { code: "zh", label: "中文" },
  { code: "en", label: "EN" },
];
const mono = "Courier New, monospace";

export default function LangSwitch({ lang, onPick }: { lang: string; onPick: (code: string) => void }) {
  return (
    <div className="hidden sm:inline-flex items-center" style={{ border: "1px solid #1f3f1f", borderRadius: "10px", overflow: "hidden", fontFamily: mono }}>
      {LANGS.map((l, i) => {
        const active = l.code === lang;
        return (
          <button
            key={l.code}
            onClick={() => onPick(l.code)}
            className="text-xs"
            style={{
              background: active ? "#00ff88" : "transparent",
              color: active ? "#04140a" : "#4a7a4a",
              fontWeight: active ? 700 : 400,
              border: "none",
              borderLeft: i === 0 ? "none" : "1px solid #1f3f1f",
              borderRadius: 0,
              padding: "4px 9px",
              cursor: "pointer",
              fontFamily: mono,
            }}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
