import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getPayPalToken() {
  const base = process.env.PAYPAL_BASE_URL || "https://api-m.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, submissionId } = await req.json();
    if (!orderId || !submissionId) {
      return NextResponse.json({ error: "Missing orderId or submissionId" }, { status: 400 });
    }

    const accessToken = await getPayPalToken();
    const base = process.env.PAYPAL_BASE_URL || "https://api-m.paypal.com";

    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const capture = await captureRes.json();
    if (!captureRes.ok || capture.status !== "COMPLETED") {
      console.error("[capture-paypal-order] capture failed:", capture);
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Mark paid
    const { data: sub } = await supabase
      .from("submissions")
      .update({ paid: true })
      .eq("id", submissionId)
      .select("invite_code")
      .single();

    // Increment used_count on the invite code
    if (sub?.invite_code) {
      const { data: codeRow } = await supabase
        .from("invite_codes")
        .select("used_count")
        .eq("code", sub.invite_code)
        .single();
      if (codeRow) {
        await supabase
          .from("invite_codes")
          .update({ used_count: (codeRow.used_count || 0) + 1 })
          .eq("code", sub.invite_code);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
