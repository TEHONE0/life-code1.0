import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";

export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  const email = userData.user?.email;
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Admin sees all; bloggers see only their own
  const isAdmin = email === ADMIN_EMAIL;
  let query = supabase
    .from("commissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) query = query.eq("blogger_email", email);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = (data || []).reduce((sum, r) => sum + Number(r.amount_usd), 0);
  return NextResponse.json({ commissions: data, total });
}
