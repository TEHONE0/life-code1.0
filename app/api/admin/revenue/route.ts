import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";
// 价格三段：≤06-12 为 ¥8.8/¥6.8；06-12~06-15 为 ¥18.8/¥16.8；≥06-15 回到 ¥8.8/¥6.8
// 注：06-13 起新订单已存真实 amount，反推仅用于更早历史订单兜底
const PRICE_CHANGE = new Date("2026-06-12T00:00:00+08:00").getTime();
const PRICE_REVERT = new Date("2026-06-15T00:00:00+08:00").getTime();
const OLD_FULL = 8.80, OLD_DISCOUNT = 6.80;
const NEW_FULL = 18.80, NEW_DISCOUNT = 16.80;
// ZPay 手续费：1.0% 平台 + 0.6% 支付宝，结算到支付宝余额前扣除
const ZPAY_FEE_RATE = 0.016;

// 营收统计：我的收益（总营收 − 博主佣金）+ 各博主收益汇总
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 已付费订单 + 邀请码元数据 + 佣金
  // amount 列可能尚未创建（ALTER 未跑），失败则退回不含 amount 的查询
  let subsRes = await supabase.from("submissions").select("invite_code, created_at, amount").eq("paid", true).neq("email", ADMIN_EMAIL);
  if (subsRes.error && /amount/i.test(subsRes.error.message)) {
    subsRes = await supabase.from("submissions").select("invite_code, created_at").eq("paid", true).neq("email", ADMIN_EMAIL) as typeof subsRes;
  }
  const [{ data: codes }, { data: comms }] = await Promise.all([
    supabase.from("invite_codes").select("code, free_access, commission_usd, label, blogger_email"),
    supabase.from("commissions").select("invite_code, amount_usd, status"),
  ]);
  const subs = subsRes.data as { invite_code: string | null; created_at: string; amount?: number | null }[] | null;

  const codeMeta = new Map<string, { free: boolean; discount: boolean; label: string | null; email: string | null }>();
  for (const c of codes || []) {
    codeMeta.set(c.code, {
      free: !!c.free_access || /^LCGIFT/i.test(c.code),
      discount: !c.free_access && !!c.commission_usd, // 博主码：有佣金、非免费
      label: c.label,
      email: c.blogger_email,
    });
  }

  // 每单金额：优先用真实记录的 amount；无则按"下单日期×档位"反推（06-12前后价格不同）
  let gross = 0, fullCount = 0, discountCount = 0, freeCount = 0;
  let estimated = false; // 是否含按价格反推的历史订单（非精确）
  for (const s of subs || []) {
    const code = s.invite_code;
    const meta = code ? codeMeta.get(code) : null;
    if (meta?.free) { freeCount++; continue; }
    const isDiscount = !!meta?.discount;
    if (isDiscount) discountCount++; else fullCount++;
    if (s.amount != null) {
      gross += Number(s.amount); // 真实金额，精确
    } else {
      estimated = true;
      const t = new Date(s.created_at).getTime();
      // 06-12 之前 或 06-15 之后均为低价档；中间为高价档
      const low = t < PRICE_CHANGE || t >= PRICE_REVERT;
      gross += isDiscount ? (low ? OLD_DISCOUNT : NEW_DISCOUNT) : (low ? OLD_FULL : NEW_FULL);
    }
  }

  // 博主佣金：按邀请码汇总（pending/settled）
  const byCode = new Map<string, { pending: number; settled: number; total: number; count: number }>();
  let bloggerTotal = 0, bloggerPending = 0, bloggerSettled = 0;
  for (const c of comms || []) {
    const amt = Number(c.amount_usd) || 0;
    bloggerTotal += amt;
    if (c.status === "settled") bloggerSettled += amt; else bloggerPending += amt;
    const e = byCode.get(c.invite_code) || { pending: 0, settled: 0, total: 0, count: 0 };
    e.total += amt; e.count += 1;
    if (c.status === "settled") e.settled += amt; else e.pending += amt;
    byCode.set(c.invite_code, e);
  }
  const bloggers = [...byCode.entries()].map(([invite_code, v]) => ({
    invite_code,
    label: codeMeta.get(invite_code)?.label || null,
    email: codeMeta.get(invite_code)?.email || null,
    ...v,
  })).sort((a, b) => b.total - a.total);

  const fee = gross * ZPAY_FEE_RATE;

  return NextResponse.json({
    paidCount: (subs || []).length,
    gross: +gross.toFixed(2),
    fullCount, discountCount, freeCount,
    bloggerTotal: +bloggerTotal.toFixed(2),
    bloggerPending: +bloggerPending.toFixed(2),
    bloggerSettled: +bloggerSettled.toFixed(2),
    fee: +fee.toFixed(2),
    feeRate: ZPAY_FEE_RATE,
    myNet: +(gross - bloggerTotal - fee).toFixed(2),
    estimated, // true=含历史反推订单，数字为估算（真实以支付宝/ZPay为准）
    bloggers,
  });
}
