/**
 * OrchestratorClient - Manages test lifecycle through the orchestrator API
 *
 * Handles server discovery, test token acquisition, test execution,
 * and result submission via the orchestrator service.
 */

import { ServerInfo } from './types/server';
import { QOEClient } from './QOEClient';
import { QualityResults, SpeedResults } from './types/results';

export interface TestTokenResponse {
  token: string;
  expiresAt: string;
  serverId: string;
  testId: string;
}

export class OrchestratorClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Strip trailing slashes
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Fetch the list of available test servers from the orchestrator
   */
  async fetchServers(): Promise<ServerInfo[]> {
    const resp = await fetch(`${this.baseUrl}/api/servers`);
    if (!resp.ok) throw new Error(`Failed to fetch servers: ${resp.status}`);
    const data = await resp.json();
    return data.servers;
  }

  /**
   * Request a test token for a specific server
   */
  async requestTestToken(serverId: string): Promise<TestTokenResponse> {
    const resp = await fetch(`${this.baseUrl}/api/test-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId }),
    });
    if (!resp.ok) throw new Error(`Failed to get test token: ${resp.status}`);
    return resp.json();
  }

  /**
   * Submit test results to the orchestrator
   */
  async submitResults(token: string, results: Record<string, unknown>): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/api/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...results, token }),
    });
    if (!resp.ok) throw new Error(`Failed to submit results: ${resp.status}`);
  }

  /**
   * Convenience: run a quality test through the orchestrator.
   * Discovers best server (or uses specified), acquires token, runs test, submits results.
   */
  async runQualityTest(serverId?: string): Promise<{ results: QualityResults; testId: string }> {
    const server = serverId
      ? (await this.fetchServers()).find((s) => s.id === serverId)
      : await this.discoverBestServer();

    if (!server) throw new Error(serverId ? `Server not found: ${serverId}` : 'No servers available');

    const tokenResp = await this.requestTestToken(server.id);

    const client = new QOEClient({ authToken: tokenResp.token });
    client.setServer(server);
    const results = await client.runQualityTest();

    await this.submitResults(tokenResp.token, {
      serverId: server.id,
      testMode: 'quality',
      download: { bandwidthMbps: results.download.bandwidthMbps },
      upload: { bandwidthMbps: results.upload.bandwidthMbps },
      idleLatency: { median: results.idleLatency.median },
      downloadLatency: results.downloadLatency ? { median: results.downloadLatency.median } : undefined,
      uploadLatency: results.uploadLatency ? { median: results.uploadLatency.median } : undefined,
      packetLoss: { lossPercent: results.packetLoss.lossPercent },
      bufferbloat: results.bufferbloat,
      qualityScore: results.qualityScore,
    });

    return { results, testId: tokenResp.testId };
  }

  /**
   * Convenience: run a speed test through the orchestrator.
   * Discovers best server (or uses specified), acquires token, runs test, submits results.
   */
  async runSpeedTest(serverId?: string): Promise<{ results: SpeedResults; testId: string }> {
    const server = serverId
      ? (await this.fetchServers()).find((s) => s.id === serverId)
      : await this.discoverBestServer();

    if (!server) throw new Error(serverId ? `Server not found: ${serverId}` : 'No servers available');

    const tokenResp = await this.requestTestToken(server.id);

    const client = new QOEClient({ authToken: tokenResp.token, mode: 'speed' });
    client.setServer(server);
    const results = await client.runSpeedTest();

    await this.submitResults(tokenResp.token, {
      serverId: server.id,
      testMode: 'speed',
      download: { bandwidthMbps: results.download.bandwidthMbps },
      upload: { bandwidthMbps: results.upload.bandwidthMbps },
      idleLatency: { median: results.idleLatency.median },
      packetLoss: { lossPercent: results.packetLoss.lossPercent },
    });

    return { results, testId: tokenResp.testId };
  }

  /**
   * Discover the best server by measuring latency to all enabled servers
   */
  private async discoverBestServer(): Promise<ServerInfo> {
    const servers = await this.fetchServers();
    const enabled = servers.filter((s) => s.enabled);
    if (enabled.length === 0) throw new Error('No enabled servers found');

    // Measure latency to each server
    const latencies = await Promise.all(
      enabled.map(async (server) => {
        try {
          const start = performance.now();
          const resp = await fetch(`${server.httpUrl}/__latency`, {
            signal: AbortSignal.timeout(5000),
          });
          if (!resp.ok) return { server, latency: Infinity };
          const latency = performance.now() - start;
          return { server, latency };
        } catch {
          return { server, latency: Infinity };
        }
      }),
    );

    latencies.sort((a, b) => a.latency - b.latency);
    if (latencies[0].latency === Infinity) throw new Error('No reachable servers found');
    return latencies[0].server;
  }
}
