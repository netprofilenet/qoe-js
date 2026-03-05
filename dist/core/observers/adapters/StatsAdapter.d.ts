/**
 * Stats Adapter
 *
 * Calculates statistics from raw metrics
 */
import { MetricAdapter } from '../Observer';
import { RawMetric } from '../../metrics/MetricCollector';
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
export declare class StatsAdapter extends MetricAdapter<StatsData> {
    private downloadSamples;
    private uploadSamples;
    private latencySamples;
    constructor();
    onMetric(metric: RawMetric): void;
    onComplete(): void;
    reset(): void;
}
//# sourceMappingURL=StatsAdapter.d.ts.map