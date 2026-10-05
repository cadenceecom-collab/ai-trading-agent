export type Candle = { open:number; high:number; low:number; close:number; volume?:number|null };

export function sma(values:number[], period:number){
  if(values.length < period) return null;
  const slice=values.slice(-period); return slice.reduce((a,b)=>a+b,0)/period;
}
export function ema(values:number[], period:number){
  if(values.length < period) return null;
  const k=2/(period+1); let e=values.slice(0,period).reduce((a,b)=>a+b,0)/period;
  for(const v of values.slice(period)) e=v*k+e*(1-k); return e;
}
export function rsi(values:number[], period=14){
  if(values.length<=period) return null;
  let gains=0, losses=0;
  for(let i=1;i<=period;i++){const d=values[i]-values[i-1]; if(d>=0) gains+=d; else losses-=d;}
  let avgGain=gains/period, avgLoss=losses/period;
  for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1]; const g=Math.max(d,0), l=Math.max(-d,0); avgGain=(avgGain*(period-1)+g)/period; avgLoss=(avgLoss*(period-1)+l)/period;}
  if(avgLoss===0) return 100; return 100-(100/(1+avgGain/avgLoss));
}
export function atr(candles:Candle[], period=14){
  if(candles.length<=period) return null;
  const tr:number[]=[];
  for(let i=1;i<candles.length;i++){const c=candles[i], p=candles[i-1]; tr.push(Math.max(c.high-c.low,Math.abs(c.high-p.close),Math.abs(c.low-p.close)));}
  return sma(tr,period);
}
export function macd(values:number[]){
  const fast=ema(values,12), slow=ema(values,26); if(fast===null||slow===null) return null;
  return fast-slow;
}
export function technicalFeatures(candles:Candle[]){
  const closes=candles.map(c=>c.close);
  const latest=closes.at(-1) ?? 0;
  const sma20=sma(closes,20), sma50=sma(closes,50), ema12=ema(closes,12), ema26=ema(closes,26);
  const rsi14=rsi(closes,14), atr14=atr(candles,14), macdValue=macd(closes);
  const avgVolume=sma(candles.map(c=>c.volume??0),20);
  const latestVolume=candles.at(-1)?.volume ?? null;
  const volumeRatio=avgVolume && latestVolume!==null ? latestVolume/avgVolume : null;
  const momentum20=closes.length>20 ? ((latest/closes[closes.length-21])-1)*100 : null;
  return {latest,sma20,sma50,ema12,ema26,rsi14,atr14,macd:macdValue,avgVolume,latestVolume,volumeRatio,momentum20};
}
