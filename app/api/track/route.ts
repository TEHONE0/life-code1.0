import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 埋点写入：无需登录，失败静默（埋点不该影响用户）
export async function POST(req: NextRequest) {
  try {
    const { event, session_id, lang } = await req.json();
    if (!event) return NextResponse.json({ ok: false });
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from("page_events").insert({
      event: String(event).slice(0, 40),
      session_id: session_id ? String(session_id).slice(0, 60) : null,
      lang: lang ? String(lang).slice(0, 8) : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
