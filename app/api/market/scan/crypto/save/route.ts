import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
import {getCryptoConsensus,getCryptoCandles} from '@/lib/trading/market-data';
import {scoreCrypto} from '@/lib/trading/crypto-signal';

export const dynamic='force-dynamic';

export async function POST(req:NextRequest){
 if((process.env.TRADING_MODE??'paper')!=='paper'||process.env.LIVE_TRADING_ENABLED==='true')return NextResponse.json({error:'Signal persistence is restricted to paper mode while live trading is disabled.'},{status:403});
 const supabase=getSupabaseAdmin();
 if(!supabase)return NextResponse.json({error:'Server database credentials are not configured.'},{status:503});
 try{
  const body=await req.json().catch(()=>({}));
  const requested=Array.isArray(body?.symbols)?body.symbols:['BTC','ETH'];
  const symbols=[...new Set(requested.map((s:unknown)=>String(s).replace(/[^A-Za-z0-9]/g,'').toUpperCase()).filter((s:string)=>['BTC','ETH'].includes(s)))] as ('BTC'|'ETH')[];
  if(!symbols.length)return NextResponse.json({error:'Provide BTC and/or ETH.'},{status:400});
  const {data:strategy}=await supabase.from('strategies').select('id').eq('name','Multi-Factor').maybeSingle();
  const results=[];
  for(const symbol of symbols){
   const consensus=await getCryptoConsensus(symbol);
   if(!consensus){results.push({symbol,saved:false,reason:'No exchange quotes available.'});continue;}
   let candleSource:'Coinbase'|'Kraken'|'Bitget'|null=null;
   let candles=await getCryptoCandles('Coinbase',symbol,200);
   if(candles.length>=20)candleSource='Coinbase';
   else{
    const kc=await getCryptoCandles('Kraken',symbol,200);
    if(kc.length>candles.length){candles=kc;candleSource='Kraken';}
   }
   if(candles.length<20){
    const bc=await getCryptoCandles('Bitget',symbol,200);
    if(bc.length>candles.length){candles=bc;candleSource='Bitget';}
   }
   if(candles.length<20){results.push({symbol,saved:false,reason:'At least 20 valid daily candles are required.',candleCount:candles.length});continue;}
   const signal=scoreCrypto(candles,consensus.spreadPct,consensus.venues.length);
   const catalogSymbol=symbol+'/USD';
   const {data:asset,error:assetError}=await supabase.from('assets').select('id').eq('symbol',catalogSymbol).eq('is_active',true).maybeSingle();
   if(assetError||!asset?.id){results.push({symbol,saved:false,reason:assetError?.message??'Crypto asset not found in catalog.'});continue;}
   const {data:row,error}=await supabase.from('signals').insert({asset_id:asset.id,strategy_id:strategy?.id??null,action:signal.action,confidence:signal.confidence,score:signal.score,timeframe:'1d',entry_price:consensus.consensusPrice,rationale:signal.rationale,features:{...signal.features,candleSource,candleCount:candles.length,venues:consensus.venues.map(v=>v.venue),spreadPct:consensus.spreadPct}}).select('id').single();
   if(error){results.push({symbol,saved:false,reason:error.message});continue;}
   await supabase.from('audit_log').insert({event_type:'crypto_signal_saved',severity:'info',entity_type:'signal',entity_id:row.id,message:'Crypto technical signal saved for review; no order submitted.',metadata:{symbol,action:signal.action,score:signal.score,confidence:signal.confidence,candleCount:candles.length}});
   results.push({symbol,saved:true,signalId:row.id,action:signal.action,score:signal.score,confidence:signal.confidence,candleCount:candles.length,candleSource,rationale:signal.rationale});
  }
  return NextResponse.json({status:'ok',mode:'paper',liveTradingEnabled:false,orderSubmission:'disabled',results});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save crypto signals.',orderSubmission:'disabled'},{status:500});}
}
