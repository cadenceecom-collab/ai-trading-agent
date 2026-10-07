import {NextResponse} from 'next/server';
import {ibkr} from '@/lib/brokers/ibkr';
import {kraken} from '@/lib/brokers/kraken';
import {coinbase} from '@/lib/brokers/coinbase';
import {bitget} from '@/lib/brokers/bitget';
export async function GET(){
 const [i,k,c,b]=await Promise.all([ibkr.getStatus(),kraken.getStatus(),coinbase.getStatus(),bitget.getStatus()]);
 return NextResponse.json({mode:process.env.TRADING_MODE??'paper',liveTradingEnabled:process.env.LIVE_TRADING_ENABLED==='true',connections:{ibkr:{...i,setupRequired:!i.authenticated},kraken:{...k,privateCredentialsConfigured:Boolean(process.env.KRAKEN_API_KEY&&process.env.KRAKEN_API_SECRET)},coinbase:{...c,privateCredentialsConfigured:Boolean(process.env.COINBASE_API_KEY&&process.env.COINBASE_API_SECRET)},bitget:{...b,demoCredentialsConfigured:bitget.isDemoConfigured()}}});
}