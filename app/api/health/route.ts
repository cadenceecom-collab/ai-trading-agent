import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ status: 'ok', database: 'not_configured', tradingMode: 'paper' });
  }

  const { error } = await supabase.from('venues').select('name').limit(1);
  return NextResponse.json({
    status: error ? 'degraded' : 'ok',
    database: error ? 'error' : 'connected',
    tradingMode: process.env.TRADING_MODE ?? 'paper',
    liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === 'true',
  }, { status: error ? 503 : 200 });
}
