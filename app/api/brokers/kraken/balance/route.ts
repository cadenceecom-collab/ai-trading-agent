import { NextResponse } from 'next/server';
import { kraken } from '@/lib/brokers/kraken';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await kraken.getStatus();
  if (!status.authenticated) {
    return NextResponse.json(
      { broker: 'Kraken', authenticated: false, error: status.message ?? 'Kraken authentication is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const response = await kraken.getBalance() as { result?: Record<string, string> };
    const balances = Object.entries(response.result ?? {})
      .map(([asset, amount]) => ({ asset, amount: Number(amount) }))
      .filter((item) => Number.isFinite(item.amount) && item.amount !== 0)
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json(
      { broker: 'Kraken', authenticated: true, balances, retrievedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { broker: 'Kraken', authenticated: true, error: error instanceof Error ? error.message : 'Unable to read Kraken balances.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
