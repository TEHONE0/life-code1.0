import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { answers, lang, existingSubmissionId } = await req.json();

  // Try to get logged-in user (optional — no error if not authenticated)
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  let userId: string | null = null;
  let userEmail: string | null = null;
  if (token) {
    const { data: userData } = await supabase.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email ?? null;
    }
  }

  // If existing draft exists: claim it for the logged-in user if not yet claimed
  if (existingSubmissionId) {
    if (userId) {
      await supabase
        .from("submissions")
        .update({ user_id: userId, email: userEmail })
        .eq("id", existingSubmissionId)
        .is("user_id", null); // only claim if still anonymous
    }
    return NextResponse.json({ submissionId: existingSubmissionId });
  }

  // Create new draft (with or without user_id)
  const name = (answers.basic_info || "").split(/[，,、\s]/)[0].trim() || "anonymous";
  const { data: row, error: insertErr } = await supabase
    .from("submissions")
    .insert({
      user_id: userId,
      email: userEmail,
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
      paid: false,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message || "DB error" }, { status: 500 });
  }

  return NextResponse.json({ submissionId: row.id });
}
