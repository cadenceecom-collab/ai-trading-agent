export type RiskLimits = { maxPositionPct:number; maxDailyLossPct:number; maxTradeRiskPct:number; maxCryptoExposurePct:number };
export type RiskInput = { portfolioValue:number; currentPositionValue:number; proposedOrderValue:number; dailyLossPct:number; currentCryptoExposurePct:number; isCrypto:boolean; stopDistancePct:number };
export type RiskResult = { approved:boolean; reasons:string[]; projectedPositionPct:number; projectedCryptoExposurePct:number; tradeRiskPct:number };
export const DEFAULT_RISK_LIMITS:RiskLimits={maxPositionPct:10,maxDailyLossPct:2,maxTradeRiskPct:0.5,maxCryptoExposurePct:25};
export function evaluateRisk(input:RiskInput,limits=DEFAULT_RISK_LIMITS):RiskResult{
 const reasons:string[]=[];
 if(input.portfolioValue<=0) reasons.push('Portfolio value must be positive.');
 if(input.proposedOrderValue<=0) reasons.push('Proposed trade value must be positive.');
 const projectedPositionPct=input.portfolioValue>0?((input.currentPositionValue+input.proposedOrderValue)/input.portfolioValue)*100:Infinity;
 const projectedCryptoExposurePct=input.isCrypto?input.currentCryptoExposurePct+(input.proposedOrderValue/Math.max(input.portfolioValue,1))*100:input.currentCryptoExposurePct;
 const tradeRiskPct=Math.abs(input.proposedOrderValue/Math.max(input.portfolioValue,1))*Math.max(input.stopDistancePct,0);
 if(projectedPositionPct>limits.maxPositionPct) reasons.push(`Position would be ${projectedPositionPct.toFixed(2)}%, above the ${limits.maxPositionPct}% limit.`);
 if(input.dailyLossPct>=limits.maxDailyLossPct) reasons.push(`Daily loss is ${input.dailyLossPct.toFixed(2)}%, at or above the ${limits.maxDailyLossPct}% limit.`);
 if(tradeRiskPct>limits.maxTradeRiskPct) reasons.push(`Trade risk is ${tradeRiskPct.toFixed(2)}%, above the ${limits.maxTradeRiskPct}% limit.`);
 if(input.isCrypto&&projectedCryptoExposurePct>limits.maxCryptoExposurePct) reasons.push(`Crypto exposure would be ${projectedCryptoExposurePct.toFixed(2)}%, above the ${limits.maxCryptoExposurePct}% limit.`);
 return {approved:reasons.length===0,reasons,projectedPositionPct,projectedCryptoExposurePct,tradeRiskPct};
}
