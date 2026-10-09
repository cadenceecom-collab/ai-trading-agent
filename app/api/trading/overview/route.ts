import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Server database configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy." },
      { status: 503 },
    );
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [accountResult, positionsResult, signalsResult, ordersResult, rulesResult] = await Promise.all([
    db.from("accounts").select("id,name,base_currency,account_type").limit(1).maybeSingle(),
    db.from("positions").select("id,quantity,market_value,unrealized_pnl,assets(symbol)"),
    db.from("signals").select("id,action,confidence,rationale,assets(symbol)").order("created_at", { ascending: false }).limit(50),
    db.from("orders").select("id,side,status,quantity,assets(symbol),venues(name)").order("created_at", { ascending: false }).limit(50),
    db.from("risk_rules").select("name,value,unit").eq("enabled", true),
  ]);

  const firstError = accountResult.error ?? positionsResult.error ?? signalsResult.error ?? ordersResult.error ?? rulesResult.error;
  if (firstError) {
    return NextResponse.json({ error: "Unable to load the trading overview from Supabase.", details: firstError.message }, { status: 502 });
  }

  return NextResponse.json({
    account: accountResult.data ?? null,
    positions: positionsResult.data ?? [],
    signals: signalsResult.data ?? [],
    orders: ordersResult.data ?? [],
    riskRules: rulesResult.data ?? [],
    tradingMode: process.env.TRADING_MODE ?? "paper",
    liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === "true",
  });
}
