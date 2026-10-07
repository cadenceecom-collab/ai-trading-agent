import {NextResponse} from 'next/server';
import {ibkr} from '@/lib/brokers/ibkr';
export async function GET(){
 const status=await ibkr.getStatus();
 return NextResponse.json({broker:'IBKR',authentication:'OAuth 2.0 / Web API',...status,tradingMode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true'});
}