/**
 * QOE Client - Main entry point for network quality measurements
 */

import { EventEmitter } from './utils/events';
import { ServerConfig } from './config/ServerConfig';
import { TestConfig, mergeConfig } from './config/TestConfig';
import { ServerInfo, convertToRTCIceServers } from './types/server';
import { BandwidthTest } from './tests/BandwidthTest';
import { LatencyTest } from './tests/LatencyTest';
import { PacketLossTest } from './tests/PacketLossTest';
import { calculateStats } from './utils/stats';
import {
  QualityResults,
  SpeedResults,
  ApplicationResults
} from './types/results';
import { OrchestratorClient } from './OrchestratorClient';

// New toolkit imports
import { TestRunner } from './composition/TestRunner';
import { MetricCollector, RawMetric } from './metrics/MetricCollector';
import { MetricObservable, MetricObserver } from './observers/Observer';
import { TestPlan, ExecutionResult } from './types/primitives';

export class QOEClient {
  // Legacy properties
  private config: TestConfig;
  private serverConfig: ServerConfig;
  private eventEmitter: EventEmitter;
  private stopRequested: boolean = false;
  private running: boolean = false;

  // New toolkit properties
  private testRunner: TestRunner;
  private metricCollector: MetricCollector;
  private metricObservable: MetricObservable;

  /**
   * Create a new QOE Client
   * @param config - Optional test configuration
   */
  constructor(config: TestConfig = {}) {
    this.config = mergeConfig(config, config.mode || 'quality');
    this.serverConfig = new ServerConfig();
    this.eventEmitter = new EventEmitter();

    // Initialize new toolkit components
    this.testRunner = new TestRunner(this.eventEmitter);
    this.metricCollector = new MetricCollector();
    this.metricObservable = new MetricObservable();

    // Connect metric events to observable
    this.eventEmitter.on('metric', (event: any) => {
      const metric: RawMetric = {
        timestamp: performance.now(),
        source: 'primitive',
        type: event.primitive || 'unknown',
        data: event.result?.data,
        stepId: event.stepId
      };
      this.metricCollector.collect(metric);
      this.metricObservable.notify(metric);
    });

    // Set custom server if provided
    if (config.serverConfig?.customServer) {
      this.serverConfig.setServer(config.serverConfig.customServer);
    }
  }

  /**
   * Create a QOEClient configured from an orchestrator.
   * Fetches server list, picks the best server (or the one specified), and acquires a test token.
   */
  static async fromOrchestrator(
    url: string,
    serverId?: string,
  ): Promise<{ client: QOEClient; testId: string; token: string; orchestrator: OrchestratorClient }> {
    const orchestrator = new OrchestratorClient(url);

    const servers = await orchestrator.fetchServers();
    let server: ServerInfo | undefined;

    if (serverId) {
      server = servers.find((s) => s.id === serverId);
      if (!server) throw new Error(`Server not found: ${serverId}`);
    } else {
      // Pick first enabled server (simple for factory — use OrchestratorClient for full discovery)
      const enabled = servers.filter((s) => s.enabled);
      if (enabled.length === 0) throw new Error('No enabled servers found');
      server = enabled[0];
    }

    const tokenResp = await orchestrator.requestTestToken(server.id);

    const client = new QOEClient({ authToken: tokenResp.token });
    client.setServer(server);

    return { client, testId: tokenResp.testId, token: tokenResp.token, orchestrator };
  }

