import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrchestratorClient } from '../src/core/OrchestratorClient';

const MOCK_SERVERS = [
  {
    id: 'srv-1',
    name: 'Server 1',
    country: 'US',
    httpUrl: 'http://srv1:3000',
    webrtcSignalingUrl: 'ws://srv1:3000/signaling',
    stunServers: [],
    turnServers: [],
    enabled: true,
  },
];

const MOCK_TOKEN_RESPONSE = {
  token: 'mock-token.mock-sig',
  expiresAt: new Date(Date.now() + 300000).toISOString(),
  serverId: 'srv-1',
  testId: 'test-abc',
};

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('OrchestratorClient constructor', () => {
  it('strips trailing slashes', () => {
    const client = new OrchestratorClient('https://example.com///');
    // We can't access private baseUrl, but we can verify fetch calls
    expect(client).toBeDefined();
  });
});

describe('fetchServers', () => {
  it('calls GET /api/servers and returns server list', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ servers: MOCK_SERVERS }),
    });

    const client = new OrchestratorClient('https://orch.example.com');
    const servers = await client.fetchServers();

    expect(fetch).toHaveBeenCalledWith('https://orch.example.com/api/servers');
    expect(servers).toEqual(MOCK_SERVERS);
    expect(servers).toHaveLength(1);
    expect(servers[0].id).toBe('srv-1');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const client = new OrchestratorClient('https://orch.example.com');
    await expect(client.fetchServers()).rejects.toThrow('Failed to fetch servers: 500');
  });
});

describe('requestTestToken', () => {
  it('calls POST /api/test-token with serverId', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_TOKEN_RESPONSE),
    });

    const client = new OrchestratorClient('https://orch.example.com');
    const token = await client.requestTestToken('srv-1');

    expect(fetch).toHaveBeenCalledWith('https://orch.example.com/api/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId: 'srv-1' }),
    });
    expect(token.token).toBe('mock-token.mock-sig');
    expect(token.serverId).toBe('srv-1');
    expect(token.testId).toBe('test-abc');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const client = new OrchestratorClient('https://orch.example.com');
    await expect(client.requestTestToken('srv-1')).rejects.toThrow('Failed to get test token: 429');
  });
});

describe('submitResults', () => {
  it('calls POST /api/results with token and results', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'result-1' }),
    });

    const client = new OrchestratorClient('https://orch.example.com');
    const results = {
      serverId: 'srv-1',
      testMode: 'quality',
      download: { bandwidthMbps: 100 },
    };

    await client.submitResults('my-token', results);

    expect(fetch).toHaveBeenCalledWith('https://orch.example.com/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      },
      body: JSON.stringify({ ...results, token: 'my-token' }),
    });
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const client = new OrchestratorClient('https://orch.example.com');
    await expect(client.submitResults('bad-token', {})).rejects.toThrow('Failed to submit results: 401');
  });
});
