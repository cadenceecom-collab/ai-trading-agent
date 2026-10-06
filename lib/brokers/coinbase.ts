export type CoinbaseStatus={configured:boolean;reachable:boolean;message?:string};
const API='https://api.coinbase.com/api/v3/brokerage';
async function request<T>(path:string):Promise<T>{
 const r=await fetch(API+path,{cache:'no-store',headers:{Accept:'application/json'}});
 const text=await r.text();let data:any;
 try{data=JSON.parse(text)}catch{throw new Error('Invalid Coinbase response');}
 if(!r.ok)throw new Error(`Coinbase HTTP ${r.status}`);
 return data as T;
}
export const coinbase={
 isConfigured:()=>true,
 async getStatus():Promise<CoinbaseStatus>{
  try{await request('/market/products/BTC-USD');return{configured:true,reachable:true,message:'Coinbase public market-data API reachable.'}}
  catch(e){return{configured:true,reachable:false,message:e instanceof Error?e.message:'Unable to reach Coinbase.'}}
 },
 async getTicker(productId='BTC-USD'){return request(`/market/products/${encodeURIComponent(productId)}/ticker`)},
 async getCandles(productId='BTC-USD',start?:string,end?:string,granularity='ONE_DAY',limit=350){
  const params=new URLSearchParams({start:start??String(Math.floor(Date.now()/1000)-350*86400),end:end??String(Math.floor(Date.now()/1000)),granularity});
  if(limit>0)params.set('limit',String(Math.min(limit,350)));
  return request(`/market/products/${encodeURIComponent(productId)}/candles?${params.toString()}`);
 },
 async getProducts(){return request('/market/products?limit=250')},
};