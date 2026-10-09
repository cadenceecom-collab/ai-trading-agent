'use client';
import {useEffect,useState} from 'react';

type Overview={
 account?:{name:string;base_currency:string;account_type:string}|null;
 positions:Array<{id:string;quantity:number;market_value:number|null;unrealized_pnl:number|null;assets?:{symbol:string}|null}>;
 signals:Array<{id:string;action:string;confidence:number|null;rationale:string|null;assets?:{symbol:string}|null}>;
 orders:Array<{id:string;side:string;status:string;quantity:number;assets?:{symbol:string}|null;venues?:{name:string}|null}>;
 riskRules:Array<{name:string;value:number;unit:string|null}>;
 tradingMode:string;liveTradingEnabled:boolean
};
type Health={configured:boolean;connected?:boolean;authenticated?:boolean;reachable?:boolean;message?:string;demoConfigured?:boolean;privateCredentialsConfigured?:boolean};
type KrakenBalance={asset:string;amount:number};
type CryptoScan={symbol:string;action?:'buy'|'sell'|'hold';confidence?:number;score?:number;candleCount?:number;candleSource?:string|null;rationale?:string;features?:{latest:number;sma20:number|null;sma50:number|null;momentum20:number|null;spreadPct:number;venueCount:number};consensus?:{consensusPrice:number;spreadPct:number;venues:Array<{venue:string;price:number}>};error?:string};
type ApiError={error?:string};
const money=(n:number|null|undefined,currency='CAD')=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat('en-CA',{style:'currency',currency,maximumFractionDigits:2}).format(n):'—';
const pct=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(2)+'%':'—';
function actionClass(action?:string){return action==='buy'?'good':action==='sell'?'bad':'warn'}

