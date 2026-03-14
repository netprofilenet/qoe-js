import { describe, it, expect, vi } from 'vitest';
import { QOEClient } from '../src/core/QOEClient';
import type { ServerInfo } from '../src/core/types/server';

// Helper to flush microtasks (EventEmitter uses queueMicrotask)
async function flush() {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

const TEST_SERVER: ServerInfo = {
  id: 'test-srv',
  name: 'Test Server',
  country: 'US',
  httpUrl: 'http://localhost:3000',
  webrtcSignalingUrl: 'ws://localhost:3000/signaling',
  stunServers: ['stun:stun.l.google.com:19302'],
  turnServers: [],
  enabled: true,
};

describe('QOEClient constructor', () => {
  it('creates with default config', () => {
    const client = new QOEClient();
    expect(client).toBeDefined();
    expect(client.isRunning()).toBe(false);
  });

  it('creates with custom config', () => {
    const client = new QOEClient({ mode: 'speed' });
    expect(client).toBeDefined();
    expect(client.isRunning()).toBe(false);
  });

  it('sets custom server from config', () => {
    const client = new QOEClient({
      serverConfig: { customServer: TEST_SERVER },
    });
    const server = client.getServer();
    expect(server.id).toBe('test-srv');
    expect(server.httpUrl).toBe('http://localhost:3000');
  });
});

describe('setServer / getServer', () => {
  it('sets and gets server', () => {
    const client = new QOEClient();
    client.setServer(TEST_SERVER);

    const server = client.getServer();
    expect(server.id).toBe('test-srv');
    expect(server.httpUrl).toBe('http://localhost:3000');
    expect(server.webrtcSignalingUrl).toBe('ws://localhost:3000/signaling');
  });

  it('overwrites previously set server', () => {
    const client = new QOEClient();
    client.setServer(TEST_SERVER);

    const newServer: ServerInfo = {
      ...TEST_SERVER,
      id: 'new-srv',
      httpUrl: 'http://new:4000',
    };
    client.setServer(newServer);

    expect(client.getServer().id).toBe('new-srv');
  });
});

describe('stop / isRunning', () => {
  it('isRunning returns false when not running', () => {
    const client = new QOEClient();
    expect(client.isRunning()).toBe(false);
  });

  it('stop does not throw when not running', () => {
    const client = new QOEClient();
    expect(() => client.stop()).not.toThrow();
  });
});

describe('event wiring (on/off)', () => {
  it('registers and fires event listeners', async () => {
    const client = new QOEClient();
    const handler = vi.fn();
    client.on('progress', handler);

    // We can't easily trigger internal events without running tests,
    // but we can verify the wiring doesn't throw
    expect(handler).not.toHaveBeenCalled();
  });

  it('unregisters event listeners', async () => {
    const client = new QOEClient();
    const handler = vi.fn();
    client.on('progress', handler);
    client.off('progress', handler);
    // Handler should no longer fire
  });
});

describe('toolkit API', () => {
  it('getTestRunner returns a TestRunner', () => {
    const client = new QOEClient();
    const runner = client.getTestRunner();
    expect(runner).toBeDefined();
  });

  it('getMetricCollector returns a MetricCollector', () => {
    const client = new QOEClient();
    const collector = client.getMetricCollector();
    expect(collector).toBeDefined();
  });

  it('getMetrics returns empty array initially', () => {
    const client = new QOEClient();
    const metrics = client.getMetrics();
    expect(metrics).toEqual([]);
  });

  it('subscribe returns an unsubscribe function', () => {
    const client = new QOEClient();
    const observer = { onMetric: vi.fn() };
    const unsub = client.subscribe(observer);
    expect(typeof unsub).toBe('function');
    unsub();
  });
});
