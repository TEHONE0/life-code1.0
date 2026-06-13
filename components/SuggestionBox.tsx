"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const mono = "Courier New, monospace";

type Lang = string;

// 功能调研建议框：内容(必填) + 邮箱留资(选填，登录自动带入) + 可选投票。
// 提交写入 feature_suggestions 表，作为产品需求蓄水池。
export default function SuggestionBox({
  feature,
  lang,
  placeholder,
  vote,
}: {
  feature: string;
  lang: Lang;
  placeholder: string;
  vote?: string | null;
}) {
  const zh = lang === "zh";
  const ko = lang === "ko";
  const [content, setContent] = useState("");
  const [wechat, setWechat] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  // 已登录则自动带入生命代码账号邮箱
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email;
      if (e) setEmail(e);
    });
  }, []);

  const submit = async () => {
    if (busy) return;
    if (!content.trim()) {
      setErr(zh ? "写一句你的想法再提交～" : ko ? "의견을 입력해 주세요" : "Please write something first");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/feature-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ feature, content: content.trim(), wechat: wechat.trim() || null, email: email.trim() || null, vote: vote || null, lang }),
      });
      if (!res.ok) throw new Error("submit failed");
      setDone(true);
    } catch {
      setErr(zh ? "提交失败，请稍后再试" : ko ? "제출 실패" : "Submit failed, please retry");
    } finally {
      setBusy(false);
    }
  };

  const hasContact = !!(wechat.trim() || email.trim());

  if (done) {
    return (
      <div className="p-6 text-center space-y-2" style={{ border: "1px solid #00ff8844", background: "#0a1f0a", borderRadius: "16px", fontFamily: mono }}>
        <div className="text-sm font-bold" style={{ color: "#00ff88" }}>
          {zh ? "✓ 收到了，谢谢你" : ko ? "✓ 감사합니다" : "✓ Got it, thank you"}
        </div>
        <div className="text-xs" style={{ color: "#5a9a5a" }}>
          {hasContact
            ? (zh ? "上线第一时间通知你，并邀你优先内测体验" : ko ? "출시되면 가장 먼저 알려드릴게요" : "We'll notify you first when it launches")
            : (zh ? "你的建议会直接影响我们的设计" : ko ? "당신의 의견이 설계에 반영됩니다" : "Your suggestion shapes what we build")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3" style={{ border: "1px solid #1a3a1a", background: "#080e08", borderRadius: "16px" }}>
      <div className="text-xs" style={{ color: "#2d5a2d", fontFamily: mono }}>
        // {zh ? "留下你的想法 / 建议" : ko ? "의견을 남겨주세요" : "Leave your thoughts"}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 text-sm"
        style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "12px", color: "#cfe8cf", fontFamily: mono, resize: "vertical", outline: "none" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#00ff88")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#1a3a1a")}
      />
      <div className="pt-1 space-y-2">
        <div className="text-xs" style={{ color: "#4a8a4a", fontFamily: mono }}>
          {zh ? "// 联系方式（选填）— 留下联系方式，上线第一时间通知你 + 优先内测"
            : ko ? "// 연락처 (선택) — 출시 시 가장 먼저 알림 + 우선 베타"
            : "// Contact (optional) — get notified first + priority beta access"}
        </div>
        <input
          type="text"
          value={wechat}
          onChange={(e) => setWechat(e.target.value)}
          placeholder={zh ? "微信号" : ko ? "위챗 ID" : "WeChat ID"}
          className="w-full p-3 text-sm"
          style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "10px", color: "#cfe8cf", fontFamily: mono, outline: "none" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00ff88")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1a3a1a")}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={zh ? "邮箱" : ko ? "이메일" : "Email"}
          className="w-full p-3 text-sm"
          style={{ background: "#0a150a", border: "1px solid #1a3a1a", borderRadius: "10px", color: "#cfe8cf", fontFamily: mono, outline: "none" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00ff88")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1a3a1a")}
        />
      </div>
      {err && <div className="text-xs" style={{ color: "#ff6b6b", fontFamily: mono }}>{err}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full py-3 text-sm font-bold tracking-wider"
        style={{ border: "none", color: "#04140a", cursor: busy ? "not-allowed" : "pointer", fontFamily: mono, borderRadius: "12px", background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)", boxShadow: "0 0 20px #00ff8844", opacity: busy ? 0.7 : 1 }}
      >
        {busy ? (zh ? "提交中…" : ko ? "제출 중…" : "Submitting…") : (zh ? "提交建议" : ko ? "제출" : "Submit")}
      </button>
    </div>
  );
}
