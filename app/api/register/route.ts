import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 服务端注册：用 admin 接口建用户并直接标记已确认（email_confirm: true），
// 这样手机号/用户名映射出的内部邮箱也能注册成功，不依赖后台「确认邮箱」开关。
// 建成后前端再用同样的邮箱+密码登录。
export async function POST(req: NextRequest) {
  const { email, password, account } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "缺少账号或密码" }, { status: 400 });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: account ? { account } : undefined,
  });

  if (error) {
    // 已注册过：让前端走登录提示
    const already = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { error: already ? "该账号已注册，请直接登录" : error.message, already },
      { status: already ? 409 : 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
