import {NextRequest,NextResponse} from 'next/server';
import {decideTrade} from '@/lib/trading/portfolio-decision';

export async function POST(req:NextRequest){
 if((process.env.TRADING_MODE??'paper')!=='paper'||process.env.LIVE_TRADING_ENABLED==='true')return NextResponse.json({error:'Decision endpoint is restricted to paper mode while live trading is disabled.'},{status:403});
 try{
  const body=await req.json();const required=['symbol','action','confidence','price','portfolioValue'];
  for(const key of required)if(body?.[key]===undefined)return NextResponse.json({error:`Missing field: ${key}`},{status:400});
  const result=decideTrade({symbol:String(body.symbol),action:body.action,confidence:Number(body.confidence),price:Number(body.price),isCrypto:Boolean(body.isCrypto),stopDistancePct:Number(body.stopDistancePct??2)},Number(body.portfolioValue),Number(body.currentPositionValue??0),Number(body.currentCryptoExposurePct??0),Number(body.dailyLossPct??0),Number(body.orderValuePct??5));
  return NextResponse.json({...result,execution:'not submitted',liveTradingEnabled:false});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid decision request.'},{status:400})}
}
