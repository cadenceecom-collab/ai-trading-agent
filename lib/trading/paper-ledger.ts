type Side='buy'|'sell';
export type LedgerPosition={quantity:number;averagePrice:number;marketValue:number;unrealizedPnl:number};
export function applyPaperFill(position:LedgerPosition|null,side:Side,quantity:number,fillPrice:number,markPrice=fillPrice):LedgerPosition{
 const q=Math.max(0,Number(position?.quantity??0));const avg=Number(position?.averagePrice??0);const qty=Math.max(0,quantity);
 if(side==='buy'){const next=q+qty;const nextAvg=next>0?((q*avg)+(qty*fillPrice))/next:0;return{quantity:next,averagePrice:nextAvg,marketValue:next*markPrice,unrealizedPnl:(markPrice-nextAvg)*next};}
 const next=Math.max(0,q-qty);const realizedBase=Math.min(q,qty);const nextAvg=next>0?avg:0;return{quantity:next,averagePrice:nextAvg,marketValue:next*markPrice,unrealizedPnl:(markPrice-nextAvg)*next};
}
