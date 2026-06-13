import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";

// 转化漏斗：落地页 → 提交问卷 → 到支付页 → 实际付费
// 前三阶段按 page_events 去重会话数；末阶段用真实付费数（排除管理员自测）
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 时间范围：today / 7d / 30d / all（默认 all）。今天以中国时区(UTC+8)零点为界
  const range = new URL(req.url).searchParams.get("range") || "all";
  let cutoff: string | null = null;
  const now = Date.now();
  if (range === "today") {
    const cn = new Date(now + 8 * 3600 * 1000); // 转到UTC+8
    cutoff = new Date(Date.UTC(cn.getUTCFullYear(), cn.getUTCMonth(), cn.getUTCDate()) - 8 * 3600 * 1000).toISOString();
  } else if (range === "7d") {
    cutoff = new Date(now - 7 * 86400 * 1000).toISOString();
  } else if (range === "30d") {
    cutoff = new Date(now - 30 * 86400 * 1000).toISOString();
  }

  let eventsQ = supabase.from("page_events").select("event, session_id");
  let paidQ = supabase.from("submissions").select("id", { count: "exact", head: true }).eq("paid", true).neq("email", ADMIN_EMAIL);
  if (cutoff) {
    eventsQ = eventsQ.gte("created_at", cutoff);
    paidQ = paidQ.gte("created_at", cutoff);
  }
  const [{ data: events }, { count: paidCount }] = await Promise.all([eventsQ, paidQ]);

  // 各阶段去重会话数
  const distinct = (ev: string) => new Set((events || []).filter((e) => e.event === ev && e.session_id).map((e) => e.session_id)).size;
  const landing = distinct("landing");
  const surveySubmit = distinct("survey_submit");
  const paymentView = distinct("payment_view");
  const paid = paidCount || 0;

  return NextResponse.json({
    stages: [
      { key: "landing", count: landing },
      { key: "survey_submit", count: surveySubmit },
      { key: "payment_view", count: paymentView },
      { key: "paid", count: paid },
    ],
    hasData: (events || []).length > 0,
  });
}
