import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type FetchCause = Error & { cause?: (Error & { code?: string }) | string };

function safeFetchError(error: unknown) {
  const err = error as FetchCause;
  const cause = err?.cause;
  const causeMessage = typeof cause === "string" ? cause : cause?.message;
  const causeCode = typeof cause === "object" && cause ? cause.code : undefined;
  return {
    name: err?.name ?? "Error",
    message: err?.message ?? "Unknown fetch error",
    ...(causeCode ? { causeCode } : {}),
    ...(causeMessage ? { causeMessage: causeMessage.slice(0, 240) } : {}),
  };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        error: "Server database configuration is missing.",
        diagnostics: {
          supabaseUrlPresent: Boolean(url),
          serviceRoleKeyPresent: Boolean(key),
          deploymentEnvironment: process.env.VERCEL_ENV ?? "unknown",
          gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
        },
      },
      { status: 503 },
    );
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return NextResponse.json(
      { error: "Supabase URL is invalid.", diagnostics: { urlFormatValid: false } },
      { status: 503 },
    );
  }

  // supabase-js converts thrown fetch errors into PostgREST errors, so retain
  // the sanitized original cause separately for the response diagnostics.
  let networkFetchError: ReturnType<typeof safeFetchError> | null = null;
  const diagnosticFetch: typeof fetch = async (input, init) => {
    try {
      return await fetch(input, init);
    } catch (error) {
      networkFetchError = safeFetchError(error);
      throw error;
    }
  };

  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: diagnosticFetch },
    });
    const [accountResult, positionsResult, signalsResult, ordersResult, rulesResult] = await Promise.all([
      db.from("accounts").select("id,name,base_currency,account_type").limit(1).maybeSingle(),
      db.from("positions").select("id,quantity,market_value,unrealized_pnl,assets(symbol)"),
      db.from("signals").select("id,action,confidence,rationale,assets(symbol)").order("created_at", { ascending: false }).limit(50),
      db.from("orders").select("id,side,status,quantity,assets(symbol),venues(name)").order("created_at", { ascending: false }).limit(50),
      db.from("risk_rules").select("name,value,unit").eq("enabled", true),
    ]);

    const firstError = accountResult.error ?? positionsResult.error ?? signalsResult.error ?? ordersResult.error ?? rulesResult.error;
    if (firstError) {
      return NextResponse.json(
        {
          error: "Unable to load the trading overview from Supabase.",
          details: firstError.message,
          supabaseDiagnostics: {
            keyFormat: key.startsWith("sb_secret_")
              ? "supabase_secret_key"
              : key.startsWith("eyJ")
                ? "legacy_jwt_key"
                : "unknown",
            errorCode: firstError.code ?? null,
            errorHint: firstError.hint ?? null,
            errorDetails: firstError.details ?? null,
          },
          ...(networkFetchError ? { networkDiagnostics: networkFetchError } : {}),
          hostname,
          deploymentEnvironment: process.env.VERCEL_ENV ?? "unknown",
          gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
        },
        { status: 502 },
      );
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
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load the trading overview from Supabase.",
        details: safeFetchError(error),
        ...(networkFetchError ? { networkDiagnostics: networkFetchError } : {}),
        hostname,
        deploymentEnvironment: process.env.VERCEL_ENV ?? "unknown",
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
      },
      { status: 502 },
    );
  }
}
