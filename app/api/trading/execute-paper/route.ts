import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * Fail-closed paper execution gate.
 *
 * The previous handler trusted price, quantity, portfolio value and exposure
 * supplied by the browser. Those values are not a safe basis for risk checks.
 * Execution stays disabled until the server can calculate account equity,
 * current exposure and daily loss from trusted market/account data.
 */
export async function POST() {
  if (process.env.TRADING_MODE !== 'paper' || process.env.LIVE_TRADING_ENABLED === 'true') {
    return NextResponse.json(
      { status: 'blocked', error: 'Execution is locked unless paper mode is enabled and live trading is disabled.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { status: 'not_configured', error: 'Server database credentials are not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const message =
    'Paper execution is temporarily blocked: trusted server-side portfolio equity, exposure, daily-loss and market-price validation must be available before an order can be simulated.';
  try {
    await supabase.from('audit_log').insert({
      event_type: 'paper_execution_blocked',
      severity: 'warning',
      message,
      metadata: {
        reason: 'trusted_risk_inputs_unavailable',
        tradingMode: process.env.TRADING_MODE ?? 'paper',
        liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === 'true',
      },
    });
  } catch {
    // The safety gate remains closed even if audit logging is unavailable.
  }

  return NextResponse.json(
    {
      status: 'blocked',
      mode: 'paper',
      liveTradingEnabled: false,
      orderSubmission: 'disabled',
      error: message,
    },
    { status: 409, headers: { 'Cache-Control': 'no-store' } },
  );
}
