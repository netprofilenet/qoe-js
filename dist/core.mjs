class EventEmitter {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Register an event listener
   * @param event - Event name
   * @param callback - Callback function to invoke when event is emitted
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Unregister an event listener
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  /**
   * Emit an event with data
   * @param event - Event name
   * @param data - Data to pass to event listeners
   *
   * CRITICAL: Uses queueMicrotask to defer observer callbacks to prevent
   * blocking the test execution. Observers run asynchronously so they don't
   * slow down bandwidth measurements.
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      queueMicrotask(() => {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (error) {
            console.error(`Error in event listener for '${event}':`, error);
          }
        });
      });
    }
  }
  /**
   * Register a one-time event listener
   * @param event - Event name
   * @param callback - Callback function to invoke once
   */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name (if not provided, removes all listeners)
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  /**
   * Get the number of listeners for an event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(event) {
    const callbacks = this.listeners.get(event);
    return callbacks ? callbacks.size : 0;
  }
}
class ServerConfig {
  constructor() {
    this.currentServer = null;
  }
  /**
   * Set the current server
   */
  setServer(server) {
    this.currentServer = server;
  }
  /**
   * Get the current server
   */
  getServer() {
    if (!this.currentServer) {
      return {
        id: "local",
        name: "Local Server",
        country: "Local",
        httpUrl: `${window.location.protocol}//${window.location.host}`,
        webrtcSignalingUrl: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/signaling`,
        stunServers: ["stun:stun.l.google.com:19302"],
        turnServers: [],
        enabled: true
      };
    }
    return this.currentServer;
  }
  /**
   * Load server registry from URL
   */
  async loadRegistry(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load server registry: ${response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Discover the best server based on latency
   */
  async discoverBestServer(registry) {
    const enabledServers = registry.servers.filter((s) => s.enabled);
    if (enabledServers.length === 0) {
      throw new Error("No enabled servers in registry");
    }
    const latencies = await Promise.all(
      enabledServers.map((server) => this.measureServerLatency(server))
    );
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
  async measureServerLatency(server) {
    const samples = [];
    const sampleCount = 3;
    for (let i = 0; i < sampleCount; i++) {
      const start = performance.now();
      try {
        await fetch(`${server.httpUrl}/__latency`, {
          method: "GET",
          signal: AbortSignal.timeout(5e3)
        });
        const latency = performance.now() - start;
        samples.push(latency);
      } catch (err) {
        samples.push(1e4);
      }
    }
    const sorted = samples.sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
}
const QUALITY_MODE_DOWNLOAD_TESTS = [
  { size: 1e5, samples: 10, label: "100kB" },
  { size: 1e6, samples: 8, label: "1MB" },
  { size: 1e7, samples: 6, label: "10MB" },
  { size: 25e6, samples: 4, label: "25MB" },
  { size: 1e8, samples: 3, label: "100MB" }
];
const QUALITY_MODE_UPLOAD_TESTS = [
  { size: 1e5, samples: 10, label: "100kB" },
  { size: 1e6, samples: 8, label: "1MB" },
  { size: 1e7, samples: 6, label: "10MB" },
  { size: 25e6, samples: 4, label: "25MB" },
  { size: 5e7, samples: 3, label: "50MB" }
];
const SPEED_MODE_DOWNLOAD_TESTS = [
  { size: 1e7, samples: 1, label: "10MB" },
  { size: 25e6, samples: 1, label: "25MB" },
  { size: 1e8, samples: 1, label: "100MB" },
  { size: 25e7, samples: 1, label: "250MB" }
];
const SPEED_MODE_UPLOAD_TESTS = [
  { size: 1e7, samples: 1, label: "10MB" },
  { size: 25e6, samples: 1, label: "25MB" },
  { size: 1e8, samples: 1, label: "100MB" },
  { size: 15e7, samples: 1, label: "150MB" }
];
const BANDWIDTH_FINISH_DURATION = 1e3;
const IDLE_LATENCY_COUNT = 20;
const IDLE_LATENCY_INTERVAL = 100;
const LOADED_LATENCY_INTERVAL = 400;
const PACKET_LOSS_COUNT = 1e3;
const PACKET_LOSS_DURATION = 1e4;
const SPEED_TEST_DURATION = 15e3;
const SPEED_TEST_MIN_CONNECTIONS = 10;
const SPEED_TEST_CHUNK_SIZE = 25e6;
const QUALITY_BANDWIDTH_PERCENTILE = 90;
const SPEED_BANDWIDTH_PERCENTILE = 100;
const LATENCY_PERCENTILE = 50;
const STREAMING_BITRATES = [5, 10, 25, 50, 100];
const GAMING_LATENCY_COUNT = 200;
const GAMING_DURATION = 2e4;
const CONFERENCE_DURATION = 3e4;
const CONFERENCE_BURST_INTERVAL = 10;
const CONFERENCE_BURST_PACKETS = 52;
const CONFERENCE_TARGET_BITRATE = 2e6;
function getQualityModeConfig() {
  return {
    downloadTests: QUALITY_MODE_DOWNLOAD_TESTS,
    uploadTests: QUALITY_MODE_UPLOAD_TESTS,
    bandwidthFinishDuration: BANDWIDTH_FINISH_DURATION,
    speedTestDuration: 0,
    // Not used in quality mode
    speedTestMinConnections: 1,
    // Not used in quality mode
    speedTestChunkSize: 0,
    // Not used in quality mode
    idleLatencyCount: IDLE_LATENCY_COUNT,
    idleLatencyInterval: IDLE_LATENCY_INTERVAL,
    loadedLatencyInterval: LOADED_LATENCY_INTERVAL,
    packetLossCount: PACKET_LOSS_COUNT,
    packetLossDuration: PACKET_LOSS_DURATION
  };
}
function getSpeedModeConfig() {
  return {
    downloadTests: SPEED_MODE_DOWNLOAD_TESTS,
    uploadTests: SPEED_MODE_UPLOAD_TESTS,
    bandwidthFinishDuration: BANDWIDTH_FINISH_DURATION * 5,
    // Longer for speed mode
    speedTestDuration: SPEED_TEST_DURATION,
    speedTestMinConnections: SPEED_TEST_MIN_CONNECTIONS,
    speedTestChunkSize: SPEED_TEST_CHUNK_SIZE,
    idleLatencyCount: 10,
    // Fewer samples for speed mode
    idleLatencyInterval: IDLE_LATENCY_INTERVAL,
    loadedLatencyInterval: 500,
    // Not typically used in speed mode
    packetLossCount: 500,
    // Fewer packets for speed mode
    packetLossDuration: 1e4
  };
}
function mergeConfig(userConfig = {}, mode = "quality") {
  const defaults = mode === "speed" ? getSpeedModeConfig() : getQualityModeConfig();
  return {
    mode,
    authToken: userConfig.authToken,
    downloadTests: userConfig.downloadTests || defaults.downloadTests,
    uploadTests: userConfig.uploadTests || defaults.uploadTests,
    bandwidthFinishDuration: userConfig.bandwidthFinishDuration ?? defaults.bandwidthFinishDuration,
    speedTestDuration: userConfig.speedTestDuration ?? defaults.speedTestDuration,
    speedTestMinConnections: userConfig.speedTestMinConnections ?? defaults.speedTestMinConnections,
    speedTestChunkSize: userConfig.speedTestChunkSize ?? defaults.speedTestChunkSize,
    idleLatencyCount: userConfig.idleLatencyCount ?? defaults.idleLatencyCount,
    idleLatencyInterval: userConfig.idleLatencyInterval ?? defaults.idleLatencyInterval,
    loadedLatencyInterval: userConfig.loadedLatencyInterval ?? defaults.loadedLatencyInterval,
    packetLossCount: userConfig.packetLossCount ?? defaults.packetLossCount,
    packetLossDuration: userConfig.packetLossDuration ?? defaults.packetLossDuration,
    appTests: userConfig.appTests,
    serverConfig: userConfig.serverConfig
  };
}
function convertToRTCIceServers(server) {
  const iceServers = [];
  server.stunServers.forEach((url) => {
    iceServers.push({ urls: url });
  });
  server.turnServers.forEach((turn) => {
    iceServers.push({
      urls: turn.urls,
      username: turn.username,
      credential: turn.credential
    });
  });
  return iceServers;
}
function generateRandomData(size) {
  const buffer = new ArrayBuffer(size);
  const data = new Uint8Array(buffer);
  const maxChunk = 65536;
  for (let i = 0; i < size; i += maxChunk) {
    const chunkSize = Math.min(maxChunk, size - i);
    const chunk = new Uint8Array(chunkSize);
    crypto.getRandomValues(chunk);
    data.set(chunk, i);
  }
  return data;
}
function calculateMedian(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function calculatePercentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(Math.ceil(p / 100 * sorted.length), sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
function calculateStats(values) {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stddev: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    median: calculateMedian(values),
    stddev,
    p10: calculatePercentile(values, 10),
    p25: calculatePercentile(values, 25),
    p50: calculatePercentile(values, 50),
    p75: calculatePercentile(values, 75),
    p90: calculatePercentile(values, 90)
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function msToMicroseconds(ms) {
  return Math.floor(ms * 1e3);
}
function microsecondsToMs(us) {
  return us / 1e3;
}
function requestId() {
  return Math.random().toString(36).slice(2, 10);
}
function getUploadDuration(url) {
  try {
    const entries = performance.getEntriesByName(url, "resource");
    if (entries.length === 0) return null;
    const entry = entries[entries.length - 1];
    if (entry.requestStart > 0 && entry.responseStart > 0) {
      const duration = entry.responseStart - entry.requestStart;
      if (duration > 0) return duration;
    }
  } catch {
  }
  return null;
}
function clearResourceTimings() {
  try {
    performance.clearResourceTimings();
  } catch {
  }
}
class BandwidthTest {
  constructor(config, eventEmitter) {
    this.stopRequested = false;
    this.config = config;
    this.eventEmitter = eventEmitter;
  }
  get authHeaders() {
    return this.config.authToken ? { "Authorization": `Bearer ${this.config.authToken}` } : {};
  }
  /**
   * Request the test to stop gracefully
   */
  stop() {
    this.stopRequested = true;
  }
  /**
   * Reset stop flag (call before starting a new test)
   */
  resetStop() {
    this.stopRequested = false;
  }
  /**
   * Measure download bandwidth for a single test size
   * @param test - Test configuration (size, label, samples)
   * @param testStart - Reference timestamp for relative timing
   * @returns Array of bandwidth samples for this size
   */
  async measureDownloadSize(test, testStart) {
    const testSamples = [];
    for (let i = 0; i < test.samples; i++) {
      if (this.stopRequested) break;
      try {
        const start = performance.now();
        const response = await fetch(`${this.config.apiBaseUrl}/__down?bytes=${test.size}`, {
          headers: this.authHeaders
        });
        const buffer = await response.arrayBuffer();
        const totalBytes = buffer.byteLength;
        const adjustedDuration = Math.max(performance.now() - start, 1);
        const bandwidth = totalBytes * 8 / (adjustedDuration / 1e3);
        const timestamp = performance.now() - testStart;
        if (i === 0) continue;
        const sample = {
          timestamp,
          bandwidth,
          size: totalBytes,
          duration: adjustedDuration
        };
        testSamples.push(sample);
        this.eventEmitter.emit("sample", {
          type: "sample",
          sampleType: "download",
          sample,
          timestamp
        });
        if (adjustedDuration >= this.config.bandwidthFinishDuration) {
          break;
        }
      } catch (err) {
        this.eventEmitter.emit("error", {
          type: "error",
          error: err instanceof Error ? err : new Error(String(err)),
          context: "Download bandwidth test"
        });
      }
    }
    return testSamples;
  }
  /**
   * Measure upload bandwidth for a single test size
   * @param test - Test configuration (size, label, samples)
   * @param testStart - Reference timestamp for relative timing
   * @returns Array of bandwidth samples for this size
   */
  async measureUploadSize(test, testStart) {
    const testSamples = [];
    const sharedBuffer = generateRandomData(test.size);
    for (let i = 0; i < test.samples; i++) {
      if (this.stopRequested) break;
      const data = sharedBuffer.subarray(0, test.size);
      try {
        const rid = requestId();
        const fullUrl = `${this.config.apiBaseUrl}/__up?_rid=${rid}`;
        const fallbackStart = performance.now();
        const response = await fetch(fullUrl, {
          method: "POST",
          body: data,
          headers: { "Content-Type": "application/octet-stream", ...this.authHeaders }
        });
        await response.text();
        const fallbackDuration = performance.now() - fallbackStart;
        const rtDuration = getUploadDuration(fullUrl);
        const adjustedDuration = Math.max(rtDuration ?? fallbackDuration, 1);
        clearResourceTimings();
        const bandwidth = test.size * 8 / (adjustedDuration / 1e3);
        const timestamp = performance.now() - testStart;
        if (i === 0) continue;
        const sample = {
          timestamp,
          bandwidth,
          size: test.size,
          duration: adjustedDuration
        };
        testSamples.push(sample);
        this.eventEmitter.emit("sample", {
          type: "sample",
          sampleType: "upload",
          sample,
          timestamp
        });
        if (adjustedDuration >= this.config.bandwidthFinishDuration) {
          break;
        }
      } catch (err) {
        this.eventEmitter.emit("error", {
          type: "error",
          error: err instanceof Error ? err : new Error(String(err)),
          context: "Upload bandwidth test"
        });
      }
    }
    return testSamples;
  }
  /**
   * Measure download bandwidth across all configured test sizes
   * @returns BandwidthResult with p90 bandwidth and all samples
   */
  async measureDownload() {
    this.resetStop();
    const allSamples = [];
    const testsBySize = [];
    const testStart = performance.now();
    for (const test of this.config.downloadTests) {
      if (this.stopRequested) break;
      const testSamples = [];
      for (let i = 0; i < test.samples; i++) {
        if (this.stopRequested) break;
        try {
          const start = performance.now();
          const response = await fetch(`${this.config.apiBaseUrl}/__down?bytes=${test.size}`, {
            headers: this.authHeaders
          });
          const buffer = await response.arrayBuffer();
          const totalBytes = buffer.byteLength;
          const adjustedDuration = Math.max(performance.now() - start, 1);
          const bandwidth = totalBytes * 8 / (adjustedDuration / 1e3);
          const timestamp = performance.now() - testStart;
          if (i === 0) continue;
          const sample = {
            timestamp,
            bandwidth,
            size: totalBytes,
            duration: adjustedDuration
          };
          allSamples.push(sample);
          testSamples.push(sample);
          this.eventEmitter.emit("sample", {
            type: "sample",
            sampleType: "download",
            sample,
            timestamp
          });
          if (adjustedDuration >= this.config.bandwidthFinishDuration) {
            break;
          }
        } catch (err) {
          this.eventEmitter.emit("error", {
            type: "error",
            error: err instanceof Error ? err : new Error(String(err)),
            context: "Download bandwidth test"
          });
        }
      }
      if (testSamples.length > 0) {
        testsBySize.push({
          size: test.size,
          label: test.label,
          samples: testSamples,
          stats: calculateStats(testSamples.map((s) => s.bandwidth))
        });
      }
      if (this.stopRequested || testSamples.length > 0 && testSamples[testSamples.length - 1].duration >= this.config.bandwidthFinishDuration) {
        break;
      }
    }
    const bandwidths = allSamples.map((s) => s.bandwidth);
    const stats = calculateStats(bandwidths);
    return {
      bandwidth: stats.p90,
      // Use p90 for quality mode
      bandwidthMbps: stats.p90 / 1e6,
      stats,
      samples: allSamples,
      testsBySize
    };
  }
  /**
   * Measure upload bandwidth across all configured test sizes
   * @returns BandwidthResult with p90 bandwidth and all samples
   */
  async measureUpload() {
    this.resetStop();
    const allSamples = [];
    const testsBySize = [];
    const testStart = performance.now();
    for (const test of this.config.uploadTests) {
      if (this.stopRequested) break;
      const testSamples = [];
      const sharedBuffer = generateRandomData(test.size);
      for (let i = 0; i < test.samples; i++) {
        if (this.stopRequested) break;
        const data = sharedBuffer.subarray(0, test.size);
        try {
          const rid = requestId();
          const fullUrl = `${this.config.apiBaseUrl}/__up?_rid=${rid}`;
          const fallbackStart = performance.now();
          const response = await fetch(fullUrl, {
            method: "POST",
            body: data,
            headers: { "Content-Type": "application/octet-stream", ...this.authHeaders }
          });
          await response.text();
          const fallbackDuration = performance.now() - fallbackStart;
          const rtDuration = getUploadDuration(fullUrl);
          const adjustedDuration = Math.max(rtDuration ?? fallbackDuration, 1);
          clearResourceTimings();
          const bandwidth = test.size * 8 / (adjustedDuration / 1e3);
          const timestamp = performance.now() - testStart;
          if (i === 0) continue;
          const sample = {
            timestamp,
            bandwidth,
            size: test.size,
            duration: adjustedDuration
          };
          allSamples.push(sample);
          testSamples.push(sample);
          this.eventEmitter.emit("sample", {
            type: "sample",
            sampleType: "upload",
            sample,
            timestamp
          });
          if (adjustedDuration >= this.config.bandwidthFinishDuration) {
            break;
          }
        } catch (err) {
          this.eventEmitter.emit("error", {
            type: "error",
            error: err instanceof Error ? err : new Error(String(err)),
            context: "Upload bandwidth test"
          });
        }
      }
      if (testSamples.length > 0) {
        testsBySize.push({
          size: test.size,
          label: test.label,
          samples: testSamples,
          stats: calculateStats(testSamples.map((s) => s.bandwidth))
        });
      }
      if (this.stopRequested || testSamples.length > 0 && testSamples[testSamples.length - 1].duration >= this.config.bandwidthFinishDuration) {
        break;
      }
    }
    const bandwidths = allSamples.map((s) => s.bandwidth);
    const stats = calculateStats(bandwidths);
    return {
      bandwidth: stats.p90,
      // Use p90 for quality mode
      bandwidthMbps: stats.p90 / 1e6,
      stats,
      samples: allSamples,
      testsBySize
    };
  }
  /**
   * Measure upload bandwidth using N parallel connections (speed mode / Ookla-style)
   *
   * Each worker continuously sends requests for the full durationMs window.
   * Aggregate throughput = total bytes across all connections / total wall-clock time.
   *
   * Note: no server timing correction for upload — the server drain time completely
   * overlaps with the client transfer time (TCP flow control), so subtracting it
   * would undercount transfer duration and inflate results.
   */
  async measureUploadParallel(concurrency, durationMs, chunkSize) {
    this.resetStop();
    const allSamples = [];
    const testStart = performance.now();
    const endTime = testStart + durationMs;
    const sharedBuffer = generateRandomData(chunkSize);
    let measurementStartTime = 0;
    let totalBytesTransferred = 0;
    const worker = async () => {
      let isWarmup = true;
      while (performance.now() < endTime && !this.stopRequested) {
        const data = sharedBuffer.subarray(0, chunkSize);
        const start = performance.now();
        try {
          const rid = requestId();
          const fullUrl = `${this.config.apiBaseUrl}/__up?_rid=${rid}`;
          const response = await fetch(fullUrl, {
            method: "POST",
            body: data,
            headers: { "Content-Type": "application/octet-stream", ...this.authHeaders }
          });
          await response.text();
          const rtDuration = getUploadDuration(fullUrl);
          const duration = rtDuration ?? performance.now() - start;
          clearResourceTimings();
          if (isWarmup) {
            isWarmup = false;
            if (measurementStartTime === 0) measurementStartTime = performance.now();
            continue;
          }
          totalBytesTransferred += chunkSize;
          const adjustedDuration = Math.max(duration, 1);
          const bandwidth = chunkSize * 8 / (adjustedDuration / 1e3);
          const timestamp = performance.now() - testStart;
          const sample = {
            timestamp,
            bandwidth,
            size: chunkSize,
            duration: adjustedDuration
          };
          allSamples.push(sample);
          this.eventEmitter.emit("sample", {
            type: "sample",
            sampleType: "upload",
            sample,
            timestamp
          });
        } catch (err) {
          this.eventEmitter.emit("error", {
            type: "error",
            error: err instanceof Error ? err : new Error(String(err)),
            context: "Upload bandwidth test (parallel)"
          });
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    const measureDuration = performance.now() - (measurementStartTime || testStart);
    const aggregateBandwidth = totalBytesTransferred > 0 ? totalBytesTransferred * 8 / (measureDuration / 1e3) : 0;
    const perConnectionBandwidths = allSamples.map((s) => s.bandwidth);
    const stats = calculateStats(perConnectionBandwidths.length > 0 ? perConnectionBandwidths : [aggregateBandwidth]);
    const label = `${Math.round(chunkSize / 1e6)}MB`;
    return {
      bandwidth: aggregateBandwidth,
      bandwidthMbps: aggregateBandwidth / 1e6,
      stats,
      samples: allSamples,
      testsBySize: allSamples.length > 0 ? [{
        size: chunkSize,
        label,
        samples: allSamples,
        stats
      }] : []
    };
  }
}
class WebRTCConnection {
  /**
   * Create a new WebRTC connection
   * @param signalingUrl - WebSocket signaling server URL (ws:// or wss://)
   * @param iceServers - Array of STUN/TURN servers
   * @param eventEmitter - Optional event emitter for debug events
   * @param authToken - Optional bearer token for authenticated servers
   */
  constructor(signalingUrl, iceServers, eventEmitter, authToken) {
    this.pc = null;
    this.dataChannel = null;
    this.ws = null;
    this.connected = false;
    this.messageHandlers = /* @__PURE__ */ new Map();
    this.sequence = 0;
    this.signalingUrl = signalingUrl;
    this.iceServers = iceServers;
    this.eventEmitter = eventEmitter || new EventEmitter();
    this.authToken = authToken;
  }
  /**
   * Establish WebRTC connection via WebSocket signaling
   * @returns Promise that resolves when connection is established
   */
  async connect() {
    if (this.connected) return;
    return new Promise((resolve, reject) => {
      const wsUrl = this.authToken ? `${this.signalingUrl}?token=${encodeURIComponent(this.authToken)}` : this.signalingUrl;
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = async () => {
        this.eventEmitter.emit("debug", { type: "websocket", message: "WebSocket connected" });
        this.pc = new RTCPeerConnection({
          iceServers: this.iceServers
        });
        this.pc.onicecandidate = (event) => {
          if (event.candidate && this.ws) {
            this.eventEmitter.emit("debug", { type: "ice", message: "Sending ICE candidate" });
            this.ws.send(JSON.stringify({
              type: "ice",
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            }));
          }
        };
        this.pc.onconnectionstatechange = () => {
          if (this.pc) {
            this.eventEmitter.emit("debug", {
              type: "connection",
              message: `Peer connection state: ${this.pc.connectionState}`
            });
            if (this.pc.connectionState === "failed") {
              reject(new Error("Peer connection failed"));
            }
          }
        };
        this.dataChannel = this.pc.createDataChannel("latency", {
          ordered: false,
          maxRetransmits: 0
        });
        this.dataChannel.onopen = () => {
          this.eventEmitter.emit("debug", { type: "datachannel", message: "Data channel opened - WebRTC ready!" });
          this.connected = true;
          resolve();
        };
        this.dataChannel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        this.dataChannel.onerror = (error) => {
          this.eventEmitter.emit("debug", { type: "error", message: "Data channel error", error });
          reject(error);
        };
        this.dataChannel.onclose = () => {
          this.eventEmitter.emit("debug", { type: "datachannel", message: "Data channel closed" });
          this.connected = false;
        };
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.eventEmitter.emit("debug", { type: "signaling", message: "Sending WebRTC offer" });
        this.ws.send(JSON.stringify({
          type: "offer",
          sdp: offer.sdp
        }));
      };
      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "answer") {
          this.eventEmitter.emit("debug", { type: "signaling", message: "Received answer from server" });
          if (this.pc) {
            await this.pc.setRemoteDescription({
              type: "answer",
              sdp: msg.sdp
            });
          }
        } else if (msg.type === "ice") {
          this.eventEmitter.emit("debug", { type: "ice", message: "Received ICE candidate from server" });
          if (msg.candidate && this.pc) {
            try {
              const candidateInit = { candidate: msg.candidate };
              if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
              if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
              await this.pc.addIceCandidate(candidateInit);
            } catch (err) {
              this.eventEmitter.emit("debug", { type: "error", message: "Error adding ICE candidate", error: err });
            }
          }
        } else if (msg.type === "error") {
          this.eventEmitter.emit("debug", { type: "error", message: `Signaling error: ${msg.message}` });
          reject(new Error(msg.message));
        }
      };
      this.ws.onerror = (error) => {
        this.eventEmitter.emit("debug", { type: "error", message: "WebSocket error", error });
        reject(error);
      };
      this.ws.onclose = () => {
        this.eventEmitter.emit("debug", { type: "websocket", message: "WebSocket closed" });
        if (!this.connected) {
          reject(new Error("WebSocket closed before connection established"));
        }
      };
      setTimeout(() => {
        if (!this.connected) {
          this.eventEmitter.emit("debug", { type: "error", message: "WebRTC connection timeout" });
          reject(new Error("WebRTC connection timeout"));
        }
      }, 15e3);
    });
  }
  /**
   * Send a latency probe and measure round-trip time
   * @returns Promise with latency measurement result
   */
  async measureLatency() {
    if (!this.connected || !this.dataChannel) {
      throw new Error("WebRTC not connected");
    }
    return new Promise((resolve) => {
      const sequence = this.sequence++;
      const clientTimestamp = performance.now() * 1e3;
      const packet = new ArrayBuffer(48);
      const view = new DataView(packet);
      view.setUint32(0, sequence, true);
      const timestampBigInt = BigInt(Math.floor(clientTimestamp));
      view.setBigUint64(4, timestampBigInt, true);
      const sendTime = performance.now();
      this.dataChannel.send(packet);
      this.messageHandlers.set(sequence, (serverTimestamp) => {
        const receiveTime = performance.now();
        const rtt = receiveTime - sendTime;
        resolve({
          rtt,
          serverTimestamp,
          sequence
        });
      });
      setTimeout(() => {
        if (this.messageHandlers.has(sequence)) {
          this.messageHandlers.delete(sequence);
          resolve({ rtt: -1, serverTimestamp: 0n, sequence });
        }
      }, 2e3);
    });
  }
  /**
   * Handle incoming WebRTC packet
   * @param data - Packet data (ArrayBuffer)
   */
  handleMessage(data) {
    const view = new DataView(data);
    const sequence = view.getUint32(0, true);
    const serverTimestamp = view.getBigUint64(12, true);
    const handler = this.messageHandlers.get(sequence);
    if (handler) {
      handler(serverTimestamp);
      this.messageHandlers.delete(sequence);
    }
  }
  /**
   * Close WebRTC connection and clean up resources
   */
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.messageHandlers.clear();
  }
  /**
   * Check if connection is established
   */
  get isConnected() {
    return this.connected;
  }
}
class LatencyTest {
  constructor(config, eventEmitter) {
    this.webrtcConnection = null;
    this.stopRequested = false;
    this.loadedLatencyWorker = null;
    this.loadedLatencyPromise = null;
    this.testStart = 0;
    this.downloadLatencySamples = [];
    this.uploadLatencySamples = [];
    this.config = config;
    this.eventEmitter = eventEmitter;
  }
  /**
   * Request the test to stop gracefully
   */
  stop() {
    this.stopRequested = true;
    this.loadedLatencyWorker = null;
  }
  /**
   * Measure idle latency (without concurrent data transfer)
   * @returns LatencyResult with median latency and all samples
   */
  async measureIdleLatency() {
    this.stopRequested = false;
    const samples = [];
    this.testStart = performance.now();
    const testStart = this.testStart;
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
      this.eventEmitter.emit("debug", {
        type: "debug",
        message: "Using WebRTC for idle latency measurement"
      });
    } catch (err) {
      this.eventEmitter.emit("debug", {
        type: "debug",
        message: `WebRTC connection failed for idle latency, falling back to HTTP: ${err}`
      });
      useWebRTC = false;
    }
    for (let i = 0; i < this.config.idleLatencyCount; i++) {
      if (this.stopRequested) break;
      try {
        let rtt = null;
        if (useWebRTC && this.webrtcConnection) {
          const result = await this.webrtcConnection.measureLatency();
          rtt = result.rtt < 0 ? null : result.rtt;
        } else {
          const start = performance.now();
          await fetch(`${this.config.apiBaseUrl}/__latency`, {
            headers: this.config.authToken ? { "Authorization": `Bearer ${this.config.authToken}` } : {}
          });
          rtt = performance.now() - start;
        }
        if (rtt !== null) {
          const timestamp = performance.now() - testStart;
          const sample = { timestamp, latency: rtt };
          samples.push(sample);
          this.eventEmitter.emit("sample", {
            type: "sample",
            sampleType: "latency",
            sample,
            timestamp,
            latencyPhase: "idle"
          });
        }
      } catch (err) {
        this.eventEmitter.emit("error", {
          type: "error",
          error: err instanceof Error ? err : new Error(String(err)),
          context: "Idle latency test"
        });
      }
      await sleep(this.config.idleLatencyInterval);
    }
    const latencies = samples.map((s) => s.latency);
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
  async startLoadedLatencyMeasurement(type) {
    if (this.loadedLatencyWorker === type) {
      return;
    }
    const useWebRTC = this.webrtcConnection && this.webrtcConnection.isConnected;
    if (useWebRTC) {
      this.eventEmitter.emit("debug", {
        type: "debug",
        message: `Using WebRTC for loaded latency measurement during ${type}`
      });
    }
    this.loadedLatencyWorker = type;
    const measure = async () => {
      while (this.loadedLatencyWorker === type) {
        try {
          let rtt = null;
          if (useWebRTC && this.webrtcConnection && this.webrtcConnection.isConnected) {
            const result = await this.webrtcConnection.measureLatency();
            rtt = result.rtt < 0 ? null : result.rtt;
          } else {
            const start = performance.now();
            await fetch(`${this.config.apiBaseUrl}/__latency`, {
              headers: this.config.authToken ? { "Authorization": `Bearer ${this.config.authToken}` } : {}
            });
            rtt = performance.now() - start;
          }
          if (rtt !== null) {
            const timestamp = performance.now() - this.testStart;
            const sample = { timestamp, latency: rtt };
            if (type === "download") {
              this.downloadLatencySamples.push(sample);
            } else {
              this.uploadLatencySamples.push(sample);
            }
            this.eventEmitter.emit("sample", {
              type: "sample",
              sampleType: "latency",
              sample,
              timestamp,
              latencyPhase: type === "download" ? "downloadLoaded" : "uploadLoaded"
            });
          }
        } catch (err) {
          this.eventEmitter.emit("error", {
            type: "error",
            error: err instanceof Error ? err : new Error(String(err)),
            context: `Loaded latency measurement (${type})`
          });
        }
        await sleep(this.config.loadedLatencyInterval);
      }
    };
    this.loadedLatencyPromise = measure();
  }
  /**
   * Stop loaded latency measurement and return accumulated results
   * @returns Object with download and upload latency results
   */
  async stopLoadedLatencyMeasurement() {
    this.loadedLatencyWorker = null;
    if (this.loadedLatencyPromise) {
      await this.loadedLatencyPromise;
      this.loadedLatencyPromise = null;
    }
    let downloadLatency = null;
    if (this.downloadLatencySamples.length > 0) {
      const latencies = this.downloadLatencySamples.map((s) => s.latency);
      const stats = calculateStats(latencies);
      downloadLatency = {
        median: stats.median,
        stats,
        samples: this.downloadLatencySamples
      };
    }
    let uploadLatency = null;
    if (this.uploadLatencySamples.length > 0) {
      const latencies = this.uploadLatencySamples.map((s) => s.latency);
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
  close() {
    if (this.webrtcConnection) {
      this.webrtcConnection.close();
      this.webrtcConnection = null;
    }
    this.loadedLatencyWorker = null;
  }
}
function serializeWebRTCPacket(sequence, timestamp) {
  const buffer = new ArrayBuffer(48);
  const view = new DataView(buffer);
  view.setUint32(0, sequence, true);
  const timestampUs = BigInt(Math.floor(timestamp * 1e3));
  view.setBigUint64(4, timestampUs, true);
  view.setBigUint64(12, 0n, true);
  return new Uint8Array(buffer);
}
function deserializeWebRTCPacket(data) {
  if (data.byteLength !== 48) {
    console.error("Invalid packet size:", data.byteLength);
    return null;
  }
  const buffer = data instanceof ArrayBuffer ? data : data.buffer;
  const view = new DataView(buffer);
  return {
    sequence: view.getUint32(0, true),
    clientTimestamp: Number(view.getBigUint64(4, true)),
    serverTimestamp: Number(view.getBigUint64(12, true))
  };
}
class PacketLossTest {
  constructor(config, eventEmitter) {
    this.stopRequested = false;
    this.config = config;
    this.eventEmitter = eventEmitter;
  }
  /**
   * Request the test to stop gracefully
   */
  stop() {
    this.stopRequested = true;
  }
  /**
   * Measure packet loss using unreliable WebRTC DataChannels
   * @returns PacketLossResult with loss ratio and lost packet sequences
   */
  async measure() {
    this.stopRequested = false;
    try {
      const wsUrl = this.config.authToken ? `${this.config.webrtcSignalingUrl}?token=${encodeURIComponent(this.config.authToken)}` : this.config.webrtcSignalingUrl;
      const ws = new WebSocket(wsUrl);
      await new Promise((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("WebSocket connection failed"));
        setTimeout(() => reject(new Error("WebSocket timeout")), 5e3);
      });
      const pc = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });
      const dc = pc.createDataChannel("packet-loss", {
        ordered: false,
        // No ordering
        maxRetransmits: 0
        // No retransmissions (unreliable)
      });
      dc.binaryType = "arraybuffer";
      let dataChannelOpen = false;
      dc.onopen = () => {
        dataChannelOpen = true;
        this.eventEmitter.emit("debug", {
          type: "debug",
          message: "Packet loss DataChannel opened"
        });
      };
      const packetsSent = [];
      const packetsReceived = /* @__PURE__ */ new Set();
      dc.onmessage = (event) => {
        const packet = deserializeWebRTCPacket(event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data);
        if (packet) {
          packetsReceived.add(packet.sequence);
          this.eventEmitter.emit("progress", {
            type: "progress",
            testMode: "quality",
            currentPhase: "Packet Loss Test",
            percentage: Math.round(packetsReceived.size / this.config.packetLossCount * 100),
            currentTest: `Received ${packetsReceived.size}/${packetsSent.length} packets`
          });
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({
        type: "offer",
        sdp: offer.sdp
      }));
      const answer = await new Promise((resolve) => {
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === "answer") {
            resolve(msg);
          } else if (msg.type === "ice") {
            const candidateInit = { candidate: msg.candidate };
            if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
            if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
            if (candidateInit.sdpMid != null || candidateInit.sdpMLineIndex != null) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((err) => {
                this.eventEmitter.emit("debug", {
                  type: "debug",
                  message: `Failed to add ICE candidate: ${err}`
                });
              });
            }
          }
        };
      });
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          }));
        }
      };
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (dataChannelOpen) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 5e3);
      });
      const interval = this.config.packetLossDuration / this.config.packetLossCount;
      for (let i = 0; i < this.config.packetLossCount; i++) {
        if (this.stopRequested) break;
        if (dc.readyState === "open") {
          const binaryPacket = serializeWebRTCPacket(i, performance.now());
          dc.send(binaryPacket);
          packetsSent.push(i);
          this.eventEmitter.emit("progress", {
            type: "progress",
            testMode: "quality",
            currentPhase: "Packet Loss Test",
            percentage: Math.round(i / this.config.packetLossCount * 100),
            currentTest: `Sent ${packetsSent.length}/${this.config.packetLossCount} packets`
          });
        }
        await sleep(interval);
      }
      await sleep(2e3);
      ws.close();
      pc.close();
      const sent = packetsSent.length;
      const received = packetsReceived.size;
      const lossRatio = sent > 0 ? 1 - received / sent : 0;
      const lostSequences = packetsSent.filter((seq) => !packetsReceived.has(seq));
      return {
        sent,
        received,
        lossRatio,
        lossPercent: lossRatio * 100,
        lostSequences
      };
    } catch (err) {
      this.eventEmitter.emit("error", {
        type: "error",
        error: err instanceof Error ? err : new Error(String(err)),
        context: "Packet loss test"
      });
      return {
        sent: 0,
        received: 0,
        lossRatio: 0,
        lossPercent: 0,
        lostSequences: []
      };
    }
  }
}
class OrchestratorClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }
  /**
   * Fetch the list of available test servers from the orchestrator
   */
  async fetchServers() {
    const resp = await fetch(`${this.baseUrl}/api/servers`);
    if (!resp.ok) throw new Error(`Failed to fetch servers: ${resp.status}`);
    const data = await resp.json();
    return data.servers;
  }
  /**
   * Request a test token for a specific server
   */
  async requestTestToken(serverId) {
    const resp = await fetch(`${this.baseUrl}/api/test-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId })
    });
    if (!resp.ok) throw new Error(`Failed to get test token: ${resp.status}`);
    return resp.json();
  }
  /**
   * Submit test results to the orchestrator
   */
  async submitResults(token, results) {
    const resp = await fetch(`${this.baseUrl}/api/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...results, token })
    });
    if (!resp.ok) throw new Error(`Failed to submit results: ${resp.status}`);
  }
  /**
   * Convenience: run a quality test through the orchestrator.
   * Discovers best server (or uses specified), acquires token, runs test, submits results.
   */
  async runQualityTest(serverId) {
    const server = serverId ? (await this.fetchServers()).find((s) => s.id === serverId) : await this.discoverBestServer();
    if (!server) throw new Error(serverId ? `Server not found: ${serverId}` : "No servers available");
    const tokenResp = await this.requestTestToken(server.id);
    const client = new QOEClient({ authToken: tokenResp.token });
    client.setServer(server);
    const results = await client.runQualityTest();
    await this.submitResults(tokenResp.token, {
      serverId: server.id,
      testMode: "quality",
      download: { bandwidthMbps: results.download.bandwidthMbps },
      upload: { bandwidthMbps: results.upload.bandwidthMbps },
      idleLatency: { median: results.idleLatency.median },
      downloadLatency: results.downloadLatency ? { median: results.downloadLatency.median } : void 0,
      uploadLatency: results.uploadLatency ? { median: results.uploadLatency.median } : void 0,
      packetLoss: { lossPercent: results.packetLoss.lossPercent },
      bufferbloat: results.bufferbloat,
      qualityScore: results.qualityScore
    });
    return { results, testId: tokenResp.testId };
  }
  /**
   * Convenience: run a speed test through the orchestrator.
   * Discovers best server (or uses specified), acquires token, runs test, submits results.
   */
  async runSpeedTest(serverId) {
    const server = serverId ? (await this.fetchServers()).find((s) => s.id === serverId) : await this.discoverBestServer();
    if (!server) throw new Error(serverId ? `Server not found: ${serverId}` : "No servers available");
    const tokenResp = await this.requestTestToken(server.id);
    const client = new QOEClient({ authToken: tokenResp.token, mode: "speed" });
    client.setServer(server);
    const results = await client.runSpeedTest();
    await this.submitResults(tokenResp.token, {
      serverId: server.id,
      testMode: "speed",
      download: { bandwidthMbps: results.download.bandwidthMbps },
      upload: { bandwidthMbps: results.upload.bandwidthMbps },
      idleLatency: { median: results.idleLatency.median },
      packetLoss: { lossPercent: results.packetLoss.lossPercent }
    });
    return { results, testId: tokenResp.testId };
  }
  /**
   * Discover the best server by measuring latency to all enabled servers
   */
  async discoverBestServer() {
    const servers = await this.fetchServers();
    const enabled = servers.filter((s) => s.enabled);
    if (enabled.length === 0) throw new Error("No enabled servers found");
    const latencies = await Promise.all(
      enabled.map(async (server) => {
        try {
          const start = performance.now();
          const resp = await fetch(`${server.httpUrl}/__latency`, {
            signal: AbortSignal.timeout(5e3)
          });
          if (!resp.ok) return { server, latency: Infinity };
          const latency = performance.now() - start;
          return { server, latency };
        } catch {
          return { server, latency: Infinity };
        }
      })
    );
    latencies.sort((a, b) => a.latency - b.latency);
    if (latencies[0].latency === Infinity) throw new Error("No reachable servers found");
    return latencies[0].server;
  }
}
async function httpDownload(config, context) {
  if (config.type !== "httpDownload") {
    throw new Error("Invalid config type for httpDownload");
  }
  const timestamp = performance.now();
  const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;
  try {
    const fullUrl = `${url}?bytes=${config.size}`;
    const headers = {};
    if (config.authToken) headers["Authorization"] = `Bearer ${config.authToken}`;
    const start = performance.now();
    const response = await fetch(fullUrl, { signal: context.signal, headers });
    const buffer = await response.arrayBuffer();
    const totalBytes = buffer.byteLength;
    const duration = Math.max(performance.now() - start, 1e-3);
    const bandwidth = totalBytes * 8 / (duration / 1e3);
    return {
      timestamp,
      duration,
      success: true,
      data: {
        bytesReceived: totalBytes,
        bandwidth
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
async function httpUpload(config, context) {
  if (config.type !== "httpUpload") {
    throw new Error("Invalid config type for httpUpload");
  }
  const timestamp = performance.now();
  const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;
  try {
    const data = generateRandomData(config.size);
    const rid = requestId();
    const fullUrl = `${url}?_rid=${rid}`;
    const transferStart = performance.now();
    const uploadHeaders = { "Content-Type": "application/octet-stream" };
    if (config.authToken) uploadHeaders["Authorization"] = `Bearer ${config.authToken}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: data,
      headers: uploadHeaders,
      signal: context.signal
    });
    await response.text();
    const fallbackDuration = performance.now() - transferStart;
    const rtDuration = getUploadDuration(fullUrl);
    const duration = Math.max(rtDuration ?? fallbackDuration, 1e-3);
    clearResourceTimings();
    const bandwidth = config.size * 8 / (duration / 1e3);
    return {
      timestamp,
      duration,
      success: true,
      data: {
        bytesUploaded: config.size,
        bandwidth,
        timingSource: rtDuration !== null ? "resource-timing" : "fallback"
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
async function latencyProbe(config, context) {
  var _a, _b;
  if (config.type !== "latencyProbe") {
    throw new Error("Invalid config type for latencyProbe");
  }
  const timestamp = performance.now();
  try {
    let rtt;
    if (config.useWebRTC && config.connectionRef) {
      const connectionResult = context.results.get(config.connectionRef);
      if (!connectionResult || !((_b = (_a = connectionResult.primitiveResults[0]) == null ? void 0 : _a.data) == null ? void 0 : _b.connection)) {
        throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
      }
      const webrtcConn = connectionResult.primitiveResults[0].data.connection;
      const result = await webrtcConn.measureLatency();
      rtt = result.rtt;
      if (rtt < 0) {
        throw new Error("Packet loss detected");
      }
    } else {
      const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;
      const probeHeaders = {};
      if (config.authToken) probeHeaders["Authorization"] = `Bearer ${config.authToken}`;
      const start = performance.now();
      await fetch(url, { signal: context.signal, headers: probeHeaders });
      rtt = performance.now() - start;
    }
    return {
      timestamp,
      duration: rtt,
      success: true,
      data: {
        latency: rtt
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
async function webrtcConnect(config, _context) {
  if (config.type !== "webrtcConnect") {
    throw new Error("Invalid config type for webrtcConnect");
  }
  const timestamp = performance.now();
  try {
    const signalingUrl = config.authToken ? `${config.signalingUrl}?token=${encodeURIComponent(config.authToken)}` : config.signalingUrl;
    const ws = new WebSocket(signalingUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket connection failed"));
      setTimeout(() => reject(new Error("WebSocket timeout")), 5e3);
    });
    const pc = new RTCPeerConnection({
      iceServers: config.iceServers
    });
    const dc = pc.createDataChannel("qoe-data", {
      ordered: false,
      maxRetransmits: 0
    });
    dc.binaryType = "arraybuffer";
    const dataChannelReady = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("DataChannel timeout after 3 seconds"));
      }, 3e3);
      dc.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      dc.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error("DataChannel error: " + err));
      };
      if (dc.readyState === "open") {
        clearTimeout(timeout);
        resolve();
      }
    });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: "ice",
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        }));
      }
    };
    const answerPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Answer timeout after 3 seconds"));
      }, 3e3);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "answer") {
          clearTimeout(timeout);
          resolve(msg);
        } else if (msg.type === "ice") {
          if (!msg.candidate) {
            return;
          }
          const candidateInit = { candidate: msg.candidate };
          if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
          if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
          if (candidateInit.sdpMid != null || candidateInit.sdpMLineIndex != null) {
            pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {
            });
          }
        }
      };
    });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({
      type: "offer",
      sdp: offer.sdp
    }));
    const answer = await answerPromise;
    await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
    await dataChannelReady;
    const duration = performance.now() - timestamp;
    return {
      timestamp,
      duration,
      success: true,
      data: {
        connection: {
          ws,
          pc,
          dc,
          measureLatency: async () => {
            const start = performance.now();
            return new Promise((resolve) => {
              const timeout = setTimeout(() => {
                dc.removeEventListener("message", handler);
                resolve({ rtt: -1 });
              }, 1e3);
              const handler = () => {
                clearTimeout(timeout);
                dc.removeEventListener("message", handler);
                const rtt = performance.now() - start;
                resolve({ rtt });
              };
              dc.addEventListener("message", handler);
              const pingPacket = new Uint8Array(48);
              dc.send(pingPacket);
            });
          },
          close: () => {
            ws.close();
            pc.close();
          }
        }
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
async function webrtcLatencyProbe(config, context) {
  var _a, _b;
  if (config.type !== "webrtcLatencyProbe") {
    throw new Error("Invalid config type for webrtcLatencyProbe");
  }
  const timestamp = performance.now();
  try {
    const connectionResult = context.results.get(config.connectionRef);
    if (!connectionResult || !((_b = (_a = connectionResult.primitiveResults[0]) == null ? void 0 : _a.data) == null ? void 0 : _b.connection)) {
      throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
    }
    const webrtcConn = connectionResult.primitiveResults[0].data.connection;
    const result = await webrtcConn.measureLatency();
    if (result.rtt < 0) {
      throw new Error("Latency measurement failed (packet loss)");
    }
    return {
      timestamp,
      duration: result.rtt,
      success: true,
      data: {
        latency: result.rtt
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
async function packetStream(config, context) {
  var _a, _b;
  if (config.type !== "packetStream") {
    throw new Error("Invalid config type for packetStream");
  }
  const timestamp = performance.now();
  try {
    const connectionResult = context.results.get(config.connectionRef);
    if (!connectionResult || !((_b = (_a = connectionResult.primitiveResults[0]) == null ? void 0 : _a.data) == null ? void 0 : _b.connection)) {
      throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
    }
    const webrtcConn = connectionResult.primitiveResults[0].data.connection;
    const dc = webrtcConn.dc;
    const packetsSent = [];
    const packetsReceived = /* @__PURE__ */ new Set();
    dc.onmessage = (evt) => {
      const packet = deserializeWebRTCPacket(
        evt.data instanceof ArrayBuffer ? new Uint8Array(evt.data) : evt.data
      );
      if (packet) {
        packetsReceived.add(packet.sequence);
      }
    };
    if (!config.receiveOnly) {
      for (let i = 0; i < config.packetCount; i++) {
        if (context.signal.aborted) break;
        if (dc.readyState === "open") {
          const binaryPacket = serializeWebRTCPacket(i, performance.now());
          dc.send(binaryPacket);
          packetsSent.push(i);
        }
        await sleep(config.interval);
      }
      await sleep(2e3);
    } else {
      const duration = config.packetCount * config.interval + 2e3;
      await sleep(duration);
    }
    const finalDuration = performance.now() - timestamp;
    const sent = packetsSent.length;
    const received = packetsReceived.size;
    const lossRatio = sent > 0 ? 1 - received / sent : 0;
    const lostSequences = packetsSent.filter((seq) => !packetsReceived.has(seq));
    return {
      timestamp,
      duration: finalDuration,
      success: true,
      data: {
        sent,
        received,
        lossRatio,
        lossPercent: lossRatio * 100,
        lostSequences
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
const PRIMITIVES = {
  httpDownload,
  httpUpload,
  latencyProbe,
  webrtcConnect,
  webrtcLatencyProbe,
  packetStream
};
class PrimitiveRegistry {
  constructor() {
    this.primitives = /* @__PURE__ */ new Map();
    this.register("httpDownload", PRIMITIVES.httpDownload);
    this.register("httpUpload", PRIMITIVES.httpUpload);
    this.register("latencyProbe", PRIMITIVES.latencyProbe);
    this.register("webrtcConnect", PRIMITIVES.webrtcConnect);
    this.register("webrtcLatencyProbe", PRIMITIVES.webrtcLatencyProbe);
    this.register("packetStream", PRIMITIVES.packetStream);
  }
  /**
   * Register a primitive function
   * @param type - Primitive type name
   * @param fn - Primitive function implementation
   */
  register(type, fn) {
    this.primitives.set(type, fn);
  }
  /**
   * Check if a primitive is registered
   * @param type - Primitive type name
   * @returns True if registered
   */
  has(type) {
    return this.primitives.has(type);
  }
  /**
   * Execute a primitive function
   * @param type - Primitive type to execute
   * @param config - Primitive configuration
   * @param context - Execution context
   * @returns Promise with primitive result
   */
  async execute(type, config, context) {
    const primitive = this.primitives.get(type);
    if (!primitive) {
      throw new Error(`Unknown primitive type: ${type}`);
    }
    return await primitive(config, context);
  }
  /**
   * Get all registered primitive types
   * @returns Array of primitive type names
   */
  getTypes() {
    return Array.from(this.primitives.keys());
  }
  /**
   * Clear all registered primitives (useful for testing)
   */
  clear() {
    this.primitives.clear();
  }
}
class TestRunner {
  constructor(eventEmitter) {
    this.abortController = null;
    this.primitiveRegistry = new PrimitiveRegistry();
    this.eventEmitter = eventEmitter;
  }
  /**
   * Execute a test plan
   * @param plan - Test plan to execute
   * @returns Promise with execution result
   */
  async execute(plan) {
    var _a;
    const startTime = performance.now();
    this.abortController = new AbortController();
    const context = {
      results: /* @__PURE__ */ new Map(),
      state: /* @__PURE__ */ new Map(),
      server: ((_a = plan.options) == null ? void 0 : _a.server) || {
        id: "default",
        name: "Default Server",
        country: "US",
        httpUrl: "http://localhost:3000",
        webrtcSignalingUrl: "ws://localhost:3000/signaling",
        stunServers: ["stun:stun.l.google.com:19302"],
        turnServers: [],
        enabled: true
      },
      signal: this.abortController.signal
    };
    const stepResults = [];
    let success = true;
    let error;
    try {
      const batches = this.buildDependencyGraph(plan.steps);
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (context.signal.aborted) break;
        const batchPromises = batch.map(
          (step) => {
            var _a2;
            return this.executeStep(step, context, (_a2 = plan.options) == null ? void 0 : _a2.timeout);
          }
        );
        const batchResults = await Promise.allSettled(batchPromises);
        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          const step = batch[i];
          if (result.status === "fulfilled") {
            stepResults.push(result.value);
            if (step.id) {
              context.results.set(step.id, result.value);
            }
          } else {
            success = false;
            error = result.reason;
            stepResults.push({
              step,
              skipped: false,
              primitiveResults: [],
              duration: 0
            });
          }
        }
        if (!success && this.hasDependents(batch, plan.steps)) {
          break;
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
    }
    const duration = performance.now() - startTime;
    return {
      success,
      duration,
      stepResults,
      error,
      context
    };
  }
  /**
   * Stop execution gracefully
   */
  stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  /**
   * Execute a single step
   * @param step - Test step to execute
   * @param context - Execution context
   * @param _timeout - Optional timeout in ms (reserved for future use)
   * @returns Promise with step result
   */
  async executeStep(step, context, _timeout) {
    const stepStart = performance.now();
    if (step.condition && !this.evaluateCondition(step.condition, context)) {
      return {
        step,
        skipped: true,
        primitiveResults: []
      };
    }
    let primitiveResults;
    switch (step.execution.mode) {
      case "sequential":
        primitiveResults = await this.executeSequential(step, context);
        break;
      case "parallel":
        primitiveResults = await this.executeParallel(step, context);
        break;
      case "burst":
        primitiveResults = await this.executeBurst(step, context);
        break;
      case "timed":
        primitiveResults = await this.executeTimed(step, context);
        break;
      default:
        throw new Error(`Unknown execution mode: ${step.execution.mode}`);
    }
    const duration = performance.now() - stepStart;
    return {
      step,
      skipped: false,
      duration,
      primitiveResults
    };
  }
  /**
   * Execute step in sequential mode
   */
  async executeSequential(step, context) {
    const results = [];
    const repeat = step.execution.repeat || { count: 1 };
    const count = repeat.count || 1;
    const interval = repeat.interval || 0;
    for (let i = 0; i < count; i++) {
      if (context.signal.aborted) break;
      const result = await this.primitiveRegistry.execute(
        step.primitive,
        step.config,
        context
      );
      results.push(result);
      this.eventEmitter.emit("metric", {
        type: "metric",
        source: "primitive",
        primitive: step.primitive,
        stepId: step.id,
        result
      });
      if (interval > 0 && i < count - 1) {
        await sleep(interval);
      }
    }
    return results;
  }
  /**
   * Execute step in parallel mode
   */
  async executeParallel(step, context) {
    const results = [];
    const repeat = step.execution.repeat || {};
    const concurrency = step.execution.concurrency || 1;
    const duration = repeat.duration;
    const count = repeat.count;
    if (duration) {
      const endTime = performance.now() + duration;
      while (performance.now() < endTime && !context.signal.aborted) {
        const batch = Array(concurrency).fill(null).map(
          () => this.primitiveRegistry.execute(step.primitive, step.config, context)
        );
        const batchResults = await Promise.allSettled(batch);
        for (const result of batchResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
            this.eventEmitter.emit("metric", {
              type: "metric",
              source: "primitive",
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
      }
    } else if (count) {
      const batches = Math.ceil(count / concurrency);
      for (let b = 0; b < batches; b++) {
        if (context.signal.aborted) break;
        const batchSize = Math.min(concurrency, count - b * concurrency);
        const batch = Array(batchSize).fill(null).map(
          () => this.primitiveRegistry.execute(step.primitive, step.config, context)
        );
        const batchResults = await Promise.allSettled(batch);
        for (const result of batchResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
            this.eventEmitter.emit("metric", {
              type: "metric",
              source: "primitive",
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
      }
    }
    return results;
  }
  /**
   * Execute step in burst mode
   */
  async executeBurst(step, context) {
    const results = [];
    const repeat = step.execution.repeat || {};
    const burst = step.execution.burst;
    if (!burst) {
      throw new Error("Burst mode requires burst configuration");
    }
    const burstCount = repeat.count || 1;
    const burstDuration = repeat.duration;
    if (burstDuration) {
      const endTime = performance.now() + burstDuration;
      while (performance.now() < endTime && !context.signal.aborted) {
        const burstBatch = Array(burst.size).fill(null).map(
          () => this.primitiveRegistry.execute(step.primitive, step.config, context)
        );
        const burstResults = await Promise.allSettled(burstBatch);
        for (const result of burstResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
            this.eventEmitter.emit("metric", {
              type: "metric",
              source: "primitive",
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
        if (performance.now() < endTime) {
          await sleep(burst.interval);
        }
      }
    } else {
      for (let i = 0; i < burstCount; i++) {
        if (context.signal.aborted) break;
        const burstBatch = Array(burst.size).fill(null).map(
          () => this.primitiveRegistry.execute(step.primitive, step.config, context)
        );
        const burstResults = await Promise.allSettled(burstBatch);
        for (const result of burstResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
            this.eventEmitter.emit("metric", {
              type: "metric",
              source: "primitive",
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
        if (i < burstCount - 1) {
          await sleep(burst.interval);
        }
      }
    }
    return results;
  }
  /**
   * Execute step in timed mode
   */
  async executeTimed(step, context) {
    const results = [];
    const repeat = step.execution.repeat || {};
    const duration = repeat.duration || 1e3;
    const interval = repeat.interval || 0;
    const endTime = performance.now() + duration;
    while (performance.now() < endTime && !context.signal.aborted) {
      const result = await this.primitiveRegistry.execute(
        step.primitive,
        step.config,
        context
      );
      results.push(result);
      this.eventEmitter.emit("metric", {
        type: "metric",
        source: "primitive",
        primitive: step.primitive,
        stepId: step.id,
        result
      });
      if (interval > 0 && performance.now() < endTime) {
        await sleep(interval);
      }
    }
    return results;
  }
  /**
   * Build dependency graph and return batches of steps that can run in parallel
   * @param steps - Test steps
   * @returns Array of batches (each batch contains steps that can run in parallel)
   */
  buildDependencyGraph(steps) {
    const batches = [];
    const processed = /* @__PURE__ */ new Set();
    const remaining = new Set(steps.map((s, i) => s.id || `step-${i}`));
    const stepsWithIds = steps.map((step, i) => ({
      ...step,
      id: step.id || `step-${i}`
    }));
    while (remaining.size > 0) {
      const batch = [];
      for (const step of stepsWithIds) {
        if (!remaining.has(step.id)) continue;
        const dependenciesSatisfied = !step.dependsOn || step.dependsOn.every((depId) => processed.has(depId));
        if (dependenciesSatisfied) {
          batch.push(step);
        }
      }
      if (batch.length === 0) {
        throw new Error("Circular or missing dependencies detected");
      }
      batches.push(batch);
      for (const step of batch) {
        processed.add(step.id);
        remaining.delete(step.id);
      }
    }
    return batches;
  }
  /**
   * Check if any step depends on steps in the given batch
   */
  hasDependents(batch, allSteps) {
    const batchIds = new Set(batch.map((s) => s.id).filter(Boolean));
    for (const step of allSteps) {
      if (step.dependsOn && step.dependsOn.some((depId) => batchIds.has(depId))) {
        return true;
      }
    }
    return false;
  }
  /**
   * Evaluate a step condition
   */
  evaluateCondition(condition, context) {
    switch (condition.type) {
      case "always":
        return true;
      case "ifSuccess":
        for (const result of context.results.values()) {
          if (result.primitiveResults.some((pr) => !pr.success)) {
            return false;
          }
        }
        return true;
      case "ifFailure":
        for (const result of context.results.values()) {
          if (result.primitiveResults.some((pr) => !pr.success)) {
            return true;
          }
        }
        return false;
      case "ifFast":
        if (!condition.maxDuration) return true;
        for (const result of context.results.values()) {
          if (result.duration && result.duration > condition.maxDuration) {
            return false;
          }
        }
        return true;
      case "custom":
        if (condition.evaluate) {
          return condition.evaluate(context);
        }
        return true;
      default:
        return true;
    }
  }
}
class MetricCollector {
  constructor() {
    this.metrics = [];
  }
  /**
   * Collect a metric
   * @param metric - Raw metric to collect
   */
  collect(metric) {
    this.metrics.push(metric);
  }
  /**
   * Get all collected metrics
   * @returns Array of all metrics
   */
  getMetrics() {
    return [...this.metrics];
  }
  /**
   * Filter metrics by predicate
   * @param predicate - Filter function
   * @returns Filtered metrics
   */
  filter(predicate) {
    return this.metrics.filter(predicate);
  }
  /**
   * Get metrics by source
   * @param source - Metric source
   * @returns Metrics from that source
   */
  getBySource(source) {
    return this.filter((m) => m.source === source);
  }
  /**
   * Get metrics by type
   * @param type - Metric type
   * @returns Metrics of that type
   */
  getByType(type) {
    return this.filter((m) => m.type === type);
  }
  /**
   * Get metrics by step ID
   * @param stepId - Step ID
   * @returns Metrics from that step
   */
  getByStepId(stepId) {
    return this.filter((m) => m.stepId === stepId);
  }
  /**
   * Get metrics in time range
   * @param start - Start timestamp
   * @param end - End timestamp
   * @returns Metrics in range
   */
  getByTimeRange(start, end) {
    return this.filter((m) => m.timestamp >= start && m.timestamp <= end);
  }
  /**
   * Get count of metrics
   * @returns Number of metrics
   */
  count() {
    return this.metrics.length;
  }
  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
  /**
   * Get first metric
   * @returns First metric or undefined
   */
  first() {
    return this.metrics[0];
  }
  /**
   * Get last metric
   * @returns Last metric or undefined
   */
  last() {
    return this.metrics[this.metrics.length - 1];
  }
}
class MetricObservable {
  constructor() {
    this.observers = /* @__PURE__ */ new Set();
  }
  /**
   * Subscribe an observer
   * @param observer - Observer to subscribe
   * @returns Unsubscribe function
   */
  subscribe(observer) {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }
  /**
   * Notify all observers of a new metric
   * @param metric - Raw metric
   */
  notify(metric) {
    for (const observer of this.observers) {
      try {
        observer.onMetric(metric);
      } catch (err) {
        console.error("Observer error:", err);
      }
    }
  }
  /**
   * Notify all observers of completion
   */
  notifyComplete() {
    var _a;
    for (const observer of this.observers) {
      try {
        (_a = observer.onComplete) == null ? void 0 : _a.call(observer);
      } catch (err) {
        console.error("Observer error:", err);
      }
    }
  }
  /**
   * Notify all observers of an error
   * @param error - Error that occurred
   */
  notifyError(error) {
    var _a;
    for (const observer of this.observers) {
      try {
        (_a = observer.onError) == null ? void 0 : _a.call(observer, error);
      } catch (err) {
        console.error("Observer error:", err);
      }
    }
  }
  /**
   * Get count of observers
   * @returns Number of observers
   */
  count() {
    return this.observers.size;
  }
  /**
   * Clear all observers
   */
  clear() {
    this.observers.clear();
  }
}
class MetricAdapter {
  constructor(initialData) {
    this.data = initialData;
  }
  /**
   * Get transformed data
   * @returns Transformed data
   */
  getData() {
    return this.data;
  }
  /**
   * Called when test completes (can be overridden)
   */
  onComplete() {
  }
  /**
   * Called when an error occurs (can be overridden)
   */
  onError(error) {
    console.error("Adapter error:", error);
  }
}
class ConsoleLoggerAdapter {
  constructor(verbose = false) {
    this.verbose = verbose;
  }
  onMetric(metric) {
    if (this.verbose) {
      console.log("[Metric]", metric);
    } else {
      console.log(`[${metric.source}] ${metric.type}:`, metric.data);
    }
  }
  onComplete() {
    console.log("[Complete] Test finished");
  }
  onError(error) {
    console.error("[Error]", error.message);
  }
}
class QOEClient {
  /**
   * Create a new QOE Client
   * @param config - Optional test configuration
   */
  constructor(config = {}) {
    var _a;
    this.stopRequested = false;
    this.running = false;
    this.config = mergeConfig(config, config.mode || "quality");
    this.serverConfig = new ServerConfig();
    this.eventEmitter = new EventEmitter();
    this.testRunner = new TestRunner(this.eventEmitter);
    this.metricCollector = new MetricCollector();
    this.metricObservable = new MetricObservable();
    this.eventEmitter.on("metric", (event) => {
      var _a2;
      const metric = {
        timestamp: performance.now(),
        source: "primitive",
        type: event.primitive || "unknown",
        data: (_a2 = event.result) == null ? void 0 : _a2.data,
        stepId: event.stepId
      };
      this.metricCollector.collect(metric);
      this.metricObservable.notify(metric);
    });
    if ((_a = config.serverConfig) == null ? void 0 : _a.customServer) {
      this.serverConfig.setServer(config.serverConfig.customServer);
    }
  }
  /**
   * Create a QOEClient configured from an orchestrator.
   * Fetches server list, picks the best server (or the one specified), and acquires a test token.
   */
  static async fromOrchestrator(url, serverId) {
    const orchestrator = new OrchestratorClient(url);
    const servers = await orchestrator.fetchServers();
    let server;
    if (serverId) {
      server = servers.find((s) => s.id === serverId);
      if (!server) throw new Error(`Server not found: ${serverId}`);
    } else {
      const enabled = servers.filter((s) => s.enabled);
      if (enabled.length === 0) throw new Error("No enabled servers found");
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
  async runQualityTest() {
    this.stopRequested = false;
    this.running = true;
    const config = mergeConfig(this.config, "quality");
    const server = this.serverConfig.getServer();
    const iceServers = convertToRTCIceServers(server);
    this.eventEmitter.emit("progress", {
      type: "progress",
      testMode: "quality",
      currentPhase: "Starting quality test",
      percentage: 0
    });
    const bandwidthTest = new BandwidthTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        downloadTests: config.downloadTests,
        uploadTests: config.uploadTests,
        bandwidthFinishDuration: config.bandwidthFinishDuration
      },
      this.eventEmitter
    );
    const latencyTest = new LatencyTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        iceServers,
        idleLatencyCount: config.idleLatencyCount,
        idleLatencyInterval: config.idleLatencyInterval,
        loadedLatencyInterval: config.loadedLatencyInterval
      },
      this.eventEmitter
    );
    const packetLossTest = new PacketLossTest(
      {
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        authToken: config.authToken,
        iceServers,
        packetLossCount: config.packetLossCount,
        packetLossDuration: config.packetLossDuration
      },
      this.eventEmitter
    );
    try {
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "quality",
        currentPhase: "Measuring idle latency",
        percentage: 10
      });
      const idleLatency = await latencyTest.measureIdleLatency();
      const allDownloadSamples = [];
      const allUploadSamples = [];
      const downloadTestsBySize = [];
      const uploadTestsBySize = [];
      const testStart = performance.now();
      const downloadTests = config.downloadTests;
      const uploadTests = config.uploadTests;
      const maxTests = Math.max(downloadTests.length, uploadTests.length);
      for (let i = 0; i < maxTests; i++) {
        if (this.stopRequested) break;
        if (i < downloadTests.length) {
          const test = downloadTests[i];
          this.eventEmitter.emit("progress", {
            type: "progress",
            testMode: "quality",
            currentPhase: `Measuring ${test.label} download`,
            percentage: 25 + i / maxTests * 20
          });
          latencyTest.startLoadedLatencyMeasurement("download");
          const samples = await bandwidthTest.measureDownloadSize(test, testStart);
          allDownloadSamples.push(...samples);
          if (samples.length > 0) {
            const bandwidths = samples.map((s) => s.bandwidth);
            const stats = calculateStats(bandwidths);
            downloadTestsBySize.push({
              size: test.size,
              label: test.label,
              samples,
              stats
            });
            this.eventEmitter.emit("testSizeComplete", {
              type: "testSizeComplete",
              direction: "download",
              testsBySize: [...downloadTestsBySize]
              // Send copy
            });
            if (samples[samples.length - 1].duration >= config.bandwidthFinishDuration) {
              break;
            }
          }
        }
        if (i < uploadTests.length) {
          const test = uploadTests[i];
          this.eventEmitter.emit("progress", {
            type: "progress",
            testMode: "quality",
            currentPhase: `Measuring ${test.label} upload`,
            percentage: 45 + i / maxTests * 20
          });
          latencyTest.startLoadedLatencyMeasurement("upload");
          const samples = await bandwidthTest.measureUploadSize(test, testStart);
          allUploadSamples.push(...samples);
          if (samples.length > 0) {
            const bandwidths = samples.map((s) => s.bandwidth);
            const stats = calculateStats(bandwidths);
            uploadTestsBySize.push({
              size: test.size,
              label: test.label,
              samples,
              stats
            });
            this.eventEmitter.emit("testSizeComplete", {
              type: "testSizeComplete",
              direction: "upload",
              testsBySize: [...uploadTestsBySize]
              // Send copy
            });
            if (samples[samples.length - 1].duration >= config.bandwidthFinishDuration) {
              break;
            }
          }
        }
      }
      const { downloadLatency, uploadLatency } = await latencyTest.stopLoadedLatencyMeasurement();
      this.eventEmitter.emit("latencyUpdate", {
        type: "latencyUpdate",
        idleLatency,
        downloadLatency,
        uploadLatency
      });
      const downloadBandwidths = allDownloadSamples.map((s) => s.bandwidth);
      const uploadBandwidths = allUploadSamples.map((s) => s.bandwidth);
      const downloadStats = calculateStats(downloadBandwidths);
      const uploadStats = calculateStats(uploadBandwidths);
      const download = {
        bandwidth: downloadStats.p90,
        bandwidthMbps: downloadStats.p90 / 1e6,
        stats: downloadStats,
        samples: allDownloadSamples,
        testsBySize: downloadTestsBySize
      };
      const upload = {
        bandwidth: uploadStats.p90,
        bandwidthMbps: uploadStats.p90 / 1e6,
        stats: uploadStats,
        samples: allUploadSamples,
        testsBySize: uploadTestsBySize
      };
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "quality",
        currentPhase: "Measuring packet loss",
        percentage: 75
      });
      const packetLoss = await packetLossTest.measure();
      let bufferbloat = 0;
      if (downloadLatency && uploadLatency) {
        const loadedMedian = (downloadLatency.median + uploadLatency.median) / 2;
        bufferbloat = Math.max(0, loadedMedian - idleLatency.median);
      }
      let qualityScore = 100;
      if (idleLatency.median > 100) qualityScore -= 20;
      if (bufferbloat > 50) qualityScore -= 30;
      if (packetLoss.lossPercent > 1) qualityScore -= 25;
      if (download.bandwidthMbps < 10) qualityScore -= 25;
      qualityScore = Math.max(0, qualityScore);
      const activityRatings = this.calculateActivityRatings(
        download.bandwidthMbps,
        idleLatency.median,
        packetLoss.lossPercent,
        idleLatency.stats.stddev || 0
      );
      const results = {
        download,
        upload,
        idleLatency,
        downloadLatency: downloadLatency || void 0,
        uploadLatency: uploadLatency || void 0,
        packetLoss,
        bufferbloat,
        qualityScore,
        activityRatings
      };
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "quality",
        currentPhase: "Complete",
        percentage: 100
      });
      this.eventEmitter.emit("complete", {
        type: "complete",
        testMode: "quality",
        results
      });
      latencyTest.close();
      this.running = false;
      return results;
    } catch (error) {
      this.running = false;
      this.eventEmitter.emit("error", {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        context: "Quality mode test"
      });
      throw error;
    }
  }
  /**
   * Run speed mode test (Ookla-style)
   * @returns Promise with speed test results
   */
  async runSpeedTest() {
    this.stopRequested = false;
    this.running = true;
    const config = mergeConfig(this.config, "speed");
    const server = this.serverConfig.getServer();
    const iceServers = convertToRTCIceServers(server);
    this.eventEmitter.emit("progress", {
      type: "progress",
      testMode: "speed",
      currentPhase: "Starting speed test",
      percentage: 0
    });
    const bandwidthTest = new BandwidthTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        downloadTests: config.downloadTests,
        uploadTests: config.uploadTests,
        bandwidthFinishDuration: config.bandwidthFinishDuration
      },
      this.eventEmitter
    );
    const latencyTest = new LatencyTest(
      {
        apiBaseUrl: server.httpUrl,
        authToken: config.authToken,
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        iceServers,
        idleLatencyCount: config.idleLatencyCount,
        idleLatencyInterval: config.idleLatencyInterval,
        loadedLatencyInterval: config.loadedLatencyInterval
      },
      this.eventEmitter
    );
    const packetLossTest = new PacketLossTest(
      {
        webrtcSignalingUrl: server.webrtcSignalingUrl,
        authToken: config.authToken,
        iceServers,
        packetLossCount: config.packetLossCount,
        packetLossDuration: config.packetLossDuration
      },
      this.eventEmitter
    );
    try {
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "speed",
        currentPhase: "Measuring idle latency",
        percentage: 10
      });
      const idleLatency = await latencyTest.measureIdleLatency();
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "speed",
        currentPhase: "Measuring download speed",
        percentage: 30
      });
      const download = await bandwidthTest.measureDownload();
      download.bandwidth = download.stats.max;
      download.bandwidthMbps = download.stats.max / 1e6;
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "speed",
        currentPhase: "Measuring upload speed",
        percentage: 60
      });
      const upload = await bandwidthTest.measureUploadParallel(
        config.speedTestMinConnections,
        config.speedTestDuration,
        config.speedTestChunkSize
      );
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "speed",
        currentPhase: "Measuring packet loss",
        percentage: 85
      });
      const packetLoss = await packetLossTest.measure();
      const results = {
        download,
        upload,
        idleLatency,
        packetLoss
      };
      this.eventEmitter.emit("progress", {
        type: "progress",
        testMode: "speed",
        currentPhase: "Complete",
        percentage: 100
      });
      this.eventEmitter.emit("complete", {
        type: "complete",
        testMode: "speed",
        results
      });
      latencyTest.close();
      this.running = false;
      return results;
    } catch (error) {
      this.running = false;
      this.eventEmitter.emit("error", {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        context: "Speed mode test"
      });
      throw error;
    }
  }
  /**
   * Run application-specific tests
   * @returns Promise with application test results
   */
  async runApplicationTest() {
    throw new Error("Application test mode is not yet implemented. Use runQualityTest() or runSpeedTest() instead.");
  }
  /**
   * Set the server to use for testing
   * @param server - Server configuration
   */
  setServer(server) {
    this.serverConfig.setServer(server);
  }
  /**
   * Get the current server
   */
  getServer() {
    return this.serverConfig.getServer();
  }
  /**
   * Auto-discover and set the best server
   * @param registryUrl - URL to server registry JSON
   */
  async discoverBestServer(registryUrl) {
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
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  /**
   * Unregister an event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
  /**
   * Request all running tests to stop gracefully
   */
  stop() {
    this.stopRequested = true;
  }
  /**
   * Check if tests are currently running
   */
  isRunning() {
    return this.running;
  }
  /**
   * Calculate activity ratings based on network metrics
   * @private
   */
  calculateActivityRatings(downloadMbps, latency, packetLossPercent, jitter) {
    let videoStreaming = "Poor";
    if (downloadMbps > 25 && latency < 100) {
      videoStreaming = "Good";
    } else if (downloadMbps > 10 && latency < 200) {
      videoStreaming = "Fair";
    }
    let gaming = "Poor";
    if (latency < 50 && jitter < 10 && packetLossPercent < 1) {
      gaming = "Good";
    } else if (latency < 100 && jitter < 20 && packetLossPercent < 3) {
      gaming = "Fair";
    }
    let videoChat = "Poor";
    if (downloadMbps > 5 && latency < 150 && packetLossPercent < 2) {
      videoChat = "Good";
    } else if (downloadMbps > 2 && latency < 300) {
      videoChat = "Fair";
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
  async executeTestPlan(plan) {
    this.metricCollector.clear();
    const result = await this.testRunner.execute(plan);
    this.metricObservable.notifyComplete();
    return result;
  }
  /**
   * Subscribe to metrics (NEW TOOLKIT API)
   * @param observer - Observer to subscribe
   * @returns Unsubscribe function
   */
  subscribe(observer) {
    return this.metricObservable.subscribe(observer);
  }
  /**
   * Get all collected metrics (NEW TOOLKIT API)
   * @returns Array of raw metrics
   */
  getMetrics() {
    return this.metricCollector.getMetrics();
  }
  /**
   * Get the test runner instance (NEW TOOLKIT API)
   * @returns TestRunner instance
   */
  getTestRunner() {
    return this.testRunner;
  }
  /**
   * Get the metric collector instance (NEW TOOLKIT API)
   * @returns MetricCollector instance
   */
  getMetricCollector() {
    return this.metricCollector;
  }
  /**
   * Stop execution of current test plan (NEW TOOLKIT API)
   */
  stopTestPlan() {
    this.testRunner.stop();
  }
}
function createTestPlan(plan) {
  return plan;
}
function validateTestStep(step) {
  if (!step.primitive) {
    throw new Error("Step must specify a primitive");
  }
  if (!step.execution) {
    throw new Error("Step must specify an execution mode");
  }
  if (!step.config) {
    throw new Error("Step must specify a config");
  }
  const validModes = ["sequential", "parallel", "burst", "timed"];
  if (!validModes.includes(step.execution.mode)) {
    throw new Error(`Invalid execution mode: ${step.execution.mode}`);
  }
  if (step.execution.mode === "parallel" && !step.execution.concurrency) {
    throw new Error("Parallel mode requires concurrency to be specified");
  }
  if (step.execution.mode === "burst" && !step.execution.burst) {
    throw new Error("Burst mode requires burst configuration");
  }
  if (step.execution.repeat) {
    if (step.execution.repeat.count === void 0 && step.execution.repeat.duration === void 0) {
      throw new Error("Repeat must specify either count or duration");
    }
  }
}
function validateTestPlan(plan) {
  if (!plan.name) {
    throw new Error("Test plan must have a name");
  }
  if (!plan.steps || plan.steps.length === 0) {
    throw new Error("Test plan must have at least one step");
  }
  plan.steps.forEach((step, index) => {
    try {
      validateTestStep(step);
    } catch (err) {
      throw new Error(`Step ${index} validation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
  const stepIds = new Set(plan.steps.map((s) => s.id).filter(Boolean));
  plan.steps.forEach((step, index) => {
    if (step.dependsOn) {
      step.dependsOn.forEach((depId) => {
        if (!stepIds.has(depId)) {
          throw new Error(`Step ${index} depends on unknown step: ${depId}`);
        }
      });
    }
  });
  const visited = /* @__PURE__ */ new Set();
  const recursionStack = /* @__PURE__ */ new Set();
  function hasCycle(stepId) {
    if (recursionStack.has(stepId)) return true;
    if (visited.has(stepId)) return false;
    visited.add(stepId);
    recursionStack.add(stepId);
    const step = plan.steps.find((s) => s.id === stepId);
    if (step == null ? void 0 : step.dependsOn) {
      for (const depId of step.dependsOn) {
        if (hasCycle(depId)) return true;
      }
    }
    recursionStack.delete(stepId);
    return false;
  }
  for (const step of plan.steps) {
    if (step.id && hasCycle(step.id)) {
      throw new Error(`Circular dependency detected involving step: ${step.id}`);
    }
  }
}
class ChartAdapter extends MetricAdapter {
  constructor() {
    super({
      downloadSamples: [],
      uploadSamples: [],
      latencySamples: []
    });
  }
  onMetric(metric) {
    var _a, _b, _c;
    if (metric.type === "httpDownload" && ((_a = metric.data) == null ? void 0 : _a.bandwidth)) {
      this.data.downloadSamples.push({
        x: metric.timestamp,
        y: metric.data.bandwidth / 1e6
        // Convert to Mbps
      });
    }
    if (metric.type === "httpUpload" && ((_b = metric.data) == null ? void 0 : _b.bandwidth)) {
      this.data.uploadSamples.push({
        x: metric.timestamp,
        y: metric.data.bandwidth / 1e6
        // Convert to Mbps
      });
    }
    if ((metric.type === "latencyProbe" || metric.type === "webrtcLatencyProbe") && ((_c = metric.data) == null ? void 0 : _c.latency)) {
      this.data.latencySamples.push({
        x: metric.timestamp,
        y: metric.data.latency
      });
    }
  }
  reset() {
    this.data = {
      downloadSamples: [],
      uploadSamples: [],
      latencySamples: []
    };
  }
}
class StatsAdapter extends MetricAdapter {
  constructor() {
    super({});
    this.downloadSamples = [];
    this.uploadSamples = [];
    this.latencySamples = [];
  }
  onMetric(metric) {
    var _a, _b, _c;
    if (metric.type === "httpDownload" && ((_a = metric.data) == null ? void 0 : _a.bandwidth)) {
      this.downloadSamples.push(metric.data.bandwidth);
    }
    if (metric.type === "httpUpload" && ((_b = metric.data) == null ? void 0 : _b.bandwidth)) {
      this.uploadSamples.push(metric.data.bandwidth);
    }
    if ((metric.type === "latencyProbe" || metric.type === "webrtcLatencyProbe") && ((_c = metric.data) == null ? void 0 : _c.latency)) {
      this.latencySamples.push(metric.data.latency);
    }
  }
  onComplete() {
    if (this.downloadSamples.length > 0) {
      this.data.downloadBandwidth = {
        samples: [...this.downloadSamples],
        stats: calculateStats(this.downloadSamples)
      };
    }
    if (this.uploadSamples.length > 0) {
      this.data.uploadBandwidth = {
        samples: [...this.uploadSamples],
        stats: calculateStats(this.uploadSamples)
      };
    }
    if (this.latencySamples.length > 0) {
      this.data.latency = {
        samples: [...this.latencySamples],
        stats: calculateStats(this.latencySamples)
      };
    }
  }
  reset() {
    this.downloadSamples = [];
    this.uploadSamples = [];
    this.latencySamples = [];
    this.data = {};
  }
}
const qualityModePlan = {
  name: "Quality Mode Test (Cloudflare-style)",
  description: "Interleaved bandwidth with loaded latency measurement",
  steps: [
    // 1. WebRTC connection for all latency tests
    {
      id: "webrtc-connect",
      name: "Connect WebRTC",
      primitive: "webrtcConnect",
      execution: { mode: "sequential" },
      config: {
        type: "webrtcConnect",
        signalingUrl: "/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      }
    },
    // 2. Idle latency measurement via WebRTC (20 probes, no artificial delay)
    {
      id: "idle-latency",
      name: "Measure idle latency",
      primitive: "webrtcLatencyProbe",
      execution: {
        mode: "sequential",
        repeat: { count: 20 }
      },
      config: {
        type: "webrtcLatencyProbe",
        connectionRef: "webrtc-connect"
      },
      dependsOn: ["webrtc-connect"]
    },
    // === 100kB SIZE ===
    // 3. Download 100kB
    {
      id: "download-100kb",
      name: "Download 100kB",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpDownload", url: "/__down", size: 1e5 },
      dependsOn: ["idle-latency"]
    },
    // 4. Loaded latency during 100kB download
    {
      id: "loaded-latency-download-100kb",
      name: "Loaded latency (100kB download)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["webrtc-connect"]
    },
    // 5. Upload 100kB
    {
      id: "upload-100kb",
      name: "Upload 100kB",
      primitive: "httpUpload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpUpload", url: "/__up", size: 1e5 },
      dependsOn: ["download-100kb"]
    },
    // 6. Loaded latency during 100kB upload
    {
      id: "loaded-latency-upload-100kb",
      name: "Loaded latency (100kB upload)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["upload-100kb"]
    },
    // === 1MB SIZE ===
    // 7. Download 1MB
    {
      id: "download-1mb",
      name: "Download 1MB",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpDownload", url: "/__down", size: 1e6 },
      dependsOn: ["loaded-latency-upload-100kb"]
    },
    // 8. Loaded latency during 1MB download
    {
      id: "loaded-latency-download-1mb",
      name: "Loaded latency (1MB download)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["webrtc-connect"]
    },
    // 9. Upload 1MB
    {
      id: "upload-1mb",
      name: "Upload 1MB",
      primitive: "httpUpload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpUpload", url: "/__up", size: 1e6 },
      dependsOn: ["download-1mb"]
    },
    // 10. Loaded latency during 1MB upload
    {
      id: "loaded-latency-upload-1mb",
      name: "Loaded latency (1MB upload)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["upload-1mb"]
    },
    // === 10MB SIZE ===
    // 11. Download 10MB
    {
      id: "download-10mb",
      name: "Download 10MB",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpDownload", url: "/__down", size: 1e7 },
      dependsOn: ["loaded-latency-upload-1mb"]
    },
    // 12. Loaded latency during 10MB download
    {
      id: "loaded-latency-download-10mb",
      name: "Loaded latency (10MB download)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["webrtc-connect"]
    },
    // 13. Upload 10MB
    {
      id: "upload-10mb",
      name: "Upload 10MB",
      primitive: "httpUpload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpUpload", url: "/__up", size: 1e7 },
      dependsOn: ["download-10mb"]
    },
    // 14. Loaded latency during 10MB upload
    {
      id: "loaded-latency-upload-10mb",
      name: "Loaded latency (10MB upload)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["upload-10mb"]
    },
    // === 25MB SIZE ===
    // 15. Download 25MB
    {
      id: "download-25mb",
      name: "Download 25MB",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpDownload", url: "/__down", size: 25e6 },
      dependsOn: ["loaded-latency-upload-10mb"]
    },
    // 16. Loaded latency during 25MB download
    {
      id: "loaded-latency-download-25mb",
      name: "Loaded latency (25MB download)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["webrtc-connect"]
    },
    // 17. Upload 25MB
    {
      id: "upload-25mb",
      name: "Upload 25MB",
      primitive: "httpUpload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpUpload", url: "/__up", size: 25e6 },
      dependsOn: ["download-25mb"]
    },
    // 18. Loaded latency during 25MB upload
    {
      id: "loaded-latency-upload-25mb",
      name: "Loaded latency (25MB upload)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["upload-25mb"]
    },
    // === 100MB SIZE ===
    // 19. Download 100MB
    {
      id: "download-100mb",
      name: "Download 100MB",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpDownload", url: "/__down", size: 1e8 },
      dependsOn: ["loaded-latency-upload-25mb"]
    },
    // 20. Loaded latency during 100MB download
    {
      id: "loaded-latency-download-100mb",
      name: "Loaded latency (100MB download)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["webrtc-connect"]
    },
    // 21. Upload 50MB (reduced from 100MB to match original implementation)
    {
      id: "upload-50mb",
      name: "Upload 50MB",
      primitive: "httpUpload",
      execution: { mode: "sequential", repeat: { count: 10 } },
      config: { type: "httpUpload", url: "/__up", size: 5e7 },
      dependsOn: ["download-100mb"]
    },
    // 22. Loaded latency during 50MB upload
    {
      id: "loaded-latency-upload-50mb",
      name: "Loaded latency (50MB upload)",
      primitive: "webrtcLatencyProbe",
      execution: { mode: "sequential", repeat: { count: 5 } },
      config: { type: "webrtcLatencyProbe", connectionRef: "webrtc-connect" },
      dependsOn: ["upload-50mb"]
    },
    // 23. Packet loss test
    {
      id: "packet-loss",
      name: "Packet loss measurement",
      primitive: "packetStream",
      execution: { mode: "timed" },
      config: {
        type: "packetStream",
        connectionRef: "webrtc-connect",
        packetCount: 1e3,
        interval: 10,
        packetSize: 48
      },
      dependsOn: ["webrtc-connect", "loaded-latency-upload-50mb"]
    }
  ]
};
const speedModePlan = {
  name: "Speed Mode Test (Ookla-style)",
  description: "Maximum bandwidth with parallel connections",
  steps: [
    // 1. Idle latency (10 probes, 100ms interval)
    {
      id: "idle-latency",
      name: "Measure idle latency",
      primitive: "latencyProbe",
      execution: {
        mode: "sequential",
        repeat: { count: 10, interval: 100 }
      },
      config: {
        type: "latencyProbe",
        url: "/__latency"
      }
    },
    // 2. Download speed test (10 parallel connections, 15 seconds, 25MB chunks)
    {
      id: "download-speed",
      name: "Maximum download speed",
      primitive: "httpDownload",
      execution: {
        mode: "parallel",
        concurrency: 10,
        repeat: { duration: 15e3 }
      },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 25e6
      },
      dependsOn: ["idle-latency"]
    },
    // 3. Upload speed test (10 parallel connections, 15 seconds, 25MB chunks)
    {
      id: "upload-speed",
      name: "Maximum upload speed",
      primitive: "httpUpload",
      execution: {
        mode: "parallel",
        concurrency: 10,
        repeat: { duration: 15e3 }
      },
      config: {
        type: "httpUpload",
        url: "/__up",
        size: 25e6
      },
      dependsOn: ["download-speed"]
    },
    // 4. WebRTC connection for packet loss
    {
      id: "webrtc-connect",
      name: "Connect WebRTC",
      primitive: "webrtcConnect",
      execution: { mode: "sequential" },
      config: {
        type: "webrtcConnect",
        signalingUrl: "/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      },
      dependsOn: ["upload-speed"]
    },
    // 5. Packet loss test (500 packets, 20ms interval)
    {
      id: "packet-loss",
      name: "Packet loss measurement",
      primitive: "packetStream",
      execution: { mode: "timed" },
      config: {
        type: "packetStream",
        connectionRef: "webrtc-connect",
        packetCount: 500,
        interval: 20,
        packetSize: 48
      },
      dependsOn: ["webrtc-connect"]
    }
  ]
};
const streamingTestPlan = {
  name: "Video Streaming Test",
  description: "Progressive bitrate testing (480p → 720p → 1080p → 4K)",
  steps: [
    // 480p quality (~1.5 Mbps)
    {
      id: "bitrate-480p",
      name: "480p quality test",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 5, interval: 100 } },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 15e5
        // ~1.5 Mbps for 8 seconds
      }
    },
    // 720p quality (~3 Mbps)
    {
      id: "bitrate-720p",
      name: "720p quality test",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 5, interval: 100 } },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 3e6
        // ~3 Mbps for 8 seconds
      },
      condition: { type: "ifSuccess" },
      dependsOn: ["bitrate-480p"]
    },
    // 1080p quality (~5 Mbps)
    {
      id: "bitrate-1080p",
      name: "1080p quality test",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 5, interval: 100 } },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 5e6
        // ~5 Mbps for 8 seconds
      },
      condition: { type: "ifSuccess" },
      dependsOn: ["bitrate-720p"]
    },
    // 4K quality (~15 Mbps)
    {
      id: "bitrate-4k",
      name: "4K quality test",
      primitive: "httpDownload",
      execution: { mode: "sequential", repeat: { count: 5, interval: 100 } },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 15e6
        // ~15 Mbps for 8 seconds
      },
      condition: { type: "ifSuccess" },
      dependsOn: ["bitrate-1080p"]
    }
  ]
};
const gamingTestPlan = {
  name: "Gaming Performance Test",
  description: "Low-latency ping test with jitter measurement",
  steps: [
    // WebRTC connection for low-latency probes
    {
      id: "webrtc-connect",
      name: "Connect WebRTC",
      primitive: "webrtcConnect",
      execution: { mode: "sequential" },
      config: {
        type: "webrtcConnect",
        signalingUrl: "/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      }
    },
    // High-frequency latency probes (1000 samples @ 50 Hz = 20ms interval)
    {
      id: "gaming-latency",
      name: "Gaming latency test",
      primitive: "webrtcLatencyProbe",
      execution: {
        mode: "sequential",
        repeat: { count: 1e3, interval: 20 }
        // 50 Hz
      },
      config: {
        type: "webrtcLatencyProbe",
        connectionRef: "webrtc-connect"
      },
      dependsOn: ["webrtc-connect"]
    }
  ]
};
const conferenceTestPlan = {
  name: "Video Conferencing Test",
  description: "Bidirectional bursty traffic simulating 720p video call",
  steps: [
    // WebRTC connection
    {
      id: "webrtc-connect",
      name: "Connect WebRTC",
      primitive: "webrtcConnect",
      execution: { mode: "sequential" },
      config: {
        type: "webrtcConnect",
        signalingUrl: "/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      }
    },
    // Upstream video (52 packets every 10ms = ~2 Mbps for 720p)
    {
      id: "upstream-video",
      name: "Upstream video stream",
      primitive: "packetStream",
      execution: {
        mode: "burst",
        burst: { size: 52, interval: 10 },
        repeat: { duration: 3e4 }
        // 30 seconds
      },
      config: {
        type: "packetStream",
        connectionRef: "webrtc-connect",
        packetCount: 156e3,
        // 52 packets * 100 bursts/sec * 30 sec
        interval: 10,
        packetSize: 48
      },
      dependsOn: ["webrtc-connect"]
    },
    // Background latency probes (for jitter measurement)
    {
      id: "jitter-measurement",
      name: "Jitter measurement",
      primitive: "webrtcLatencyProbe",
      execution: {
        mode: "sequential",
        repeat: { count: 300, interval: 100 }
      },
      config: {
        type: "webrtcLatencyProbe",
        connectionRef: "webrtc-connect"
      },
      dependsOn: ["webrtc-connect"]
    }
  ]
};
const voipTestPlan = {
  name: "VoIP Call Quality Test",
  description: "G.711 codec simulation (64kbps, 20ms packets)",
  steps: [
    // WebRTC connection
    {
      id: "webrtc-connect",
      name: "Connect WebRTC",
      primitive: "webrtcConnect",
      execution: { mode: "sequential" },
      config: {
        type: "webrtcConnect",
        signalingUrl: "/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      }
    },
    // VoIP packet stream (G.711: 64kbps, 20ms packets = 160 bytes per packet)
    {
      id: "voip-stream",
      name: "VoIP packet stream",
      primitive: "packetStream",
      execution: {
        mode: "sequential",
        repeat: { count: 3e3, interval: 20 }
        // 60 seconds of voice
      },
      config: {
        type: "packetStream",
        connectionRef: "webrtc-connect",
        packetCount: 3e3,
        interval: 20,
        packetSize: 48
        // Simplified packet size
      },
      dependsOn: ["webrtc-connect"]
    }
  ]
};
const browsingTestPlan = {
  name: "Web Browsing Performance Test",
  description: "Typical webpage load pattern",
  steps: [
    // Initial HTML fetch (single connection)
    {
      id: "html-fetch",
      name: "HTML fetch",
      primitive: "httpDownload",
      execution: { mode: "sequential" },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 5e4
        // 50KB HTML
      }
    },
    // Parallel resource fetching (CSS, JS, images)
    // 6 parallel connections (typical browser limit)
    {
      id: "resource-fetch",
      name: "Resource fetch",
      primitive: "httpDownload",
      execution: {
        mode: "parallel",
        concurrency: 6,
        repeat: { count: 20 }
        // 20 resources
      },
      config: {
        type: "httpDownload",
        url: "/__down",
        size: 1e5
        // 100KB average resource size
      },
      dependsOn: ["html-fetch"]
    },
    // Measure latency during page load
    {
      id: "page-load-latency",
      name: "Page load latency",
      primitive: "latencyProbe",
      execution: {
        mode: "sequential",
        repeat: { count: 10, interval: 100 }
      },
      config: {
        type: "latencyProbe",
        url: "/__latency"
      },
      dependsOn: ["html-fetch"]
    }
  ]
};
export {
  BANDWIDTH_FINISH_DURATION,
  BandwidthTest,
  CONFERENCE_BURST_INTERVAL,
  CONFERENCE_BURST_PACKETS,
  CONFERENCE_DURATION,
  CONFERENCE_TARGET_BITRATE,
  ChartAdapter,
  ConsoleLoggerAdapter,
  EventEmitter,
  GAMING_DURATION,
  GAMING_LATENCY_COUNT,
  IDLE_LATENCY_COUNT,
  IDLE_LATENCY_INTERVAL,
  LATENCY_PERCENTILE,
  LOADED_LATENCY_INTERVAL,
  LatencyTest,
  MetricAdapter,
  MetricCollector,
  MetricObservable,
  OrchestratorClient,
  PACKET_LOSS_COUNT,
  PACKET_LOSS_DURATION,
  PRIMITIVES,
  PacketLossTest,
  PrimitiveRegistry,
  QOEClient,
  QUALITY_BANDWIDTH_PERCENTILE,
  QUALITY_MODE_DOWNLOAD_TESTS,
  QUALITY_MODE_UPLOAD_TESTS,
  SPEED_BANDWIDTH_PERCENTILE,
  SPEED_MODE_DOWNLOAD_TESTS,
  SPEED_MODE_UPLOAD_TESTS,
  SPEED_TEST_CHUNK_SIZE,
  SPEED_TEST_DURATION,
  SPEED_TEST_MIN_CONNECTIONS,
  STREAMING_BITRATES,
  ServerConfig,
  StatsAdapter,
  TestRunner,
  WebRTCConnection,
  browsingTestPlan,
  calculateMedian,
  calculatePercentile,
  calculateStats,
  conferenceTestPlan,
  convertToRTCIceServers,
  createTestPlan,
  deserializeWebRTCPacket,
  gamingTestPlan,
  generateRandomData,
  getQualityModeConfig,
  getSpeedModeConfig,
  httpDownload,
  httpUpload,
  latencyProbe,
  mergeConfig,
  microsecondsToMs,
  msToMicroseconds,
  packetStream,
  qualityModePlan,
  serializeWebRTCPacket,
  sleep,
  speedModePlan,
  streamingTestPlan,
  validateTestPlan,
  validateTestStep,
  voipTestPlan,
  webrtcConnect,
  webrtcLatencyProbe
};