  /**
   * Run quality mode test (Cloudflare-style)
   * @returns Promise with quality test results
   */
  async runQualityTest(): Promise<QualityResults> {
    this.stopRequested = false;
    this.running = true;
    const config = mergeConfig(this.config, 'quality');
    const server = this.serverConfig.getServer();
    const iceServers = convertToRTCIceServers(server);

    this.eventEmitter.emit('progress', {
      type: 'progress',
      testMode: 'quality',
      currentPhase: 'Starting quality test',
      percentage: 0
    });

    // Create test instances
    const bandwidthTest = new BandwidthTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        downloadTests: config.downloadTests!,
        uploadTests: config.uploadTests!,
        bandwidthFinishDuration: config.bandwidthFinishDuration!
      },
      this.eventEmitter
    );

    const latencyTest = new LatencyTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        iceServers,
        idleLatencyCount: config.idleLatencyCount!,
        idleLatencyInterval: config.idleLatencyInterval!,
        loadedLatencyInterval: config.loadedLatencyInterval!
      },
      this.eventEmitter
    );

    const packetLossTest = new PacketLossTest(
      {
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        authToken: config.authToken,
        iceServers,
        packetLossCount: config.packetLossCount!,
        packetLossDuration: config.packetLossDuration!
      },
      this.eventEmitter
    );

    try {
      // 1. Measure idle latency
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'quality',
        currentPhase: 'Measuring idle latency',
        percentage: 10
      });
      const idleLatency = await latencyTest.measureIdleLatency();

      // 2. Interleaved download/upload tests with loaded latency
      // Quality mode interleaves tests: 100kB↓, 100kB↑, 1MB↓, 1MB↑, etc.
      const allDownloadSamples: any[] = [];
      const allUploadSamples: any[] = [];
      const downloadTestsBySize: any[] = [];
      const uploadTestsBySize: any[] = [];
      const testStart = performance.now();

      // Get the test configurations
      const downloadTests = config.downloadTests!;
      const uploadTests = config.uploadTests!;
      const maxTests = Math.max(downloadTests.length, uploadTests.length);

      for (let i = 0; i < maxTests; i++) {
        if (this.stopRequested) break;

        // Download test for this size
        if (i < downloadTests.length) {
          const test = downloadTests[i];
          this.eventEmitter.emit('progress', {
            type: 'progress',
            testMode: 'quality',
            currentPhase: `Measuring ${test.label} download`,
            percentage: 25 + (i / maxTests) * 20
          });

          // Start loaded latency measurement for download
          latencyTest.startLoadedLatencyMeasurement('download');

          const samples = await bandwidthTest.measureDownloadSize(test, testStart);
          allDownloadSamples.push(...samples);

          if (samples.length > 0) {
            const bandwidths = samples.map(s => s.bandwidth);
            const stats = calculateStats(bandwidths);
            downloadTestsBySize.push({
              size: test.size,
              label: test.label,
              samples,
              stats
            });

            // Emit progressive testsBySize update
            this.eventEmitter.emit('testSizeComplete', {
              type: 'testSizeComplete',
              direction: 'download',
              testsBySize: [...downloadTestsBySize]  // Send copy
            });

            // Check if we should stop early
            if (samples[samples.length - 1].duration >= config.bandwidthFinishDuration!) {
              break;
            }
          }
        }

        // Upload test for this size
        if (i < uploadTests.length) {
          const test = uploadTests[i];
          this.eventEmitter.emit('progress', {
            type: 'progress',
            testMode: 'quality',
            currentPhase: `Measuring ${test.label} upload`,
            percentage: 45 + (i / maxTests) * 20
          });

          // Start loaded latency measurement for upload
          latencyTest.startLoadedLatencyMeasurement('upload');

          const samples = await bandwidthTest.measureUploadSize(test, testStart);
          allUploadSamples.push(...samples);

          if (samples.length > 0) {
            const bandwidths = samples.map(s => s.bandwidth);
            const stats = calculateStats(bandwidths);
            uploadTestsBySize.push({
              size: test.size,
              label: test.label,
              samples,
              stats
            });

            // Emit progressive testsBySize update
            this.eventEmitter.emit('testSizeComplete', {
              type: 'testSizeComplete',
              direction: 'upload',
              testsBySize: [...uploadTestsBySize]  // Send copy
            });

            // Check if we should stop early
            if (samples[samples.length - 1].duration >= config.bandwidthFinishDuration!) {
              break;
            }
          }
        }
      }

      // Stop loaded latency measurement and await final in-flight sample
      const { downloadLatency, uploadLatency } = await latencyTest.stopLoadedLatencyMeasurement();

      // Emit latency updates with all samples
      this.eventEmitter.emit('latencyUpdate', {
        type: 'latencyUpdate',
        idleLatency,
        downloadLatency,
        uploadLatency
      });

      // Build download/upload results
      const downloadBandwidths = allDownloadSamples.map((s: any) => s.bandwidth);
      const uploadBandwidths = allUploadSamples.map((s: any) => s.bandwidth);
      const downloadStats = calculateStats(downloadBandwidths);
      const uploadStats = calculateStats(uploadBandwidths);

      const download = {
        bandwidth: downloadStats.p90,
        bandwidthMbps: downloadStats.p90 / 1_000_000,
        stats: downloadStats,
        samples: allDownloadSamples,
        testsBySize: downloadTestsBySize
      };

      const upload = {
        bandwidth: uploadStats.p90,
        bandwidthMbps: uploadStats.p90 / 1_000_000,
        stats: uploadStats,
        samples: allUploadSamples,
        testsBySize: uploadTestsBySize
      };

      // 3. Measure packet loss
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'quality',
        currentPhase: 'Measuring packet loss',
        percentage: 75
      });
      const packetLoss = await packetLossTest.measure();

      // Calculate bufferbloat
      let bufferbloat = 0;
      if (downloadLatency && uploadLatency) {
        const loadedMedian = (downloadLatency.median + uploadLatency.median) / 2;
        bufferbloat = Math.max(0, loadedMedian - idleLatency.median);
      }

      // Calculate quality score (simplified)
      let qualityScore = 100;
      if (idleLatency.median > 100) qualityScore -= 20;
      if (bufferbloat > 50) qualityScore -= 30;
      if (packetLoss.lossPercent > 1) qualityScore -= 25;
      if (download.bandwidthMbps < 10) qualityScore -= 25;
      qualityScore = Math.max(0, qualityScore);

      // Calculate activity ratings
      const activityRatings = this.calculateActivityRatings(
        download.bandwidthMbps,
        idleLatency.median,
        packetLoss.lossPercent,
        idleLatency.stats.stddev || 0
      );

      // Build results
      const results: QualityResults = {
        download,
        upload,
        idleLatency,
        downloadLatency: downloadLatency || undefined,
        uploadLatency: uploadLatency || undefined,
        packetLoss,
        bufferbloat,
        qualityScore,
        activityRatings
      };

      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'quality',
        currentPhase: 'Complete',
        percentage: 100
      });

      this.eventEmitter.emit('complete', {
        type: 'complete',
        testMode: 'quality',
        results
      });

      // Clean up
      latencyTest.close();
      this.running = false;

      return results;

    } catch (error) {
      this.running = false;
      this.eventEmitter.emit('error', {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'Quality mode test'
      });
      throw error;
    }
  }

  /**
   * Run speed mode test (Ookla-style)
   * @returns Promise with speed test results
   */
  async runSpeedTest(): Promise<SpeedResults> {
    this.stopRequested = false;
    this.running = true;
    const config = mergeConfig(this.config, 'speed');
    const server = this.serverConfig.getServer();
    const iceServers = convertToRTCIceServers(server);

    this.eventEmitter.emit('progress', {
      type: 'progress',
      testMode: 'speed',
      currentPhase: 'Starting speed test',
      percentage: 0
    });

    const bandwidthTest = new BandwidthTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        downloadTests: config.downloadTests!,
        uploadTests: config.uploadTests!,
        bandwidthFinishDuration: config.bandwidthFinishDuration!
      },
      this.eventEmitter
    );

    const latencyTest = new LatencyTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        iceServers,
        idleLatencyCount: config.idleLatencyCount!,
        idleLatencyInterval: config.idleLatencyInterval!,
        loadedLatencyInterval: config.loadedLatencyInterval!
      },
      this.eventEmitter
    );

    const packetLossTest = new PacketLossTest(
      {
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        authToken: config.authToken,
        iceServers,
        packetLossCount: config.packetLossCount!,
        packetLossDuration: config.packetLossDuration!
      },
      this.eventEmitter
    );

    try {
      // 1. Measure idle latency
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'speed',
        currentPhase: 'Measuring idle latency',
        percentage: 10
      });
      const idleLatency = await latencyTest.measureIdleLatency();

      // 2. Download speed test
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'speed',
        currentPhase: 'Measuring download speed',
        percentage: 30
      });
      const download = await bandwidthTest.measureDownload();
      // For speed mode, use max instead of p90
      download.bandwidth = download.stats.max;
      download.bandwidthMbps = download.stats.max / 1_000_000;

      // 3. Upload speed test — parallel connections (Ookla-style)
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'speed',
        currentPhase: 'Measuring upload speed',
        percentage: 60
      });
      const upload = await bandwidthTest.measureUploadParallel(
        config.speedTestMinConnections!,
        config.speedTestDuration!,
        config.speedTestChunkSize!
      );

      // 4. Measure packet loss
      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'speed',
        currentPhase: 'Measuring packet loss',
        percentage: 85
      });
      const packetLoss = await packetLossTest.measure();

      const results: SpeedResults = {
        download,
        upload,
        idleLatency,
        packetLoss
      };

      this.eventEmitter.emit('progress', {
        type: 'progress',
        testMode: 'speed',
        currentPhase: 'Complete',
        percentage: 100
      });

      this.eventEmitter.emit('complete', {
        type: 'complete',
        testMode: 'speed',
        results
      });

      // Clean up
      latencyTest.close();
      this.running = false;

      return results;

    } catch (error) {
      this.running = false;
      this.eventEmitter.emit('error', {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'Speed mode test'
      });
      throw error;
    }
  }

  /**
   * Run application-specific tests
   * @returns Promise with application test results
   */
  async runApplicationTest(): Promise<ApplicationResults> {
    throw new Error('Application test mode is not yet implemented. Use runQualityTest() or runSpeedTest() instead.');
  }

  /**
   * Set the server to use for testing
   * @param server - Server configuration
   */
  setServer(server: ServerInfo): void {
    this.serverConfig.setServer(server);
  }

  /**
   * Get the current server
   */
  getServer(): ServerInfo {
    return this.serverConfig.getServer();
  }

  /**
   * Auto-discover and set the best server
   * @param registryUrl - URL to server registry JSON
   */
  async discoverBestServer(registryUrl: string): Promise<ServerInfo> {
    const registry = await this.serverConfig.loadRegistry(registryUrl);
    const bestServer = await this.serverConfig.discoverBestServer(registry);
    this.serverConfig.setServer(bestServer);
    return bestServer;
  }

  /**
   * Register an event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unregister an event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Request all running tests to stop gracefully
   */
  stop(): void {
    this.stopRequested = true;
  }

  /**
   * Check if tests are currently running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Calculate activity ratings based on network metrics
   * @private
   */
  private calculateActivityRatings(
    downloadMbps: number,
    latency: number,
    packetLossPercent: number,
    jitter: number
  ): { videoStreaming: 'Good' | 'Fair' | 'Poor'; gaming: 'Good' | 'Fair' | 'Poor'; videoChat: 'Good' | 'Fair' | 'Poor' } {
    // Video Streaming - needs good download and reasonable latency
    let videoStreaming: 'Good' | 'Fair' | 'Poor' = 'Poor';
    if (downloadMbps > 25 && latency < 100) {
      videoStreaming = 'Good';
    } else if (downloadMbps > 10 && latency < 200) {
      videoStreaming = 'Fair';
    }

    // Gaming - needs low latency, low jitter, low packet loss
    let gaming: 'Good' | 'Fair' | 'Poor' = 'Poor';
    if (latency < 50 && jitter < 10 && packetLossPercent < 1) {
      gaming = 'Good';
    } else if (latency < 100 && jitter < 20 && packetLossPercent < 3) {
      gaming = 'Fair';
    }

    // Video Chat - needs moderate download, reasonable latency, low packet loss
    let videoChat: 'Good' | 'Fair' | 'Poor' = 'Poor';
    if (downloadMbps > 5 && latency < 150 && packetLossPercent < 2) {
      videoChat = 'Good';
    } else if (downloadMbps > 2 && latency < 300) {
      videoChat = 'Fair';
    }

    return { videoStreaming, gaming, videoChat };
  }

  // ============================================================
  // NEW TOOLKIT API
  // ============================================================

  /**
   * Execute a test plan (NEW TOOLKIT API)
   * @param plan - Test plan to execute
   * @returns Promise with execution result
   */
  async executeTestPlan(plan: TestPlan): Promise<ExecutionResult> {
    // Clear previous metrics
    this.metricCollector.clear();

    // Execute the plan
    const result = await this.testRunner.execute(plan);

    // Notify observers of completion
    this.metricObservable.notifyComplete();

    return result;
  }

  /**
   * Subscribe to metrics (NEW TOOLKIT API)
   * @param observer - Observer to subscribe
   * @returns Unsubscribe function
   */
  subscribe(observer: MetricObserver): () => void {
    return this.metricObservable.subscribe(observer);
  }

  /**
   * Get all collected metrics (NEW TOOLKIT API)
   * @returns Array of raw metrics
   */
  getMetrics(): RawMetric[] {
    return this.metricCollector.getMetrics();
  }

  /**
   * Get the test runner instance (NEW TOOLKIT API)
   * @returns TestRunner instance
   */
  getTestRunner(): TestRunner {
    return this.testRunner;
  }

  /**
   * Get the metric collector instance (NEW TOOLKIT API)
   * @returns MetricCollector instance
   */
  getMetricCollector(): MetricCollector {
    return this.metricCollector;
  }

  /**
   * Stop execution of current test plan (NEW TOOLKIT API)
   */
  stopTestPlan(): void {
    this.testRunner.stop();
  }
}
