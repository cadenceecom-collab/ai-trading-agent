import {NextRequest,NextResponse} from 'next/server';
import {getCryptoConsensus,getCryptoCandles} from '@/lib/trading/market-data';
import {scoreCrypto} from '@/lib/trading/crypto-signal';

export const dynamic = 'force-dynamic';

export async function GET(req:NextRequest){
 const symbol=(req.nextUrl.searchParams.get('symbol')??'BTC').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
 if(!symbol)return NextResponse.json({error:'Invalid symbol.'},{status:400});
 try {
  const consensus=await getCryptoConsensus(symbol);
  if(!consensus)return NextResponse.json({status:'ok',mode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',symbol,action:'hold',confidence:0,reason:'No exchange quotes available.',candleSource:null,orderSubmission:'disabled'});
  let candleSource:'Coinbase'|'Kraken'|'Bitget'|null=null;
  let candles=await getCryptoCandles('Coinbase',symbol,200);
  if(candles.length>=20)candleSource='Coinbase';
  else {
   const krakenCandles=await getCryptoCandles('Kraken',symbol,200);
   if(krakenCandles.length>candles.length){candles=krakenCandles;candleSource='Kraken';}
  }
  if(candles.length<20){
   const bitgetCandles=await getCryptoCandles('Bitget',symbol,200);
   if(bitgetCandles.length>candles.length){candles=bitgetCandles;candleSource='Bitget';}
  }
  const signal=scoreCrypto(candles,consensus.spreadPct,consensus.venues.length);
  return NextResponse.json({status:'ok',mode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',symbol,consensus,candleCount:candles.length,candleSource,...signal,orderSubmission:'disabled'});
 } catch(e) {
  return NextResponse.json({error:e instanceof Error?e.message:'Crypto scan failed.',symbol,orderSubmission:'disabled'},{status:502});
 }
}
