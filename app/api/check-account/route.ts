import { NextRequest, NextResponse } from "next/server";

// 用 Supabase Admin REST 直接按 email 查账号是否存在
// 比 listUsers 全量拉取更高效，用于登录失败后区分「账号不存在」vs「密码错误」
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ exists: false });

  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );
  const data = await res.json();
  const exists = (data?.users?.length ?? 0) > 0;
  return NextResponse.json({ exists });
}
