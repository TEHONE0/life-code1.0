import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    SHOPIFY_CHECKOUT_URL: process.env.SHOPIFY_CHECKOUT_URL ? "SET: " + process.env.SHOPIFY_CHECKOUT_URL.slice(0, 40) : "NOT SET",
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
