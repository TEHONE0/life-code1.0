import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "v4-" + Date.now(),
    SUPABASE_URL: process.env.SUPABASE_URL ? `set (${process.env.SUPABASE_URL.substring(0,20)}...)` : "MISSING",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `set (first8: ${process.env.ANTHROPIC_API_KEY.substring(0,8)})` : "MISSING",
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? `set (${process.env.PAYPAL_CLIENT_ID.substring(0,8)}...)` : "MISSING",
    PAYPAL_SECRET: process.env.PAYPAL_SECRET ? `set (${process.env.PAYPAL_SECRET.substring(0,8)}...)` : "MISSING",
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || "not set (will use live)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || "unknown",
  });
}
