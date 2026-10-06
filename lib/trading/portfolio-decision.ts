import {evaluateRisk,DEFAULT_RISK_LIMITS,RiskResult} from './risk';

export type CandidateSignal={symbol:string;action:'buy'|'sell'|'hold';confidence:number;price:number;isCrypto:boolean;stopDistancePct?:number};
export type PortfolioDecision={approved:boolean;action:'buy'|'sell'|'hold';symbol:string;confidence:number;orderValue:number;risk:RiskResult;reason:string};

export function decideTrade(candidate:CandidateSignal,portfolioValue:number,currentPositionValue:number,currentCryptoExposurePct:number,dailyLossPct:number,orderValuePct=5):PortfolioDecision{
 if(candidate.action==='hold'||candidate.confidence<50){
  return{approved:false,action:'hold',symbol:candidate.symbol,confidence:candidate.confidence,orderValue:0,risk:evaluateRisk({portfolioValue,currentPositionValue,proposedOrderValue:0,dailyLossPct,currentCryptoExposurePct,isCrypto:candidate.isCrypto,stopDistancePct:candidate.stopDistancePct??0}),reason:'Signal does not meet the minimum decision threshold.'};
 }
 const orderValue=portfolioValue*Math.min(Math.max(orderValuePct,0),DEFAULT_RISK_LIMITS.maxPositionPct)/100;
 const risk=evaluateRisk({portfolioValue,currentPositionValue,proposedOrderValue:orderValue,dailyLossPct,currentCryptoExposurePct,isCrypto:candidate.isCrypto,stopDistancePct:candidate.stopDistancePct??2});
 if(!risk.approved)return{approved:false,action:candidate.action,symbol:candidate.symbol,confidence:candidate.confidence,orderValue,risk,reason:risk.reasons.join(' ')};
 return{approved:true,action:candidate.action,symbol:candidate.symbol,confidence:candidate.confidence,orderValue,risk,reason:'Signal passed deterministic portfolio risk controls.'};
}
