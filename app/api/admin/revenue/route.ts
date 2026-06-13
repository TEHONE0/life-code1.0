import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";
const FULL_PRICE = 18.80;     // 标准价
const DISCOUNT_PRICE = 16.80; // 达人邀请码价

// 营收统计：我的收益（总营收 − 博主佣金）+ 各博主收益汇总
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 已付费订单 + 邀请码元数据 + 佣金
  const [{ data: subs }, { data: codes }, { data: comms }] = await Promise.all([
    // 排除管理员自己的测试报告（admin 邮箱 paid 自动为 true，非真实营收）
    supabase.from("submissions").select("invite_code").eq("paid", true).neq("email", ADMIN_EMAIL),
    supabase.from("invite_codes").select("code, free_access, commission_usd, label, blogger_email"),
    supabase.from("commissions").select("invite_code, amount_usd, status"),
  ]);

  const codeMeta = new Map<string, { free: boolean; discount: boolean; label: string | null; email: string | null }>();
  for (const c of codes || []) {
    codeMeta.set(c.code, {
      free: !!c.free_access || /^LCGIFT/i.test(c.code),
      discount: !c.free_access && !!c.commission_usd, // 博主码：有佣金、非免费
      label: c.label,
      email: c.blogger_email,
    });
  }

  // 每单价格反推：无码→标准价；免费码→0；博主码→折扣价；其它码→标准价
  let gross = 0, fullCount = 0, discountCount = 0, freeCount = 0;
  for (const s of subs || []) {
    const code = s.invite_code as string | null;
    const meta = code ? codeMeta.get(code) : null;
    if (meta?.free) { freeCount++; continue; }
    if (meta?.discount) { gross += DISCOUNT_PRICE; discountCount++; }
    else { gross += FULL_PRICE; fullCount++; }
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

  return NextResponse.json({
    paidCount: (subs || []).length,
    gross: +gross.toFixed(2),
    fullCount, discountCount, freeCount,
    bloggerTotal: +bloggerTotal.toFixed(2),
    bloggerPending: +bloggerPending.toFixed(2),
    bloggerSettled: +bloggerSettled.toFixed(2),
    myNet: +(gross - bloggerTotal).toFixed(2),
    bloggers,
  });
}
