import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
import {executeTrade} from '@/lib/trading/execution-router';
import {applyPaperFill} from '@/lib/trading/paper-ledger';
export async function POST(req:NextRequest){
 if(process.env.TRADING_MODE!=='paper'||process.env.LIVE_TRADING_ENABLED==='true')return NextResponse.json({error:'Paper execution requires paper mode and live trading disabled.'},{status:403});
 const supabase=getSupabaseAdmin();if(!supabase)return NextResponse.json({error:'Server database credentials are not configured.'},{status:503});
 try{
  const b=await req.json();const result=await executeTrade({venue:String(b.venue),symbol:String(b.symbol),side:b.side,quantity:Number(b.quantity),price:Number(b.price),orderType:b.orderType});
  if(!result.accepted)return NextResponse.json(result,{status:422});
  const {data:asset}=await supabase.from('assets').select('id,asset_type').eq('symbol',result.symbol).maybeSingle();
  const {data:venue}=await supabase.from('venues').select('id').eq('name',result.venue).maybeSingle();
  if(!asset?.id)return NextResponse.json({error:'Asset is not registered in the trading catalog.'},{status:404});
  const {data:account}=await supabase.from('accounts').select('id').eq('account_type','paper').eq('is_enabled',true).limit(1).maybeSingle();
  if(!account?.id)return NextResponse.json({error:'Enabled paper account not found.'},{status:404});
  const {data:order,error:orderError}=await supabase.from('orders').insert({account_id:account.id,asset_id:asset.id,venue_id:venue?.id??null,side:result.side,order_type:b.orderType??'market',quantity:result.quantity,limit_price:result.fillPrice,status:'filled',submitted_at:result.executedAt,filled_at:result.executedAt,client_order_id:`paper-exec-${Date.now()}-${crypto.randomUUID().slice(0,8)}`}).select('id').single();
  if(orderError||!order)return NextResponse.json({error:orderError?.message??'Unable to create paper order.'},{status:500});
  const {error:execError}=await supabase.from('executions').insert({order_id:order.id,quantity:result.quantity,price:result.fillPrice,fee:0,fee_currency:'CAD',executed_at:result.executedAt});
  if(execError)return NextResponse.json({error:execError.message,orderId:order.id},{status:500});
  const {data:existing}=await supabase.from('positions').select('id,quantity,average_price').eq('account_id',account.id).eq('asset_id',asset.id).maybeSingle();
  const next=applyPaperFill(existing?{quantity:Number(existing.quantity),averagePrice:Number(existing.average_price),marketValue:0,unrealizedPnl:0}:null,result.side,result.quantity,result.fillPrice,result.fillPrice);
  if(next.quantity===0&&existing?.id)await supabase.from('positions').delete().eq('id',existing.id);
  else if(existing?.id)await supabase.from('positions').update({quantity:next.quantity,average_price:next.averagePrice,market_value:next.marketValue,unrealized_pnl:next.unrealizedPnl,updated_at:result.executedAt}).eq('id',existing.id);
  else await supabase.from('positions').insert({account_id:account.id,asset_id:asset.id,quantity:next.quantity,average_price:next.averagePrice,market_value:next.marketValue,unrealized_pnl:next.unrealizedPnl,updated_at:result.executedAt});
  await supabase.from('audit_log').insert({event_type:'paper_execution',severity:'info',entity_type:'order',entity_id:order.id,message:'Paper execution simulated and portfolio position updated; no live broker order submitted.',metadata:{...result,position:next}});
  return NextResponse.json({...result,orderId:order.id,position:next},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid paper execution request.'},{status:400})}
}