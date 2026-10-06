import { NextRequest, NextResponse } from 'next/server';
import { ibkr } from '@/lib/brokers/ibkr';

export async function GET(request: NextRequest) {
  if (!ibkr.isConfigured()) {
    return NextResponse.json(
      { error: 'IBKR is not configured. Set IBKR_API_URL on the server.' },
      { status: 503 },
    );
  }

  const raw = request.nextUrl.searchParams.get('conids') ?? '';
  const conids = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (!conids.length) {
    return NextResponse.json(
      { error: 'Provide one or more IBKR contract IDs as ?conids=123,456.' },
      { status: 400 },
    );
  }

  try {
    const snapshots = await ibkr.getSnapshot(conids);
    return NextResponse.json({
      broker: 'IBKR',
      source: 'Client Portal Web API',
      snapshots,
      liveTradingEnabled: process.env.LIVE_TRADING_ENABLED === 'true',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'IBKR market-data request failed.' },
      { status: 502 },
    );
  }
}
