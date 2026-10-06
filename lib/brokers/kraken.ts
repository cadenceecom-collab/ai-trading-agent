export type KrakenStatus={configured:boolean;reachable:boolean;message?:string};
const API='https://api.kraken.com/0/public';
async function request<T>(path:string):Promise<T>{
 const r=await fetch(API+path,{cache:'no-store',headers:{Accept:'application/json'}});
 const text=await r.text();let data:any;
 try{data=JSON.parse(text)}catch{throw new Error('Invalid Kraken response');}
 if(!r.ok)throw new Error(`Kraken HTTP ${r.status}`);
 if(Array.isArray(data.error)&&data.error.length)throw new Error(data.error.join('; '));
 return data as T;
}
export const kraken={
 isConfigured:()=>true,
 async getStatus():Promise<KrakenStatus>{
  try{await request('/SystemStatus');return{configured:true,reachable:true,message:'Kraken public market-data API reachable.'}}
  catch(e){return{configured:true,reachable:false,message:e instanceof Error?e.message:'Unable to reach Kraken.'}}
 },
 async getTicker(pair:string){return request(`/Ticker?pair=${encodeURIComponent(pair)}`)},
 async getOHLC(pair:string,interval=1440){return request(`/OHLC?pair=${encodeURIComponent(pair)}&interval=${interval}`)},
 async getAssetPairs(){return request('/AssetPairs')},
};