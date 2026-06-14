import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { answersDiffer } from "@/lib/submissionAnswers";

export async function POST(req: NextRequest) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { answers, lang, existingSubmissionId } = await req.json();

  // Try to get logged-in user (optional — no error if not authenticated)
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  let userId: string | null = null;
  let userEmail: string | null = null;
  if (token) {
    const { data: userData } = await supabase.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email ?? null;
    }
  }

  // 新版问卷 basic_info 是 "姓名: 范向南 / 性别: 男 / ..." 合成串，优先按标签提取；旧格式回退首段
  const _bi = (answers.basic_info || "") as string;
  const name = (_bi.match(/(?:姓名|Name|이름)[:：]\s*([^/，,、\n]+)/i)?.[1] || _bi.split(/[，,、/\s]/)[0] || "").trim() || "anonymous";

  // 旧ID只允许复用"未支付、未出报告"的草稿，且必须用最新答案覆盖——
  // 已支付/已出报告的记录若被复用，新填的人会被旧档顶掉、新答案丢失（2026-06-13 线上bug）
  if (existingSubmissionId) {
    const { data: existing } = await supabase
      .from("submissions")
      .select("id, paid, report, enneagram, basic_info, origin, critical_error, core_loop, const_value, status, legacy, dimension, defense")
      .eq("id", existingSubmissionId)
      .maybeSingle();
    if (existing && !existing.paid && !existing.report) {
      // 问卷一字未改 → 保留已生成的简报缓存（省算力）；改了任何字 → 简报失效重新解析
      const changed = answersDiffer(existing, answers);
      await supabase
        .from("submissions")
        .update({
          name, lang,
          enneagram: answers.enneagram, basic_info: answers.basic_info,
          origin: answers.origin, critical_error: answers.critical_error,
          core_loop: answers.core_loop, const_value: answers.const,
          status: answers.status, legacy: answers.legacy,
          dimension: answers.dimension, defense: answers.defense,
          ...(changed ? { preview: null } : {}),
        })
        .eq("id", existingSubmissionId);
      if (userId) {
        await supabase
          .from("submissions")
          .update({ user_id: userId, email: userEmail })
          .eq("id", existingSubmissionId)
          .is("user_id", null); // only claim if still anonymous
      }
      return NextResponse.json({ submissionId: existingSubmissionId });
    }
    // 旧ID不可复用 → 落到下方新建
  }

  // Create new draft (with or without user_id)
  const { data: row, error: insertErr } = await supabase
    .from("submissions")
    .insert({
      user_id: userId,
      email: userEmail,
      name,
      lang,
      enneagram: answers.enneagram,
      basic_info: answers.basic_info,
      origin: answers.origin,
      critical_error: answers.critical_error,
      core_loop: answers.core_loop,
      const_value: answers.const,
      status: answers.status,
      legacy: answers.legacy,
      dimension: answers.dimension,
      defense: answers.defense,
      paid: false,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message || "DB error" }, { status: 500 });
  }

  return NextResponse.json({ submissionId: row.id });
}
