'use client';

import { useEffect, useState } from 'react';

type Overview = {
  account?: { name: string; base_currency: string; account_type: string } | null;
  positions: Array<{ id: string; quantity: number; market_value: number | null; unrealized_pnl: number | null; assets?: { symbol: string } | null }>;
  signals: Array<{ id: string; action: string; confidence: number | null; rationale: string | null; assets?: { symbol: string } | null }>;
  orders: Array<{ id: string; side: string; status: string; quantity: number; assets?: { symbol: string } | null; venues?: { name: string } | null }>;
  riskRules: Array<{ name: string; value: number; unit: string | null }>;
  tradingMode: string;
  liveTradingEnabled: boolean;
};

export default function Home() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/trading/overview').then(async r => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? json.status ?? 'Unable to load trading data');
      setData(json);
    }).catch(e => setError(e.message));
  }, []);

  const portfolio = data?.positions.reduce((sum, p) => sum + Number(p.market_value ?? 0), 0) ?? 0;
  const pnl = data?.positions.reduce((sum, p) => sum + Number(p.unrealized_pnl ?? 0), 0) ?? 0;
  const rules = data?.riskRules ?? [];

  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="brand">AI Trading Agent</div><div className="sub">Stocks + Crypto · Database-backed paper trading</div></div>
        <div className="status"><span className="dot" />{${"data?.liveTradingEnabled ? 'LIVE TRADING ENABLED' : 'Live trading disabled'"}}</div>
      </header>

      {${'error && <div className="card warning" style={{marginBottom:16}}>Database connection is not ready: ' + error + '</div>'}}

      <section className="grid">
        <div className="card"><div className="label">Paper account</div><div className="value">{${"data?.account?.name ?? 'Not connected'"}}</div><div className="sub">{${"data?.tradingMode ?? 'paper'"}} mode</div></div>
        <div className="card"><div className="label">Position value</div><div className="value">CA {${'portfolio.toLocaleString(undefined,{maximumFractionDigits:2})'}}</div><div className="sub">{${'data?.positions.length ?? 0'}} open positions</div></div>
        <div className="card"><div className="label">Unrealized P&amp;L</div><div className={${"pnl >= 0 ? 'value positive' : 'value muted'"}}>{${"pnl >= 0 ? '+' : ''}}CA {${'pnl.toLocaleString(undefined,{maximumFractionDigits:2})'}}</div><div className="sub">Calculated from database positions</div></div>
        <div className="card"><div className="label">Risk rules</div><div className="value positive">LOCKED</div><div className="sub">{${'rules.length'}} active deterministic limits</div></div>
      </section>

      <section className="main">
        <div className="card">
          <div className="sectionTitle">AI Signals</div><div className="sub">Only database signals appear here; signals do not execute orders directly.</div>
          {(data?.signals ?? []).length === 0 ? <div className="empty">No signals yet. The market-data and signal engine will populate this panel.</div> :
            data!.signals.map(s => <div className="row" key={s.id}><div><div className="symbol">{${"s.assets?.symbol ?? 'Unknown'"}}</div><div className="sub">{${"s.rationale ?? 'No rationale recorded'"}}</div></div><div style={{textAlign:'right'}}><div className={${"s.action === 'BUY' ? 'buy' : s.action === 'SELL' ? 'muted' : 'hold'"}}>{${'s.action'}} · {${'s.confidence ?? 0'}}%</div></div></div>)}
        </div>

        <div className="card">
          <div className="sectionTitle">Paper Orders</div><div className="sub">Risk-approved orders are still paper-only.</div>
          {(data?.orders ?? []).length === 0 ? <div className="empty">No paper orders yet.</div> :
            data!.orders.map(o => <div className="row" key={o.id}><div><div className="symbol">{${"o.assets?.symbol ?? 'Unknown'"}}</div><div className="sub">{${"o.venues?.name ?? 'Unassigned venue'"}} · {${'o.quantity'}}</div></div><div style={{textAlign:'right'}}><div className={${"o.status === 'approved_paper' ? 'buy' : 'muted'"}}>{${'o.side.toUpperCase()'}}</div><div className="sub">{${'o.status'}}</div></div></div>)}
        </div>
      </section>

      <section className="card" style={{marginTop:16}}>
        <div className="sectionTitle">Deterministic Risk Guardrails</div>
        <div className="sub">The AI cannot override these limits.</div>
        <div className="ruleGrid">{rules.map(r => <div className="rule" key={r.name}><span>{${'r.name'}}</span><strong>{${'String(r.value)'}}{${"r.unit === 'percent' ? '%' : r.unit ? ' ' + r.unit : ''"}}</strong></div>)}</div>
      </section>
    </main>
  );
}
