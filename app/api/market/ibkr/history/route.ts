import { NextRequest, NextResponse } from 'next/server';
import { ibkr } from '@/lib/brokers/ibkr';

export async function GET(request: NextRequest) {
  if (!ibkr.isConfigured()) return NextResponse.json({ error: 'IBKR_API_URL is not configured.' }, { status: 503 });
  const conid = Number(request.nextUrl.searchParams.get('conid'));
  if (!Number.isInteger(conid) || conid <= 0) {
    return NextResponse.json({ error: 'Provide a valid IBKR contract ID as ?conid=...' }, { status: 400 });
  }
  const period = request.nextUrl.searchParams.get('period') ?? '1y';
  const bar = request.nextUrl.searchParams.get('bar') ?? '1d';
  try {
    const history = await ibkr.getHistory(conid, period, bar);
    return NextResponse.json({ broker: 'IBKR', conid, period, bar, history, orderSubmission: 'disabled' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'IBKR historical data request failed.' }, { status: 502 });
  }
}
