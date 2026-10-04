const opportunities = [
  { symbol: 'BTC/USD', type: 'Crypto', signal: 'BUY', confidence: 87, venue: 'Kraken', risk: 'Low' },
  { symbol: 'NVDA', type: 'Stock', signal: 'BUY', confidence: 82, venue: 'IBKR', risk: 'Medium' },
  { symbol: 'ETH/USD', type: 'Crypto', signal: 'HOLD', confidence: 61, venue: 'Coinbase', risk: 'Medium' },
  { symbol: 'AAPL', type: 'Stock', signal: 'SELL', confidence: 76, venue: 'IBKR', risk: 'Medium' },
];

const positions = [
  { symbol: 'BTC/USD', value: '$8,240', pnl: '+4.8%' },
  { symbol: 'NVDA', value: '$7,110', pnl: '+7.2%' },
  { symbol: 'ETH/USD', value: '$3,980', pnl: '-1.1%' },
];

export default function Dashboard() {
  return (
    <main className="shell">
      <header className="topbar">
        <div><span className="eyebrow">STANDALONE SYSTEM</span><h1>AI Trading Agent</h1></div>
        <div className="status"><span className="dot" /> PAPER TRADING <span className="lock">LIVE LOCKED</span></div>
      </header>

      <section className="metrics">
        <Metric label="Portfolio" value="$125,430" detail="+$842 today" />
        <Metric label="Cash" value="42%" detail="Available" />
        <Metric label="Risk" value="LOW" detail="Within limits" />
        <Metric label="AI Confidence" value="87%" detail="Top signal" />
      </section>

      <section className="grid">
        <div className="panel wide">
          <div className="panelHead"><div><span className="eyebrow">AI MARKET SCANNER</span><h2>Current opportunities</h2></div><span className="pill">Paper only</span></div>
          <div className="table">
            {opportunities.map((item) => <div className="row" key={item.symbol}>
              <div><strong>{item.symbol}</strong><small>{item.type}</small></div>
              <span className={`signal ${item.signal.toLowerCase()}`}>{item.signal}</span>
              <div><strong>{item.confidence}%</strong><small>confidence</small></div>
              <div><strong>{item.venue}</strong><small>{item.risk} risk</small></div>
              <button>Analyze</button>
            </div>)}
          </div>
        </div>

        <div className="panel">
          <span className="eyebrow">PORTFOLIO</span><h2>Positions</h2>
          {positions.map((p) => <div className="position" key={p.symbol}><div><strong>{p.symbol}</strong><small>{p.value}</small></div><span>{p.pnl}</span></div>)}
          <div className="allocation"><span>Equity</span><b>46%</b></div><div className="bar"><i style={{ width: '46%' }} /></div>
          <div className="allocation"><span>Crypto</span><b>12%</b></div><div className="bar"><i style={{ width: '12%' }} /></div>
        </div>
      </section>

      <section className="panel decision">
        <div><span className="eyebrow">AI DECISION ENGINE</span><h2>BUY BTC/USD</h2><p>Multi-factor signal: momentum + trend + volume confirmation. This is a paper-trading proposal only.</p></div>
        <div className="decisionStats"><div><small>Confidence</small><b>87%</b></div><div><small>Risk</small><b>0.45%</b></div><div><small>Allocation</small><b>2.5%</b></div><div><small>Venue</small><b>Kraken</b></div></div>
        <div className="actions"><button className="approve">Approve paper trade</button><button>Reject</button><button>Details</button></div>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
