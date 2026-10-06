import { NextResponse } from 'next/server';
import { ibkr } from '@/lib/brokers/ibkr';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'SPY'];

export async function GET(request: Request) {
  if (!ibkr.isConfigured()) {
    return NextResponse.json({ error: 'IBKR_API_URL is not configured.' }, { status: 503 });
  }
  const url = new URL(request.url);
  const symbols = (url.searchParams.get('symbols') ?? DEFAULT_SYMBOLS.join(','))
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return { symbol, contracts: await ibkr.searchContract(symbol) };
        } catch (error) {
          return { symbol, contracts: [], error: error instanceof Error ? error.message : 'Contract lookup failed.' };
        }
      }),
    );
    return NextResponse.json({ broker: 'IBKR', results, orderSubmission: 'disabled' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'IBKR contract lookup failed.' }, { status: 502 });
  }
}
