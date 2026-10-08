import { createHmac, createHash } from 'node:crypto';

export type KrakenStatus = {
  configured: boolean;
  reachable: boolean;
  authenticated?: boolean;
  message?: string;
};

const API = 'https://api.kraken.com';
const PRIVATE_PATH_PREFIX = '/0/private';

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid Kraken response');
  }
  if (!response.ok) throw new Error(`Kraken HTTP ${response.status}`);
  if (Array.isArray(data.error) && data.error.length) {
    throw new Error(data.error.join('; '));
  }
  return data as T;
}

async function publicRequest<T>(path: string): Promise<T> {
  return parse<T>(
    await fetch(`${API}/0/public${path}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }),
  );
}

function configured(): boolean {
  return Boolean(process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET);
}

async function privateRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  if (!configured()) {
    throw new Error('Kraken private API credentials are not configured.');
  }

  // Kraken signs the complete URI path, including /0/private, not just the endpoint name.
  const uriPath = `${PRIVATE_PATH_PREFIX}${endpoint}`;
  const nonce = Date.now().toString();
  const body = new URLSearchParams({ nonce, ...params }).toString();
  const sha256 = createHash('sha256').update(nonce + body).digest();
  const signature = createHmac(
    'sha512',
    Buffer.from(process.env.KRAKEN_API_SECRET!, 'base64'),
  )
    .update(Buffer.concat([Buffer.from(uriPath), sha256]))
    .digest('base64');

  return parse<T>(
    await fetch(`${API}${uriPath}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'API-Key': process.env.KRAKEN_API_KEY!,
        'API-Sign': signature,
      },
      body,
      cache: 'no-store',
    }),
  );
}

export const kraken = {
  isConfigured: configured,

  async getStatus(): Promise<KrakenStatus> {
    try {
      await publicRequest('/SystemStatus');
    } catch {
      return {
        configured: configured(),
        reachable: false,
        authenticated: false,
        message: 'Kraken public API is unreachable. Please retry shortly.',
      };
    }

    if (!configured()) {
      return {
        configured: false,
        reachable: true,
        authenticated: false,
        message: 'Kraken public API reachable; private credentials are not configured.',
      };
    }

    try {
      await privateRequest('/Balance');
      return {
        configured: true,
        reachable: true,
        authenticated: true,
        message: 'Kraken private API authentication successful.',
      };
    } catch (error) {
      return {
        configured: true,
        reachable: true,
        authenticated: false,
        message: error instanceof Error
          ? error.message
          : 'Unable to authenticate with Kraken.',
      };
    }
  },

  getBalance() {
    return privateRequest('/Balance');
  },
  getOpenOrders() {
    return privateRequest('/OpenOrders');
  },
  getClosedOrders() {
    return privateRequest('/ClosedOrders');
  },
  getTicker(pair: string) {
    return publicRequest('/Ticker?pair=' + encodeURIComponent(pair));
  },
  getOHLC(pair: string, interval = 1440) {
    return publicRequest('/OHLC?pair=' + encodeURIComponent(pair) + '&interval=' + interval);
  },
  getAssetPairs() {
    return publicRequest('/AssetPairs');
  },
};
