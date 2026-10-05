import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: 'not_configured' }, { status: 503 });

  const [account, positions, signals, orders, rules, venues] = await Promise.all([
    supabase.from('accounts').select('*').eq('account_type', 'paper').eq('is_enabled', true).limit(1).maybeSingle(),
    supabase.from('positions').select('*, assets(symbol,name,asset_type,currency)').order('updated_at', { ascending: false }),
    supabase.from('signals').select('*, assets(symbol,name,asset_type,currency)').order('created_at', { ascending: false }).limit(20),
    supabase.from('orders').select('*, assets(symbol,name), venues(name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('risk_rules').select('*').eq('is_enabled', true),
    supabase.from('venues').select('*').eq('is_enabled', true),
  ]);

  const errors = [account, positions, signals, orders, rules, venues].filter(x => x.error).map(x => x.error?.message);
  if (errors.length) return NextResponse.json({ status: 'error', errors }, { status: 500 });

  return NextResponse.json({
    status: 'ok',
    account: account.data,
    positions: positions.data ?? [],
    signals: signals.data ?? [],
    orders: orders.data ?? [],
    riskRules: rules.data ?? [],
    venues: venues.data ?? [],
    tradingMode: process.env.TRADING_MODE ?? 'paper',
    liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === 'true',
  });
}
