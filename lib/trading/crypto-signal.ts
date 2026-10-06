export type CryptoCandle={timestamp:number;open:number;high:number;low:number;close:number;volume:number};
export type CryptoSignal={action:'buy'|'sell'|'hold';score:number;confidence:number;rationale:string;features:{latest:number;sma20:number|null;sma50:number|null;momentum20:number|null;spreadPct:number;venueCount:number}};
function avg(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function sma(xs:number[],n:number){return xs.length>=n?avg(xs.slice(-n)):null}
export function scoreCrypto(candles:CryptoCandle[],spreadPct:number,venueCount:number):CryptoSignal{
 const closes=candles.map(c=>c.close).filter(Number.isFinite);const latest=closes.at(-1)??0;const sma20=sma(closes,20);const sma50=sma(closes,50);const momentum20=closes.length>=21?(latest/closes.at(-21)!-1)*100:null;
 let score=50;const reasons:string[]=[];
 if(sma20!==null){if(latest>sma20){score+=12;reasons.push('price above SMA20')}else{score-=12;reasons.push('price below SMA20')}}
 if(sma50!==null){if(latest>sma50){score+=12;reasons.push('price above SMA50')}else{score-=12;reasons.push('price below SMA50')}}
 if(momentum20!==null){if(momentum20>2){score+=12;reasons.push('20-period momentum positive')}else if(momentum20<-2){score-=12;reasons.push('20-period momentum negative')}}
 if(spreadPct>0.5){score-=8;reasons.push('cross-exchange spread elevated')}else if(venueCount>=2){score+=4;reasons.push('cross-exchange prices aligned')}
 score=Math.max(0,Math.min(100,score));const action=score>=68?'buy':score<=32?'sell':'hold';const confidence=Math.round(Math.abs(score-50)*2);
 return{action,score,confidence,rationale:reasons.length?reasons.join('; '):'Insufficient crypto history for a directional signal.',features:{latest,sma20,sma50,momentum20,spreadPct,venueCount}};
}