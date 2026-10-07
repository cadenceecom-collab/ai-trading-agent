import {NextResponse} from 'next/server';
export async function GET(){
 return NextResponse.json({
  liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',
  mode:process.env.TRADING_MODE??'paper',
  platforms:[
   {id:'ibkr',name:'IBKR',mode:'Web API / OAuth 2.0',required:['IBKR_CLIENT_ID','IBKR_CLIENT_ASSERTION','IBKR_ACCESS_TOKEN'],note:'IBKR OAuth requires a registered application and RSA client assertion. Brokerage session initialization is required before trading endpoints.'},
   {id:'kraken',name:'Kraken',mode:'Private REST API',required:['KRAKEN_API_KEY','KRAKEN_API_SECRET'],note:'Keep the API key restricted to the minimum permissions required.'},
   {id:'coinbase',name:'Coinbase',mode:'Advanced Trade API',required:['COINBASE_API_KEY','COINBASE_API_SECRET'],note:'Use server-side credentials only.'},
   {id:'bitget',name:'Bitget',mode:'Demo REST API',required:['BITGET_API_KEY','BITGET_API_SECRET','BITGET_API_PASSPHRASE'],note:'Create the key while Bitget Demo mode is active; demo requests use the paptrading header.'}
  ]
 });
}