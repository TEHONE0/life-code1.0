import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase
    .from("invite_codes")
    .select("code, label, commission_usd, is_active")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!data || !data.is_active) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, label: data.label, discount: 12 });
}
