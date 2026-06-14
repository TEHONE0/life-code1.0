import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { answersDiffer } from "@/lib/submissionAnswers";

const ADMIN_EMAILS = ['theone208899@gmail.com'];
// 免费码不再硬编码，统一以 invite_codes.free_access 字段为准（与 validate-invite 同源）
const PRICE = "18.80";
const DISCOUNT_PRICE = "16.80"; // 达人邀请码（lifecode01-10）专属价

function epaySign(params: Record<string, string>, key: string): string {
  const str =
    Object.keys(params)
      .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "")
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + key;
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { lang, answers, inviteCode, existingSubmissionId, tradeType } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = userData.user;
    const isAdmin = ADMIN_EMAILS.includes(user.email || "");
    let submissionId: string | null = null;

    // 新版问卷 basic_info 是 "姓名: 范向南 / 性别: 男 / ..." 合成串，优先按标签提取；旧格式回退首段
    const _bi = (answers.basic_info || "") as string;
    const name = (_bi.match(/(?:姓名|Name|이름)[:：]\s*([^/，,、\n]+)/i)?.[1] || _bi.split(/[，,、/\s]/)[0] || "").trim() || "anonymous";

    if (existingSubmissionId) {
      // 旧ID只允许复用"未支付、未出报告"的草稿，且用最新答案覆盖——
      // 已支付/已出报告的记录若被复用，新填的人会被旧档顶掉、新答案丢失（2026-06-13 线上bug）
      const { data: existing } = await supabase
        .from("submissions")
        .select("id, paid, report, enneagram, basic_info, origin, critical_error, core_loop, const_value, status, legacy, dimension, defense")
        .eq("id", existingSubmissionId)
        .maybeSingle();
      if (existing && !existing.paid && !existing.report) {
        // 问卷未改 → 保留简报缓存；改了 → 简报失效（与 save-draft 一致）
        const changed = answersDiffer(existing, answers);
        await supabase.from("submissions").update({
          name, lang,
          enneagram: answers.enneagram, basic_info: answers.basic_info,
          origin: answers.origin, critical_error: answers.critical_error,
          core_loop: answers.core_loop, const_value: answers.const,
          status: answers.status, legacy: answers.legacy,
          dimension: answers.dimension, defense: answers.defense,
          invite_code: inviteCode || null,
          ...(changed ? { preview: null } : {}),
        }).eq("id", existingSubmissionId);
        submissionId = existingSubmissionId;
      }
      // 旧ID不可复用 → 落到下方新建
    }

    if (!submissionId) {
      const { data: row, error: insertErr } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id, email: user.email, name, lang,
          enneagram: answers.enneagram, basic_info: answers.basic_info,
          origin: answers.origin, critical_error: answers.critical_error,
          core_loop: answers.core_loop, const_value: answers.const,
          status: answers.status, legacy: answers.legacy,
          dimension: answers.dimension, defense: answers.defense, paid: isAdmin,
          invite_code: inviteCode || null,
        })
        .select("id").single();
      if (insertErr || !row) return NextResponse.json({ error: insertErr?.message || "DB error" }, { status: 500 });
      submissionId = row.id;
    }

    if (isAdmin) {
      await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
      return NextResponse.json({ testMode: true, submissionId });
    }

    let price = PRICE;
    if (inviteCode) {
      const normalized = inviteCode.trim().toUpperCase();
      const { data: invite } = await supabase
        .from("invite_codes")
        .select("is_active, free_access, used_count, max_uses, expires_at")
        .eq("code", normalized)
        .single();
      // 赠礼码限次/限期：用满或过期视为无效
      const exhausted = invite?.max_uses && (invite.used_count || 0) >= invite.max_uses;
      const expired = invite?.expires_at && new Date(invite.expires_at) < new Date();
      const usable = invite?.is_active && !exhausted && !expired;
      if (usable && invite.free_access) {
        await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
        await supabase.from("invite_codes").update({ used_count: (invite.used_count || 0) + 1 }).eq("code", normalized);
        return NextResponse.json({ testMode: true, submissionId });
      }
      if (usable) price = DISCOUNT_PRICE;
    }

    // 未配置 ZPay → 测试模式
    const pid = process.env.ZPAY_PID;
    const zkey = process.env.ZPAY_KEY;
    if (!pid || !zkey) {
      await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
      return NextResponse.json({ testMode: true, submissionId });
    }

    const host = req.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const orderId = `LC${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    void tradeType; // 当前仅开通支付宝渠道
    const notifyUrl = `${protocol}://${host}/api/payment-notify`;
    const returnUrl = `${protocol}://${host}/${lang}/result?sid=${submissionId}&source=payment`;

    const params: Record<string, string> = {
      pid,
      type: "alipay",
      out_trade_no: orderId,
      notify_url: notifyUrl,
      return_url: returnUrl,
      name: "生命代码报告",
      money: price,
      sign_type: "MD5",
    };
    params.sign = epaySign(params, zkey);

    await supabase.from("submissions").update({ shopify_order_id: orderId }).eq("id", submissionId);

    const url = `https://zpayz.cn/submit.php?${new URLSearchParams(params).toString()}`;
    return NextResponse.json({ url, submissionId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
