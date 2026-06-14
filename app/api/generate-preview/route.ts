import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcBazi } from "@/lib/bazi";
import { PREVIEW_PROMPT_ZH } from "@/lib/prompts/preview_zh";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { submissionId } = await req.json();
    if (!submissionId)
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    // 只允许本人查看自己的预览
    const { data: sub } = await supabase
      .from("submissions")
      .select("user_id, preview, basic_info, enneagram, origin, critical_error, core_loop, const_value, status, legacy, dimension, defense, lang")
      .eq("id", submissionId)
      .single();

    if (!sub || sub.user_id !== userData.user.id)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // 已有预览直接返回
    if (sub.preview) return NextResponse.json({ preview: sub.preview });

    const answers = {
      basic_info: sub.basic_info,
      enneagram: sub.enneagram,
      origin: sub.origin,
      critical_error: sub.critical_error,
      core_loop: sub.core_loop,
      const: sub.const_value,
      status: sub.status,
      legacy: sub.legacy,
      dimension: sub.dimension,
      defense: sub.defense,
    };

    const baziResult = calcBazi(answers.basic_info || "");
    const baziBlock = baziResult ? `\n\n${baziResult.raw}` : "";
    const currentYear = new Date().getFullYear();

    const userContent = `当前年份：${currentYear}年（所有涉及"近期""当前年份""流年"的分析，请以${currentYear}年为准）

以下是用户填写的生命代码问卷：

Q00 · ENNEAGRAM_SCAN（九型人格自测）：
${answers.enneagram || "未填写"}

Q01 · BASIC_INFO（姓名/生日/城市）：
${answers.basic_info}

Q02 · ORIGIN_ENVIRONMENT（家庭环境）：
${answers.origin}

Q03 · CRITICAL_ERROR（最重的打击）：
${answers.critical_error}

Q04 · CORE_LOOP（停不下来的事）：
${answers.core_loop}

Q05 · UNDELETABLE_CONST（最怕失去什么）：
${answers.const}

Q06 · CURRENT_STATUS（当前状态与阻力）：
${answers.status}

Q07 · LEGACY_DEFINE（希望被怎么记住）：
${answers.legacy}

Q08 · DEFENSE_RESPONSE（被指出问题时的第一反应）：
${answers.defense || "未填写"}

Q09 · DIMENSION_SCAN（意识维度）：
${answers.dimension || "未填写"}
${baziBlock}
请根据以上变量，生成系统速读预览。`;

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.API_BASE_URL,
    });

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: PREVIEW_PROMPT_ZH },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const preview = completion.choices[0]?.message?.content || "";

    // 存库（静默失败不影响返回）
    await supabase
      .from("submissions")
      .update({ preview })
      .eq("id", submissionId);

    return NextResponse.json({ preview });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
