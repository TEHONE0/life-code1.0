import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ['theone208899@gmail.com']

async function getPayPalToken() {
  const base = process.env.PAYPAL_BASE_URL || "https://api-m.paypal.com";
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error(`Missing PayPal env vars: CLIENT_ID=${!!clientId} SECRET=${!!secret}`);
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("[getPayPalToken] PayPal response:", JSON.stringify(data));
    throw new Error(`PayPal OAuth failed: ${data.error_description || data.error || JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { lang, answers, inviteCode, existingSubmissionId } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = userData.user;
    const isAdmin = ADMIN_EMAILS.includes(user.email || '')
    let submissionId: string;

    if (existingSubmissionId) {
      submissionId = existingSubmissionId;
      if (inviteCode) {
        await supabase.from("submissions").update({ invite_code: inviteCode }).eq("id", submissionId);
      }
    } else {
      const name = (answers.basic_info || "").split(/[，,、\s]/)[0].trim() || "anonymous";
      const { data: row, error: insertErr } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          email: user.email,
          name,
          lang,
          enneagram: answers.enneagram,
          basic_info: answers.basic_info,
          origin: answers.origin,
          critical_error: answers.critical_error,
          core_loop: answers.core_loop,
          const_value: answers.const,
          status: answers.status,
          legacy: answers.legacy,
          dimension: answers.dimension,
          defense: answers.defense,
          paid: isAdmin,
          invite_code: inviteCode || null,
        })
        .select("id")
        .single();
      if (insertErr || !row) return NextResponse.json({ error: insertErr?.message || "DB error" }, { status: 500 });
      submissionId = row.id;
    }

    // Admin accounts skip payment entirely
    if (isAdmin) {
      await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
      return NextResponse.json({ testMode: true, submissionId });
    }

    const host = req.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const returnUrl = `${protocol}://${host}/${lang}/result?sid=${submissionId}&paypal=1`;
    const cancelUrl = `${protocol}://${host}/${lang}/payment`;

    // Free beta codes — full access, no payment required
    const FREE_ACCESS_CODES = ["FANDAO666"];

    // Validate invite code for discount or free access
    let price = "8.90";
    if (inviteCode) {
      const normalized = inviteCode.trim().toUpperCase();
      if (FREE_ACCESS_CODES.includes(normalized)) {
        // Free access: skip PayPal entirely
        await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
        // Increment used_count
        const { data: codeRow } = await supabase.from("invite_codes").select("used_count").eq("code", normalized).single();
        if (codeRow) {
          await supabase.from("invite_codes").update({ used_count: (codeRow.used_count || 0) + 1 }).eq("code", normalized);
        }
        return NextResponse.json({ testMode: true, submissionId });
      }
      const { data: invite } = await supabase
        .from("invite_codes")
        .select("is_active")
        .eq("code", normalized)
        .single();
      if (invite?.is_active) {
        price = (8.9 * 0.8).toFixed(2); // 20% off
      }
    }

    let accessToken: string;
    try {
      accessToken = await getPayPalToken();
      if (!accessToken) throw new Error("Empty access token from PayPal");
    } catch (tokenErr: unknown) {
      const msg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
      console.error("[create-paypal-order] Token error:", msg);
      return NextResponse.json({ error: "PayPal token error: " + msg }, { status: 500 });
    }
    const base = process.env.PAYPAL_BASE_URL || "https://api-m.paypal.com";

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: price },
          description: "Life Code Report",
          custom_id: submissionId,
        }],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: "THEONE AI Studio",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error("[create-paypal-order] PayPal error:", JSON.stringify(order));
      return NextResponse.json({ error: order.message || "PayPal error", details: order }, { status: 500 });
    }

    const approvalUrl = order.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
    return NextResponse.json({ url: approvalUrl, submissionId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
