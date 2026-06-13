import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 功能调研建议收集：AI疗愈室 / 细分领域报告 的"研发中"页面提交入口
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { feature, content, email, vote, lang } = await req.json();

    if (!feature || !content || !String(content).trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    // 登录用户邮箱（选填，无需登录）
    let userEmail: string | null = null;
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userEmail = data?.user?.email ?? null;
    }

    const { error } = await supabase.from("feature_suggestions").insert({
      feature: String(feature).slice(0, 40),
      content: String(content).slice(0, 2000),
      email: email ? String(email).slice(0, 200) : null,
      vote: vote ? String(vote).slice(0, 40) : null,
      user_email: userEmail,
      lang: lang ? String(lang).slice(0, 8) : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
