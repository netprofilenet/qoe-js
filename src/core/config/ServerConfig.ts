/**
 * Server configuration and discovery
 */

import { ServerInfo, ServerRegistry } from '../types/server';

export class ServerConfig {
  private currentServer: ServerInfo | null = null;

  /**
   * Set the current server
   */
  setServer(server: ServerInfo): void {
    this.currentServer = server;
  }

  /**
   * Get the current server
   */
  getServer(): ServerInfo {
    if (!this.currentServer) {
      // Return default localhost server
      return {
        id: 'local',
        name: 'Local Server',
        country: 'Local',
        httpUrl: `${window.location.protocol}//${window.location.host}`,
        webrtcSignalingUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/signaling`,
        stunServers: ['stun:stun.l.google.com:19302'],
        turnServers: [],
        enabled: true
      };
    }
    return this.currentServer;
  }

  /**
   * Load server registry from URL
   */
  async loadRegistry(url: string): Promise<ServerRegistry> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load server registry: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Discover the best server based on latency
   */
  async discoverBestServer(registry: ServerRegistry): Promise<ServerInfo> {
    const enabledServers = registry.servers.filter(s => s.enabled);
    if (enabledServers.length === 0) {
      throw new Error('No enabled servers in registry');
    }

    // Measure latency to each server
    const latencies = await Promise.all(
      enabledServers.map(server => this.measureServerLatency(server))
    );

    // Find server with lowest latency
    let bestIndex = 0;
    let bestLatency = latencies[0];
    for (let i = 1; i < latencies.length; i++) {
      if (latencies[i] < bestLatency) {
        bestLatency = latencies[i];
        bestIndex = i;
      }
    }

    return enabledServers[bestIndex];
  }

  /**
   * Measure latency to a specific server
   */
  private async measureServerLatency(server: ServerInfo): Promise<number> {
    const samples: number[] = [];
    const sampleCount = 3;

    for (let i = 0; i < sampleCount; i++) {
      const start = performance.now();
      try {
        await fetch(`${server.httpUrl}/__latency`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        const latency = performance.now() - start;
        samples.push(latency);
      } catch (err) {
        // Server unreachable, assign high latency
        samples.push(10000);
      }
    }

    // Return median latency
    const sorted = samples.sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
}
