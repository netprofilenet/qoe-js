/**
 * Latency measurement for idle and loaded conditions
 */

import { EventEmitter } from '../utils/events';
import { sleep } from '../utils/timing';
import { calculateStats } from '../utils/stats';
import { LatencyResult, LatencySample } from '../types/results';
import { WebRTCConnection } from '../webrtc/WebRTCConnection';

export interface LatencyTestConfig {
  apiBaseUrl: string;
  authToken?: string;
  webrtcSignalingUrl: string;
  iceServers: RTCIceServer[];
  idleLatencyCount: number;
  idleLatencyInterval: number;      // ms between probes
  loadedLatencyInterval: number;    // ms between probes during bandwidth tests
}

export class LatencyTest {
  private config: LatencyTestConfig;
  private eventEmitter: EventEmitter;
  private webrtcConnection: WebRTCConnection | null = null;
  private stopRequested: boolean = false;
  private loadedLatencyWorker: 'download' | 'upload' | null = null;
  private loadedLatencyPromise: Promise<void> | null = null;
  private testStart: number = 0;
  private downloadLatencySamples: LatencySample[] = [];
  private uploadLatencySamples: LatencySample[] = [];

  constructor(config: LatencyTestConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Request the test to stop gracefully
   */
  stop(): void {
    this.stopRequested = true;
    this.loadedLatencyWorker = null;
  }

  /**
   * Measure idle latency (without concurrent data transfer)
   * @returns LatencyResult with median latency and all samples
   */
  async measureIdleLatency(): Promise<LatencyResult> {
    this.stopRequested = false;
    const samples: LatencySample[] = [];
    this.testStart = performance.now();
    const testStart = this.testStart;

    // Try to connect WebRTC for more accurate latency
    let useWebRTC = false;
    if (!this.webrtcConnection) {
      this.webrtcConnection = new WebRTCConnection(
        this.config.webrtcSignalingUrl,
        this.config.iceServers,
        this.eventEmitter,
        this.config.authToken
      );
    }

    try {
      await this.webrtcConnection.connect();
      useWebRTC = true;
      this.eventEmitter.emit('debug', {
        type: 'debug',
        message: 'Using WebRTC for idle latency measurement'
      });
    } catch (err) {
      this.eventEmitter.emit('debug', {
        type: 'debug',
        message: `WebRTC connection failed for idle latency, falling back to HTTP: ${err}`
      });
      useWebRTC = false;
    }

    // Collect latency samples
    for (let i = 0; i < this.config.idleLatencyCount; i++) {
      if (this.stopRequested) break;

      try {
        let rtt: number | null = null;

        if (useWebRTC && this.webrtcConnection) {
          const result = await this.webrtcConnection.measureLatency();
          rtt = result.rtt < 0 ? null : result.rtt; // Filter packet loss
        } else {
          // Fallback to HTTP
          const start = performance.now();
          await fetch(`${this.config.apiBaseUrl}/__latency`, {
              headers: this.config.authToken ? { 'Authorization': `Bearer ${this.config.authToken}` } : {}
            });
          rtt = performance.now() - start;
        }

        if (rtt !== null) {
          const timestamp = performance.now() - testStart;
          const sample: LatencySample = { timestamp, latency: rtt };
          samples.push(sample);

          // Emit sample event with phase info
          this.eventEmitter.emit('sample', {
            type: 'sample',
            sampleType: 'latency',
            sample,
            timestamp,
            latencyPhase: 'idle'
          });
        }
      } catch (err) {
        this.eventEmitter.emit('error', {
          type: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
          context: 'Idle latency test'
        });
      }

      await sleep(this.config.idleLatencyInterval);
    }

    const latencies = samples.map(s => s.latency);
    const stats = calculateStats(latencies);

    return {
      median: stats.median,
      stats,
      samples
    };
  }

  /**
   * Start background latency measurement during bandwidth tests
   * @param type - 'download' or 'upload'
   */
  async startLoadedLatencyMeasurement(type: 'download' | 'upload'): Promise<void> {
    // If already running for this type, don't restart
    if (this.loadedLatencyWorker === type) {
      return;
    }

    // Check if WebRTC is available (should be connected from idle latency)
    const useWebRTC = this.webrtcConnection && this.webrtcConnection.isConnected;
    if (useWebRTC) {
      this.eventEmitter.emit('debug', {
        type: 'debug',
        message: `Using WebRTC for loaded latency measurement during ${type}`
      });
    }

    this.loadedLatencyWorker = type;

    // Start measurement loop
    const measure = async () => {
      while (this.loadedLatencyWorker === type) {
        try {
          let rtt: number | null = null;

          if (useWebRTC && this.webrtcConnection && this.webrtcConnection.isConnected) {
            const result = await this.webrtcConnection.measureLatency();
            rtt = result.rtt < 0 ? null : result.rtt;
          } else {
            // Fallback to HTTP
            const start = performance.now();
            await fetch(`${this.config.apiBaseUrl}/__latency`, {
              headers: this.config.authToken ? { 'Authorization': `Bearer ${this.config.authToken}` } : {}
            });
            rtt = performance.now() - start;
          }

          if (rtt !== null) {
            const timestamp = performance.now() - this.testStart;
            const sample: LatencySample = { timestamp, latency: rtt };

            // Store in appropriate array
            if (type === 'download') {
              this.downloadLatencySamples.push(sample);
            } else {
              this.uploadLatencySamples.push(sample);
            }

            // Emit sample event with phase info
            this.eventEmitter.emit('sample', {
              type: 'sample',
              sampleType: 'latency',
              sample,
              timestamp,
              latencyPhase: type === 'download' ? 'downloadLoaded' : 'uploadLoaded'
            });
          }
        } catch (err) {
          this.eventEmitter.emit('error', {
            type: 'error',
            error: err instanceof Error ? err : new Error(String(err)),
            context: `Loaded latency measurement (${type})`
          });
        }

        await sleep(this.config.loadedLatencyInterval);
      }
    };

    // Store promise so stopLoadedLatencyMeasurement can await it
    this.loadedLatencyPromise = measure();
  }

  /**
   * Stop loaded latency measurement and return accumulated results
   * @returns Object with download and upload latency results
   */
  async stopLoadedLatencyMeasurement(): Promise<{
    downloadLatency: LatencyResult | null;
    uploadLatency: LatencyResult | null;
  }> {
    this.loadedLatencyWorker = null;
    // Await the background loop to finish its current iteration
    if (this.loadedLatencyPromise) {
      await this.loadedLatencyPromise;
      this.loadedLatencyPromise = null;
    }

    // Calculate download latency results
    let downloadLatency: LatencyResult | null = null;
    if (this.downloadLatencySamples.length > 0) {
      const latencies = this.downloadLatencySamples.map(s => s.latency);
      const stats = calculateStats(latencies);
      downloadLatency = {
        median: stats.median,
        stats,
        samples: this.downloadLatencySamples
      };
    }

    // Calculate upload latency results
    let uploadLatency: LatencyResult | null = null;
    if (this.uploadLatencySamples.length > 0) {
      const latencies = this.uploadLatencySamples.map(s => s.latency);
      const stats = calculateStats(latencies);
      uploadLatency = {
        median: stats.median,
        stats,
        samples: this.uploadLatencySamples
      };
    }

    return { downloadLatency, uploadLatency };
  }

  /**
   * Close WebRTC connection and clean up resources
   */
  close(): void {
    if (this.webrtcConnection) {
      this.webrtcConnection.close();
      this.webrtcConnection = null;
    }
    this.loadedLatencyWorker = null;
  }
}
