import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { lang, answers, inviteCode } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = userData.user;
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
        paid: false,
        invite_code: inviteCode || null,
      })
      .select("id")
      .single();
    if (insertErr || !row) return NextResponse.json({ error: insertErr?.message || "DB error" }, { status: 500 });

    const submissionId = row.id;

    const checkoutBase = process.env.SHOPIFY_CHECKOUT_URL;
    if (!checkoutBase) {
      await supabase.from("submissions").update({ paid: true }).eq("id", submissionId);
      return NextResponse.json({ testMode: true, submissionId });
    }

    const sep = checkoutBase.includes("?") ? "&" : "?";
    const returnUrl = `/${lang}/result?sid=${submissionId}`;
    let url = `${checkoutBase}${sep}attributes[submission_id]=${submissionId}&attributes[user_id]=${user.id}&attributes[lang]=${lang}&return_to=${encodeURIComponent(returnUrl)}`;
    if (inviteCode) url += `&discount=${encodeURIComponent(inviteCode)}`;
    return NextResponse.json({ url, submissionId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
