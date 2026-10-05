import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { evaluateRisk, DEFAULT_RISK_LIMITS } from '@/lib/trading/risk';

type OrderBody = {
  account_id?: string; asset_id: string; venue_id?: string; signal_id?: string;
  side: 'buy' | 'sell'; order_type?: 'market' | 'limit' | 'stop'; quantity: number;
  limit_price?: number; stop_price?: number; current_position_value?: number;
  portfolio_value: number; daily_loss_pct?: number; crypto_exposure_pct?: number; stop_distance_pct?: number;
};

export async function POST(request: Request) {
  if (process.env.TRADING_MODE !== 'paper' || process.env.LIVE_TRADING_ENABLED === 'true') {
    return NextResponse.json({ error: 'Paper-order endpoint requires TRADING_MODE=paper and LIVE_TRADING_ENABLED=false.' }, { status: 403 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });

  let body: OrderBody;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body.asset_id || !body.side || !Number.isFinite(body.quantity) || body.quantity <= 0 ||
      !Number.isFinite(body.portfolio_value) || body.portfolio_value <= 0) {
    return NextResponse.json({ error: 'asset_id, side, positive quantity, and positive portfolio_value are required.' }, { status: 400 });
  }

  const [{ data: asset, error: assetError }, { data: account, error: accountError }] = await Promise.all([
    supabase.from('assets').select('id,asset_type').eq('id', body.asset_id).single(),
    body.account_id
      ? supabase.from('accounts').select('id').eq('id', body.account_id).single()
      : supabase.from('accounts').select('id').eq('account_type', 'paper').eq('is_enabled', true).limit(1).single(),
  ]);
  if (assetError || !asset) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
  if (accountError || !account) return NextResponse.json({ error: 'Enabled paper account not found.' }, { status: 404 });

  const price = body.limit_price ?? body.stop_price;
  if (!Number.isFinite(price) || (price as number) <= 0) {
    return NextResponse.json({ error: 'A positive limit_price or stop_price is required.' }, { status: 400 });
  }

  const proposedOrderValue = body.quantity * (price as number);
  const risk = evaluateRisk({
    portfolioValue: body.portfolio_value,
    currentPositionValue: body.current_position_value ?? 0,
    proposedOrderValue,
    dailyLossPct: body.daily_loss_pct ?? 0,
    currentCryptoExposurePct: body.crypto_exposure_pct ?? 0,
    isCrypto: asset.asset_type === 'crypto',
    stopDistancePct: body.stop_distance_pct ?? 0,
  }, DEFAULT_RISK_LIMITS);

  const status = risk.approved ? 'approved' : 'rejected';
  const clientOrderId = `paper-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: order, error } = await supabase.from('orders').insert({
    account_id: account.id, asset_id: body.asset_id, venue_id: body.venue_id ?? null,
    signal_id: body.signal_id ?? null, side: body.side, order_type: body.order_type ?? 'limit',
    quantity: body.quantity, limit_price: body.limit_price ?? null, stop_price: body.stop_price ?? null,
    status, client_order_id: clientOrderId, submitted_at: risk.approved ? new Date().toISOString() : null,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message, risk }, { status: 500 });

  await supabase.from('audit_log').insert({
    event_type: 'paper_order_risk_check',
    severity: risk.approved ? 'info' : 'warning',
    entity_type: 'order',
    entity_id: order.id,
    message: risk.approved ? 'Paper order approved by deterministic risk engine.' : 'Paper order rejected by deterministic risk engine.',
    metadata: { risk, status },
  });

  return NextResponse.json({ status, order, risk }, { status: risk.approved ? 201 : 422 });
}
