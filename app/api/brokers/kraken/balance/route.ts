import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET);
  return NextResponse.json(
    { balances: [], error: configured ? "The read-only Kraken balance endpoint is not implemented in this deployment." : "Kraken API credentials are not configured on the server." },
    { status: 503 },
  );
}
