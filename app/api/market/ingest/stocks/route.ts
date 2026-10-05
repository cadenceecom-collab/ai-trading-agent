import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const SYMBOLS=['AAPL','MSFT','NVDA','SPY'];

export async function GET(){
  const supabase=getSupabaseAdmin();
  if(!supabase) return NextResponse.json({error:'Server database credentials are not configured.'},{status:503});
  if(process.env.TRADING_MODE!=='paper'||process.env.LIVE_TRADING_ENABLED==='true') return NextResponse.json({error:'Development stock ingestion is disabled outside paper mode.'},{status:403});
  const [{data:assets,error:assetError},{data:venue,error:venueError}]=await Promise.all([
    supabase.from('assets').select('id,symbol').in('symbol',SYMBOLS).eq('is_active',true),
    supabase.from('venues').select('id').eq('name','IBKR').maybeSingle(),
  ]);
  if(assetError||venueError) return NextResponse.json({error:assetError?.message??venueError?.message},{status:500});
  const results=[];
  for(const asset of assets??[]){
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.symbol)}?range=1y&interval=1d&events=history`;
    const response=await fetch(url,{headers:{'User-Agent':'AI-Trading-Agent/0.1'},cache:'no-store'});
    if(!response.ok){results.push({symbol:asset.symbol,status:'error',error:`market-data HTTP ${response.status}`});continue;}
    const json=await response.json();
    const result=json?.chart?.result?.[0];
    const timestamps:number[]=result?.timestamp??[];
    const q=result?.indicators?.quote?.[0];
    const rows=timestamps.map((ts,i)=>({asset_id:asset.id,venue_id:venue?.id??null,timeframe:'1d',candle_time:new Date(ts*1000).toISOString(),open:q?.open?.[i],high:q?.high?.[i],low:q?.low?.[i],close:q?.close?.[i],volume:q?.volume?.[i]??null})).filter((r:any)=>[r.open,r.high,r.low,r.close].every((v:any)=>Number.isFinite(v)));
    const {data:latest}=await supabase.from('market_candles').select('candle_time').eq('asset_id',asset.id).eq('timeframe','1d').order('candle_time',{ascending:false}).limit(1).maybeSingle();
    const newRows=rows.filter((r:any)=>!latest||r.candle_time>latest.candle_time);
    if(newRows.length) { const {error}=await supabase.from('market_candles').insert(newRows); if(error){results.push({symbol:asset.symbol,status:'error',error:error.message});continue;} }
    results.push({symbol:asset.symbol,status:'ok',received:rows.length,inserted:newRows.length});
  }
  await supabase.from('audit_log').insert({event_type:'stock_market_data_ingest',severity:'info',message:'Development daily stock market data ingestion completed.',metadata:{results,source:'Yahoo Finance chart endpoint',paperOnly:true}});
  return NextResponse.json({status:'ok',source:'Yahoo Finance chart endpoint (development only)',results});
}
