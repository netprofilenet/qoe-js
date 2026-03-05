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
export class MetricObservable {
  private observers: Set<MetricObserver> = new Set();

  /**
   * Subscribe an observer
   * @param observer - Observer to subscribe
   * @returns Unsubscribe function
   */
  subscribe(observer: MetricObserver): () => void {
    this.observers.add(observer);

    // Return unsubscribe function
    return () => {
      this.observers.delete(observer);
    };
  }

  /**
   * Notify all observers of a new metric
   * @param metric - Raw metric
   */
  notify(metric: RawMetric): void {
    for (const observer of this.observers) {
      try {
        observer.onMetric(metric);
      } catch (err) {
        console.error('Observer error:', err);
      }
    }
  }

  /**
   * Notify all observers of completion
   */
  notifyComplete(): void {
    for (const observer of this.observers) {
      try {
        observer.onComplete?.();
      } catch (err) {
        console.error('Observer error:', err);
      }
    }
  }

  /**
   * Notify all observers of an error
   * @param error - Error that occurred
   */
  notifyError(error: Error): void {
    for (const observer of this.observers) {
      try {
        observer.onError?.(error);
      } catch (err) {
        console.error('Observer error:', err);
      }
    }
  }

  /**
   * Get count of observers
   * @returns Number of observers
   */
  count(): number {
    return this.observers.size;
  }

  /**
   * Clear all observers
   */
  clear(): void {
    this.observers.clear();
  }
}

/**
 * Metric Adapter - base class for transforming metrics
 */
export abstract class MetricAdapter<T> implements MetricObserver {
  protected data: T;

  constructor(initialData: T) {
    this.data = initialData;
  }

  /**
   * Process a metric (must be implemented by subclasses)
   */
  abstract onMetric(metric: RawMetric): void;

  /**
   * Get transformed data
   * @returns Transformed data
   */
  getData(): T {
    return this.data;
  }

  /**
   * Reset adapter data
   */
  abstract reset(): void;

  /**
   * Called when test completes (can be overridden)
   */
  onComplete?(): void {
    // Default: do nothing
  }

  /**
   * Called when an error occurs (can be overridden)
   */
  onError?(error: Error): void {
    // Default: log error
    console.error('Adapter error:', error);
  }
}

/**
 * Console Logger Adapter - logs metrics to console
 */
export class ConsoleLoggerAdapter implements MetricObserver {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  onMetric(metric: RawMetric): void {
    if (this.verbose) {
      console.log('[Metric]', metric);
    } else {
      console.log(`[${metric.source}] ${metric.type}:`, metric.data);
    }
  }

  onComplete(): void {
    console.log('[Complete] Test finished');
  }

  onError(error: Error): void {
    console.error('[Error]', error.message);
  }
}