export default function Home(){
 const [data,setData]=useState<Overview|null>(null);
 const [health,setHealth]=useState<Record<string,Health>>({});
 const [balances,setBalances]=useState<KrakenBalance[]>([]);
 const [scans,setScans]=useState<CryptoScan[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');

 async function load(){
  setLoading(true);setError('');
  const results=await Promise.allSettled([
   fetch('/api/trading/overview',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error??'Overview unavailable');return j as Overview}),
   fetch('/api/brokers/connections',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error??'Connections unavailable');return j}),
   fetch('/api/brokers/kraken/balance',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error??'Kraken balance unavailable');return j as {balances?:KrakenBalance[]}}),
  ]);
  if(results[0].status==='fulfilled')setData(results[0].value);else setError(results[0].reason instanceof Error?results[0].reason.message:'Overview unavailable.');
  if(results[1].status==='fulfilled')setHealth(results[1].value.connections??{});
  if(results[2].status==='fulfilled')setBalances(results[2].value.balances??[]);
  setLoading(false);
 }
 async function scanCrypto(){
  setBusy(true);setError('');setNotice('');
  try{
   const out=await Promise.all(['BTC','ETH'].map(async symbol=>{
    const response=await fetch('/api/market/scan/crypto?symbol='+symbol,{cache:'no-store'});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error??'Crypto scan failed for '+symbol);
    return result as CryptoScan;
   }));
   setScans(out);setNotice('Market scan completed. These are technical signals, not guaranteed predictions.');
  }catch(e){setError(e instanceof Error?e.message:'Crypto scan failed.')}finally{setBusy(false)}
 }
 async function saveScans(){
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/market/scan/crypto/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols:scans.map(s=>s.symbol)})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??'Unable to save signals');
   setNotice('Signals saved to the database.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Unable to save signals')}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);
 const connections: Array<[string,Health|undefined]>=[['IBKR',health.ibkr],['Kraken',health.kraken],['Coinbase',health.coinbase],['Bitget',health.bitget]];
 return <main className="shell">
  <header className="topbar">
   <div><div className="brand">AI Trading Agent</div><div className="sub">Stocks + crypto · Research and paper trading</div></div>
   <div className="status"><span className="dot"/>{data?.tradingMode??'paper'} mode · live trading disabled</div>
  </header>
  <section className="grid">
   <div className="card"><div className="label">Paper account</div><div className="value">{data?.account?.name??'Paper Trading'}</div><div className="delta">{data?.account?.base_currency??'CAD'} base currency · {data?.account?.account_type??'paper'}</div></div>
   <div className="card"><div className="label">Open positions</div><div className="value">{data?.positions?.length??0}</div><div className="delta">Database-backed positions</div></div>
   <div className="card"><div className="label">Saved signals</div><div className="value">{data?.signals?.length??0}</div><div className="delta">Rules-based technical scans</div></div>
   <div className="card"><div className="label">Orders</div><div className="value">{data?.orders?.length??0}</div><div className="delta">Execution remains gated</div></div>
  </section>
  {error&&<div className="error" role="alert">{error}</div>}
  {notice&&<div className="notice">{notice}</div>}
  <section className="panel">
   <div className="panelHead"><h2>Broker connections</h2><div className="actions"><button className="secondary" onClick={()=>void load()} disabled={loading}>Refresh</button></div></div>
   <div className="connectionGrid">{connections.map(([name,h])=><div className="connection" key={name as string}><div className="connectionTop"><strong>{name as string}</strong><span className={'pill '+(h?.authenticated?'good':h?.reachable?'warn':'')}>{h?.authenticated?'AUTHENTICATED':h?.reachable?'PUBLIC DATA':'CHECK SETUP'}</span></div><div className="muted">{h?.message??'Connection status is loading.'}</div></div>)}</div>
   <div className="muted" style={{marginTop:12}}>Public market data does not prove private account authentication. Live trading and order submission are disabled.</div>
  </section>
  <section className="panel">
   <div className="panelHead"><h2>Crypto technical scanner</h2><div className="actions"><button onClick={()=>void scanCrypto()} disabled={busy}>{busy?'Working…':'Scan BTC + ETH'}</button><button className="secondary" onClick={()=>void saveScans()} disabled={busy||scans.length===0}>Save signals</button></div></div>
   {scans.length===0?<div className="muted">Run a scan to fetch public market data and calculate technical indicators.</div>:<div className="tableWrap"><table><thead><tr><th>Asset</th><th>Action</th><th>Score</th><th>Price</th><th>20-day momentum</th><th>Candles</th><th>Analysis</th></tr></thead><tbody>{scans.map(s=><tr key={s.symbol}><td>{s.symbol}</td><td className={actionClass(s.action)}>{s.action?.toUpperCase()??'—'}</td><td>{s.score??s.confidence??'—'}</td><td>{money(s.consensus?.consensusPrice??s.features?.latest,'USD')}</td><td>{pct(s.features?.momentum20)}</td><td>{s.candleCount??'—'} {s.candleSource?'('+s.candleSource+')':''}</td><td>{s.rationale??s.error??'—'}</td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel">
   <div className="panelHead"><h2>Paper positions</h2><span className="muted">{data?.positions?.length??0} tracked</span></div>
   {(data?.positions?.length??0)===0?<div className="muted">No saved positions yet.</div>:<div className="tableWrap"><table><thead><tr><th>Asset</th><th>Quantity</th><th>Market value</th><th>Unrealized P/L</th></tr></thead><tbody>{data!.positions.map(p=><tr key={p.id}><td>{p.assets?.symbol??'Unknown'}</td><td>{p.quantity}</td><td>{money(p.market_value)}</td><td>{money(p.unrealized_pnl)}</td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel">
   <div className="panelHead"><h2>Kraken balances</h2><span className="muted">Read-only private endpoint</span></div>
   {balances.length===0?<div className="muted">No balances loaded. Confirm Kraken authentication or refresh.</div>:<div className="tableWrap"><table><thead><tr><th>Asset</th><th>Available balance</th></tr></thead><tbody>{balances.map((b,i)=><tr key={b.asset+i}><td>{b.asset}</td><td>{b.amount}</td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel">
   <div className="panelHead"><h2>Recent saved signals</h2><span className="muted">{data?.signals?.length??0} signals</span></div>
   {(data?.signals?.length??0)===0?<div className="muted">No saved signals. Run the crypto scanner and choose Save signals, or load the stock scanner after market data ingestion.</div>:<div className="tableWrap"><table><thead><tr><th>Asset</th><th>Action</th><th>Confidence</th><th>Rationale</th></tr></thead><tbody>{data!.signals.map(s=><tr key={s.id}><td>{s.assets?.symbol??'—'}</td><td className={actionClass(s.action)}>{s.action.toUpperCase()}</td><td>{s.confidence??'—'}</td><td>{s.rationale??'—'}</td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel">
   <div className="panelHead"><h2>Deterministic risk limits</h2><span className="pill warn">Enforced before paper execution is enabled</span></div>
   <div className="ruleGrid">{(data?.riskRules??[]).map(r=><div className="rule" key={r.name}><span>{r.name}</span><strong>{r.value}{r.unit==='percent'?'%':r.unit?' '+r.unit:''}</strong></div>)}</div>
   <div className="muted" style={{marginTop:12}}>Default guardrails: max position 10%, daily loss 2%, trade risk 0.5%, crypto exposure 25%. Paper execution remains blocked until trusted server-side portfolio and market-price validation is in place.</div>
  </section>
 </main>
}
