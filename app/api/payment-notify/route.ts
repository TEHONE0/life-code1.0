import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function epaySign(params: Record<string, string>, key: string): string {
  const str =
    Object.keys(params)
      .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "")
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + key;
  return crypto.createHash("md5").update(str).digest("hex");
}

// 赠礼码生成：去掉易混字符（0/O/1/I）
function genGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `LCGIFT-${s}`;
}

const GIFT_EXPIRE_MS = 30 * 24 * 3600 * 1000; // 赠礼码30天有效

async function handle(req: NextRequest) {
  try {
    const params: Record<string, string> = {};
    if (req.method === "GET") {
      req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });
    } else {
      const body = await req.text();
      for (const [k, v] of new URLSearchParams(body)) params[k] = v;
    }

    console.log("[payment-notify] 收到回调", { order: params.out_trade_no, status: params.trade_status, money: params.money });

    const zkey = process.env.ZPAY_KEY!;
    const expected = epaySign(params, zkey);
    if (params.sign !== expected) {
      console.error("[payment-notify] 签名错误", { expected, got: params.sign });
      return new NextResponse("签名错误", { status: 400 });
    }
    if (params.trade_status !== "TRADE_SUCCESS") {
      return new NextResponse("success");
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 购买赠礼订单（订单号GIFT开头）：激活预生成的赠礼码（created_by 存的是订单号），不涉及报告解锁
    if (params.out_trade_no?.startsWith("GIFT")) {
      const { data: giftRow } = await supabase
        .from("invite_codes").select("code").eq("created_by", params.out_trade_no).single();
      if (giftRow) {
        await supabase.from("invite_codes")
          .update({ is_active: true, expires_at: new Date(Date.now() + GIFT_EXPIRE_MS).toISOString() })
          .eq("code", giftRow.code);
        console.log("[payment-notify] 赠礼码已激活", { order: params.out_trade_no, code: giftRow.code });
      } else {
        console.error("[payment-notify] ⚠️ 赠礼订单找不到预生成码", { order: params.out_trade_no });
      }
      return new NextResponse("success");
    }

    const { data: submission } = await supabase
      .from("submissions")
      .select("id, email, invite_code")
      .eq("shopify_order_id", params.out_trade_no)
      .single();

    if (submission) {
      await supabase.from("submissions").update({ paid: true }).eq("id", submission.id);
      if (submission.invite_code) {
        const { data: codeRow } = await supabase
          .from("invite_codes").select("used_count, blogger_email, commission_usd").eq("code", submission.invite_code).single();
        if (codeRow) {
          await supabase.from("invite_codes")
            .update({ used_count: (codeRow.used_count || 0) + 1 })
            .eq("code", submission.invite_code);

          // 达人分成自动记录（认邀请码，blogger_email 可空；commission_usd 在国内版存人民币）
          if (codeRow.commission_usd) {
            await supabase.from("commissions").insert({
              invite_code: submission.invite_code,
              blogger_email: codeRow.blogger_email,
              user_email: submission.email,
              submission_id: submission.id,
              amount_usd: codeRow.commission_usd,
              status: "pending",
            });
          }
        }
      }
      console.log("[payment-notify] 已解锁", { order: params.out_trade_no, submission: submission.id });

      // 买一赠一活动：活动期内付费成功自动送一张30天有效的一次性免费码（免费码解锁不走支付回调，天然不触发）
      const promoUntil = process.env.GIFT_PROMO_UNTIL; // 如 2026-06-30；未配置或已过期则不送
      if (promoUntil && new Date() <= new Date(`${promoUntil}T23:59:59+08:00`)) {
        const giftCode = genGiftCode();
        const { error: giftErr } = await supabase.from("invite_codes").insert({
          code: giftCode, label: "买一赠一", free_access: true, max_uses: 1, is_active: true,
          expires_at: new Date(Date.now() + GIFT_EXPIRE_MS).toISOString(),
          buyer_email: submission.email,
        });
        if (giftErr) console.error("[payment-notify] ⚠️ 买一赠一码生成失败", { order: params.out_trade_no, error: giftErr.message });
        else console.log("[payment-notify] 已送买一赠一码", { order: params.out_trade_no, code: giftCode });
      }
    } else {
      // 用户已付款但找不到订单记录 = 最严重的静默失败，必须留痕便于人工补单
      console.error("[payment-notify] ⚠️ 付款成功但找不到对应订单", { order: params.out_trade_no, money: params.money });
    }

    return new NextResponse("success");
  } catch (e) {
    console.error("[payment-notify]", e);
    return new NextResponse("error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
