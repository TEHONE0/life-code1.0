import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";

// 用户建议（AI疗愈室 / 细分领域报告 调研）+ 投票统计
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("feature_suggestions")
    .select("id, feature, content, email, vote, user_email, lang, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 细分报告投票统计
  const votes: Record<string, number> = {};
  for (const r of data || []) {
    if (r.vote) votes[r.vote] = (votes[r.vote] || 0) + 1;
  }
  return NextResponse.json({ suggestions: data || [], votes });
}
