import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "theone208899@gmail.com";

function svc() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await svc().auth.getUser(token);
  if (!data.user || data.user.email !== ADMIN_EMAIL) return null;
  return data.user;
}

// GET: 结算流水列表
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await svc()
    .from("settlements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settlements: data });
}

// POST: 按博主结算 N 单（取最早的 N 笔 pending 佣金）
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { blogger_email, order_count, note } = await req.json();
  const n = parseInt(order_count, 10);
  if (!blogger_email || !Number.isInteger(n) || n <= 0)
    return NextResponse.json({ error: "blogger_email 与正整数 order_count 必填" }, { status: 400 });

  const supabase = svc();

  // 取该博主最早的 N 笔待结算佣金
  const { data: pending, error: pErr } = await supabase
    .from("commissions")
    .select("id, amount_usd")
    .eq("blogger_email", blogger_email)
    .eq("status", "pending")
    .is("settlement_id", null)
    .order("created_at", { ascending: true })
    .limit(n);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!pending || pending.length < n)
    return NextResponse.json({ error: `待结算仅 ${pending?.length || 0} 单，不足 ${n} 单` }, { status: 400 });

  const amount = pending.reduce((s, r) => s + Number(r.amount_usd), 0);

  // 写结算流水
  const { data: settlement, error: sErr } = await supabase
    .from("settlements")
    .insert({ blogger_email, order_count: n, amount_usd: amount, note: note || null, created_by: admin.email })
    .select()
    .single();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  // 标记这 N 笔为已结算
  const ids = pending.map((r) => r.id);
  const { error: uErr } = await supabase
    .from("commissions")
    .update({ status: "settled", settlement_id: settlement.id })
    .in("id", ids);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ settlement });
}

// DELETE: 撤销一笔结算（关联佣金退回 pending）
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = svc();
  const { error: rErr } = await supabase
    .from("commissions")
    .update({ status: "pending", settlement_id: null })
    .eq("settlement_id", id);
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const { error: dErr } = await supabase.from("settlements").delete().eq("id", id);
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
