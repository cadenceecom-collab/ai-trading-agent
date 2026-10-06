import {bitget} from '@/lib/brokers/bitget';
import {coinbase} from '@/lib/brokers/coinbase';
import {kraken} from '@/lib/brokers/kraken';

export type MarketQuote={venue:string;symbol:string;price:number;bid?:number;ask?:number;timestamp:number};
export type MarketCandle={venue:string;symbol:string;timestamp:number;open:number;high:number;low:number;close:number;volume:number};

function n(v:unknown){const x=Number(v);return Number.isFinite(x)?x:undefined;}

export async function getCryptoQuotes(symbol='BTC'){
 const targets=[{venue:'Kraken',symbol:symbol==='BTC'?'XBTUSD':symbol+'USD',run:()=>kraken.getTicker(symbol==='BTC'?'XBTUSD':symbol+'USD')},{venue:'Coinbase',symbol:symbol+'-USD',run:()=>coinbase.getTicker(symbol+'-USD')},{venue:'Bitget',symbol:symbol+'USDT',run:()=>bitget.getTicker(symbol+'USDT','SPOT')}];
 const out:MarketQuote[]=[];
 for(const t of targets){try{const raw:any=await t.run();const x=raw?.result?.[Object.keys(raw?.result??{})[0]]??raw?.data?.[0]??raw?.data;const price=n(x?.c?.[0]??x?.last??x?.lastPr??x?.close);if(price)out.push({venue:t.venue,symbol:t.symbol,price,bid:n(x?.b?.[0]??x?.bidPr),ask:n(x?.a?.[0]??x?.askPr),timestamp:Date.now()});}catch{}}
 return out;
}

export async function getCryptoCandles(venue:'Kraken'|'Coinbase'|'Bitget',symbol='BTC',limit=200):Promise<MarketCandle[]>{
 try{
  if(venue==='Kraken'){const pair=symbol==='BTC'?'XBTUSD':symbol+'USD';const raw:any=await kraken.getOHLC(pair,1440);const key=Object.keys(raw.result??{}).find(k=>k!=='last');return (key?(raw.result[key]??[]):[]).slice(-limit).map((r:any)=>({venue,symbol,timestamp:Number(r[0])*1000,open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[6])}));}
  if(venue==='Bitget'){const raw:any=await bitget.getCandles(symbol+'USDT','1D','SPOT',Math.min(limit,1000));return (raw.data??[]).map((r:any)=>({venue,symbol,timestamp:Number(r[0]),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])}));}
  const raw:any=await coinbase.getCandles(symbol+'-USD',undefined,undefined,'ONE_DAY',Math.min(limit,350));return (raw.candles??[]).map((r:any)=>({venue,symbol,timestamp:Number(r.start)*1000,open:Number(r.open),high:Number(r.high),low:Number(r.low),close:Number(r.close),volume:Number(r.volume)}));
 }catch{return[]}
}

export async function getCryptoConsensus(symbol='BTC'){
 const quotes=await getCryptoQuotes(symbol);
 if(!quotes.length)return null;
 const price=quotes.reduce((s,q)=>s+q.price,0)/quotes.length;
 const spreadPct=quotes.length>1?(Math.max(...quotes.map(q=>q.price))-Math.min(...quotes.map(q=>q.price)))/price*100:0;
 return {symbol,venues:quotes,consensusPrice:price,spreadPct,timestamp:Date.now()};
}