/**
 * Metric Collection System
 *
 * Collects raw metrics without transformation
 * Provides filtering and querying capabilities
 */

/**
 * Raw metric emitted from primitives or steps
 */
export interface RawMetric {
  timestamp: number;              // When the metric was collected
  source: 'primitive' | 'step' | 'plan';  // Where it came from
  type: string;                   // Metric type (primitive name, event type, etc.)
  data: any;                      // Raw data
  stepId?: string;                // Optional step ID
  metadata?: Record<string, any>; // Optional metadata
}

/**
 * Metric Collector stores all metrics
 */
export class MetricCollector {
  private metrics: RawMetric[] = [];

  /**
   * Collect a metric
   * @param metric - Raw metric to collect
   */
  collect(metric: RawMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Get all collected metrics
   * @returns Array of all metrics
   */
  getMetrics(): RawMetric[] {
    return [...this.metrics];
  }

  /**
   * Filter metrics by predicate
   * @param predicate - Filter function
   * @returns Filtered metrics
   */
  filter(predicate: (metric: RawMetric) => boolean): RawMetric[] {
    return this.metrics.filter(predicate);
  }

  /**
   * Get metrics by source
   * @param source - Metric source
   * @returns Metrics from that source
   */
  getBySource(source: 'primitive' | 'step' | 'plan'): RawMetric[] {
    return this.filter(m => m.source === source);
  }

  /**
   * Get metrics by type
   * @param type - Metric type
   * @returns Metrics of that type
   */
  getByType(type: string): RawMetric[] {
    return this.filter(m => m.type === type);
  }

  /**
   * Get metrics by step ID
   * @param stepId - Step ID
   * @returns Metrics from that step
   */
  getByStepId(stepId: string): RawMetric[] {
    return this.filter(m => m.stepId === stepId);
  }

  /**
   * Get metrics in time range
   * @param start - Start timestamp
   * @param end - End timestamp
   * @returns Metrics in range
   */
  getByTimeRange(start: number, end: number): RawMetric[] {
    return this.filter(m => m.timestamp >= start && m.timestamp <= end);
  }

  /**
   * Get count of metrics
   * @returns Number of metrics
   */
  count(): number {
    return this.metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get first metric
   * @returns First metric or undefined
   */
  first(): RawMetric | undefined {
    return this.metrics[0];
  }

  /**
   * Get last metric
   * @returns Last metric or undefined
   */
  last(): RawMetric | undefined {
    return this.metrics[this.metrics.length - 1];
  }
}

/**
 * Metric Transformer interface
 * Transforms raw metrics into specific formats
 */
export interface MetricTransformer<T> {
  transform(metrics: RawMetric[]): T;
}

/**
 * Base transformer for bandwidth metrics
 */
export interface BandwidthMetrics {
  downloadSamples: Array<{ timestamp: number; bandwidth: number; size: number }>;
  uploadSamples: Array<{ timestamp: number; bandwidth: number; size: number }>;
  downloadStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    stddev: number;
  };
  uploadStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    stddev: number;
  };
}

/**
 * Base transformer for latency metrics
 */
export interface LatencyMetrics {
  idleSamples: Array<{ timestamp: number; latency: number }>;
  downloadLoadedSamples: Array<{ timestamp: number; latency: number }>;
  uploadLoadedSamples: Array<{ timestamp: number; latency: number }>;
  idleStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    stddev: number;
  };
}
