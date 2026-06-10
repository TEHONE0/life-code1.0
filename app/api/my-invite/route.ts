import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 博主自助查询：返回登录邮箱名下邀请码的使用/佣金/结算情况（只读，不含买家邮箱）
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  const email = userData?.user?.email;
  if (!email) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data: codes } = await supabase
    .from("invite_codes")
    .select("code, label, used_count, is_active, commission_usd")
    .eq("blogger_email", email);
  if (!codes || codes.length === 0) return NextResponse.json({ codes: [], commissions: [], settlements: [] });

  const codeList = codes.map((c) => c.code);
  const { data: commissions } = await supabase
    .from("commissions")
    .select("invite_code, amount_usd, status, created_at")
    .in("invite_code", codeList)
    .order("created_at", { ascending: false });
  const { data: settlements } = await supabase
    .from("settlements")
    .select("invite_code, order_count, amount_usd, note, created_at")
    .in("invite_code", codeList)
    .order("created_at", { ascending: false });

  return NextResponse.json({ codes, commissions: commissions || [], settlements: settlements || [] });
}
