"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ADMIN_EMAIL = "theone208899@gmail.com";

type InviteCode = {
  id: string;
  code: string;
  label: string | null;
  blogger_email: string | null;
  commission_usd: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

type Commission = {
  id: string;
  invite_code: string;
  blogger_email: string;
  user_email: string;
  amount_usd: number;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [tab, setTab] = useState<"codes" | "commissions">("codes");
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session || data.session.user.email !== ADMIN_EMAIL) {
        router.replace(`/${lang}`);
        return;
      }
      setToken(data.session.access_token);
    })();
  }, [lang, router]);

  useEffect(() => {
    if (!token) return;
    fetchCodes();
    fetchCommissions();
  }, [token]);

  const fetchCodes = async () => {
    const res = await fetch("/api/admin/invite-codes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setCodes(json.codes || []);
  };

  const fetchCommissions = async () => {
    const res = await fetch("/api/admin/commissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setCommissions(json.commissions || []);
    setTotalCommission(json.total || 0);
  };

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: newCode.trim(), label: newLabel.trim() || null, blogger_email: newEmail.trim() || null }),
    });
    const json = await res.json();
    if (json.error) { setError(json.error); setCreating(false); return; }
    setNewCode(""); setNewLabel(""); setNewEmail("");
    setCreating(false);
    fetchCodes();
  };

  const handleToggle = async (code: string, is_active: boolean) => {
    await fetch("/api/admin/invite-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, is_active: !is_active }),
    });
    fetchCodes();
  };

  if (!token) return null;

  const S = { color: "#050a05", bg: "radial-gradient(ellipse at top, #061206 0%, #050a05 60%)", mono: "Courier New, monospace" as const };

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: S.bg }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-xs" style={{ color: "#1e4a1e", fontFamily: S.mono }}>// ADMIN · {ADMIN_EMAIL}</div>
        <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: "1px solid #1a3a1a" }}>
          {(["codes", "commissions"] as const).map((v) => (
            <button key={v} onClick={() => setTab(v)}
              className="px-4 py-2 text-sm font-bold"
              style={{ background: "transparent", border: "none", borderBottom: tab === v ? "2px solid #00ff88" : "2px solid transparent", color: tab === v ? "#00ff88" : "#2d5a2d", cursor: "pointer", fontFamily: S.mono, marginBottom: "-1px" }}
            >
              {v === "codes" ? "Invite Codes" : `Commissions ($${totalCommission.toFixed(2)})`}
            </button>
          ))}
        </div>

        {tab === "codes" && (
          <div className="space-y-4">
            {/* Create new code */}
            <div className="p-4 border space-y-3" style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: S.mono }}>
              <div className="text-xs" style={{ color: "#2d5a2d" }}>// CREATE INVITE CODE</div>
              <div className="flex gap-2 flex-wrap">
                <input
                  placeholder="CODE (e.g. BLOGGER01)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="px-3 py-2 text-sm"
                  style={{ background: "#0a150a", border: "1px solid #1a3a1a", color: "#e2e8f0", fontFamily: S.mono, outline: "none", flex: "1", minWidth: "120px", letterSpacing: "0.1em" }}
                />
                <input
                  placeholder="博主名称 (label)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="px-3 py-2 text-sm"
                  style={{ background: "#0a150a", border: "1px solid #1a3a1a", color: "#e2e8f0", fontFamily: S.mono, outline: "none", flex: "1", minWidth: "120px" }}
                />
                <input
                  placeholder="博主邮箱 (email)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="px-3 py-2 text-sm"
                  style={{ background: "#0a150a", border: "1px solid #1a3a1a", color: "#e2e8f0", fontFamily: S.mono, outline: "none", flex: "1", minWidth: "150px" }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newCode.trim()}
                  className="px-5 py-2 text-sm font-bold"
                  style={{ border: "1px solid #00ff88", color: "#00ff88", background: "transparent", cursor: "pointer", fontFamily: S.mono, opacity: creating ? 0.5 : 1 }}
                >
                  {creating ? "..." : "+ 生成"}
                </button>
              </div>
              {error && <div className="text-xs" style={{ color: "#ff6b6b" }}>⚠ {error}</div>}
            </div>

            {/* Code list */}
            <div className="space-y-2">
              {codes.map((c) => (
                <div key={c.id} className="p-3 border flex items-center justify-between gap-3"
                  style={{ borderColor: c.is_active ? "#1a3a1a" : "#1a1a1a", background: "#080e08", fontFamily: S.mono }}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: c.is_active ? "#00ff88" : "#2d5a2d", letterSpacing: "0.1em" }}>{c.code}</div>
                    <div className="text-xs" style={{ color: "#4a7a4a" }}>
                      {c.label || "—"} · {c.blogger_email || "no email"} · 用了 {c.used_count} 次 · $2/单
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs" style={{ color: c.is_active ? "#00ff88" : "#ff6b6b" }}>
                      {c.is_active ? "● 有效" : "○ 已停用"}
                    </span>
                    <button
                      onClick={() => handleToggle(c.code, c.is_active)}
                      className="text-xs px-3 py-1"
                      style={{ border: "1px solid #1a3a1a", color: "#2d5a2d", background: "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ff8866"; e.currentTarget.style.color = "#4a8a4a" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.color = "#2d5a2d" }}
                    >
                      {c.is_active ? "停用" : "启用"}
                    </button>
                  </div>
                </div>
              ))}
              {codes.length === 0 && (
                <div className="text-xs text-center py-8" style={{ color: "#2d5a2d", fontFamily: S.mono }}>// 暂无邀请码</div>
              )}
            </div>
          </div>
        )}

        {tab === "commissions" && (
          <div className="space-y-2">
            <div className="text-xs p-3 border" style={{ borderColor: "#1a3a1a", background: "#080e08", color: "#00ff88", fontFamily: S.mono }}>
              // 累计待结算佣金：${totalCommission.toFixed(2)} USD
            </div>
            {commissions.map((c) => (
              <div key={c.id} className="p-3 border space-y-1" style={{ borderColor: "#1a3a1a", background: "#080e08", fontFamily: S.mono }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#00ff88" }}>${Number(c.amount_usd).toFixed(2)}</span>
                  <span style={{ color: c.status === "pending" ? "#fbbf24" : "#00ff88" }}>● {c.status}</span>
                </div>
                <div className="text-xs" style={{ color: "#4a7a4a" }}>
                  邀请码: {c.invite_code} · 博主: {c.blogger_email || "—"}
                </div>
                <div className="text-xs" style={{ color: "#2d5a2d" }}>
                  用户: {c.user_email} · {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {commissions.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: "#2d5a2d", fontFamily: S.mono }}>// 暂无佣金记录</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
