import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    key: process.env.DEEPSEEK_API_KEY?.slice(0, 15) + "...",
    base: process.env.API_BASE_URL,
  });
}
