/**
 * Stats Adapter
 *
 * Calculates statistics from raw metrics
 */

import { MetricAdapter } from '../Observer';
import { RawMetric } from '../../metrics/MetricCollector';
import { calculateStats } from '../../utils/stats';

/**
 * Statistics data format
 */
import { Statistics } from '../../utils/stats';

export interface StatsData {
  downloadBandwidth?: {
    samples: number[];
    stats: Statistics;
  };
  uploadBandwidth?: {
    samples: number[];
    stats: Statistics;
  };
  latency?: {
    samples: number[];
    stats: Statistics;
  };
}

/**
 * Stats Adapter - calculates statistics from metrics
 */
export class StatsAdapter extends MetricAdapter<StatsData> {
  private downloadSamples: number[] = [];
  private uploadSamples: number[] = [];
  private latencySamples: number[] = [];

  constructor() {
    super({});
  }

  onMetric(metric: RawMetric): void {
    // Collect download bandwidth samples
    if (metric.type === 'httpDownload' && metric.data?.bandwidth) {
      this.downloadSamples.push(metric.data.bandwidth);
    }

    // Collect upload bandwidth samples
    if (metric.type === 'httpUpload' && metric.data?.bandwidth) {
      this.uploadSamples.push(metric.data.bandwidth);
    }

    // Collect latency samples
    if ((metric.type === 'latencyProbe' || metric.type === 'webrtcLatencyProbe') && metric.data?.latency) {
      this.latencySamples.push(metric.data.latency);
    }
  }

  onComplete(): void {
    // Calculate all statistics when test completes
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

  reset(): void {
    this.downloadSamples = [];
    this.uploadSamples = [];
    this.latencySamples = [];
    this.data = {};
  }
}
