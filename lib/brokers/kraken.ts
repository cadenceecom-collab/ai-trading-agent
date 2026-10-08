import {createHmac,createHash} from 'node:crypto';
export type KrakenStatus={configured:boolean;reachable:boolean;authenticated?:boolean;message?:string};
const API='https://api.kraken.com';
async function parse<T>(r:Response):Promise<T>{const text=await r.text();let data:any;try{data=JSON.parse(text)}catch{throw new Error('Invalid Kraken response');}if(!r.ok)throw new Error(`Kraken HTTP ${r.status}`);if(Array.isArray(data.error)&&data.error.length)throw new Error(data.error.join('; '));return data as T;}
async function publicRequest<T>(path:string):Promise<T>{return parse(await fetch(API+'/0/public'+path,{cache:'no-store',headers:{Accept:'application/json'}}));}
function configured(){return Boolean(process.env.KRAKEN_API_KEY&&process.env.KRAKEN_API_SECRET);}
async function privateRequest<T>(path:string,params:Record<string,string>={}):Promise<T>{if(!configured())throw new Error('Kraken private API credentials are not configured.');const nonce=Date.now().toString();const body=new URLSearchParams({nonce,...params}).toString();const hash=createHash('sha256').update(nonce+body).digest();const signature=createHmac('sha512',Buffer.from(process.env.KRAKEN_API_SECRET!,'base64')).update(Buffer.concat([Buffer.from(path),hash])).digest('base64');return parse(await fetch(API+'/0/private'+path,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded','API-Key':process.env.KRAKEN_API_KEY!,'API-Sign':signature},body,cache:'no-store'}));}
export const kraken={
 isConfigured:configured,
 async getStatus():Promise<KrakenStatus>{try{await publicRequest('/SystemStatus');if(!configured())return{configured:false,reachable:true,authenticated:false,message:'Kraken public API reachable; private credentials are not configured.'};await privateRequest('/Balance');return{configured:true,reachable:true,authenticated:true,message:'Kraken private API authentication successful.'}}catch(e){return{configured,reachable:false,authenticated:false,message:e instanceof Error?e.message:'Unable to authenticate with Kraken.'}}},
 async getBalance(){return privateRequest('/Balance')},
 async getOpenOrders(){return privateRequest('/OpenOrders')},
 async getClosedOrders(){return privateRequest('/ClosedOrders')},
 async getTicker(pair:string){return publicRequest('/Ticker?pair='+encodeURIComponent(pair))},
 async getOHLC(pair:string,interval=1440){return publicRequest('/OHLC?pair='+encodeURIComponent(pair)+'&interval='+interval)},
 async getAssetPairs(){return publicRequest('/AssetPairs')},
};