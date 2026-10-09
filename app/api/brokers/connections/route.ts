import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const connections = {
    ibkr: { configured: Boolean(process.env.IBKR_CLIENT_ID && process.env.IBKR_ACCOUNT_ID), reachable: false, authenticated: false, message: "Broker health checks are not implemented in this deployment. No orders are submitted." },
    kraken: { configured: Boolean(process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET), reachable: false, authenticated: false, message: "Kraken health checks are not implemented in this deployment. No orders are submitted." },
    coinbase: { configured: Boolean(process.env.COINBASE_API_KEY && process.env.COINBASE_API_SECRET), reachable: false, authenticated: false, message: "Coinbase health checks are not implemented in this deployment. No orders are submitted." },
    bitget: { configured: Boolean(process.env.BITGET_API_KEY && process.env.BITGET_API_SECRET && process.env.BITGET_API_PASSPHRASE), reachable: false, authenticated: false, message: "Bitget health checks are not implemented in this deployment. No orders are submitted." },
  };
  return NextResponse.json({ connections, tradingMode: process.env.TRADING_MODE ?? "paper", liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === "true" });
}
