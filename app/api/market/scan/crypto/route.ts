import {NextRequest,NextResponse} from 'next/server';
import {getCryptoConsensus,getCryptoCandles} from '@/lib/trading/market-data';
import {scoreCrypto} from '@/lib/trading/crypto-signal';
export async function GET(req:NextRequest){
 const symbol=(req.nextUrl.searchParams.get('symbol')??'BTC').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
 if(!symbol)return NextResponse.json({error:'Invalid symbol.'},{status:400});
 const consensus=await getCryptoConsensus(symbol);
 if(!consensus)return NextResponse.json({status:'ok',symbol,action:'hold',confidence:0,reason:'No exchange quotes available.',orderSubmission:'disabled'});
 const candles=await getCryptoCandles('Coinbase',symbol,200);
 const signal=scoreCrypto(candles,consensus.spreadPct,consensus.venues.length);
 return NextResponse.json({status:'ok',mode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',symbol,consensus,candleCount:candles.length,...signal,orderSubmission:'disabled'});
}