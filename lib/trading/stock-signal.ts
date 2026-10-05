import { Candle, technicalFeatures } from './indicators';

export type StockSignal = { action:'buy'|'sell'|'hold'; score:number; confidence:number; rationale:string; features:ReturnType<typeof technicalFeatures> };

export function scoreStock(candles:Candle[]):StockSignal{
  const f=technicalFeatures(candles); const reasons:string[]=[]; let score=50;
  if(f.sma20!==null && f.latest>f.sma20){score+=10; reasons.push('price above SMA20');} else if(f.sma20!==null){score-=10; reasons.push('price below SMA20');}
  if(f.sma50!==null && f.latest>f.sma50){score+=10; reasons.push('price above SMA50');} else if(f.sma50!==null){score-=10; reasons.push('price below SMA50');}
  if(f.rsi14!==null){if(f.rsi14<30){score+=12; reasons.push('RSI oversold');} else if(f.rsi14>70){score-=12; reasons.push('RSI overbought');}}
  if(f.macd!==null){if(f.macd>0){score+=8; reasons.push('MACD positive');} else {score-=8; reasons.push('MACD negative');}}
  if(f.momentum20!==null){if(f.momentum20>0){score+=8; reasons.push('20-period momentum positive');} else {score-=8; reasons.push('20-period momentum negative');}}
  score=Math.max(0,Math.min(100,score));
  const action=score>=65?'buy':score<=35?'sell':'hold';
  const confidence=Math.round(Math.abs(score-50)*2);
  return {action,score,confidence,rationale:reasons.length?reasons.join('; '):'Insufficient technical history for a directional signal.',features:f};
}
