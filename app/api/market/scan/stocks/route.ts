import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { scoreStock } from '@/lib/trading/stock-signal';

export async function GET(){
  const supabase=getSupabaseAdmin();
  if(!supabase) return NextResponse.json({error:'Server database credentials are not configured.'},{status:503});
  const [{data:assets,error:assetError},{data:strategy,error:strategyError}]=await Promise.all([
    supabase.from('assets').select('id,symbol,name,asset_type,currency').in('asset_type',['stock','etf']).eq('is_active',true).order('symbol'),
    supabase.from('strategies').select('id,name').eq('name','Multi-Factor').maybeSingle(),
  ]);
  if(assetError||strategyError) return NextResponse.json({error:assetError?.message??strategyError?.message},{status:500});
  const results=[];
  for(const asset of assets??[]){
    const {data:candles,error}=await supabase.from('market_candles').select('open,high,low,close,volume,candle_time').eq('asset_id',asset.id).eq('timeframe','1d').order('candle_time',{ascending:true}).limit(250);
    if(error) return NextResponse.json({error:error.message},{status:500});
    const signal=scoreStock(candles??[]);
    results.push({asset,...signal,candleCount:candles?.length??0});
    if((candles?.length??0)>=50){
      await supabase.from('signals').insert({asset_id:asset.id,strategy_id:strategy?.id??null,action:signal.action,confidence:signal.confidence,score:signal.score,timeframe:'1d',entry_price:signal.features.latest||null,rationale:signal.rationale,features:signal.features});
    }
  }
  await supabase.from('audit_log').insert({event_type:'stock_scan',severity:'info',message:'Technical stock scan completed in paper mode.',metadata:{assetsScanned:results.length,signalsWritten:results.filter(x=>x.candleCount>=50).length}});
  return NextResponse.json({status:'ok',mode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',results});
}
