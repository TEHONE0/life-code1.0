import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 免费码不再硬编码，统一以 invite_codes.free_access 字段为准（与 create-payment 同源）

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false });

  const normalized = code.trim().toUpperCase();

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase
    .from("invite_codes")
    .select("code, label, commission_usd, is_active, free_access, used_count, max_uses, expires_at")
    .eq("code", normalized)
    .single();

  if (!data || !data.is_active) return NextResponse.json({ valid: false });
  // 赠礼码限次/限期：用满或过期视为无效
  if (data.max_uses && (data.used_count || 0) >= data.max_uses) return NextResponse.json({ valid: false });
  if (data.expires_at && new Date(data.expires_at) < new Date()) return NextResponse.json({ valid: false });
  if (data.free_access) {
    return NextResponse.json({ valid: true, label: data.label, discount: 100, freeAccess: true });
  }
  return NextResponse.json({ valid: true, label: data.label, discount: 20, freeAccess: false });
}
