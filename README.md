# AI Trading Agent

Standalone AI-assisted trading system for stocks and crypto.

## Scope
- Stocks/ETFs via IBKR
- Crypto via Kraken and Coinbase
- Paper trading first
- Deterministic risk controls
- AI-assisted market analysis and trade proposals
- Separate infrastructure from NOURKANDI AI Manager

## Safety
Live trading is disabled during initial development. The AI proposes trades; deterministic risk checks must approve them before execution.

## Planned stack
- Next.js dashboard
- Supabase/PostgreSQL
- Python quantitative engine
- IBKR, Kraken, Coinbase adapters
- AI decision layer

## Development
The repository is intentionally starting as a clean standalone project. No NOURKANDI credentials, code, or integrations belong here.
