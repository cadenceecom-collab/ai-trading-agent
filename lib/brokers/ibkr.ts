export type IBKRStatus = {
  connected: boolean;
  authenticated: boolean;
  established?: boolean;
  message?: string;
};

export type IBKRMarketSnapshot = {
  conid: number;
  conidEx?: string;
  last?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  updatedAt?: number;
  raw: Record<string, unknown>;
};

const DEFAULT_BASE_URL = 'https://localhost:5000/v1/api';

function baseUrl() {
  return (process.env.IBKR_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function configured() {
  return Boolean(process.env.IBKR_API_URL);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(`IBKR API error: ${detail}`);
  }

  return data as T;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export const ibkr = {
  isConfigured: configured,

  async getStatus(): Promise<IBKRStatus> {
    if (!configured()) {
      return {
        connected: false,
        authenticated: false,
        established: false,
        message: 'IBKR_API_URL is not configured.',
      };
    }

    try {
      // Client Portal Gateway uses this endpoint to report the current brokerage session.
      return await request<IBKRStatus>('/iserver/auth/status');
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        established: false,
        message: error instanceof Error ? error.message : 'Unable to reach IBKR.',
      };
    }
  },

  async getAccounts(): Promise<unknown> {
    return request('/iserver/accounts');
  },

  async searchContract(symbol: string): Promise<unknown> {
    const encoded = encodeURIComponent(symbol.trim().toUpperCase());
    return request(`/iserver/secdef/search?symbol=${encoded}`);
  },

  async getSnapshot(conids: number[], fields = ['31', '84', '85', '86', '87', '88']) {
    if (!conids.length) return [];

    const data = await request<unknown[]>(
      `/iserver/marketdata/snapshot?conids=${conids.join(',')}&fields=${fields.join(',')}`,
    );

    return data.map((row) => {
      const raw = (row ?? {}) as Record<string, unknown>;
      return {
        conid: num(raw.conid) ?? 0,
        conidEx: typeof raw.conidEx === 'string' ? raw.conidEx : undefined,
        last: num(raw['31']),
        bid: num(raw['84']),
        ask: num(raw['86']),
        bidSize: num(raw['85']),
        askSize: num(raw['88']),
        updatedAt: num(raw._updated),
        raw,
      } satisfies IBKRMarketSnapshot;
    });
  },

  async getHistory(conid: number, period = '1y', bar = '1d') {
    const params = new URLSearchParams({
      conid: String(conid),
      period,
      bar,
      outsideRth: 'true',
    });
    return request(`/iserver/marketdata/history?${params.toString()}`);
  },
};
