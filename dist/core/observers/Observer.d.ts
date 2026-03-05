/**
 * Observer Pattern for Metrics
 *
 * Enables multiple consumers to subscribe to metrics and transform them as needed
 */
import { RawMetric } from '../metrics/MetricCollector';
/**
 * Metric Observer interface
 */
export interface MetricObserver {
    /**
     * Called when a new metric is available
     */
    onMetric(metric: RawMetric): void;
    /**
     * Called when test completes
     */
    onComplete?(): void;
    /**
     * Called when an error occurs
     */
    onError?(error: Error): void;
}
/**
 * Metric Observable - manages subscriptions
 */
export declare class MetricObservable {
    private observers;
    /**
     * Subscribe an observer
     * @param observer - Observer to subscribe
     * @returns Unsubscribe function
     */
    subscribe(observer: MetricObserver): () => void;
    /**
     * Notify all observers of a new metric
     * @param metric - Raw metric
     */
    notify(metric: RawMetric): void;
    /**
     * Notify all observers of completion
     */
    notifyComplete(): void;
    /**
     * Notify all observers of an error
     * @param error - Error that occurred
     */
    notifyError(error: Error): void;
    /**
     * Get count of observers
     * @returns Number of observers
     */
    count(): number;
    /**
     * Clear all observers
     */
    clear(): void;
}
/**
 * Metric Adapter - base class for transforming metrics
 */
export declare abstract class MetricAdapter<T> implements MetricObserver {
    protected data: T;
    constructor(initialData: T);
    /**
     * Process a metric (must be implemented by subclasses)
     */
    abstract onMetric(metric: RawMetric): void;
    /**
     * Get transformed data
     * @returns Transformed data
     */
    getData(): T;
    /**
     * Reset adapter data
     */
    abstract reset(): void;
    /**
     * Called when test completes (can be overridden)
     */
    onComplete?(): void;
    /**
     * Called when an error occurs (can be overridden)
     */
    onError?(error: Error): void;
}
/**
 * Console Logger Adapter - logs metrics to console
 */
export declare class ConsoleLoggerAdapter implements MetricObserver {
    private verbose;
    constructor(verbose?: boolean);
    onMetric(metric: RawMetric): void;
    onComplete(): void;
    onError(error: Error): void;
}
//# sourceMappingURL=Observer.d.ts.map