import {NextResponse} from 'next/server';import {coinbase} from '@/lib/brokers/coinbase';
export async function GET(){const status=await coinbase.getStatus();return NextResponse.json({broker:'Coinbase',role:'crypto market data',...status,tradingMode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',orderSubmission:'disabled'});}
