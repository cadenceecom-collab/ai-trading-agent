import { createPrivateKey, sign as cryptoSign, randomBytes } from 'node:crypto';

export type CoinbaseStatus = {
  configured: boolean;
  reachable: boolean;
  authenticated: boolean;
  privateCredentialsConfigured: boolean;
  message?: string;
};

const HOST = 'api.coinbase.com';
const API = `https://${HOST}/api/v3/brokerage`;

function credentials() {
  const keyId = process.env.COINBASE_API_KEY?.trim();
  const rawSecret = process.env.COINBASE_API_SECRET?.trim();
  return { keyId, rawSecret, configured: Boolean(keyId && rawSecret) };
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

/**
 * Coinbase CDP Advanced Trade API keys use an EC private key and ES256 JWT.
 * Keep key material server-side; never return tokens or credentials to clients.
 */
function makeJwt(method: string, path: string): string {
  const { keyId, rawSecret } = credentials();
  if (!keyId || !rawSecret) throw new Error('Coinbase CDP API key credentials are not configured.');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', typ: 'JWT', kid: keyId, nonce: randomBytes(16).toString('hex') };
  const payload = {
    iss: 'cdp',
    sub: keyId,
    nbf: now,
    iat: now,
    exp: now + 120,
    uri: `${method} ${HOST}${path}`,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const normalizedPem = rawSecret.replace(/\\n/g, '\n');
  const signature = cryptoSign('sha256', Buffer.from(signingInput), {
    key: createPrivateKey(normalizedPem),
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${base64url(signature)}`;
}

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(API + path, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid Coinbase public API response.'); }
  if (!response.ok) throw new Error(`Coinbase public API HTTP ${response.status}`);
  return data as T;
}

async function privateRequest<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = makeJwt(method, path);
  const bodyText = body === undefined ? undefined : JSON.stringify(body);
  const response = await fetch(API + path, {
    method,
    body: bodyText,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(bodyText ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Invalid Coinbase private API response (HTTP ${response.status}).`); }
  if (!response.ok) {
    // Avoid reflecting request headers, key material, or the JWT in errors.
    const message = typeof data?.message === 'string' ? data.message : 'Private API request rejected.';
    throw new Error(`Coinbase private API HTTP ${response.status}: ${message.slice(0, 180)}`);
  }
  return data as T;
}

export const coinbase = {
  isConfigured: () => true,
  isPrivateConfigured: () => credentials().configured,

  async getStatus(): Promise<CoinbaseStatus> {
    let reachable = false;
    let publicMessage = '';
    try {
      await publicRequest('/market/products/BTC-USD');
      reachable = true;
      publicMessage = 'Public market-data API reachable.';
    } catch (error) {
      publicMessage = error instanceof Error ? error.message : 'Unable to reach public API.';
    }

    const privateCredentialsConfigured = credentials().configured;
    if (!privateCredentialsConfigured) {
      return {
        configured: true,
        reachable,
        authenticated: false,
        privateCredentialsConfigured: false,
        message: `${publicMessage} Private Advanced Trade credentials are not configured.`,
      };
    }

    try {
      await privateRequest('GET', '/accounts');
      return {
        configured: true,
        reachable,
        authenticated: true,
        privateCredentialsConfigured: true,
        message: `${publicMessage} Private account authentication successful (read-only check).`,
      };
    } catch (error) {
      return {
        configured: true,
        reachable,
        authenticated: false,
        privateCredentialsConfigured: true,
        message: `${publicMessage} Private authentication failed: ${error instanceof Error ? error.message : 'request failed'}`,
      };
    }
  },

  async getAccounts() {
    return privateRequest('GET', '/accounts');
  },

  async getTicker(productId = 'BTC-USD') {
    return publicRequest(`/market/products/${encodeURIComponent(productId)}/ticker`);
  },

  async getCandles(productId = 'BTC-USD', start?: string, end?: string, granularity = 'ONE_DAY', limit = 350) {
    const params = new URLSearchParams({
      start: start ?? String(Math.floor(Date.now() / 1000) - 350 * 86400),
      end: end ?? String(Math.floor(Date.now() / 1000)),
      granularity,
    });
    if (limit > 0) params.set('limit', String(Math.min(limit, 350)));
    return publicRequest(`/market/products/${encodeURIComponent(productId)}/candles?${params.toString()}`);
  },

  async getProducts() {
    return publicRequest('/market/products?limit=250');
  },
};
