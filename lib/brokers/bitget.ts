export type BitgetStatus={configured:boolean;reachable:boolean;message?:string};
const API='https://api.bitget.com';
async function request<T>(path:string):Promise<T>{
 const r=await fetch(API+path,{cache:'no-store',headers:{Accept:'application/json'}});
 const text=await r.text();let data:any;
 try{data=JSON.parse(text)}catch{throw new Error('Invalid Bitget response');}
 if(!r.ok)throw new Error(`Bitget HTTP ${r.status}`);
 if(data?.code&&data.code!=='00000')throw new Error(data.msg||`Bitget API error ${data.code}`);
 return data as T;
}
export const bitget={
 isConfigured:()=>true,
 async getStatus():Promise<BitgetStatus>{
  try{await request('/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT');return{configured:true,reachable:true,message:'Bitget public market-data API reachable.'}}
  catch(e){return{configured:true,reachable:false,message:e instanceof Error?e.message:'Unable to reach Bitget.'}}
 },
 async getTicker(symbol='BTCUSDT',category='SPOT'){return request(`/api/v3/market/tickers?category=${encodeURIComponent(category)}&symbol=${encodeURIComponent(symbol)}`)},
 async getCandles(symbol='BTCUSDT',interval='1D',category='SPOT',limit=1000){return request(`/api/v3/market/candles?category=${encodeURIComponent(category)}&symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${Math.min(Math.max(limit,1),1000)}`)},
 async getInstruments(category='SPOT'){return request(`/api/v3/market/instruments?category=${encodeURIComponent(category)}`)},
};