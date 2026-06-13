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

  const [{ data: events }, { count: paidCount }] = await Promise.all([
    supabase.from("page_events").select("event, session_id"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("paid", true).neq("email", ADMIN_EMAIL),
  ]);

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
