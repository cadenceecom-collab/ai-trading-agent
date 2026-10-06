import {NextResponse} from 'next/server';import {bitget} from '@/lib/brokers/bitget';
export async function GET(){const status=await bitget.getStatus();return NextResponse.json({broker:'Bitget',role:'crypto market data',...status,tradingMode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',orderSubmission:'disabled'});}
