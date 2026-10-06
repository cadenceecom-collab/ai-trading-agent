import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
import {executeTrade} from '@/lib/trading/execution-router';
export async function POST(req:NextRequest){
 if(process.env.TRADING_MODE!=='paper'||process.env.LIVE_TRADING_ENABLED==='true')return NextResponse.json({error:'Paper execution requires paper mode and live trading disabled.'},{status:403});
 const supabase=getSupabaseAdmin();if(!supabase)return NextResponse.json({error:'Server database credentials are not configured.'},{status:503});
 try{
  const b=await req.json();const result=await executeTrade({venue:String(b.venue),symbol:String(b.symbol),side:b.side,quantity:Number(b.quantity),price:Number(b.price),orderType:b.orderType});
  if(!result.accepted)return NextResponse.json(result,{status:422});
  const {data:asset}=await supabase.from('assets').select('id').eq('symbol',result.symbol).maybeSingle();
  const {data:venue}=await supabase.from('venues').select('id').eq('name',result.venue).maybeSingle();
  if(asset?.id){
   const {data:account}=await supabase.from('accounts').select('id').eq('account_type','paper').eq('is_enabled',true).limit(1).maybeSingle();
   const {data:order}=await supabase.from('orders').insert({account_id:account?.id??null,asset_id:asset.id,venue_id:venue?.id??null,side:result.side,order_type:result.orderType??'market',quantity:result.quantity,limit_price:result.fillPrice,status:'filled',submitted_at:result.executedAt,filled_at:result.executedAt,client_order_id:`paper-exec-${Date.now()}-${crypto.randomUUID().slice(0,8)}`}).select('id').maybeSingle();
   if(order?.id)await supabase.from('executions').insert({order_id:order.id,quantity:result.quantity,price:result.fillPrice,executed_at:result.executedAt});
   await supabase.from('audit_log').insert({event_type:'paper_execution',severity:'info',entity_type:'order',entity_id:order?.id??null,message:'Paper execution simulated; no live broker order submitted.',metadata:result});
  }
  return NextResponse.json(result,{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid paper execution request.'},{status:400})}
}