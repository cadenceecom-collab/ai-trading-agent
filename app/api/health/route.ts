import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    tradingMode: process.env.TRADING_MODE ?? 'paper',
    liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === 'true',
    timestamp: new Date().toISOString(),
  });
}
