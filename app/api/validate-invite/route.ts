import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Free beta codes — full access, no payment required
const FREE_ACCESS_CODES = ["FANDAO666"];

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false });

  const normalized = code.trim().toUpperCase();

  // Check free-access codes first (no DB lookup needed)
  if (FREE_ACCESS_CODES.includes(normalized)) {
    return NextResponse.json({ valid: true, label: "内测邀请码", discount: 100, freeAccess: true });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase
    .from("invite_codes")
    .select("code, label, commission_usd, is_active")
    .eq("code", normalized)
    .single();

  if (!data || !data.is_active) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, label: data.label, discount: 20, freeAccess: false });
}
