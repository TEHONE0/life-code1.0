import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string) {
  if (!hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret) {
    const ok = verifyShopifyHmac(rawBody, req.headers.get("x-shopify-hmac-sha256"), secret);
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { note_attributes?: Array<{ name: string; value: string }>; financial_status?: string; id?: number | string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const attrs = payload.note_attributes || [];
  const submissionId = attrs.find((a) => a.name === "submission_id")?.value;
  const userId = attrs.find((a) => a.name === "user_id")?.value;

  if (!submissionId) return NextResponse.json({ ok: true, skipped: "no submission_id" });
  if (payload.financial_status && payload.financial_status !== "paid") {
    return NextResponse.json({ ok: true, skipped: `status=${payload.financial_status}` });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: submission, error } = await supabase
    .from("submissions")
    .update({ paid: true, shopify_order_id: String(payload.id ?? "") })
    .eq("id", submissionId)
    .eq("user_id", userId || "")
    .select("invite_code, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Credit commission if invite code was used
  if (submission?.invite_code) {
    const { data: codeRow } = await supabase
      .from("invite_codes")
      .select("blogger_email, commission_usd")
      .eq("code", submission.invite_code)
      .single();

    if (codeRow) {
      await supabase.from("commissions").insert({
        invite_code: submission.invite_code,
        blogger_email: codeRow.blogger_email,
        user_email: submission.email,
        submission_id: submissionId,
        amount_usd: codeRow.commission_usd,
        status: "pending",
      });
      await supabase.rpc("increment_invite_used", { p_code: submission.invite_code });
    }
  }

  return NextResponse.json({ ok: true });
}
