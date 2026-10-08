export type RiskLimits = { maxPositionPct:number; maxDailyLossPct:number; maxTradeRiskPct:number; maxCryptoExposurePct:number };
export type RiskInput = { portfolioValue:number; currentPositionValue:number; proposedOrderValue:number; dailyLossPct:number; currentCryptoExposurePct:number; isCrypto:boolean; stopDistancePct:number; side?:'buy'|'sell' };
export type RiskResult = { approved:boolean; reasons:string[]; projectedPositionPct:number; projectedCryptoExposurePct:number; tradeRiskPct:number };
export const DEFAULT_RISK_LIMITS:RiskLimits={maxPositionPct:10,maxDailyLossPct:2,maxTradeRiskPct:0.5,maxCryptoExposurePct:25};

export function evaluateRisk(input:RiskInput,limits=DEFAULT_RISK_LIMITS):RiskResult{
 const reasons:string[]=[];
 const isSell=input.side==='sell';
 if(!Number.isFinite(input.portfolioValue)||input.portfolioValue<=0) reasons.push('Portfolio value must be positive.');
 if(!Number.isFinite(input.proposedOrderValue)||input.proposedOrderValue<=0) reasons.push('Proposed trade value must be positive.');
 if(!Number.isFinite(input.currentPositionValue)||input.currentPositionValue<0) reasons.push('Current position value must be zero or positive.');
 if(isSell&&input.proposedOrderValue>input.currentPositionValue+0.000001) reasons.push('Sell value exceeds the current position; short selling is not enabled.');
 const signedOrderValue=isSell?-Math.min(input.proposedOrderValue,Math.max(input.currentPositionValue,0)):input.proposedOrderValue;
 const projectedPositionValue=Math.max(0,input.currentPositionValue+signedOrderValue);
 const projectedPositionPct=input.portfolioValue>0?(projectedPositionValue/input.portfolioValue)*100:Infinity;
 const cryptoDeltaPct=input.isCrypto?(signedOrderValue/Math.max(input.portfolioValue,1))*100:0;
 const projectedCryptoExposurePct=input.isCrypto?Math.max(0,input.currentCryptoExposurePct+cryptoDeltaPct):input.currentCryptoExposurePct;
 const tradeRiskPct=isSell?0:(Math.abs(input.proposedOrderValue/Math.max(input.portfolioValue,1))*Math.max(input.stopDistancePct,0));
 if(projectedPositionPct>limits.maxPositionPct) reasons.push(`Position would be ${projectedPositionPct.toFixed(2)}%, above the ${limits.maxPositionPct}% limit.`);
 if(input.dailyLossPct>=limits.maxDailyLossPct) reasons.push(`Daily loss is ${input.dailyLossPct.toFixed(2)}%, at or above the ${limits.maxDailyLossPct}% limit.`);
 if(tradeRiskPct>limits.maxTradeRiskPct) reasons.push(`Trade risk is ${tradeRiskPct.toFixed(2)}%, above the ${limits.maxTradeRiskPct}% limit.`);
 if(input.isCrypto&&projectedCryptoExposurePct>limits.maxCryptoExposurePct) reasons.push(`Crypto exposure would be ${projectedCryptoExposurePct.toFixed(2)}%, above the ${limits.maxCryptoExposurePct}% limit.`);
 return {approved:reasons.length===0,reasons,projectedPositionPct,projectedCryptoExposurePct,tradeRiskPct};
}
