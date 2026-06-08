import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcBazi } from "@/lib/bazi";
import { SYSTEM_PROMPT_ZH } from "@/lib/prompts/system_zh";
import { SYSTEM_PROMPT_EN } from "@/lib/prompts/system_en";

export const maxDuration = 300;

function getSystemPrompt(lang?: string) {
  if (lang === 'zh') return SYSTEM_PROMPT_ZH
  return SYSTEM_PROMPT_EN  // en and ko both use English prompt
}

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { answers, lang, submission_id } = await req.json();

    // submission_id is required — no paid check bypass allowed
    if (!submission_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: sub } = await supabase
      .from("submissions")
      .select("paid, user_id")
      .eq("id", submission_id)
      .single();
    if (!sub || sub.user_id !== userData.user.id || !sub.paid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const SYSTEM_PROMPT = getSystemPrompt(lang);

    const baziResult = calcBazi(answers.basic_info || '')
    const baziBlock = baziResult ? `\n\n${baziResult.raw}` : ''

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.API_BASE_URL,
    });

    const currentYear = new Date().getFullYear();
    const userContent = lang === 'zh'
      ? `当前年份：${currentYear}年（所有涉及"近期""当前年份""流年"的分析，请以${currentYear}年为准）

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

Q08 · DIMENSION_SCAN（意识维度）：
${answers.dimension || "未填写"}
${baziBlock}
请根据以上变量，生成完整的生命代码解析报告。`
      : `Current year: ${currentYear} (all analysis referencing "near term", "current year", or "annual cycle" should be based on ${currentYear})

Here are the user's Life Code questionnaire answers:

Q00 · ENNEAGRAM_SCAN (Enneagram self-assessment):
${answers.enneagram || "not filled"}

Q01 · BASIC_INFO (name/birth/cities):
${answers.basic_info}

Q02 · ORIGIN_ENVIRONMENT (family environment):
${answers.origin}

Q03 · CRITICAL_ERROR (heaviest blow):
${answers.critical_error}

Q04 · CORE_LOOP (what you always return to):
${answers.core_loop}

Q05 · UNDELETABLE_CONST (what you fear losing most):
${answers.const}

Q06 · CURRENT_STATUS (current situation & friction):
${answers.status}

Q07 · LEGACY_DEFINE (how you want to be remembered):
${answers.legacy}

Q08 · DIMENSION_SCAN (consciousness dimension):
${answers.dimension || "not filled"}
${baziBlock}
${lang === 'ko' ? 'Note: This user\'s interface language is Korean (한국어). If you need to output the birth data incomplete notice, write it in Korean.\n\n' : ''}Please generate the complete Life Code report based on the above variables.`;

    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    const encoder = new TextEncoder();
    let fullReport = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const baseMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ];

          // 单次输出可能因 max_tokens 被截断（比如只写到第五章），最多自动续写3次
          for (let round = 0; round < 4; round++) {
            const messages = round === 0
              ? baseMessages
              : [...baseMessages, { role: "assistant" as const, content: fullReport }, { role: "user" as const, content: "继续，从刚才中断的地方接着往下写，不要重复已经写过的内容，也不要重新输出标题或开场白。" }];

            const streamResponse = await client.chat.completions.create({
              model,
              max_tokens: 16384,
              stream: true,
              messages,
            });

            let finishReason: string | null = null;
            let lastBeat = 0;
            for await (const chunk of streamResponse) {
              const delta = chunk.choices[0]?.delta as { content?: string; reasoning_content?: string } | undefined;
              const text = delta?.content || "";
              if (text) {
                fullReport += text;
                controller.enqueue(encoder.encode(text));
              } else if (delta?.reasoning_content && Date.now() - lastBeat > 1000) {
                // 推理模型出正文前会先思考数十秒，期间无 content 输出，连接静默会被
                // 手机/微信浏览器掐断（nginx 记 499），前端卡在加载页。每秒发一个空白
                // 心跳保活；前端 cleanReport 的 trim() 会吃掉这些前导空白，不影响报告显示。
                controller.enqueue(encoder.encode(" "));
                lastBeat = Date.now();
              }
              if (chunk.choices[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
            }

            if (finishReason !== "length") break; // 正常结束，无需续写
          }

          // 先存库再关流：确保 Vercel 函数回收前写入完成
          if (fullReport && submission_id) {
            const { error } = await supabase
              .from("submissions")
              .update({ report: fullReport })
              .eq("id", submission_id);
            if (error) console.error("Supabase update error:", error.message);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Accel-Buffering": "no", // 关闭 nginx 缓冲，确保心跳和正文逐字节实时下发
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Analysis error:", msg)
    return NextResponse.json({ error: "分析失败", detail: msg }, { status: 500 });
  }
}
