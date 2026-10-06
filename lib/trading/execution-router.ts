import {bitget} from '@/lib/brokers/bitget';
export type ExecutionRequest={venue:string;symbol:string;side:'buy'|'sell';quantity:number;price:number;orderType?:'market'|'limit'|'stop'};
export type ExecutionResult={accepted:boolean;mode:'paper'|'live';status:'simulated_fill'|'submitted'|'rejected';venue:string;symbol:string;side:'buy'|'sell';quantity:number;fillPrice:number;orderType?:string;externalOrderId?:string;reason:string;executedAt:string};
export async function executeTrade(request:ExecutionRequest):Promise<ExecutionResult>{
 const now=new Date().toISOString();
 if(process.env.TRADING_MODE!=='paper'||process.env.LIVE_TRADING_ENABLED==='true')return{accepted:false,mode:'live',status:'rejected',venue:request.venue,symbol:request.symbol,side:request.side,quantity:request.quantity,fillPrice:0,orderType:request.orderType,reason:'Live execution is disabled. No broker order was submitted.',executedAt:now};
 if(!Number.isFinite(request.quantity)||request.quantity<=0||!Number.isFinite(request.price)||request.price<=0)return{accepted:false,mode:'paper',status:'rejected',venue:request.venue,symbol:request.symbol,side:request.side,quantity:request.quantity,fillPrice:0,orderType:request.orderType,reason:'Invalid quantity or price.',executedAt:now};
 if(request.venue.toLowerCase()==='bitget'&&bitget.isDemoConfigured()){
  if(request.orderType==='stop')return{accepted:false,mode:'paper',status:'rejected',venue:request.venue,symbol:request.symbol,side:request.side,quantity:request.quantity,fillPrice:0,orderType:request.orderType,reason:'Bitget demo adapter currently supports market and limit orders only.',executedAt:now};
  const placed:any=await bitget.placeDemoOrder({symbol:request.symbol,side:request.side,orderType:request.orderType==='limit'?'limit':'market',qty:String(request.quantity),price:request.orderType==='limit'?String(request.price):undefined});
  const orderId=placed?.data?.orderId??placed?.orderId;
  return{accepted:true,mode:'paper',status:'submitted',venue:request.venue,symbol:request.symbol,side:request.side,quantity:request.quantity,fillPrice:request.price,orderType:request.orderType??'market',externalOrderId:orderId,reason:'Order submitted to Bitget demo trading. No live funds were used.',executedAt:now};
 }
 return{accepted:true,mode:'paper',status:'simulated_fill',venue:request.venue,symbol:request.symbol,side:request.side,quantity:request.quantity,fillPrice:request.price,orderType:request.orderType??'market',reason:'Paper execution simulated at the supplied market/limit reference price. No real order was submitted.',executedAt:now};
}