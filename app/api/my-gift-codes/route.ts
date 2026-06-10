import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 我的赠礼码：登录用户名下的赠礼码（买一赠一所得 + 单独购买），只读
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  const email = userData?.user?.email;
  if (!email) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data: codes } = await supabase
    .from("invite_codes")
    .select("code, label, used_count, max_uses, expires_at, is_active, created_at")
    .eq("buyer_email", email)
    .like("code", "LCGIFT%")
    .eq("is_active", true) // 未付款的预生成码不展示
    .order("created_at", { ascending: false });

  return NextResponse.json({ codes: codes || [] });
}
