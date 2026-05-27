import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase.auth.getUser(token);
  if (!data.user || data.user.email !== ADMIN_EMAIL) return null;
  return data.user;
}

// GET /api/admin/invite-usage?code=THECODE01
// Returns all paid submissions that used this invite code
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase
    .from("submissions")
    .select("id, email, name, lang, paid, created_at")
    .eq("invite_code", code.toUpperCase())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}
