import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data, error } = await supabase
    .from("submissions")
    .select("id, name, lang, paid, created_at, report, enneagram, basic_info, origin, critical_error, core_loop, const_value, status, legacy, dimension")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    lang: r.lang,
    paid: r.paid,
    created_at: r.created_at,
    hasReport: !!(r.report && r.report.length > 0),
    answers: {
      enneagram: r.enneagram, basic_info: r.basic_info, origin: r.origin,
      critical_error: r.critical_error, core_loop: r.core_loop, const: r.const_value,
      status: r.status, legacy: r.legacy, dimension: r.dimension,
    },
  }));
  return NextResponse.json({ submissions: list });
}
