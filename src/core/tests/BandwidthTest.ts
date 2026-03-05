/**
 * Bandwidth measurement for download and upload tests
 */

import { EventEmitter } from '../utils/events';
import { generateRandomData } from '../utils/random';
import { calculateStats } from '../utils/stats';
import { requestId, getUploadDuration, clearResourceTimings } from '../utils/timing';
import { BandwidthResult, BandwidthSample, TestSizeResult } from '../types/results';
import { TestSize } from '../config/constants';

export interface BandwidthTestConfig {
  apiBaseUrl: string;
  downloadTests: TestSize[];
  uploadTests: TestSize[];
  bandwidthFinishDuration: number;  // ms - stop if single request exceeds this
}

export class BandwidthTest {
  private config: BandwidthTestConfig;
  private eventEmitter: EventEmitter;
  private stopRequested: boolean = false;

  constructor(config: BandwidthTestConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Request the test to stop gracefully
   */
  stop(): void {
    this.stopRequested = true;
  }

  /**
   * Reset stop flag (call before starting a new test)
   */
  private resetStop(): void {
    this.stopRequested = false;
  }

  /**
   * Measure download bandwidth for a single test size
   * @param test - Test configuration (size, label, samples)
   * @param testStart - Reference timestamp for relative timing
   * @returns Array of bandwidth samples for this size
   */
  async measureDownloadSize(test: TestSize, testStart: number): Promise<BandwidthSample[]> {
    const testSamples: BandwidthSample[] = [];

    for (let i = 0; i < test.samples; i++) {
      if (this.stopRequested) break;

      try {
        const start = performance.now();
        const response = await fetch(`${this.config.apiBaseUrl}/__down?bytes=${test.size}`);
        const buffer = await response.arrayBuffer();
        const totalBytes = buffer.byteLength;
        const adjustedDuration = Math.max(performance.now() - start, 1);

        const bandwidth = (totalBytes * 8) / (adjustedDuration / 1000);
        const timestamp = performance.now() - testStart;

        // Skip first sample per size (TCP slow-start warmup)
        if (i === 0) continue;

        const sample: BandwidthSample = {
          timestamp,
          bandwidth,
          size: totalBytes,
          duration: adjustedDuration
        };

        testSamples.push(sample);

        // Emit sample event for real-time updates
        this.eventEmitter.emit('sample', {
          type: 'sample',
          sampleType: 'download',
          sample,
          timestamp
        });

        // Stop if request took too long
        if (adjustedDuration >= this.config.bandwidthFinishDuration) {
          break;
        }
      } catch (err) {
        this.eventEmitter.emit('error', {
          type: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
          context: 'Download bandwidth test'
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
  async measureUploadSize(test: TestSize, testStart: number): Promise<BandwidthSample[]> {
    const testSamples: BandwidthSample[] = [];

    // Pre-allocate buffer once and reuse for all samples
    const sharedBuffer = generateRandomData(test.size);

    for (let i = 0; i < test.samples; i++) {
      if (this.stopRequested) break;

      const data = sharedBuffer.subarray(0, test.size);

      try {
        const rid = requestId();
        const fullUrl = `${this.config.apiBaseUrl}/__up?_rid=${rid}`;
        const fallbackStart = performance.now();
        const response = await fetch(fullUrl, {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/octet-stream' }
        });
        await response.text();
        const fallbackDuration = performance.now() - fallbackStart;

        const rtDuration = getUploadDuration(fullUrl);
        const adjustedDuration = Math.max((rtDuration ?? fallbackDuration), 1);
        clearResourceTimings();

        const bandwidth = (test.size * 8) / (adjustedDuration / 1000);
        const timestamp = performance.now() - testStart;

        // Skip first sample per size (TCP slow-start warmup)
        if (i === 0) continue;

        const sample: BandwidthSample = {
          timestamp,
          bandwidth,
          size: test.size,
          duration: adjustedDuration
        };

        testSamples.push(sample);

        // Emit sample event for real-time updates
        this.eventEmitter.emit('sample', {
          type: 'sample',
          sampleType: 'upload',
          sample,
          timestamp
        });

        // Stop if request took too long
        if (adjustedDuration >= this.config.bandwidthFinishDuration) {
          break;
        }
      } catch (err) {
        this.eventEmitter.emit('error', {
          type: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
          context: 'Upload bandwidth test'
        });
      }
    }

    return testSamples;
  }

  /**
   * Measure download bandwidth across all configured test sizes
   * @returns BandwidthResult with p90 bandwidth and all samples
   */
  async measureDownload(): Promise<BandwidthResult> {
    this.resetStop();
    const allSamples: BandwidthSample[] = [];
    const testsBySize: TestSizeResult[] = [];
    const testStart = performance.now();

    for (const test of this.config.downloadTests) {
      if (this.stopRequested) break;

      const testSamples: BandwidthSample[] = [];

      for (let i = 0; i < test.samples; i++) {
        if (this.stopRequested) break;

        try {
          const start = performance.now();
          const response = await fetch(`${this.config.apiBaseUrl}/__down?bytes=${test.size}`);
          const buffer = await response.arrayBuffer();
          const totalBytes = buffer.byteLength;
          const adjustedDuration = Math.max(performance.now() - start, 1);

          const bandwidth = (totalBytes * 8) / (adjustedDuration / 1000);
          const timestamp = performance.now() - testStart;

          // Skip first sample per size (TCP slow-start warmup)
          if (i === 0) continue;

          const sample: BandwidthSample = {
            timestamp,
            bandwidth,
            size: totalBytes,
            duration: adjustedDuration
          };

          allSamples.push(sample);
          testSamples.push(sample);

          // Emit sample event for real-time updates
          this.eventEmitter.emit('sample', {
            type: 'sample',
            sampleType: 'download',
            sample,
            timestamp
          });

          // Stop if request took too long
          if (adjustedDuration >= this.config.bandwidthFinishDuration) {
            break;
          }
        } catch (err) {
          this.eventEmitter.emit('error', {
            type: 'error',
            error: err instanceof Error ? err : new Error(String(err)),
            context: 'Download bandwidth test'
          });
        }
      }

      // Store test results grouped by size
      if (testSamples.length > 0) {
        testsBySize.push({
          size: test.size,
          label: test.label,
          samples: testSamples,
          stats: calculateStats(testSamples.map(s => s.bandwidth))
        });
      }

      // Stop early if last request was too slow
      if (this.stopRequested ||
          (testSamples.length > 0 &&
           testSamples[testSamples.length - 1].duration >= this.config.bandwidthFinishDuration)) {
        break;
      }
    }

    const bandwidths = allSamples.map(s => s.bandwidth);
    const stats = calculateStats(bandwidths);

    return {
      bandwidth: stats.p90,  // Use p90 for quality mode
      bandwidthMbps: stats.p90 / 1_000_000,
      stats,
      samples: allSamples,
      testsBySize
    };
  }

  /**
   * Measure upload bandwidth across all configured test sizes
   * @returns BandwidthResult with p90 bandwidth and all samples
   */
  async measureUpload(): Promise<BandwidthResult> {
    this.resetStop();
    const allSamples: BandwidthSample[] = [];
    const testsBySize: TestSizeResult[] = [];
    const testStart = performance.now();

    for (const test of this.config.uploadTests) {
      if (this.stopRequested) break;

      const testSamples: BandwidthSample[] = [];

      // Pre-allocate buffer once and reuse for all samples
      const sharedBuffer = generateRandomData(test.size);

      for (let i = 0; i < test.samples; i++) {
        if (this.stopRequested) break;

        const data = sharedBuffer.subarray(0, test.size);

        try {
          const rid = requestId();
          const fullUrl = `${this.config.apiBaseUrl}/__up?_rid=${rid}`;
          const fallbackStart = performance.now();
          const response = await fetch(fullUrl, {
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/octet-stream' }
          });
          await response.text();
          const fallbackDuration = performance.now() - fallbackStart;

          const rtDuration = getUploadDuration(fullUrl);
          const adjustedDuration = Math.max((rtDuration ?? fallbackDuration), 1);
          clearResourceTimings();

          const bandwidth = (test.size * 8) / (adjustedDuration / 1000);
          const timestamp = performance.now() - testStart;

          // Skip first sample per size (TCP slow-start warmup)
          if (i === 0) continue;

          const sample: BandwidthSample = {
            timestamp,
            bandwidth,
            size: test.size,
            duration: adjustedDuration
          };

          allSamples.push(sample);
          testSamples.push(sample);

          // Emit sample event for real-time updates
          this.eventEmitter.emit('sample', {
            type: 'sample',
            sampleType: 'upload',
            sample,
            timestamp
          });

          // Stop if request took too long
          if (adjustedDuration >= this.config.bandwidthFinishDuration) {
            break;
          }
        } catch (err) {
          this.eventEmitter.emit('error', {
            type: 'error',
            error: err instanceof Error ? err : new Error(String(err)),
            context: 'Upload bandwidth test'
          });
        }
      }

      // Store test results grouped by size
      if (testSamples.length > 0) {
        testsBySize.push({
          size: test.size,
          label: test.label,
          samples: testSamples,
          stats: calculateStats(testSamples.map(s => s.bandwidth))
        });
      }

      // Stop early if last request was too slow
      if (this.stopRequested ||
          (testSamples.length > 0 &&
           testSamples[testSamples.length - 1].duration >= this.config.bandwidthFinishDuration)) {
        break;
      }
    }

    const bandwidths = allSamples.map(s => s.bandwidth);
    const stats = calculateStats(bandwidths);

    return {
      bandwidth: stats.p90,  // Use p90 for quality mode
      bandwidthMbps: stats.p90 / 1_000_000,
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
  async measureUploadParallel(
    concurrency: number,
    durationMs: number,
    chunkSize: number
  ): Promise<BandwidthResult> {
    this.resetStop();

    const allSamples: BandwidthSample[] = [];
    const testStart = performance.now();
    const endTime = testStart + durationMs;

    // Pre-allocate one shared buffer reused by all workers
    const sharedBuffer = generateRandomData(chunkSize);

    // Aggregate counters (written from multiple async workers — safe in single-threaded JS)
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
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/octet-stream' }
          });
          await response.text();
          const rtDuration = getUploadDuration(fullUrl);
          const duration = rtDuration ?? (performance.now() - start);
          clearResourceTimings();

          if (isWarmup) {
            isWarmup = false;
            // After first request completes, mark measurement start for this worker
            if (measurementStartTime === 0) measurementStartTime = performance.now();
            continue;
          }

          totalBytesTransferred += chunkSize;

          const adjustedDuration = Math.max(duration, 1);
          const bandwidth = (chunkSize * 8) / (adjustedDuration / 1000);
          const timestamp = performance.now() - testStart;

          const sample: BandwidthSample = {
            timestamp,
            bandwidth,
            size: chunkSize,
            duration: adjustedDuration
          };
          allSamples.push(sample);

          this.eventEmitter.emit('sample', {
            type: 'sample',
            sampleType: 'upload',
            sample,
            timestamp
          });
        } catch (err) {
          this.eventEmitter.emit('error', {
            type: 'error',
            error: err instanceof Error ? err : new Error(String(err)),
            context: 'Upload bandwidth test (parallel)'
          });
        }
      }
    };

    // Launch all workers concurrently and wait for all to finish
    await Promise.all(Array.from({ length: concurrency }, worker));

    // Aggregate: total bytes transferred / elapsed wall-clock time since measurement started
    const measureDuration = performance.now() - (measurementStartTime || testStart);
    const aggregateBandwidth = totalBytesTransferred > 0
      ? (totalBytesTransferred * 8) / (measureDuration / 1000)
      : 0;

    const perConnectionBandwidths = allSamples.map(s => s.bandwidth);
    const stats = calculateStats(perConnectionBandwidths.length > 0
      ? perConnectionBandwidths
      : [aggregateBandwidth]);

    const label = `${Math.round(chunkSize / 1_000_000)}MB`;

    return {
      bandwidth: aggregateBandwidth,
      bandwidthMbps: aggregateBandwidth / 1_000_000,
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
