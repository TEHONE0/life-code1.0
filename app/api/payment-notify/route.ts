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

async function handle(req: NextRequest) {
  try {
    const params: Record<string, string> = {};
    if (req.method === "GET") {
      req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });
    } else {
      const body = await req.text();
      for (const [k, v] of new URLSearchParams(body)) params[k] = v;
    }

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
