const opportunities = [
  { symbol: 'BTC/USD', action: 'BUY', confidence: 87, venue: 'Kraken', note: 'Momentum + volume confirmation' },
  { symbol: 'NVDA', action: 'BUY', confidence: 82, venue: 'IBKR', note: 'Trend strength + relative strength' },
  { symbol: 'ETH/USD', action: 'HOLD', confidence: 61, venue: 'Coinbase', note: 'Signal mixed; waiting for confirmation' },
  { symbol: 'AAPL', action: 'SELL', confidence: 76, venue: 'IBKR', note: 'Risk-adjusted momentum weakening' }
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="brand">AI Trading Agent</div><div className="sub">Stocks + Crypto · Paper Trading</div></div>
        <div className="status"><span className="dot" />System online · Live trading disabled</div>
      </header>

      <section className="grid">
        <div className="card"><div className="label">Paper portfolio</div><div className="value">CA$100,000</div><div className="sub">Starting balance</div></div>
        <div className="card"><div className="label">Today P&amp;L</div><div className="value positive">+CA$842</div><div className="sub">+0.84%</div></div>
        <div className="card"><div className="label">Risk status</div><div className="value positive">LOW</div><div className="sub">All limits clear</div></div>
        <div className="card"><div className="label">Cash</div><div className="value">42%</div><div className="sub">Portfolio liquidity</div></div>
      </section>

      <section className="main">
        <div className="card">
          <div className="sectionTitle">AI Opportunities</div><div className="sub">Signals are proposals only; risk approval is required.</div>
          {opportunities.map((o) => <div className="row" key={o.symbol}><div><div className="symbol">{o.symbol}</div><div className="sub">{o.note}</div></div><div style={{textAlign:'right'}}><div className={o.action==='BUY'?'buy':o.action==='HOLD'?'hold':'muted'}>{o.action} · {o.confidence}%</div><div className="sub">{o.venue}</div></div></div>)}
        </div>

        <div className="card decision">
          <div className="sectionTitle">AI Decision Preview</div><div className="sub">Example paper-trading proposal</div>
          <div className="score buy">BUY</div>
          <div className="row"><span className="muted">Asset</span><strong>BTC/USD</strong></div>
          <div className="row"><span className="muted">Confidence</span><strong>87%</strong></div>
          <div className="row"><span className="muted">Allocation</span><strong>2.5%</strong></div>
          <div className="row"><span className="muted">Risk</span><strong>0.45%</strong></div>
          <div className="row"><span className="muted">Venue</span><strong>Kraken</strong></div>
          <div className="actions"><button className="btn primary">Approve Paper Trade</button><button className="btn">Details</button></div>
          <div className="warning">Live execution is intentionally unavailable. The risk engine must approve every future order before an execution adapter can submit it.</div>
        </div>
      </section>
    </main>
  );
}
