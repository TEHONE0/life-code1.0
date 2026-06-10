import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const GIFT_PRICE = "18.80"; // 单独购买赠礼码，原价

function epaySign(params: Record<string, string>, key: string): string {
  const str =
    Object.keys(params)
      .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "")
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + key;
  return crypto.createHash("md5").update(str).digest("hex");
}

function genGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `LCGIFT-${s}`;
}

// 购买赠礼码：预生成一个未激活的码（created_by 存订单号），支付回调确认收款后激活
export async function POST(req: NextRequest) {
  try {
    const { lang } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const pid = process.env.ZPAY_PID;
    const zkey = process.env.ZPAY_KEY;
    if (!pid || !zkey) return NextResponse.json({ error: "Payment not configured" }, { status: 500 });

    const orderId = `GIFT${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const giftCode = genGiftCode();
    const { error: insertErr } = await supabase.from("invite_codes").insert({
      code: giftCode, label: "购买赠礼", free_access: true, max_uses: 1, is_active: false,
      buyer_email: userData.user.email, created_by: orderId,
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    const host = req.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const params: Record<string, string> = {
      pid,
      type: "alipay",
      out_trade_no: orderId,
      notify_url: `${protocol}://${host}/api/payment-notify`,
      return_url: `${protocol}://${host}/${lang || "zh"}/account?view=reports`,
      name: "生命代码赠礼",
      money: GIFT_PRICE,
      sign_type: "MD5",
    };
    params.sign = epaySign(params, zkey);

    const url = `https://zpayz.cn/submit.php?${new URLSearchParams(params).toString()}`;
    return NextResponse.json({ url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
