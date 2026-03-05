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
    timestamp: number;
    source: 'primitive' | 'step' | 'plan';
    type: string;
    data: any;
    stepId?: string;
    metadata?: Record<string, any>;
}
/**
 * Metric Collector stores all metrics
 */
export declare class MetricCollector {
    private metrics;
    /**
     * Collect a metric
     * @param metric - Raw metric to collect
     */
    collect(metric: RawMetric): void;
    /**
     * Get all collected metrics
     * @returns Array of all metrics
     */
    getMetrics(): RawMetric[];
    /**
     * Filter metrics by predicate
     * @param predicate - Filter function
     * @returns Filtered metrics
     */
    filter(predicate: (metric: RawMetric) => boolean): RawMetric[];
    /**
     * Get metrics by source
     * @param source - Metric source
     * @returns Metrics from that source
     */
    getBySource(source: 'primitive' | 'step' | 'plan'): RawMetric[];
    /**
     * Get metrics by type
     * @param type - Metric type
     * @returns Metrics of that type
     */
    getByType(type: string): RawMetric[];
    /**
     * Get metrics by step ID
     * @param stepId - Step ID
     * @returns Metrics from that step
     */
    getByStepId(stepId: string): RawMetric[];
    /**
     * Get metrics in time range
     * @param start - Start timestamp
     * @param end - End timestamp
     * @returns Metrics in range
     */
    getByTimeRange(start: number, end: number): RawMetric[];
    /**
     * Get count of metrics
     * @returns Number of metrics
     */
    count(): number;
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Get first metric
     * @returns First metric or undefined
     */
    first(): RawMetric | undefined;
    /**
     * Get last metric
     * @returns Last metric or undefined
     */
    last(): RawMetric | undefined;
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
    downloadSamples: Array<{
        timestamp: number;
        bandwidth: number;
        size: number;
    }>;
    uploadSamples: Array<{
        timestamp: number;
        bandwidth: number;
        size: number;
    }>;
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
    idleSamples: Array<{
        timestamp: number;
        latency: number;
    }>;
    downloadLoadedSamples: Array<{
        timestamp: number;
        latency: number;
    }>;
    uploadLoadedSamples: Array<{
        timestamp: number;
        latency: number;
    }>;
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
//# sourceMappingURL=MetricCollector.d.ts.map