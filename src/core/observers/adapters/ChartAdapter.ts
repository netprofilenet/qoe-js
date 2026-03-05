/**
 * Chart Adapter
 *
 * Transforms raw metrics into Chart.js compatible data format
 */

import { MetricAdapter } from '../Observer';
import { RawMetric } from '../../metrics/MetricCollector';

/**
 * Chart data format (Chart.js compatible)
 */
export interface ChartData {
  downloadSamples: Array<{ x: number; y: number }>;  // timestamp, Mbps
  uploadSamples: Array<{ x: number; y: number }>;    // timestamp, Mbps
  latencySamples: Array<{ x: number; y: number }>;   // timestamp, ms
}

/**
 * Chart Adapter - converts metrics to Chart.js format
 */
export class ChartAdapter extends MetricAdapter<ChartData> {
  constructor() {
    super({
      downloadSamples: [],
      uploadSamples: [],
      latencySamples: []
    });
  }

  onMetric(metric: RawMetric): void {
    // Process bandwidth metrics
    if (metric.type === 'httpDownload' && metric.data?.bandwidth) {
      this.data.downloadSamples.push({
        x: metric.timestamp,
        y: metric.data.bandwidth / 1_000_000  // Convert to Mbps
      });
    }

    if (metric.type === 'httpUpload' && metric.data?.bandwidth) {
      this.data.uploadSamples.push({
        x: metric.timestamp,
        y: metric.data.bandwidth / 1_000_000  // Convert to Mbps
      });
    }

    // Process latency metrics
    if ((metric.type === 'latencyProbe' || metric.type === 'webrtcLatencyProbe') && metric.data?.latency) {
      this.data.latencySamples.push({
        x: metric.timestamp,
        y: metric.data.latency
      });
    }
  }

  reset(): void {
    this.data = {
      downloadSamples: [],
      uploadSamples: [],
      latencySamples: []
    };
  }
}
